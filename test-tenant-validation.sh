#!/bin/bash

# This script tests validation error handling in tenant creation API
# It should return 400 Bad Request for invalid input data

# Generate a unique identifier for testing
UNIQUE_ID="validation-test-$(date +%s)"
echo "Using test ID: $UNIQUE_ID for validation testing"

# 1. Test missing required fields (name, subdomain)
echo "Test 1: Missing required fields"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"legalName\": \"Test Company LLC\",
    \"identifier\": \"testcompany-id-$UNIQUE_ID\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 400 ]; then
  echo "✅ Correctly received 400 Bad Request for missing required fields"
  echo "$BODY" | json_pp
else
  echo "❌ Test failed: Expected HTTP 400 for missing fields, got $HTTP_CODE"
  echo "$BODY"
fi

# 2. Test invalid email format
echo -e "\nTest 2: Invalid email format"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Company $UNIQUE_ID\",
    \"subdomain\": \"testcompany-$UNIQUE_ID\",
    \"legalName\": \"Test Company LLC\",
    \"identifier\": \"testcompany-id-$UNIQUE_ID\",
    \"primaryEmail\": \"invalid-email-format\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 400 ]; then
  echo "✅ Correctly received 400 Bad Request for invalid email format"
  echo "$BODY" | json_pp
else
  echo "❌ Test failed: Expected HTTP 400 for invalid email, got $HTTP_CODE"
  echo "$BODY"
fi

# 3. Test invalid date format
echo -e "\nTest 3: Invalid date format"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Company $UNIQUE_ID\",
    \"subdomain\": \"testcompany-$UNIQUE_ID\",
    \"legalName\": \"Test Company LLC\",
    \"identifier\": \"testcompany-id-$UNIQUE_ID\",
    \"foundedDate\": \"not-a-valid-date\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 400 ]; then
  echo "✅ Correctly received 400 Bad Request for invalid date format"
  echo "$BODY" | json_pp
else
  echo "❌ Test failed: Expected HTTP 400 for invalid date, got $HTTP_CODE"
  echo "$BODY"
fi

# 4. Test invalid enum value
echo -e "\nTest 4: Invalid enum value"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Company $UNIQUE_ID\",
    \"subdomain\": \"testcompany-$UNIQUE_ID\",
    \"legalName\": \"Test Company LLC\",
    \"identifier\": \"testcompany-id-$UNIQUE_ID\",
    \"businessType\": \"INVALID_TYPE\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 400 ]; then
  echo "✅ Correctly received 400 Bad Request for invalid enum value"
  echo "$BODY" | json_pp
else
  echo "❌ Test failed: Expected HTTP 400 for invalid enum, got $HTTP_CODE"
  echo "$BODY"
fi

# 5. Test field length exceeds max
echo -e "\nTest 5: Field length exceeds maximum"
# Create a very long string (1200 characters, exceeding the 1000 character limit)
LONG_STRING=$(printf '%*s' 1200 | tr ' ' 'X')
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Company $UNIQUE_ID\",
    \"subdomain\": \"testcompany-$UNIQUE_ID\",
    \"legalName\": \"Test Company LLC\",
    \"identifier\": \"testcompany-id-$UNIQUE_ID\",
    \"description\": \"$LONG_STRING\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 400 ]; then
  echo "✅ Correctly received 400 Bad Request for exceeding field length"
  echo "$BODY" | json_pp
else
  echo "❌ Test failed: Expected HTTP 400 for long field, got $HTTP_CODE"
  echo "$BODY"
fi

echo -e "\nValidation testing completed"
