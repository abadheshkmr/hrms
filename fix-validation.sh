#!/bin/bash

# This script fixes the PAN and TAN number validation issues by updating the numbers to be 10 characters
sed -i '' 's/"panNumber": "PAN123456789"/"panNumber": "ABCDE1234F"/' test-tenant-creation.sh
sed -i '' 's/"tanNumber": "TAN987654321"/"tanNumber": "BNZS99999J"/' test-tenant-creation.sh

echo "Updated PAN and TAN numbers in test-tenant-creation.sh"
echo "Running the test script to verify..."

# Run the test script with fixed values
bash test-tenant-creation.sh
