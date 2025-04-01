#!/bin/bash

# This script tests the enhanced whitespace handling in duplicate detection

# Generate a unique identifier for testing
UNIQUE_ID="whitespace-$(date +%s)"
echo "Using test ID: $UNIQUE_ID for whitespace handling testing"

# =========================================================
# Test 1: Create a tenant with normal name
# =========================================================
echo "Test 1: Create initial tenant with normal name"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Whitespace Test $UNIQUE_ID\",
    \"subdomain\": \"whitespace-$UNIQUE_ID\",
    \"identifier\": \"whitespace-id-$UNIQUE_ID\"
  }")

# Parse status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Created initial tenant successfully"
  echo "$BODY" | json_pp
else
  echo "❌ Failed to create initial tenant: $HTTP_CODE"
  echo "$BODY" | json_pp
  exit 1
fi

# =========================================================
# Test 2: Create tenant with similar name but leading/trailing whitespace
# =========================================================
echo -e "\nTest 2: Create tenant with leading/trailing whitespace"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"  Whitespace Test $UNIQUE_ID  \",
    \"subdomain\": \"whitespace2-$UNIQUE_ID\",
    \"identifier\": \"whitespace-id2-$UNIQUE_ID\"
  }")

# Parse status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 409 ]; then
  echo "✅ Correctly detected duplicate with whitespace: $HTTP_CODE"
  echo "$BODY" | json_pp
else
  echo "❌ Failed to detect duplicate with whitespace: $HTTP_CODE"
  echo "$BODY" | json_pp
fi

# =========================================================
# Test 3: Create tenant with mixed case
# =========================================================
echo -e "\nTest 3: Create tenant with mixed case"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"whitespace TEST $UNIQUE_ID\",
    \"subdomain\": \"whitespace3-$UNIQUE_ID\",
    \"identifier\": \"whitespace-id3-$UNIQUE_ID\"
  }")

# Parse status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 409 ]; then
  echo "✅ Correctly detected duplicate with different case: $HTTP_CODE"
  echo "$BODY" | json_pp
else
  echo "❌ Failed to detect duplicate with different case: $HTTP_CODE"
  echo "$BODY" | json_pp
fi

# =========================================================
# Test 4: Create tenant with mixed whitespace within name
# =========================================================
echo -e "\nTest 4: Create tenant with mixed whitespace within name"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Whitespace   Test    $UNIQUE_ID\",
    \"subdomain\": \"whitespace4-$UNIQUE_ID\",
    \"identifier\": \"whitespace-id4-$UNIQUE_ID\"
  }")

# Parse status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 409 ]; then
  echo "✅ Correctly detected duplicate with extra internal whitespace: $HTTP_CODE"
  echo "$BODY" | json_pp
else
  echo "❌ Failed to detect duplicate with extra internal whitespace: $HTTP_CODE"
  echo "$BODY" | json_pp
fi

echo -e "\nWhitespace handling testing completed"
