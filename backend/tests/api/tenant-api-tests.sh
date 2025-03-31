#!/bin/bash

# Configuration
API_BASE_URL="http://localhost:3000"
CONTENT_TYPE="Content-Type: application/json"
TIMESTAMP=$(date +%s)
# Generate lowercase random string to comply with subdomain validation
RANDOM_STRING=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-z0-9' | fold -w 8 | head -n 1)

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test data storage
TENANT_ID=""
ADDRESS_ID=""
CONTACT_ID=""

# Helper function for running tests
run_test() {
  local test_name=$1
  local command=$2
  
  echo -e "\n${BLUE}🧪 RUNNING TEST: ${test_name}${NC}"
  echo -e "${YELLOW}--------------------------------------------------${NC}"
  
  # Execute the command
  eval $command
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ TEST PASSED${NC}"
  else
    echo -e "${RED}❌ TEST FAILED${NC}"
  fi
}

# Test 1: Get all tenants
test_get_all_tenants() {
  echo "Getting all tenants..."
  local response=$(curl -s "${API_BASE_URL}/tenants")
  
  # Check if we got a valid JSON response with items
  if echo "$response" | grep -q "\"items\""; then
    echo "Retrieved tenants successfully"
    
    # Extract and show count of tenants
    local count=$(echo "$response" | grep -o '"total":[0-9]*' | cut -d':' -f2)
    echo "Total tenants: $count"
    
    # Extract the first tenant ID if there is one
    if [ "$count" -gt 0 ]; then
      TENANT_ID=$(echo "$response" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
      echo "Saved existing tenant ID: $TENANT_ID"
    fi
    
    return 0
  else
    echo "Failed to retrieve tenants or invalid response"
    echo "Response: $response"
    return 1
  fi
}

# Test 2: Create a tenant
test_create_tenant() {
  echo "Creating a new tenant..."
  
  # Generate unique tenant data
  local tenant_name="Test Tenant ${TIMESTAMP}-${RANDOM_STRING}"
  local tenant_subdomain="test-tenant-${TIMESTAMP}-${RANDOM_STRING}"
  
  # Create the JSON payload - ensure all fields match the entity structure
  local data='{
    "name": "'"$tenant_name"'",
    "subdomain": "'"$tenant_subdomain"'",
    "legalName": "Test Corporation Ltd",
    "business": {
      "businessType": "SERVICE",
      "businessScale": "MEDIUM",
      "industry": "OTHER",
      "foundedDate": "2020-01-01"
    },
    "registration": {
      "cinNumber": "cin-'"$RANDOM_STRING"'",
      "panNumber": "pan-'"$RANDOM_STRING"'",
      "gstNumber": "gst-'"$RANDOM_STRING"'"
    },
    "contact": {
      "website": "https://'"$RANDOM_STRING"'.example.com",
      "primaryEmail": "contact@'"$RANDOM_STRING"'.example.com",
      "primaryPhone": "+123456'"$RANDOM_STRING"'",
      "supportEmail": "support@'"$RANDOM_STRING"'.example.com"
    },
    "isActive": true
  }'
  
  echo "Tenant data: $data"
  
  # Post the tenant data
  local response=$(curl -s -X POST "${API_BASE_URL}/tenants" \
    -H "$CONTENT_TYPE" \
    -d "$data")
  
  # Check if we got a valid response with an ID
  if echo "$response" | grep -q '"id"'; then
    TENANT_ID=$(echo "$response" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    echo "Created tenant with ID: $TENANT_ID"
    return 0
  else
    echo "Failed to create tenant"
    echo "Response: $response"
    return 1
  fi
}

# Test 3: Get a tenant by ID
test_get_tenant_by_id() {
  if [ -z "$TENANT_ID" ]; then
    echo "No tenant ID available for testing"
    return 1
  fi
  
  echo "Getting tenant with ID: $TENANT_ID"
  
  local response=$(curl -s "${API_BASE_URL}/tenants/${TENANT_ID}")
  
  # Check if we got a valid response with matching ID
  if echo "$response" | grep -q "\"id\":\"${TENANT_ID}\""; then
    echo "Retrieved tenant by ID successfully"
    return 0
  else
    echo "Failed to retrieve tenant by ID"
    echo "Response: $response"
    return 1
  fi
}

# Test 4: Get a tenant with full data
test_get_tenant_with_full_data() {
  if [ -z "$TENANT_ID" ]; then
    echo "No tenant ID available for testing"
    return 1
  fi
  
  echo "Getting tenant with full data for ID: $TENANT_ID"
  
  local response=$(curl -s "${API_BASE_URL}/tenants/${TENANT_ID}/full")
  
  # Check if we got a valid response with matching ID
  if echo "$response" | grep -q "\"id\":\"${TENANT_ID}\""; then
    echo "Retrieved tenant with full data successfully"
    
    # Check for addresses and contacts
    if echo "$response" | grep -q '"addresses"'; then
      echo "Addresses included: yes"
    else
      echo "Addresses included: no"
    fi
    
    if echo "$response" | grep -q '"contacts"'; then
      echo "Contacts included: yes"
    else
      echo "Contacts included: no"
    fi
    
    return 0
  else
    echo "Failed to retrieve tenant with full data"
    echo "Response: $response"
    return 1
  fi
}

# Test 5: Update a tenant
test_update_tenant() {
  if [ -z "$TENANT_ID" ]; then
    echo "No tenant ID available for testing"
    return 1
  fi
  
  echo "Updating tenant with ID: $TENANT_ID"
  
  # Create update data
  local update_data='{
    "legalName": "Updated Corporation Ltd '"$RANDOM_STRING"'",
    "business": {
      "businessScale": "LARGE",
      "description": "Updated business description"
    }
  }'
  
  local response=$(curl -s -X PATCH "${API_BASE_URL}/tenants/${TENANT_ID}" \
    -H "$CONTENT_TYPE" \
    -d "$update_data")
  
  # Check if we got a valid response
  if echo "$response" | grep -q '"legalName":"Updated'; then
    echo "Updated tenant successfully"
    return 0
  else
    echo "Failed to update tenant"
    echo "Response: $response"
    return 1
  fi
}

