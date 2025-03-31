#!/bin/bash

# This script tests duplicate subdomain/name validation in tenant creation API
# It should return a 409 Conflict when trying to create tenants with duplicate values

# Generate a fixed identifier for creating duplicate tenants
UNIQUE_ID="duplicate-test-$(date +%s)"
echo "Using test ID: $UNIQUE_ID for duplicate testing"

# 1. First create a tenant
echo "Step 1: Creating first tenant with ID $UNIQUE_ID"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Company $UNIQUE_ID\",
    \"subdomain\": \"testcompany-$UNIQUE_ID\",
    \"legalName\": \"Test Company LLC\",
    \"identifier\": \"testcompany-id-$UNIQUE_ID\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ First tenant created successfully"
  echo "$BODY" | json_pp
else
  echo "❌ Failed to create first tenant. Cannot proceed with duplicate test."
  echo "$BODY"
  exit 1
fi

# 2. Try to create a tenant with the same subdomain
echo -e "\nStep 2: Attempting to create tenant with duplicate subdomain"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Different Company Name\",
    \"subdomain\": \"testcompany-$UNIQUE_ID\",
    \"legalName\": \"Different Legal Name\",
    \"identifier\": \"different-id-$UNIQUE_ID\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 409 ]; then
  echo "✅ Expected conflict response received for duplicate subdomain"
  echo "$BODY" | json_pp
else
  echo "❌ Test failed: Expected HTTP 409 for duplicate subdomain, got $HTTP_CODE"
  echo "$BODY"
fi

# 3. Try to create a tenant with the same name
echo -e "\nStep 3: Attempting to create tenant with duplicate name"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Company $UNIQUE_ID\",
    \"subdomain\": \"different-subdomain-$UNIQUE_ID\",
    \"legalName\": \"Different Legal Name\",
    \"identifier\": \"different-id-$UNIQUE_ID\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 409 ]; then
  echo "✅ Expected conflict response received for duplicate name"
  echo "$BODY" | json_pp
else
  echo "❌ Test failed: Expected HTTP 409 for duplicate name, got $HTTP_CODE"
  echo "$BODY"
fi

# 4. Try to create a tenant with the same identifier
echo -e "\nStep 4: Attempting to create tenant with duplicate identifier"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Different Company Name 2\",
    \"subdomain\": \"different-subdomain-2-$UNIQUE_ID\",
    \"legalName\": \"Different Legal Name 2\",
    \"identifier\": \"testcompany-id-$UNIQUE_ID\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 409 ]; then
  echo "✅ Expected conflict response received for duplicate identifier"
  echo "$BODY" | json_pp
else
  echo "❌ Test failed: Expected HTTP 409 for duplicate identifier, got $HTTP_CODE"
  echo "$BODY"
fi

echo -e "\nDuplicate validation testing completed"
