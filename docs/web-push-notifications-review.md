# Web Push Notifications Implementation Review

**Date:** 2026-01-07  
**Reviewer:** Warp Agent  
**Stack:** web-push-notifications (sendapp-notifications worktree)

## Executive Summary

The web push notifications implementation demonstrates strong security practices and defensive coding. The stack is well-organized with clear separation of concerns across frontend, service worker, API, and database layers. Security hardening has been applied consistently across all layers.

**Overall Assessment:** Production-ready with minor improvements recommended.

---

## Stack Organization

### Graphite Stack Structure
After reorganization, the stack is properly ordered:

```
◯  notification-handling-frontend (PR #2441)
   ↳ feat(notifications): add frontend notification handling
   
◯  web-push-notifications (PR #2440) ← Current branch
   ↳ feat: implement web push notifications for Next.js
   
◯  temporal-notification-activity (PR #2439)
   ↳ feat(workflows): add notification-workflow with transfer integration
   
◯  notifications-schema (PR #2438)
   ↳ feat(supabase): add notifications and push_tokens tables with RLS
   
◯  dev (base)
```

**Status:** Clean - no restack required, all branches properly ordered.

---

## Architecture Overview

### Component Flow
1. **Frontend** (`NotificationAutoPrompt.tsx`) - Auto-sync subscription on login/change
2. **Service Worker** (`service_worker.js`) - Handle push events, display notifications
3. **API** (`/api/notifications/subscribe`) - Subscribe/unsubscribe endpoint with validation
4. **Database** (`notifications.sql`) - Schema, RLS, and secure functions

---

## Security Analysis

### ✅ Strengths

#### Database Layer
- **Excellent RLS implementation** - All policies enforce `auth.uid() = user_id`
- **SECURITY DEFINER functions properly secured** - No user_id parameters, derives from `auth.uid()`
- **Platform-specific constraints** - `push_tokens_platform_fields_check` ensures correct fields per platform
- **Proper grants** - `anon` role has zero access, `authenticated` has minimal CRUD
- **Search path hardening** - All functions use `SET search_path = 'public'`
- **Cascade deletes** - Tokens cleaned up when users deleted

#### API Layer
- **Comprehensive input validation** - Size limits, type checks, domain allowlists
- **Same-origin validation** - Origin/Referer header checks prevent CSRF
- **Rate limiting** - Per-user+IP limiting (20 req/min)
- **Known push service domains** - Validates against FCM, Mozilla, Apple, etc.
- **No sensitive data logging** - Only logs sanitized error info
- **Base64 validation** - Keys validated before storage
- **Content-Type enforcement** - Requires `application/json`

#### Service Worker
- **Strict payload validation** - Size limits (10KB), type checking, sanitization
- **No unsafe spreads** - Explicit property assignment prevents prototype pollution
- **Path allowlist** - Only allows navigation to specific prefixes
- **Same-origin URL validation** - Prevents open redirect attacks
- **Action deduplication** - Prevents duplicate action IDs
- **Defense in depth** - Multiple validation layers for URLs and paths

#### Frontend
- **No automatic permission prompts** - Respects browser UX requirements
- **Message type validation** - Only accepts allowlisted SW message types
- **Debouncing** - 5-second debounce prevents subscription loops
- **In-flight guard** - Prevents concurrent sync requests
- **Best-effort sync** - Silent failure, no user disruption
- **Session-aware** - Only syncs when user is logged in

---

## Areas for Improvement

### P0 (Critical - Address Before Production)

**None identified** - Security posture is strong across all layers.

---

### P1 (High Priority - Address Soon)

#### 1. Token Cleanup Strategy
**Location:** `supabase/schemas/notifications.sql`

**Issue:** No automated cleanup for stale/expired tokens.

**Impact:**
- Database bloat over time
- Wasted push attempts to inactive devices
- Potential privacy concern (old tokens retained indefinitely)