# Test 6: Add an address to a tenant
test_add_address_to_tenant() {
  if [ -z "$TENANT_ID" ]; then
    echo "No tenant ID available for testing"
    return 1
  fi
  
  echo "Adding address to tenant with ID: $TENANT_ID"
  
  # Create address data with a valid addressType
  local address_data='{
    "addressType": "CORPORATE",
    "addressLine1": "123 Test Street",
    "addressLine2": "Suite '"$RANDOM_STRING"'",
    "city": "Test City",
    "state": "Test State",
    "country": "Test Country",
    "postalCode": "12345",
    "isPrimary": true
  }'
  
  local response=$(curl -s -X POST "${API_BASE_URL}/tenants/${TENANT_ID}/addresses" \
    -H "$CONTENT_TYPE" \
    -d "$address_data")
  
  # Check if we got a valid response with an ID
  if echo "$response" | grep -q '"id"'; then
    ADDRESS_ID=$(echo "$response" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    echo "Added address with ID: $ADDRESS_ID"
    return 0
  else
    echo "Failed to add address"
    echo "Response: $response"
    return 1
  fi
}

# Test 7: Get tenant addresses
test_get_tenant_addresses() {
  if [ -z "$TENANT_ID" ]; then
    echo "No tenant ID available for testing"
    return 1
  fi
  
  echo "Getting addresses for tenant with ID: $TENANT_ID"
  
  local response=$(curl -s "${API_BASE_URL}/tenants/${TENANT_ID}/addresses")
  
  # Check if we got a valid response
  if echo "$response" | grep -q '\['; then
    # Count the addresses
    local address_count=$(echo "$response" | grep -o '"id"' | wc -l)
    echo "Retrieved $address_count addresses"
    return 0
  else
    echo "Failed to get addresses or no addresses found"
    echo "Response: $response"
    return 1
  fi
}

# Test 8: Add contact info to a tenant
test_add_contact_info_to_tenant() {
  if [ -z "$TENANT_ID" ]; then
    echo "No tenant ID available for testing"
    return 1
  fi
  
  echo "Adding contact info to tenant with ID: $TENANT_ID"
  
  # Create contact info data with a valid contactType
  local contact_data='{
    "contactType": "PRIMARY",
    "firstName": "Test",
    "lastName": "Contact'"$RANDOM_STRING"'",
    "email": "test'"$RANDOM_STRING"'@example.com",
    "phone": "+987654321'"$RANDOM_STRING"'",
    "position": "Manager",
    "department": "Sales",
    "isPrimary": true
  }'
  
  local response=$(curl -s -X POST "${API_BASE_URL}/tenants/${TENANT_ID}/contact-info" \
    -H "$CONTENT_TYPE" \
    -d "$contact_data")
  
  # Check if we got a valid response with an ID
  if echo "$response" | grep -q '"id"'; then
    CONTACT_ID=$(echo "$response" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    echo "Added contact info with ID: $CONTACT_ID"
    return 0
  else
    echo "Failed to add contact info"
    echo "Response: $response"
    return 1
  fi
}

# Test 9: Get tenant contact info
test_get_tenant_contact_info() {
  if [ -z "$TENANT_ID" ]; then
    echo "No tenant ID available for testing"
    return 1
  fi
  
  echo "Getting contact info for tenant with ID: $TENANT_ID"
  
  local response=$(curl -s "${API_BASE_URL}/tenants/${TENANT_ID}/contact-info")
  
  # Check if we got a valid response
  if echo "$response" | grep -q '\['; then
    # Count the contact info items
    local contact_count=$(echo "$response" | grep -o '"id"' | wc -l)
    echo "Retrieved $contact_count contact info items"
    return 0
  else
    echo "Failed to get contact info or no contact info found"
    echo "Response: $response"
    return 1
  fi
}

# Run all tests
echo -e "${BLUE}🚀 STARTING TENANT API TESTS${NC}"
echo -e "${YELLOW}==================================================${NC}"

# First batch of tests
run_test "Get All Tenants" test_get_all_tenants
run_test "Create Tenant" test_create_tenant
run_test "Get Tenant By ID" test_get_tenant_by_id
run_test "Get Tenant With Full Data" test_get_tenant_with_full_data

# Second batch of tests
run_test "Update Tenant" test_update_tenant
run_test "Add Address to Tenant" test_add_address_to_tenant
run_test "Get Tenant Addresses" test_get_tenant_addresses
run_test "Add Contact Info to Tenant" test_add_contact_info_to_tenant
run_test "Get Tenant Contact Info" test_get_tenant_contact_info

echo -e "\n${BLUE}🏁 ALL TESTS COMPLETED${NC}"
echo -e "${YELLOW}==================================================${NC}"
echo "Summary:"
echo "Tenant ID: $TENANT_ID"
echo "Address ID: $ADDRESS_ID"
echo "Contact ID: $CONTACT_ID"
