#!/bin/bash

# This script tests transaction integrity in tenant creation API
# It verifies that all related entities are created or none are created

# Generate a unique identifier for testing
UNIQUE_ID="transaction-$(date +%s)"
echo "Using test ID: $UNIQUE_ID for transaction testing"

# 1. Test tenant creation with valid related entities
echo "Test 1: Create tenant with valid related entities"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Transaction Test $UNIQUE_ID\",
    \"subdomain\": \"transaction-$UNIQUE_ID\",
    \"legalName\": \"Transaction Test LLC\",
    \"identifier\": \"transaction-$UNIQUE_ID\",
    \"addresses\": [
      {
        \"addressLine1\": \"123 Transaction St\",
        \"city\": \"Mumbai\",
        \"state\": \"Maharashtra\",
        \"country\": \"India\",
        \"postalCode\": \"400001\",
        \"addressType\": \"REGISTERED\",
        \"isPrimary\": true
      }
    ],
    \"contactInfo\": [
      {
        \"contactType\": \"PRIMARY\",
        \"fullName\": \"Contact Person\",
        \"email\": \"contact$UNIQUE_ID@test.com\",
        \"phone\": \"+91-9876543210\",
        \"isPrimary\": true
      }
    ]
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Successfully created tenant with related entities"
  TENANT_ID=$(echo "$BODY" | grep -o '\"id\"[[:space:]]*:[[:space:]]*\"[^\"]*\"' | head -1 | awk -F'\"' '{print $4}')
  echo "Tenant ID: $TENANT_ID"
  
  # Check that we have addresses and contacts in the response
  ADDRESS_COUNT=$(echo "$BODY" | grep -o '\"addresses\"' | wc -l)
  CONTACT_COUNT=$(echo "$BODY" | grep -o '\"contactInfo\"' | wc -l)
  
  if [ "$ADDRESS_COUNT" -gt 0 ] && [ "$CONTACT_COUNT" -gt 0 ]; then
    echo "✅ Related entities (addresses and contacts) were created"
  else
    echo "❌ Related entities were not created properly"
  fi
else
  echo "❌ Test failed: Couldn't create tenant with related entities, got $HTTP_CODE"
  echo "$BODY"
fi

# 2. Test with invalid related entity (should rollback the whole transaction)
echo -e "\nTest 2: Create tenant with invalid related entity (to test rollback)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Rollback Test $UNIQUE_ID\",
    \"subdomain\": \"rollback-$UNIQUE_ID\",
    \"legalName\": \"Rollback Test LLC\",
    \"identifier\": \"rollback-$UNIQUE_ID\",
    \"addresses\": [
      {
        \"addressLine1\": \"123 Rollback St\",
        \"city\": \"Mumbai\",
        \"state\": \"Maharashtra\",
        \"country\": \"India\",
        \"postalCode\": \"400001\",
        \"addressType\": \"INVALID_TYPE_TO_CAUSE_ERROR\",
        \"isPrimary\": true
      }
    ]
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 400 ]; then
  echo "✅ Correctly received error for invalid related entity"
  echo "$BODY" | json_pp
  
  # Verify the tenant was not created (attempt to find it)
  echo -e "\nVerifying tenant was not created (transaction rolled back)..."
  FIND_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "http://localhost:3000/tenants?name=Rollback%20Test%20$UNIQUE_ID")
  
  FIND_HTTP_CODE=$(echo "$FIND_RESPONSE" | tail -n1)
  FIND_BODY=$(echo "$FIND_RESPONSE" | sed '$d')
  
  # Check if tenant exists in the response
  TENANT_COUNT=$(echo "$FIND_BODY" | grep -o "\"Rollback Test $UNIQUE_ID\"" | wc -l)
  
  if [ "$TENANT_COUNT" -eq 0 ]; then
    echo "✅ Transaction was properly rolled back - tenant not found"
  else
    echo "❌ Transaction integrity issue - tenant was created despite error in related entity"
    echo "$FIND_BODY" | json_pp
  fi
else
  echo "❌ Test failed: Expected error for invalid related entity, got $HTTP_CODE"
  echo "$BODY"
fi

echo -e "\nTransaction integrity testing completed"
