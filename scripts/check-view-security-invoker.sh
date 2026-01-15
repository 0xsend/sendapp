#!/bin/bash
# Check that CREATE VIEW statements include security_invoker, security_barrier, and proper grants
# Fails if a view is missing security_invoker, security_barrier, or grants (when DROP VIEW is used)

set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get staged SQL files or use provided files
if [ $# -eq 0 ]; then
  FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.sql$' || true)
else
  FILES="$@"
fi

if [ -z "$FILES" ]; then
  exit 0
fi

FAILED=0

for FILE in $FILES; do
  if [ ! -f "$FILE" ]; then
    continue
  fi

  # Check for CREATE VIEW or CREATE OR REPLACE VIEW (case insensitive)
  # Exclude lines that are comments
  VIEW_LINES=$(grep -niE '^\s*create\s+(or\s+replace\s+)?view\s+' "$FILE" 2>/dev/null | grep -v '^\s*--' || true)

  if [ -z "$VIEW_LINES" ]; then
    continue
  fi

  # Check if file has security_invoker
  HAS_SECURITY_INVOKER=$(grep -iE 'security_invoker[[:space:]]*=[[:space:]]*(true|on)' "$FILE" || true)

  # Check if file has acknowledgment to skip security_invoker check
  HAS_INVOKER_ACK=$(grep -E -- '--.*no-security-invoker' "$FILE" || true)

  if [ -z "$HAS_SECURITY_INVOKER" ] && [ -z "$HAS_INVOKER_ACK" ]; then
    echo -e "${RED}ERROR:${NC} $FILE contains CREATE VIEW without security_invoker"
    echo -e "${YELLOW}Views should include 'WITH (security_invoker=on)' for RLS enforcement.${NC}"
    echo ""
    echo "Example:"
    echo "  CREATE VIEW my_view WITH (security_invoker=on) AS SELECT ..."
    echo ""
    echo "If you intentionally want a SECURITY DEFINER view, add this comment:"
    echo "  -- no-security-invoker: <reason>"
    echo ""
    FAILED=1
  fi

  # Check if file has security_barrier
  HAS_SECURITY_BARRIER=$(grep -iE 'security_barrier[[:space:]]*=[[:space:]]*(true|on)' "$FILE" || true)

  # Check if file has acknowledgment to skip security_barrier check
  HAS_BARRIER_ACK=$(grep -E -- '--.*no-security-barrier' "$FILE" || true)

  if [ -z "$HAS_SECURITY_BARRIER" ] && [ -z "$HAS_BARRIER_ACK" ]; then
    echo -e "${RED}ERROR:${NC} $FILE contains CREATE VIEW without security_barrier"
    echo -e "${YELLOW}Views should include 'WITH (security_barrier=on)' to prevent data leakage.${NC}"
    echo ""
    echo "Example:"
    echo "  CREATE VIEW my_view WITH (security_barrier=on, security_invoker=on) AS SELECT ..."
    echo ""
    echo "If you intentionally don't need security_barrier, add this comment:"
    echo "  -- no-security-barrier: <reason>"
    echo ""
    FAILED=1
  fi

  # Check if file has DROP VIEW (which loses grants)
  HAS_DROP_VIEW=$(grep -iE '^\s*drop\s+view' "$FILE" || true)

  if [ -n "$HAS_DROP_VIEW" ]; then
    # Check if file has GRANT statements for the view
    HAS_GRANTS=$(grep -iE '^\s*grant\s+.*\s+on\s+' "$FILE" || true)

    # Check if file has acknowledgment to skip grants check
    HAS_GRANTS_ACK=$(grep -E -- '--.*no-grants' "$FILE" || true)

    if [ -z "$HAS_GRANTS" ] && [ -z "$HAS_GRANTS_ACK" ]; then
      echo -e "${RED}ERROR:${NC} $FILE contains DROP VIEW without GRANT statements"
      echo -e "${YELLOW}DROP VIEW loses grants. Add GRANT/REVOKE statements or use CREATE OR REPLACE without DROP.${NC}"
      echo ""
      echo "Example grants:"
      echo "  REVOKE SELECT ON TABLE public.my_view FROM anon;"
      echo "  GRANT SELECT ON TABLE public.my_view TO authenticated;"
      echo "  GRANT SELECT ON TABLE public.my_view TO service_role;"
      echo ""
      echo "If grants are handled elsewhere, add this comment:"
      echo "  -- no-grants: <reason>"
      echo ""
      FAILED=1
    fi
  fi
done

if [ $FAILED -eq 1 ]; then
  echo -e "${RED}Pre-commit check failed.${NC} See above for details."
  exit 1
fi

exit 0
