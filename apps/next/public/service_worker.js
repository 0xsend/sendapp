/* global self URL */

/**
 * Send App Service Worker for Web Push Notifications
 * Handles push events, notification display, and click actions
 *
 * Security hardening:
 * - Strict payload validation with type checking
 * - Size limits to prevent DoS
 * - Same-origin URL validation for navigation
 * - No unsafe object spreads (prototype pollution protection)
 * - Sanitized notification options and actions
 */

// ============================================================================
// Constants
// ============================================================================

/** Maximum payload size in bytes (10KB) */
const MAX_PAYLOAD_SIZE = 10 * 1024

/** Maximum title length */
const MAX_TITLE_LENGTH = 100

/** Maximum body length */
const MAX_BODY_LENGTH = 500

/** Maximum number of actions */
const MAX_ACTIONS_COUNT = 3

/** Maximum path length */
const MAX_PATH_LENGTH = 500

/** Allowed notification message types from service worker */
const ALLOWED_MESSAGE_TYPES = Object.freeze(['PUSH_SUBSCRIPTION_CHANGED'])

/** Allowed path prefixes for navigation (must start with /) */
const ALLOWED_PATH_PREFIXES = Object.freeze(['/', '/activity', '/profile', '/send', '/settings'])

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Safely check if value is a non-null object (not array)
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Safely get a string property with validation
 * @param {object} obj - Source object
 * @param {string} key - Property key
 * @param {string} defaultValue - Default if missing/invalid
 * @param {number} maxLength - Maximum string length
 * @returns {string}
 */
function safeString(obj, key, defaultValue, maxLength = 500) {
  if (!isPlainObject(obj)) return defaultValue
  // Use Object.prototype.hasOwnProperty to avoid prototype pollution
  if (!Object.prototype.hasOwnProperty.call(obj, key)) return defaultValue
  const value = obj[key]
  if (typeof value !== 'string') return defaultValue
  return value.slice(0, maxLength)
}

/**
 * Safely get a boolean property with validation
 * @param {object} obj - Source object
 * @param {string} key - Property key
 * @param {boolean} defaultValue - Default if missing/invalid
 * @returns {boolean}
 */
function safeBoolean(obj, key, defaultValue) {
  if (!isPlainObject(obj)) return defaultValue
  if (!Object.prototype.hasOwnProperty.call(obj, key)) return defaultValue
  const value = obj[key]
  if (typeof value !== 'boolean') return defaultValue
  return value
}

/**
 * Safely get a number property with validation
 * @param {object} obj - Source object
 * @param {string} key - Property key
 * @param {number} defaultValue - Default if missing/invalid
 * @returns {number}
 */
function safeNumber(obj, key, defaultValue) {
  if (!isPlainObject(obj)) return defaultValue
  if (!Object.prototype.hasOwnProperty.call(obj, key)) return defaultValue
  const value = obj[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) return defaultValue
  return value
}

/**
 * Validate and sanitize a URL path for same-origin navigation
 * @param {string} path - The path to validate
 * @returns {string} - Safe path or '/' if invalid
 */
function validatePath(path) {
  // Must be a string
  if (typeof path !== 'string') return '/'

  // Trim and check length
  const trimmed = path.trim().slice(0, MAX_PATH_LENGTH)
  if (!trimmed) return '/'

  // Must start with / but not // (prevents protocol-relative URLs)
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/'

  // Block dangerous patterns
  const dangerous = ['javascript:', 'data:', 'vbscript:', '\\', '\0']
  const lower = trimmed.toLowerCase()
  for (const pattern of dangerous) {
    if (lower.includes(pattern)) return '/'
  }

  // Validate it's a proper relative path by parsing
  try {
    const url = new URL(trimmed, self.location.origin)
    // Ensure it resolves to same origin
    if (url.origin !== self.location.origin) return '/'
    // Check path is in allowed prefixes
    const pathname = url.pathname
    const isAllowed = ALLOWED_PATH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
    if (!isAllowed) return '/'
    return pathname + url.search + url.hash
  } catch {
    return '/'
  }
}