**Recommendation:**
```sql
-- Add periodic cleanup function
CREATE OR REPLACE FUNCTION cleanup_stale_push_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Delete tokens inactive for 90+ days
    DELETE FROM push_tokens
    WHERE is_active = false
      AND updated_at < NOW() - INTERVAL '90 days';
    
    -- Mark tokens as inactive if not used in 60+ days
    UPDATE push_tokens
    SET is_active = false
    WHERE is_active = true
      AND (last_used_at IS NULL OR last_used_at < NOW() - INTERVAL '60 days');
END;
$$;

-- Schedule via pg_cron or external cron job
-- SELECT cron.schedule('cleanup-stale-tokens', '0 2 * * *', 'SELECT cleanup_stale_push_tokens()');
```

**Files to modify:**
- `supabase/schemas/notifications.sql` - Add cleanup function
- Consider adding migration for pg_cron setup

**Target behavior ("done" means):**
- Tokens that have not been used recently (e.g. `last_used_at` is `NULL` or older than 60 days) are marked inactive (`is_active = false`).
- Tokens that are already inactive and have not been updated recently (e.g. `updated_at` older than 90 days) are deleted.
- Cleanup runs on a schedule (daily is usually sufficient) and is safe to run multiple times (idempotent).
- Tokens become active again when a client successfully re-subscribes (ties directly into P1.2).

**Concrete touchpoints (schema + code):**
- `supabase/schemas/notifications.sql`: `push_tokens` contains the fields cleanup relies on: `is_active`, `last_used_at`, `updated_at` (`push_tokens` table around lines 55-67).
- Repo note: there is currently no `pg_cron`/`cron.schedule(...)` usage under `supabase/` (as of 2026-01-07), so scheduling this requires either enabling/configuring `pg_cron` or running the cleanup via an external scheduler (e.g. Temporal/worker).
- `supabase/schemas/notifications.sql`: Expo tokens already update `last_used_at` on conflict in `register_push_token` (lines 237-263).
- `supabase/schemas/notifications.sql`: Web tokens currently **do not** update `last_used_at` in `upsert_web_push_token` (lines 278-304) → P1.2 is a prerequisite for reliable “stale web token” detection.
- `apps/next/pages/api/notifications/subscribe.ts`: Unsubscribe currently *deletes* web rows (`DELETE FROM push_tokens…` via Supabase) rather than marking inactive (lines 466-472). That reduces bloat but means “inactive for 90 days” mostly applies to tokens that go stale without an explicit unsubscribe.

**Acceptance checks:**
- DB-level: create a few synthetic `push_tokens` rows with:
  - `is_active=true` + `last_used_at` older than 60 days → after cleanup, rows should flip to `is_active=false`.
  - `is_active=false` + `updated_at` older than 90 days → after cleanup, rows should be deleted.
  - `is_active=true` + `last_used_at` within 60 days → should remain unchanged.
- Permissions: ensure only the intended actor can invoke cleanup (e.g. `service_role` via scheduler), and that the function does not take user-controllable parameters.

---

#### 2. Missing `last_used_at` Update
**Location:** `supabase/schemas/notifications.sql` - `upsert_web_push_token`

**Issue:** Function doesn't update `last_used_at` on upsert, only on conflict with Expo tokens.

**Impact:** Token activity tracking incomplete, stale token detection unreliable.

**Current code (lines 297-303):**
```sql
INSERT INTO public.push_tokens (user_id, platform, token, endpoint, p256dh, auth)
VALUES (v_user_id, 'web', NULL, p_endpoint, p_p256dh, p_auth)
ON CONFLICT (user_id, endpoint) WHERE platform = 'web'
DO UPDATE SET
    p256dh = EXCLUDED.p256dh,
    auth = EXCLUDED.auth,
    updated_at = clock_timestamp();
```

**Recommendation:**
```sql
ON CONFLICT (user_id, endpoint) WHERE platform = 'web'
DO UPDATE SET
    p256dh = EXCLUDED.p256dh,
    auth = EXCLUDED.auth,
    is_active = true,  -- ← Add: Reactivate on resub
    last_used_at = NOW(),  -- ← Add: Track activity
    updated_at = clock_timestamp();
```

