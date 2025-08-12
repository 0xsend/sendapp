# Race Condition Troubleshooting Guide

This guide provides comprehensive troubleshooting procedures for identifying, diagnosing, and resolving race condition issues in the transfer workflow.

## Quick Diagnosis Commands

### Immediate Health Check
```bash
# Run critical race condition tests
npm run test:race-conditions:critical

# Check system health
curl -s http://localhost:3000/api/health | jq .race_conditions
```

### System Status Overview  
```sql
-- Overall race condition health check
WITH race_condition_metrics AS (
  SELECT
    COUNT(*) FILTER (WHERE event_name IN ('send_account_transfers', 'send_account_receives')) as total_activities,
    COUNT(*) FILTER (WHERE event_name IN ('send_account_transfers', 'send_account_receives') AND data->>'note' IS NOT NULL) as activities_with_notes,
    COUNT(*) FILTER (WHERE event_name = 'temporal_send_account_transfers') as temporal_activities,
    COUNT(DISTINCT event_id) FILTER (WHERE event_id LIKE 'temporal/%') as unique_workflows
  FROM activity 
  WHERE created_at > NOW() - INTERVAL '24 hours'
)
SELECT 
  total_activities,
  activities_with_notes,
  ROUND(activities_with_notes * 100.0 / NULLIF(total_activities, 0), 2) as note_attachment_rate,
  temporal_activities,
  CASE 
    WHEN temporal_activities = 0 THEN 'HEALTHY'
    WHEN temporal_activities < 5 THEN 'WARNING' 
    ELSE 'CRITICAL'
  END as duplicate_status
FROM race_condition_metrics;
```

## Bug-Specific Troubleshooting

## Bug 1: Note Lookup Race Condition

### Symptoms
- Users report notes missing from completed transfers
- Note attachment rate \< 99%
- Activities exist but `data.note` is null

### Diagnostic Commands

#### Check Note Attachment Success Rate
```sql
-- Last 24 hours note attachment statistics
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as total_activities,
  COUNT(CASE WHEN data->>'note' IS NOT NULL THEN 1 END) as with_notes,
  ROUND(COUNT(CASE WHEN data->>'note' IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
FROM activity 
WHERE event_name IN ('send_account_transfers', 'send_account_receives')
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;
```

#### Identify Timing Issues
```sql
-- Check for temporal workflow processing delays
SELECT 
  workflow_id,
  status,
  created_at,
  updated_at,
  EXTRACT(EPOCH FROM (updated_at - created_at)) as processing_seconds,
  CASE 
    WHEN status = 'confirmed' AND updated_at - created_at > INTERVAL '5 minutes' THEN 'SLOW'
    WHEN status != 'confirmed' AND created_at < NOW() - INTERVAL '10 minutes' THEN 'STUCK'
    ELSE 'NORMAL'
  END as timing_status
FROM temporal.send_account_transfers 
WHERE created_at > NOW() - INTERVAL '4 hours'
ORDER BY processing_seconds DESC
LIMIT 10;
```

#### Test Fallback Lookup Mechanism
```sql
-- Verify fallback lookup is working
WITH fallback_test AS (
  SELECT 
    a.event_id,
    a.data->>'note' as note,
    t.workflow_id,
    t.data->>'note' as temporal_note,
    CASE 
      WHEN a.event_id LIKE t.workflow_id || '%' THEN 'FALLBACK_MATCH'
      WHEN t.send_account_transfers_activity_event_id = a.event_id THEN 'PRIMARY_MATCH'
      ELSE 'NO_MATCH'
    END as lookup_type
  FROM activity a
  LEFT JOIN temporal.send_account_transfers t ON (
    a.event_id LIKE t.workflow_id || '%' OR
    t.send_account_transfers_activity_event_id = a.event_id
  )
  WHERE a.event_name IN ('send_account_transfers', 'send_account_receives')
    AND a.created_at > NOW() - INTERVAL '1 hour'
)
SELECT 
  lookup_type,
  COUNT(*) as count,
  COUNT(CASE WHEN note IS NOT NULL THEN 1 END) as with_notes
FROM fallback_test 
GROUP BY lookup_type;
```

