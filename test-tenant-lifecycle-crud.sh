#!/bin/bash

# Comprehensive test script for tenant CRUD operations with focus on updates and audit trails
# This script tests the complete tenant lifecycle with all enhancements

# Generate a unique identifier for testing
UNIQUE_ID="tenant-$(date +%s)"
echo "Using test ID: $UNIQUE_ID for tenant lifecycle testing"

# ========================================================
# Test 1: Create a tenant and capture ID for further tests
# ========================================================
echo "Test 1: Creating a new tenant"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Lifecycle Test $UNIQUE_ID\",
    \"subdomain\": \"lifecycle-$UNIQUE_ID\",
    \"identifier\": \"lifecycle-id-$UNIQUE_ID\",
    \"description\": \"Tenant created for lifecycle testing\"
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

# ========================================================
# Test 2: Retrieve the tenant to verify creation
# ========================================================
echo -e "\nTest 2: Retrieving tenant details"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET http://localhost:3000/tenants/$TENANT_ID)

# Parse status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Retrieved tenant successfully"
  echo "Current status: $(echo "$BODY" | grep -o '"status":[^,}]*' | head -1 | cut -d ':' -f2 | tr -d ' "')"
else
  echo "❌ Failed to retrieve tenant: $HTTP_CODE"
  echo "$BODY" | json_pp
  exit 1
fi

# ========================================================
# Test 3: Update the tenant details
# ========================================================
echo -e "\nTest 3: Updating tenant details"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH http://localhost:3000/tenants/$TENANT_ID \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Updated Lifecycle Test $UNIQUE_ID\",
    \"description\": \"Updated description for lifecycle testing\"
  }")

# Parse status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Updated tenant successfully"
  echo "Updated name: $(echo "$BODY" | grep -o '"name":[^,}]*' | head -1 | cut -d ':' -f2 | tr -d ' "')"
else
  echo "❌ Failed to update tenant: $HTTP_CODE"
  echo "$BODY" | json_pp
  exit 1
fi

# ========================================================
# Test 4: Update tenant status with audit trail
# ========================================================
echo -e "\nTest 4: Updating tenant status to test audit trail"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH http://localhost:3000/tenants/$TENANT_ID/status \
  -H "Content-Type: application/json" \
  -d "{
    \"status\": \"ACTIVE\",
    \"reason\": \"Lifecycle testing completed successfully\",
    \"actor\": \"test-script-user\"
  }")

# Parse status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Updated tenant status successfully"
  echo "New status: $(echo "$BODY" | grep -o '"status":[^,}]*' | head -1 | cut -d ':' -f2 | tr -d ' "')"
else
  echo "❌ Failed to update tenant status: $HTTP_CODE"
  echo "$BODY" | json_pp
  exit 1
fi

# ========================================================
# Test 5: Test whitespace handling in duplicate detection
# ========================================================
echo -e "\nTest 5: Testing whitespace handling in duplicate detection"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"   Updated    Lifecycle    Test    $UNIQUE_ID   \",
    \"subdomain\": \"lifecycle-dupe-$UNIQUE_ID\",
    \"identifier\": \"lifecycle-id-dupe-$UNIQUE_ID\",
    \"description\": \"This should be detected as a duplicate due to normalized whitespace\"
  }")

# Parse status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 409 ]; then
  echo "✅ Correctly detected duplicate with whitespace variations"
  echo "$BODY" | json_pp
else
  echo "❌ Failed to detect duplicate with whitespace variations: $HTTP_CODE"
  echo "$BODY" | json_pp
fi

# ========================================================
# Test 6: Fetch tenant again to confirm all updates
# ========================================================
echo -e "\nTest 6: Fetching tenant to verify all updates"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET http://localhost:3000/tenants/$TENANT_ID)

# Parse status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Retrieved tenant successfully"
  echo "Final name: $(echo "$BODY" | grep -o '"name":[^,}]*' | head -1 | cut -d ':' -f2 | tr -d ' "')"
  echo "Final status: $(echo "$BODY" | grep -o '"status":[^,}]*' | head -1 | cut -d ':' -f2 | tr -d ' "')"
  echo "Final description: $(echo "$BODY" | grep -o '"description":[^,}]*' | head -1 | cut -d ':' -f2 | tr -d ' "')"
else
  echo "❌ Failed to retrieve tenant: $HTTP_CODE"
  echo "$BODY" | json_pp
  exit 1
fi

echo -e "\nTenant lifecycle testing completed"
echo "Check server logs for detailed audit entries with the tenant ID: $TENANT_ID"