**Concrete touchpoints (schema + code):**
- `supabase/schemas/notifications.sql`: `public.upsert_web_push_token` currently updates only `p256dh`, `auth`, and `updated_at` on conflict (lines 278-304).
- `apps/next/pages/api/notifications/subscribe.ts`: POST handler calls `supabase.rpc('upsert_web_push_token', { p_endpoint, p_p256dh, p_auth })` (lines 414-418).
- `apps/next/components/NotificationAutoPrompt.tsx`: background auto-sync calls POST `/api/notifications/subscribe` (fetch at lines 78-93).
- `apps/next/components/WebPushSubscription.tsx`: both the “silent repair” flow and the user-driven subscribe flow call the same endpoint (e.g. sync at lines 166-195; explicit subscribe at 459-474).

**Acceptance checks:**
- POST `/api/notifications/subscribe` twice with the same endpoint:
  - `push_tokens.last_used_at` should be set on first insert and updated on subsequent upserts.
  - `push_tokens.is_active` should be `true` after upsert (even if previously inactive).
- Verify the DB constraint still holds for web platform rows (`token` must remain `NULL`, and `endpoint/p256dh/auth` must be non-null).

---

#### 3. Notification Read Status Tracking
**Location:** `supabase/schemas/notifications.sql`

**Issue:** No tracking for when notifications are read/dismissed, or delivered.

**Impact:**
- Cannot measure notification effectiveness
- Cannot distinguish between "never sent" vs "sent but unread"
- No way to avoid re-sending notifications

**Recommendation:**
```sql
ALTER TABLE notifications 
  ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;

-- Add index for analytics queries
CREATE INDEX notifications_delivered_at_idx 
  ON notifications(delivered_at) 
  WHERE delivered_at IS NOT NULL;
```

**Follow-up work:**
- Update service worker to mark `delivered_at` via API call
- Update frontend to mark `read_at` when notification viewed
- Add analytics queries for delivery/read rates

**Concrete touchpoints (schema + code):**
- `supabase/schemas/notifications.sql`: `public.notifications` currently has a `read` boolean (`notifications` table at lines 43-52), but no `delivered_at` / `read_at` timestamps.
- `apps/next/public/service_worker.js`: the push handler builds `notificationData` from `payload.options.data`, but only whitelists `{ path, type, badge }` (lines 278-323). To mark delivery/read per-notification, the payload (or subsequent app state) needs a safe identifier (e.g. `notification_id`) that is also explicitly validated/whitelisted.
- `apps/next/public/service_worker.js`: natural hook points for lifecycle tracking:
  - Delivery: after `showNotification(...)` in `handlePushNotification` (line 313).
  - Read/click: at the start of the `notificationclick` handler (lines 330-357).
  - Dismiss/close: `notificationclose` handler (lines 359-366).
- `apps/next/pages/api/notifications/`: only `subscribe.ts` exists today; delivered/read tracking would require adding one or more endpoints (e.g. `apps/next/pages/api/notifications/ack.ts`) and ensuring they are safe against cross-user updates.

**Acceptance checks:**
- Schema: after adding `delivered_at` / `read_at`, verify inserts still work and existing queries are unaffected.
- Integration (once wired):
  - When a push notification is shown, the corresponding notification row’s `delivered_at` becomes non-null.
  - When the user clicks/views the notification, `read_at` becomes non-null.
  - Ensure the update path is authenticated/authorized (no ability to mark other users’ notifications as delivered/read).

---

#### 4. Push Subscription Error Handling
**Location:** `apps/next/components/NotificationAutoPrompt.tsx`

**Issue:** Silent failure on subscription sync errors - no retry logic or user notification.

