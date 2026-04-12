#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# load-test.sh — Simulate high traffic to trigger HPA scaling
# Usage:
#   ./load-test.sh                        # default: local Docker
#   ./load-test.sh http://192.168.49.2:30080  # Minikube NodePort
# ─────────────────────────────────────────────────────────────────────────────

BASE_URL="${1:-http://localhost:3000}"
CONCURRENT="${2:-20}"        # concurrent workers
DURATION="${3:-120}"         # seconds to run
CPU_LOAD_DURATION=5000       # ms each /load call runs

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; NC='\033[0m'

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  SmartScale Load Test — HPA Trigger Script${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "  Target URL  : $BASE_URL"
echo "  Concurrency : $CONCURRENT workers"
echo "  Duration    : ${DURATION}s"
echo ""

# Check dependencies
for cmd in curl awk; do
  command -v $cmd &>/dev/null || { echo "ERROR: $cmd not found"; exit 1; }
done

# Verify target is reachable
echo -e "  Checking target... "
if ! curl -sf "$BASE_URL/healthz" &>/dev/null; then
  echo -e "${RED}  ✗ Target unreachable: $BASE_URL${NC}"
  echo "  Make sure the app is running first."
  exit 1
fi
echo -e "${GREEN}  ✓ Target is up${NC}"
echo ""

# Stats counters (temp files for subshell sharing)
TMPDIR_STATS=$(mktemp -d)
echo 0 > "$TMPDIR_STATS/success"
echo 0 > "$TMPDIR_STATS/error"

worker() {
  local end=$((SECONDS + DURATION))
  while [ $SECONDS -lt $end ]; do
    # Alternate between regular requests and CPU load
    if (( RANDOM % 3 == 0 )); then
      STATUS=$(curl -sf -o /dev/null -w "%{http_code}" \
        "$BASE_URL/load?duration=${CPU_LOAD_DURATION}&intensity=100" \
        --max-time 15 2>/dev/null)
    else
      STATUS=$(curl -sf -o /dev/null -w "%{http_code}" \
        "$BASE_URL/" --max-time 5 2>/dev/null)
    fi

    if [[ "$STATUS" =~ ^2 ]]; then
      COUNT=$(cat "$TMPDIR_STATS/success")
      echo $((COUNT + 1)) > "$TMPDIR_STATS/success"
    else
      COUNT=$(cat "$TMPDIR_STATS/error")
      echo $((COUNT + 1)) > "$TMPDIR_STATS/error"
    fi
  done
}

# Launch concurrent workers in background
echo -e "  Launching ${CONCURRENT} workers...${NC}"
for i in $(seq 1 $CONCURRENT); do
  worker &
done

# Progress reporter
START_TIME=$SECONDS
while [ $((SECONDS - START_TIME)) -lt $DURATION ]; do
  ELAPSED=$((SECONDS - START_TIME))
  SUCCESS=$(cat "$TMPDIR_STATS/success")
  ERRORS=$(cat "$TMPDIR_STATS/error")
  TOTAL=$((SUCCESS + ERRORS))
  RPS=$(( TOTAL / (ELAPSED + 1) ))

  printf "\r  [%3ds/%3ds] Requests: %-6d | Success: %-6d | Errors: %-5d | ~%d req/s   " \
    "$ELAPSED" "$DURATION" "$TOTAL" "$SUCCESS" "$ERRORS" "$RPS"
  sleep 2
done

# Wait for all workers
wait
echo ""
echo ""

SUCCESS=$(cat "$TMPDIR_STATS/success")
ERRORS=$(cat "$TMPDIR_STATS/error")
TOTAL=$((SUCCESS + ERRORS))
RPS=$(( TOTAL / DURATION ))
ERROR_RATE=$(( ERRORS * 100 / (TOTAL + 1) ))

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  RESULTS"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "  Total Requests : $TOTAL"
echo -e "  Successful     : ${GREEN}$SUCCESS${NC}"
echo -e "  Errors         : ${RED}$ERRORS${NC}"
echo "  Avg RPS        : ~$RPS req/s"
echo "  Error Rate     : ${ERROR_RATE}%"
echo ""
echo -e "${GREEN}  ✓ Load test complete!${NC}"
echo ""
echo "  To watch HPA scaling in real time, run:"
echo -e "  ${YELLOW}  kubectl get hpa -n smartscale -w${NC}"
echo ""
rm -rf "$TMPDIR_STATS"
