#!/bin/bash

# This script tests edge cases in tenant creation API
# It focuses on minimal required fields and special characters

# Generate a unique identifier for testing
UNIQUE_ID="edge-case-$(date +%s)"
echo "Using test ID: $UNIQUE_ID for edge case testing"

# 1. Test with only minimal required fields
echo "Test 1: Minimal required fields only"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Minimal $UNIQUE_ID\",
    \"subdomain\": \"minimal-$UNIQUE_ID\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Successfully created tenant with minimal fields"
  echo "$BODY" | json_pp
else
  echo "❌ Test failed: Couldn't create tenant with minimal fields, got $HTTP_CODE"
  echo "$BODY"
fi

# 2. Test with special characters in allowed fields
echo -e "\nTest 2: Special characters in name field"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Special Chars: !@#$%^&*() $UNIQUE_ID\",
    \"subdomain\": \"special-$UNIQUE_ID\",
    \"legalName\": \"Special Legal Name: !@#$%^&*()\",
    \"description\": \"Description with unicode: 你好世界 😊 Спасибо\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Successfully created tenant with special characters"
  echo "$BODY" | json_pp
else
  echo "❌ Test failed: Couldn't create tenant with special characters, got $HTTP_CODE"
  echo "$BODY"
fi

# 3. Test with boundary values (max subdomain length)
echo -e "\nTest 3: Subdomain at boundary length"
# Create a subdomain with 63 characters (common DNS limit)
SUBDOMAIN=$(printf 'x%.0s' {1..57})"-$UNIQUE_ID"
echo "Using subdomain of length ${#SUBDOMAIN}: $SUBDOMAIN"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Boundary Test $UNIQUE_ID\",
    \"subdomain\": \"$SUBDOMAIN\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Successfully created tenant with boundary length subdomain"
  echo "$BODY" | json_pp
else
  echo "❌ Test failed: Couldn't create tenant with boundary subdomain, got $HTTP_CODE"
  echo "$BODY"
fi

# 4. Test with whitespace in fields
echo -e "\nTest 4: Whitespace handling in fields"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"   Leading and trailing spaces   \",
    \"subdomain\": \"whitespace-$UNIQUE_ID\",
    \"legalName\": \"  Multiple   Spaces   Between   Words  \"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Successfully created tenant with whitespace in fields"
  echo "$BODY" | json_pp
  echo "Check if whitespace was properly trimmed in the response"
else
  echo "❌ Test failed: Couldn't create tenant with whitespace, got $HTTP_CODE"
  echo "$BODY"
fi

echo -e "\nEdge case testing completed"