**Current behavior (lines 89-97):**
```typescript
if (!response.ok) {
  // Avoid logging any sensitive payload (endpoints/keys).
  log('Auto-sync failed', { source, status: response.status })
}
```

**Impact:**
- Transient network failures result in lost subscriptions
- No visibility into subscription failures
- Users may think they're subscribed when they're not

**Recommendation:**
```typescript
// Add retry with exponential backoff
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // ms

async function syncWithRetry(attempt = 0): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/subscribe', { /* ... */ });
    
    if (!response.ok) {
      if (attempt < MAX_RETRIES && response.status >= 500) {
        // Retry server errors
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
        return syncWithRetry(attempt + 1);
      }
      
      log('Auto-sync failed', { source, status: response.status, attempt });
      return false;
    }
    
    return true;
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
      return syncWithRetry(attempt + 1);
    }
    
    log('Auto-sync error', { source, err, attempt });
    return false;
  }
}
```

**Alternative:** Consider using a service worker background sync API for guaranteed delivery.

**Concrete touchpoints (code):**
- `apps/next/components/NotificationAutoPrompt.tsx`: `syncCurrentSubscription` is the auto-repair mechanism; today it only logs on non-OK responses and does not retry (fetch + handling at lines 78-96).
- `apps/next/public/service_worker.js`: `pushsubscriptionchange` posts a `PUSH_SUBSCRIPTION_CHANGED` message to all window clients (lines 428-450), which triggers `syncCurrentSubscription('subscriptionchange')`.
- `apps/next/pages/api/notifications/subscribe.ts`: server-side subscribe endpoint response classes:
  - Non-retryable (client/config/auth): 400/401/403/405/415/429 (see handler at lines 290-360 and validation paths).
  - Potentially retryable: 500 on DB/internal errors (e.g. upsert error at lines 420-428; generic catch at 434-441).
- `apps/next/components/WebPushSubscription.tsx`: existing patterns for safe error parsing/logging exist (silent sync at lines 178-195; explicit subscribe throws on non-OK at lines 471-474).

**Acceptance checks:**
- Retry behavior:
  - When POST `/api/notifications/subscribe` returns 5xx, auto-sync retries up to `MAX_RETRIES` with the configured delays and logs the attempt number.
  - When POST returns 400/401/403/415, auto-sync does **not** retry.
  - If rate-limited (429), auto-sync respects `Retry-After` (if present) or stops without thrashing.
- Logging/security:
  - No logs include the raw endpoint or key material (only status codes and safe error strings).

---

### P2 (Nice to Have - Future Enhancements)

#### 5. Service Worker Versioning
**Location:** `apps/next/public/service_worker.js`

**Issue:** No version tracking in service worker messages/payloads.

**Impact:**
- Cannot gracefully handle breaking changes in push payload format
- No way to detect client/server version mismatches

**Recommendation:**
```javascript
// Add version to SW
const SW_VERSION = '1.0.0';

// Include in pushsubscriptionchange messages
client.postMessage({
  type: 'PUSH_SUBSCRIPTION_CHANGED',
  swVersion: SW_VERSION
});

// Validate payload version
function validatePushPayload(rawData) {
  const validation = /* existing validation */;
  
  if (validation.valid) {
    const version = safeString(validation.payload, 'version', '1.0.0', 10);
    // Handle version-specific logic
  }
  
  return validation;
}
```

---

#### 6. Multi-Device Token Management
**Location:** Database schema & API

**Issue:** No explicit device identification - users can't see/manage individual devices.

**Current state:**
- `device_id` field exists but not consistently used for web push
- No UI for viewing active subscriptions

**Recommendation:**
```typescript
// Add device fingerprinting on subscription
const deviceInfo = {
  userAgent: navigator.userAgent,
  platform: navigator.platform,
  language: navigator.language,
  screenResolution: `${screen.width}x${screen.height}`,
};

const deviceId = await hash(JSON.stringify(deviceInfo)); // Simple fingerprint

// Send with subscription
fetch('/api/notifications/subscribe', {
  body: JSON.stringify({
    subscription: subscription.toJSON(),
    deviceId,
    deviceInfo, // For display in settings
  }),
});
```

