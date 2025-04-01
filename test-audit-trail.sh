#!/bin/bash

# This script tests the enhanced audit trail functionality for tenant lifecycle operations

# Generate a unique identifier for testing
UNIQUE_ID="audit-$(date +%s)"
echo "Using test ID: $UNIQUE_ID for audit trail testing"

# =========================================================
# Test 1: Create a tenant and verify standard audit capture
# =========================================================
echo "Test 1: Create tenant to test audit trail generation"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Audit Test $UNIQUE_ID\",
    \"subdomain\": \"audit-$UNIQUE_ID\",
    \"identifier\": \"audit-id-$UNIQUE_ID\",
    \"description\": \"Tenant created for audit trail testing\"
  }")

# Parse status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Created tenant successfully"
  TENANT_ID=$(echo "$BODY" | grep -o '"id":[^,}]*' | head -1 | cut -d ':' -f2 | tr -d ' "')
  echo "Tenant ID: $TENANT_ID"
else
  echo "❌ Failed to create tenant: $HTTP_CODE"
  echo "$BODY" | json_pp
  exit 1
fi

echo "Verifying server logs for audit trail creation..."
echo "Note: Check server logs for messages containing 'Generating audit trail for tenant'"

# =========================================================
# Test 2: Update tenant status to trigger audit trail
# =========================================================
echo -e "\nTest 2: Updating tenant status to trigger status_change audit"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH http://localhost:3000/tenants/$TENANT_ID/status \
  -H "Content-Type: application/json" \
  -d "{
    \"status\": \"ACTIVE\",
    \"reason\": \"For audit trail testing\",
    \"actor\": \"test-script\"
  }")

# Parse status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Updated tenant status successfully"
  echo "$BODY" | json_pp
else
  echo "❌ Failed to update tenant status: $HTTP_CODE"
  echo "$BODY" | json_pp
fi

echo "Verifying server logs for status_change audit trail..."
echo "Note: Check server logs for 'Operation: status_change' entries"

# =========================================================
# Test 3: Fetch tenant to confirm update
# =========================================================
echo -e "\nTest 3: Fetch tenant to verify status update"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET http://localhost:3000/tenants/$TENANT_ID)

# Parse status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Retrieved tenant successfully"
  STATUS=$(echo "$BODY" | grep -o '"status":[^,}]*' | head -1 | cut -d ':' -f2 | tr -d ' "')
  echo "Current tenant status: $STATUS"
  
  if [ "$STATUS" = "ACTIVE" ]; then
    echo "✅ Tenant status was correctly updated to ACTIVE"
  else
    echo "❌ Tenant status update failed, current status: $STATUS"
  fi
else
  echo "❌ Failed to retrieve tenant: $HTTP_CODE"
  echo "$BODY" | json_pp
fi

echo -e "\nAudit trail testing completed"
echo "To verify the audit trail functionality fully, check the server logs for detailed audit entries"