### Resolution Steps

#### 1. Check Database Trigger Function
```sql
-- Verify note lookup trigger exists and is active
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  trigger_body
FROM information_schema.triggers 
WHERE trigger_name LIKE '%note%' 
  AND event_object_table = 'activity';
```

#### 2. Test Manual Note Lookup  
```sql
-- Manual fallback lookup test
SELECT attach_temporal_notes_to_activity();
```

#### 3. Monitor Temporal Workflow Performance
```bash
# Check temporal server health
temporal workflow list --query "WorkflowType='transfer'"

# Check for stuck workflows
temporal workflow list --query "WorkflowType='transfer' AND ExecutionStatus='Running'" --limit 20
```

#### 4. Restart Note Attachment Process
```sql
-- Force re-run note attachment for recent activities
UPDATE activity 
SET updated_at = NOW()
WHERE event_name IN ('send_account_transfers', 'send_account_receives')
  AND data->>'note' IS NULL
  AND created_at > NOW() - INTERVAL '1 hour';
```

## Bug 2: Duplicate Activity Prevention

### Symptoms  
- Users see duplicate transfers in activity feed
- Both temporal and blockchain activities exist for same transfer
- Duplicate activity rate \> 0.1%

### Diagnostic Commands

#### Identify Duplicate Activities
```sql
-- Find current duplicate activities
WITH duplicates AS (
  SELECT 
    REGEXP_REPLACE(event_id, '/(base_logs|pending)/.*$', '') as workflow_base,
    COUNT(*) as activity_count,
    ARRAY_AGG(DISTINCT event_name) as event_types,
    ARRAY_AGG(event_id) as event_ids
  FROM activity
  WHERE event_id LIKE 'temporal/%'
    AND created_at > NOW() - INTERVAL '24 hours'
  GROUP BY REGEXP_REPLACE(event_id, '/(base_logs|pending)/.*$', '')
  HAVING COUNT(*) > 1
)
SELECT 
  workflow_base,
  activity_count,
  event_types,
  event_ids
FROM duplicates
ORDER BY activity_count DESC;
```

#### Check Cleanup Activity Status  
```sql
-- Check cleanup activity execution success
SELECT 
  workflow_id,
  activity_name,
  result,
  attempt,
  started_time,
  completed_time,
  CASE 
    WHEN result = 'COMPLETED' THEN 'SUCCESS'
    WHEN result = 'FAILED' THEN 'FAILED'
    WHEN result IS NULL THEN 'PENDING'
    ELSE 'UNKNOWN'
  END as status
FROM temporal_activity_log 
WHERE activity_name = 'cleanupTemporalActivityAfterConfirmation'
  AND started_time > NOW() - INTERVAL '24 hours'
ORDER BY started_time DESC
LIMIT 20;
```

#### Analyze Cleanup Timing
```sql
-- Check if cleanup is happening too early
SELECT 
  a.event_id,
  a.event_name,
  a.created_at as activity_created,
  t.updated_at as workflow_updated,
  EXTRACT(EPOCH FROM (t.updated_at - a.created_at)) as time_diff_seconds
FROM activity a
JOIN temporal.send_account_transfers t ON (
  a.event_id LIKE t.workflow_id || '%'
)
WHERE a.event_name = 'temporal_send_account_transfers'
  AND t.status = 'confirmed'
  AND a.created_at > NOW() - INTERVAL '4 hours'
ORDER BY time_diff_seconds ASC;
```

### Resolution Steps