**Follow-up work:**
- Add settings page to view/revoke individual device subscriptions
- Update `upsert_web_push_token` to accept `device_id` parameter
- Add `device_info` JSONB field for user-friendly display

---

#### 7. Notification Batching
**Location:** Service worker & backend

**Issue:** Each notification generates a separate push event - no batching.

**Impact:**
- Poor UX for burst notifications (e.g., 10 transfers)
- Excessive push quota usage
- Battery drain from multiple wake events

**Recommendation:**
- Backend: Implement notification batching with configurable delay (e.g., 5 seconds)
- Service Worker: Handle array of notifications in single push event
- Display: Group related notifications in notification center

**Example payload structure:**
```json
{
  "version": "1.0",
  "notifications": [
    { "type": "transfer_received", "title": "...", "body": "..." },
    { "type": "transfer_received", "title": "...", "body": "..." }
  ],
  "summary": {
    "title": "2 new transfers",
    "body": "You received $150 total"
  }
}
```

---

#### 8. Browser Compatibility Detection
**Location:** `apps/next/components/NotificationAutoPrompt.tsx`

**Issue:** No detection/handling of unsupported browsers or missing APIs.

**Current check (line 30-36):**
```typescript
if (typeof window === 'undefined') return null
if (!('serviceWorker' in navigator)) return null
```

**Recommendation:**
```typescript
function checkPushSupport(): {
  supported: boolean;
  reason?: string;
} {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'ssr' };
  }
  
  if (!('serviceWorker' in navigator)) {
    return { supported: false, reason: 'no_sw' };
  }
  
  if (!('PushManager' in window)) {
    return { supported: false, reason: 'no_push' };
  }
  
  if (!('Notification' in window)) {
    return { supported: false, reason: 'no_notification' };
  }
  
  // Check for known broken implementations
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('firefox') && ua.includes('private')) {
    return { supported: false, reason: 'firefox_private' };
  }
  
  return { supported: true };
}
```

**Follow-up:** Log unsupported browsers to analytics for tracking.

---

#### 9. Rate Limit Persistence
**Location:** `apps/next/pages/api/notifications/subscribe.ts`

**Issue:** In-memory rate limiting resets on server restart.

**Current implementation (lines 56-66):**
```typescript
function getRateLimitStore(): Map<string, RateLimitEntry> {
  const g = globalThis as unknown as GlobalRateLimitStore
  if (!g.__webPushSubscribeRateLimitStore) {
    g.__webPushSubscribeRateLimitStore = new Map()
  }
  return g.__webPushSubscribeRateLimitStore
}
```

**Impact:**
- Rate limits bypass after deployments
- No distributed rate limiting in multi-instance setups

**Recommendation:**
- Use Redis for distributed rate limiting
- Fallback to in-memory if Redis unavailable
- Consider using Upstash Rate Limit or similar service

---

#### 10. Test Coverage Gaps
**Location:** Repository-wide

**Issue:** No test files found for notification components.

**Missing test coverage:**
- ✅ `NotificationAutoPrompt.tsx` - Unit tests for debounce, sync logic, message validation
- ✅ `service_worker.js` - Mock push events, payload validation tests
- ✅ `/api/notifications/subscribe` - API integration tests
- ✅ Database functions - pgTAP tests for `upsert_web_push_token`, RLS policies

**Recommendation:**
```bash
# Test structure
tests/
├── unit/
│   ├── NotificationAutoPrompt.test.tsx
│   └── notifications-subscribe.test.ts
├── integration/
│   └── push-subscription-flow.test.ts
└── supabase/
    └── notifications_functions_test.sql  # pgTAP
```

**Priority areas:**
1. Database RLS policies (verify cross-user isolation)
2. Service worker payload validation (security-critical)
3. API input validation and rate limiting
4. Frontend sync debouncing and error handling