/**
 * Validate that a URL is same-origin and safe
 * @param {string} url - The URL to validate
 * @returns {string|null} - Safe URL or null if invalid
 */
function validateSameOriginURL(url) {
  if (typeof url !== 'string') return null

  try {
    const parsed = new URL(url, self.location.origin)
    // Must be same origin
    if (parsed.origin !== self.location.origin) return null
    // Validate the path portion
    const safePath = validatePath(parsed.pathname + parsed.search + parsed.hash)
    if (safePath === '/' && parsed.pathname !== '/') return null
    return new URL(safePath, self.location.origin).href
  } catch {
    return null
  }
}

/**
 * Validate and sanitize notification actions
 * @param {unknown} actions - Raw actions array
 * @returns {Array} - Sanitized actions array
 */
function validateActions(actions) {
  if (!Array.isArray(actions)) return []

  const sanitized = []
  const seen = new Set()

  for (const action of actions) {
    if (sanitized.length >= MAX_ACTIONS_COUNT) break
    if (!isPlainObject(action)) continue

    const actionId = safeString(action, 'action', '', 50)
    const title = safeString(action, 'title', '', 50)

    // Skip invalid or duplicate actions
    if (!actionId || !title || seen.has(actionId)) continue
    seen.add(actionId)

    // Build sanitized action without spread
    const sanitizedAction = {
      action: actionId,
      title: title,
    }

    // Optional icon - validate as relative path
    const icon = safeString(action, 'icon', '', 200)
    if (icon?.startsWith('/') && !icon.startsWith('//')) {
      sanitizedAction.icon = icon
    }

    sanitized.push(sanitizedAction)
  }

  return sanitized
}

/**
 * Validate the entire push payload structure and size
 * @param {string} rawData - Raw JSON string from push event
 * @returns {{ valid: boolean, payload?: object, error?: string }}
 */
function validatePushPayload(rawData) {
  // Check size limit
  if (typeof rawData === 'string' && rawData.length > MAX_PAYLOAD_SIZE) {
    return { valid: false, error: 'Payload exceeds size limit' }
  }

  let payload
  try {
    payload = JSON.parse(rawData)
  } catch {
    return { valid: false, error: 'Invalid JSON' }
  }

  // Must be a plain object
  if (!isPlainObject(payload)) {
    return { valid: false, error: 'Payload must be an object' }
  }

  return { valid: true, payload }
}

// ============================================================================
// Service Worker Lifecycle
// ============================================================================

// Install event - activate immediately
self.addEventListener('install', () => {
  self.skipWaiting()
})

// Activate event - claim all clients
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// ============================================================================
// Push Event Handling
// ============================================================================

// Push event handler - receives push messages from server
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.warn('[SW] Push event received without data')
    return
  }

  // Get raw text for size validation
  const rawData = event.data.text()

  // Validate payload
  const validation = validatePushPayload(rawData)
  if (!validation.valid) {
    console.error('[SW] Invalid push payload:', validation.error)
    // Show generic notification on validation failure
    event.waitUntil(
      self.registration.showNotification('Send', {
        body: 'You have a new notification',
        icon: '/favicon/apple-touch-icon.png',
        badge: '/favicon/favicon-32x32.png',
        tag: 'send-notification-fallback',
      })
    )
    return
  }

  event.waitUntil(handlePushNotification(validation.payload))
})

/**
 * Handle incoming push notification with strict validation
 * @param {Object} payload - The validated push notification payload
 */