#### 1. Manual Cleanup of Duplicates
```sql
-- CAREFUL: This will delete temporal activities where blockchain activity exists
WITH cleanup_candidates AS (
  SELECT temporal_act.id
  FROM activity temporal_act
  JOIN activity blockchain_act ON (
    blockchain_act.event_id LIKE REGEXP_REPLACE(temporal_act.event_id, '/(pending).*$', '') || '%'
    AND blockchain_act.event_name = 'send_account_transfers'
    AND temporal_act.event_name = 'temporal_send_account_transfers'
  )
  WHERE temporal_act.created_at > NOW() - INTERVAL '4 hours'
)
DELETE FROM activity 
WHERE id IN (SELECT id FROM cleanup_candidates);
```

#### 2. Fix Stuck Cleanup Activities
```bash
# Restart failed cleanup workflows
temporal workflow reset --workflow_id="temporal/transfer/*" --reason="Fix cleanup issue"

# Or signal workflows to retry cleanup
temporal workflow signal --workflow_id="temporal/transfer/USER_ID/HASH" --name="retry_cleanup"
```

#### 3. Validate Cleanup Logic
```typescript
// Test cleanup activity manually
const result = await activities.cleanupTemporalActivityAfterConfirmation({
  workflow_id: 'temporal/transfer/test-user/0xtest-hash',
  final_event_id: 'test-final-event-id', 
  final_event_name: 'send_account_transfers'
});
console.log('Cleanup result:', result);
```

#### 4. Monitor Cleanup Success Rate
```sql
-- Set up monitoring for cleanup success
SELECT 
  DATE_TRUNC('hour', started_time) as hour,
  COUNT(*) as total_cleanups,
  COUNT(*) FILTER (WHERE result = 'COMPLETED') as successful_cleanups,
  ROUND(COUNT(*) FILTER (WHERE result = 'COMPLETED') * 100.0 / COUNT(*), 2) as success_rate
FROM temporal_activity_log 
WHERE activity_name = 'cleanupTemporalActivityAfterConfirmation'
  AND started_time > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', started_time)
ORDER BY hour DESC;
```

## Bug 3: API Response Timing Issues

### Symptoms
- API response times \> 2000ms  
- Users experience timeouts or delays
- High number of 504/timeout errors

### Diagnostic Commands

#### Check API Response Times
```sql  
-- API response time analysis
SELECT 
  DATE_TRUNC('minute', timestamp) as minute,
  AVG(response_time_ms) as avg_response_time,
  MAX(response_time_ms) as max_response_time,
  COUNT(*) as request_count,
  COUNT(*) FILTER (WHERE response_time_ms > 2000) as slow_requests
FROM api_metrics 
WHERE endpoint = '/api/temporal/transfer'
  AND timestamp > NOW() - INTERVAL '2 hours'
GROUP BY DATE_TRUNC('minute', timestamp)
ORDER BY minute DESC;
```

#### Identify Slow Workflows  
```bash
# Check for workflows taking too long to start
temporal workflow list --query "WorkflowType='transfer' AND StartTime > '2024-01-01T00:00:00Z'" \
  --fields="WorkflowId,StartTime,ExecutionTime" \
  --limit 50
```

#### Check for Retry Logic (Should be Absent)
```bash
# Verify no retry logic exists in API code  
grep -r "withRetry\|Promise.any\|setTimeout.*retry\|maxAttempts" packages/api/src/routers/temporal.ts

# Should return no matches - if it returns matches, retry logic still exists
```

### Resolution Steps

#### 1. Verify Immediate Response Pattern
```bash
# Test API response time manually
time curl -X POST http://localhost:3000/api/temporal/transfer \
  -H "Content-Type: application/json" \
  -d '{"userOp": {...}, "note": "test"}'

# Should complete in < 1 second
```

#### 2. Check Temporal Server Health
```bash
# Temporal server diagnostics
temporal server status
temporal cluster health

# Check temporal server logs for issues
kubectl logs temporal-server -n temporal --tail=100
```

#### 3. Monitor Workflow Start Performance
```sql
-- Track workflow start times
SELECT 
  workflow_id,
  created_at,
  updated_at,
  status,
  EXTRACT(EPOCH FROM (updated_at - created_at)) as start_time_seconds
FROM temporal.send_account_transfers 
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND status != 'initialized'
ORDER BY start_time_seconds DESC
LIMIT 10;
```