---

## Code Quality Observations

### ✅ Excellent Practices

1. **Consistent validation patterns** - `isPlainObject`, `safeString`, `safeBoolean` helpers used throughout
2. **Explicit property assignment** - No unsafe spreads, prevents prototype pollution
3. **Defense in depth** - Multiple validation layers (API → DB → SW)
4. **No secrets in logs** - Carefully avoids logging sensitive data
5. **Type safety** - Strong TypeScript usage, database types generated
6. **Clear comments** - Security rationale documented inline
7. **Proper error boundaries** - Try/catch with fallbacks throughout

### ⚠️ Minor Style Suggestions

1. **Magic numbers** - Consider extracting to constants
   ```typescript
   const DEBOUNCE_MS = 5_000;  // Line 67
   const SUBSCRIPTION_SYNC_TIMEOUT_MS = 10_000;  // Not currently set
   ```

2. **Duplicate validation logic** - `isPlainObject` defined in 3 files
   - Consider shared utility module: `packages/app/utils/validation.ts`

3. **Service worker comments** - Very thorough, but some sections could be more concise

---

## Performance Considerations

### Current Performance: Good

**Strengths:**
- Efficient indexes on `user_id`, `is_active`, `created_at`
- Unique indexes prevent duplicate tokens
- Debouncing prevents excessive API calls
- Service worker runs off-thread

**Potential optimizations:**

1. **Batch token cleanup** - Use partitioned deletes for large cleanup operations
2. **Notification pagination** - Add limit/offset to queries (currently unbounded)
3. **Service worker caching** - Consider caching notification icons/badges
4. **Database indexes** - Consider partial index on `notifications.read = false` for unread queries

---

## Documentation Recommendations

1. **Add architecture diagram** - Visual flow of push notification lifecycle
2. **Document VAPID key generation** - Include setup instructions in README
3. **Runbook for token cleanup** - Document manual cleanup procedures
4. **Browser support matrix** - Document tested browsers and known limitations
5. **Incident response** - Document how to disable push notifications in emergency

---

## Summary of Recommendations

| Priority | Count | Focus Area |
|----------|-------|------------|
| P0 | 0 | None - production ready |
| P1 | 4 | Token cleanup, tracking, error handling |
| P2 | 6 | Versioning, UX, testing |

### Immediate Next Steps

1. **Implement token cleanup** (P1.1) - Add automated cleanup function
2. **Fix `last_used_at` tracking** (P1.2) - Update upsert function
3. **Add retry logic** (P1.4) - Improve subscription reliability
4. **Write tests** (P2.10) - Focus on security-critical paths

### Long-term Roadmap

1. Add notification analytics (delivery/read rates)
2. Implement device management UI
3. Add notification batching for better UX
4. Migrate rate limiting to Redis
5. Add comprehensive test coverage

---

## Conclusion

The web push notifications implementation demonstrates **exceptional security practices** and thoughtful defensive coding. The stack is well-organized, properly secured, and ready for production deployment.

**Key Strengths:**
- ✅ Strong security posture across all layers
- ✅ Comprehensive input validation and sanitization
- ✅ Proper RLS and database security
- ✅ Clean architecture with separation of concerns

**Key Improvements:**
- 🔧 Add token cleanup strategy
- 🔧 Improve error handling and retries
- 🔧 Add delivery/read tracking
- 🔧 Expand test coverage

**Overall Grade: A-** (Production-ready with minor improvements recommended)

---

**Files Reviewed:**
- `apps/next/components/NotificationAutoPrompt.tsx` (127 lines)
- `apps/next/public/service_worker.js` (451 lines)
- `apps/next/pages/api/notifications/subscribe.ts` (496 lines)
- `supabase/schemas/notifications.sql` (319 lines)
- `supabase/migrations/20260101165552_harden_notification_security.sql` (178 lines)

**Total Lines Reviewed:** 1,571 lines of production code

**Review Time:** Comprehensive security and architecture analysis
