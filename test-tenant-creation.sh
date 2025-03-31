#!/bin/bash

# Generate unique identifier using just timestamp (simpler and more reliable)
TIMESTAMP=$(date +%s)
UNIQUE_ID="$TIMESTAMP"

# Test tenant creation API with a full payload that includes all available fields
curl -X POST http://localhost:3000/tenants \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Company $UNIQUE_ID\",
    \"subdomain\": \"testcompany-$UNIQUE_ID\",
    \"legalName\": \"Test Company LLC $UNIQUE_ID\",
    \"identifier\": \"testcompany-id-$UNIQUE_ID\",
    
    \"businessType\": \"SERVICE\",
    \"businessScale\": \"MEDIUM\",
    \"description\": \"A comprehensive test company providing various services in the technology sector.\",
    \"foundedDate\": \"2010-05-15\",
    \"employeeCount\": 250,
    
    \"gstNumber\": \"GST123456789\",
    \"panNumber\": \"PAN123456789\",
    \"tanNumber\": \"TAN987654321\",
    \"msmeNumber\": \"UDYAM-XX-XX-0000123\",
    
    \"website\": \"https://www.testcompany-$UNIQUE_ID.com\",
    \"primaryEmail\": \"contact$UNIQUE_ID@testcompany.com\",
    \"primaryPhone\": \"+91-9876543210\",
    
    \"isActive\": true,
    
    \"addresses\": [
      {
        \"addressType\": \"REGISTERED\",
        \"addressLine1\": \"123 Main Street\",
        \"addressLine2\": \"Suite 456\",
        \"city\": \"Mumbai\",
        \"state\": \"Maharashtra\",
        \"country\": \"India\",
        \"postalCode\": \"400001\",
        \"isPrimary\": true
      },
      {
        \"addressType\": \"BILLING\",
        \"addressLine1\": \"789 Business Park\",
        \"addressLine2\": \"Building B, Floor 4\",
        \"city\": \"Bangalore\",
        \"state\": \"Karnataka\",
        \"country\": \"India\",
        \"postalCode\": \"560001\",
        \"isPrimary\": false
      }
    ],
    
    \"contactInfo\": [
      {
        \"contactType\": \"PRIMARY\",
        \"fullName\": \"John Doe\",
        \"position\": \"CEO\",
        \"email\": \"john.doe$UNIQUE_ID@testcompany.com\",
        \"phone\": \"+91-8765432109\",
        \"isPrimary\": true
      },
      {
        \"contactType\": \"WORK\",
        \"fullName\": \"Jane Smith\",
        \"position\": \"CTO\",
        \"email\": \"jane.smith$UNIQUE_ID@testcompany.com\",
        \"phone\": \"+91-7654321098\",
        \"isPrimary\": false
      }
    ]
  }" | json_pp

echo "Created tenant with unique ID: $UNIQUE_ID"