#### 4. Restart API Service (if needed)
```bash
# Restart API service to clear any hanging connections
kubectl rollout restart deployment/api-server

# Or for local development
pm2 restart api-server
```

## General Race Condition Monitoring

### Dashboard Queries

#### Key Performance Indicators (KPIs)
```sql
-- Race condition health dashboard
WITH metrics AS (
  SELECT 
    -- Bug 1: Note attachment rate
    COUNT(*) FILTER (WHERE event_name IN ('send_account_transfers', 'send_account_receives')) as total_final_activities,
    COUNT(*) FILTER (WHERE event_name IN ('send_account_transfers', 'send_account_receives') AND data->>'note' IS NOT NULL) as activities_with_notes,
    
    -- Bug 2: Duplicate rate  
    COUNT(*) FILTER (WHERE event_name = 'temporal_send_account_transfers') as temporal_activities,
    
    -- Bug 3: API performance (from separate table)
    (SELECT AVG(response_time_ms) FROM api_metrics WHERE endpoint = '/api/temporal/transfer' AND timestamp > NOW() - INTERVAL '1 hour') as avg_api_response
  FROM activity 
  WHERE created_at > NOW() - INTERVAL '1 hour'
)
SELECT 
  total_final_activities,
  activities_with_notes,
  ROUND(activities_with_notes * 100.0 / NULLIF(total_final_activities, 0), 2) as note_attachment_rate,
  temporal_activities as duplicate_count,
  ROUND(temporal_activities * 100.0 / NULLIF(total_final_activities, 0), 2) as duplicate_rate,
  ROUND(avg_api_response) as avg_api_response_ms,
  
  -- Health status
  CASE 
    WHEN activities_with_notes * 100.0 / NULLIF(total_final_activities, 0) >= 99 THEN '✅'
    WHEN activities_with_notes * 100.0 / NULLIF(total_final_activities, 0) >= 95 THEN '⚠️'
    ELSE '❌'
  END as bug1_status,
  
  CASE 
    WHEN temporal_activities = 0 THEN '✅'
    WHEN temporal_activities < 5 THEN '⚠️'
    ELSE '❌'
  END as bug2_status,
  
  CASE 
    WHEN avg_api_response <= 1000 THEN '✅'
    WHEN avg_api_response <= 2000 THEN '⚠️'
    ELSE '❌'
  END as bug3_status
FROM metrics;
```

### Alert Conditions

#### Critical Alerts
```sql
-- Alert: Note attachment rate drops below 95%
SELECT 'CRITICAL: Note attachment rate below 95%' as alert
WHERE (
  SELECT COUNT(*) FILTER (WHERE data->>'note' IS NOT NULL) * 100.0 / COUNT(*)
  FROM activity 
  WHERE event_name IN ('send_account_transfers', 'send_account_receives')
    AND created_at > NOW() - INTERVAL '1 hour'
) < 95;

-- Alert: Duplicate activities detected  
SELECT 'CRITICAL: Duplicate activities detected' as alert
WHERE EXISTS (
  SELECT 1 FROM activity 
  WHERE event_name = 'temporal_send_account_transfers'
    AND created_at > NOW() - INTERVAL '5 minutes'
);

-- Alert: API response time degraded
SELECT 'WARNING: API response time high' as alert
WHERE (
  SELECT AVG(response_time_ms) 
  FROM api_metrics 
  WHERE endpoint = '/api/temporal/transfer'
    AND timestamp > NOW() - INTERVAL '10 minutes'
) > 2000;
```

### Automated Recovery Scripts

