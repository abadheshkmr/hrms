#!/bin/bash

# This script tests multi-tenancy aspects of the tenant creation API
# It verifies that tenantId is properly set to null for the Tenant entity
# and related entities have correct tenantId references

# Generate a unique identifier for testing
UNIQUE_ID="multi-tenancy-$(date +%s)"
echo "Using test ID: $UNIQUE_ID for multi-tenancy testing"

# 1. Create a tenant with related entities
echo "Test 1: Create tenant with related entities and verify tenantId handling"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Multi-Tenant Test $UNIQUE_ID\",
    \"subdomain\": \"multi-tenant-$UNIQUE_ID\",
    \"legalName\": \"Multi-Tenant Test LLC\",
    \"identifier\": \"multi-tenant-$UNIQUE_ID\",
    \"addresses\": [
      {
        \"addressLine1\": \"123 Multi-Tenant St\",
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
  echo "✅ Successfully created tenant"
  TENANT_ID=$(echo "$BODY" | grep -o '\"id\"[[:space:]]*:[[:space:]]*\"[^\"]*\"' | head -1 | awk -F'\"' '{print $4}')
  echo "Tenant ID: $TENANT_ID"
  
  # Verify tenantId is null for the Tenant entity
  TENANT_TENANT_ID=$(echo "$BODY" | grep -o '\"tenantId\"[[:space:]]*:[[:space:]]*[^,}]*' | head -1)
  echo "Tenant.tenantId value: $TENANT_TENANT_ID"
  
  if [[ "$TENANT_TENANT_ID" == *"null"* ]]; then
    echo "✅ Tenant entity has tenantId correctly set to null"
  else
    echo "❌ Tenant entity has incorrect tenantId: $TENANT_TENANT_ID"
  fi
  
  # Check for address entities
  ADDRESS_IDS=$(echo "$BODY" | grep -o '\"addresses\".*?\[.*?\]' -z | grep -o '\"id\"[[:space:]]*:[[:space:]]*\"[^\"]*\"' | awk -F'\"' '{print $4}')
  
  if [ -n "$ADDRESS_IDS" ]; then
    echo -e "\nVerifying tenantId reference in addresses..."
    
    # For each address, check its tenantId
    echo "$ADDRESS_IDS" | while read -r ADDRESS_ID; do
      if [ -n "$ADDRESS_ID" ]; then
        # Verify tenantId in the response directly
        ADDRESS_TENANT_ID=$(echo "$BODY" | grep -A 20 "$ADDRESS_ID" | grep -o '\"tenantId\"[[:space:]]*:[[:space:]]*[^,}]*' | head -1)
        echo "Address $ADDRESS_ID: tenantId value: $ADDRESS_TENANT_ID"
        
        if [[ "$ADDRESS_TENANT_ID" == *"null"* ]]; then
          echo "✅ Address entity correctly has tenantId null (will be tenant-bound via entity relationship)"
        else
          echo "❌ Address entity has unexpected tenantId: $ADDRESS_TENANT_ID"
        fi
      fi
    done
  else
    echo "❌ No address entities found in response"
  fi
  
  # Print full response data for reference
  echo -e "\nFull response data:"
  echo "$BODY" | json_pp
else
  echo "❌ Test failed: Couldn't create tenant, got $HTTP_CODE"
  echo "$BODY"
fi

echo -e "\nMulti-tenancy testing completed"
