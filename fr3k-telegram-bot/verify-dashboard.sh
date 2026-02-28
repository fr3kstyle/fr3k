#!/usr/bin/env bash
# PAI Observability Dashboard Verification Script

echo "═══════════════════════════════════════════════════════════════"
echo "  PAI OBSERVABILITY DASHBOARD - VERIFICATION REPORT"
echo "═══════════════════════════════════════════════════════════════"
echo ""

PASSED=0
FAILED=0

# Helper functions
pass() {
  echo "  ✅ PASS: $1"
  ((PASSED++))
}

fail() {
  echo "  ❌ FAIL: $1"
  ((FAILED++))
}

# Test 1: Metrics Server Auto-Start
echo "━━━ Test 1: Metrics Server Auto-Start ━━━"
if systemctl --user is-enabled pai-metrics-server.service &>/dev/null; then
  pass "Service enabled for auto-start"
else
  fail "Service NOT enabled"
fi

if systemctl --user is-active pai-metrics-server.service &>/dev/null; then
  pass "Service is currently running"
else
  fail "Service NOT running"
fi
echo ""

# Test 2: Dashboard Loads
echo "━━━ Test 2: Dashboard Page Loads ━━━"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard)
if [ "$HTTP_CODE" = "200" ]; then
  pass "Dashboard returns HTTP 200"
else
  fail "Dashboard returned HTTP $HTTP_CODE"
fi

TITLE=$(curl -s http://localhost:3000/dashboard | grep -o "<title>.*</title>")
if [[ "$TITLE" =~ "PAI" ]]; then
  pass "Dashboard title contains 'PAI'"
else
  fail "Dashboard title: $TITLE"
fi
echo ""

# Test 3: API Endpoints
echo "━━━ Test 3: API Endpoints ━━━"

# /api/status
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/status)
if [ "$HTTP_CODE" = "200" ]; then
  pass "GET /api/status returns 200"
else
  fail "GET /api/status returned $HTTP_CODE"
fi

# /api/workflows
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/workflows)
if [ "$HTTP_CODE" = "200" ]; then
  pass "GET /api/workflows returns 200"
else
  fail "GET /api/workflows returned $HTTP_CODE"
fi

# /api/instances
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/instances)
if [ "$HTTP_CODE" = "200" ]; then
  pass "GET /api/instances returns 200"
else
  fail "GET /api/instances returned $HTTP_CODE"
fi

# /api/conversation/:userId
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/conversation/8188688460)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
  pass "GET /api/conversation/:userId responds (200 or 404 OK)"
else
  fail "GET /api/conversation/:userId returned $HTTP_CODE"
fi
echo ""

# Test 4: Jaeger UI
echo "━━━ Test 4: Jaeger Integration ━━━"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:16686)
if [ "$HTTP_CODE" = "200" ]; then
  pass "Jaeger UI accessible at :16686"
else
  fail "Jaeger UI returned $HTTP_CODE"
fi

if docker ps | grep -q jaeger; then
  pass "Jaeger container running"
else
  fail "Jaeger container NOT running"
fi
echo ""

# Test 5: SSE Real-Time Updates
echo "━━━ Test 5: SSE Real-Time Updates ━━━"
SSE_OUTPUT=$(timeout 2 curl -sN http://localhost:3000/metrics/sse 2>&1)
if echo "$SSE_OUTPUT" | grep -q "event: connected"; then
  pass "SSE sends 'connected' event"
else
  fail "SSE 'connected' event NOT found"
fi

if echo "$SSE_OUTPUT" | grep -q "event: system-update"; then
  pass "SSE sends 'system-update' events"
else
  fail "SSE 'system-update' events NOT found"
fi

if echo "$SSE_OUTPUT" | grep -q "event: agents-update"; then
  pass "SSE sends 'agents-update' events"
else
  fail "SSE 'agents-update' events NOT found"
fi
echo ""

# Test 6: Service Dependencies
echo "━━━ Test 6: Service Dependencies ━━━"
if systemctl --user is-active pai-telegram-bot.service &>/dev/null; then
  pass "PAI Telegram Bot service running"
else
  fail "PAI Telegram Bot service NOT running"
fi

# Summary
echo "═══════════════════════════════════════════════════════════════"
echo "  SUMMARY"
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ Passed: $PASSED"
echo "  ❌ Failed: $FAILED"
echo "  📊 Success Rate: $(( PASSED * 100 / (PASSED + FAILED) ))%"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "  🎉 ALL TESTS PASSED!"
  exit 0
else
  echo "  ⚠️  SOME TESTS FAILED - REVIEW ABOVE"
  exit 1
fi