#### Auto-Recovery Script
```bash
#!/bin/bash
# race-condition-recovery.sh

echo "Starting race condition recovery check..."

# Check note attachment rate
NOTE_RATE=$(psql -t -c "
  SELECT COALESCE(
    COUNT(*) FILTER (WHERE data->>'note' IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0), 
    100
  )
  FROM activity 
  WHERE event_name IN ('send_account_transfers', 'send_account_receives')
    AND created_at > NOW() - INTERVAL '1 hour'
")

if (( $(echo "$NOTE_RATE < 95" | bc -l) )); then
  echo "Note attachment rate low ($NOTE_RATE%), triggering recovery..."
  psql -c "SELECT attach_temporal_notes_to_activity();"
fi

# Check for duplicates
DUPLICATES=$(psql -t -c "
  SELECT COUNT(*) 
  FROM activity 
  WHERE event_name = 'temporal_send_account_transfers'
    AND created_at > NOW() - INTERVAL '10 minutes'
")

if [ "$DUPLICATES" -gt 0 ]; then
  echo "Found $DUPLICATES duplicate activities, triggering cleanup..."
  # Trigger cleanup workflows
  temporal workflow signal --workflow_id="temporal/transfer/*" --name="force_cleanup"
fi

echo "Recovery check complete."
```

### Log Analysis

#### Key Log Patterns to Monitor
```bash
# Search for race condition related errors
grep -i "race\|duplicate\|note.*missing\|cleanup.*failed" /var/log/app/*.log

# Monitor temporal workflow errors
grep -E "(workflow.*failed|activity.*timeout|cleanup.*error)" /var/log/temporal/*.log

# API timeout patterns
grep -E "(timeout|504|gateway.*timeout)" /var/log/api/*.log
```

### Performance Testing

#### Load Test for Race Conditions
```bash
# Test concurrent transfers to trigger race conditions
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/temporal/transfer \
    -H "Content-Type: application/json" \
    -d "{\"userOp\": {...}, \"note\": \"Load test $i\"}" &
done
wait

# Check for any race condition issues after load test
npm run test:race-conditions:verify
```

## Emergency Procedures

### Complete Race Condition Reset
```sql
-- EMERGENCY ONLY: Clear all race condition states
BEGIN;

-- Remove duplicate temporal activities (BE VERY CAREFUL)
DELETE FROM activity 
WHERE event_name = 'temporal_send_account_transfers'
  AND EXISTS (
    SELECT 1 FROM activity a2 
    WHERE a2.event_name = 'send_account_transfers'
      AND a2.event_id LIKE REGEXP_REPLACE(activity.event_id, '/(pending).*$', '') || '%'
  );

-- Force re-attach notes
UPDATE activity 
SET updated_at = NOW()
WHERE event_name IN ('send_account_transfers', 'send_account_receives')
  AND data->>'note' IS NULL
  AND created_at > NOW() - INTERVAL '4 hours';

COMMIT;
```

### Service Restart Procedure
```bash
# Full service restart in correct order
kubectl scale deployment temporal-server --replicas=0
kubectl scale deployment api-server --replicas=0
sleep 30
kubectl scale deployment temporal-server --replicas=3
sleep 60  
kubectl scale deployment api-server --replicas=5

# Verify health
npm run test:race-conditions:health
```

## Prevention Best Practices

### Code Review Checklist
- [ ] No retry logic in API responses
- [ ] Proper error handling in cleanup activities  
- [ ] Database queries use proper indexes
- [ ] Temporal workflows handle concurrent execution
- [ ] All database changes include corresponding tests

### Monitoring Setup
```yaml
# alerts.yml
- alert: RaceConditionNoteRate
  expr: note_attachment_rate < 95
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: Note attachment rate below threshold

- alert: DuplicateActivities  
  expr: duplicate_activity_count > 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: Duplicate activities detected

- alert: APIResponseSlow
  expr: avg_api_response_time > 2000
  for: 2m
  labels:
    severity: warning  
  annotations:
    summary: API response times degraded
```

This troubleshooting guide should be your go-to resource for identifying, diagnosing, and resolving any race condition issues that may arise in the future.