async function handlePushNotification(payload) {
  // Extract and validate title (required for meaningful notification)
  const title = safeString(payload, 'title', 'Send', MAX_TITLE_LENGTH)

  // Get options safely (may not exist)
  const rawOptions = isPlainObject(payload.options) ? payload.options : {}

  // Get nested data safely
  const rawData = isPlainObject(rawOptions.data) ? rawOptions.data : {}

  // Validate path from data
  const path = validatePath(safeString(rawData, 'path', '/', MAX_PATH_LENGTH))

  // Build notification data without unsafe spreads
  // Only include explicitly validated fields
  const notificationData = {
    path: path,
    type: safeString(rawData, 'type', '', 50),
    badge: safeNumber(rawData, 'badge', 0),
  }

  // Build notification options explicitly (no spread)
  const notificationOptions = {
    body: safeString(rawOptions, 'body', '', MAX_BODY_LENGTH),
    icon: safeString(rawOptions, 'icon', '/favicon/apple-touch-icon.png', 200),
    badge: safeString(rawOptions, 'badge', '/favicon/favicon-32x32.png', 200),
    tag: safeString(rawOptions, 'tag', 'send-notification', 100),
    renotify: safeBoolean(rawOptions, 'renotify', true),
    requireInteraction: safeBoolean(rawOptions, 'requireInteraction', false),
    silent: safeBoolean(rawOptions, 'silent', false),
    data: notificationData,
    actions: validateActions(rawOptions.actions),
  }

  // Show the notification
  await self.registration.showNotification(title, notificationOptions)

  // Update badge count if provided and API available
  if (notificationData.badge > 0 && 'setAppBadge' in navigator) {
    try {
      await navigator.setAppBadge(notificationData.badge)
    } catch {
      // Badge API may not be available or permitted
    }
  }
}

// ============================================================================
// Notification Click Handling
// ============================================================================

// Notification click handler - opens relevant page
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  // Safely extract data
  const data = isPlainObject(event.notification.data) ? event.notification.data : {}
  const path = validatePath(safeString(data, 'path', '/', MAX_PATH_LENGTH))

  // Handle action button clicks (if any)
  if (event.action && typeof event.action === 'string') {
    // Note: We don't store action URLs in notification data to prevent
    // open redirect vulnerabilities. Actions navigate to the main path.
    // For specific action handling, the app can read the action from
    // the notification data after navigation.
  }

  // Build same-origin URL from validated path
  const url = new URL(path, self.location.origin).href

  // Final safety check
  const safeURL = validateSameOriginURL(url)
  if (!safeURL) {
    console.error('[SW] URL validation failed, navigating to home')
    event.waitUntil(openURL(new URL('/', self.location.origin).href))
    return
  }

  event.waitUntil(openURL(safeURL))
})

// Notification close handler
self.addEventListener('notificationclose', (event) => {
  // Log for debugging (avoid logging sensitive data)
  const tag = event.notification.tag
  if (typeof tag === 'string') {
    console.log('[SW] Notification closed:', tag.slice(0, 50))
  }
})

/**
 * Open URL in existing window or create new one
 * URL must already be validated as same-origin
 * @param {string} url - The validated same-origin URL to open
 */
async function openURL(url) {
  // Double-check URL is same-origin (defense in depth)
  try {
    const parsed = new URL(url)
    if (parsed.origin !== self.location.origin) {
      console.error('[SW] Attempted to open cross-origin URL')
      return
    }
  } catch {
    console.error('[SW] Invalid URL in openURL')
    return
  }

  const windowClients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  })

  // Try to find an existing window with same URL and focus it
  for (const client of windowClients) {
    if (client.url === url && 'focus' in client) {
      await client.focus()
      return
    }
  }

  // Try to find a focused window and navigate it
  const focusedClient = windowClients.find((client) => client.focused)
  if (focusedClient && 'navigate' in focusedClient) {
    await focusedClient.navigate(url)
    await focusedClient.focus()
    return
  }

  // Find any existing window and navigate/focus it
  if (windowClients.length > 0) {
    const client = windowClients[0]
    if ('navigate' in client) {
      await client.navigate(url)
      if ('focus' in client) {
        await client.focus()
      }
      return
    }
  }

  // Open new window as last resort
  await self.clients.openWindow(url)
}

// ============================================================================
// Push Subscription Change Handling
// ============================================================================

// Push subscription change handler
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed')

  // Notify clients to re-subscribe
  // Use a validated message type from allowlist
  const messageType = ALLOWED_MESSAGE_TYPES[0] // 'PUSH_SUBSCRIPTION_CHANGED'

  event.waitUntil(
    self.clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clients) => {
        for (const client of clients) {
          client.postMessage({
            type: messageType,
            // Don't include arbitrary data in messages
          })
        }
      })
  )
})
