/**
 * Tenant API Endpoints Testing Script
 * 
 * This script tests all the tenant API endpoints in the HRMS SaaS application.
 * It uses axios for HTTP requests and runs tests sequentially.
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const headers = {
  'Content-Type': 'application/json',
};

// Add a delay function to prevent connection resets
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Request timeout and retry configuration
axios.defaults.timeout = 10000; // 10 second timeout
const MAX_RETRIES = 3;
const DELAY_BETWEEN_REQUESTS = 500; // 500ms delay between requests

// Test data storage
const testData = {
  createdTenants: [],
  createdAddresses: [],
  createdContactInfos: [],
};

/**
 * Helper function to run a test
 * @param {string} testName - Name of the test
 * @param {Function} testFn - Test function to execute
 */
async function runTest(testName, testFn) {
  console.log(`\n🧪 RUNNING TEST: ${testName}`);
  console.log('--------------------------------------------------');
  
  try {
    // Add a delay before running each test to avoid connection resets
    await delay(DELAY_BETWEEN_REQUESTS);
    await testFn();
    console.log('✅ TEST PASSED');
  } catch (error) {
    console.error('❌ TEST FAILED');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

/**
 * Helper function to make API requests with retries
 * @param {Function} requestFn - Function that returns a promise with the request
 * @returns {Promise} - Promise with the response
 */
async function withRetry(requestFn) {
  let lastError;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      console.log(`Attempt ${attempt} failed: ${error.message}`);
      lastError = error;
      
      // Wait before retrying
      if (attempt < MAX_RETRIES) {
        await delay(DELAY_BETWEEN_REQUESTS * attempt);
      }
    }
  }
  
  throw lastError;
}

/**
 * Test 1: Get all tenants
 */
async function testGetAllTenants() {
  const response = await withRetry(() => axios.get(`${API_BASE_URL}/tenants`, { headers }));
  
  // Handle the paginated response structure
  const tenants = response.data.items || response.data;
  
  console.log(`Retrieved ${tenants.length} tenants`);
  console.log('Pagination info:', {
    total: response.data.total,
    page: response.data.page,
    limit: response.data.limit,
    pages: response.data.pages
  });
  
  if (tenants.length > 0) {
    console.log('Sample tenant:', JSON.stringify(tenants[0], null, 2));
    
    // Save the first tenant ID for later tests
    testData.existingTenantId = tenants[0].id;
    console.log(`Saved existing tenant ID: ${testData.existingTenantId}`);
  }
}

/**
 * Test 2: Create a new tenant
 */
async function testCreateTenant() {
  // Generate unique identifiers for the tenant to avoid constraint violations
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  
  const newTenant = {
    name: `Test Tenant ${timestamp}-${randomString}`,
    subdomain: `test-tenant-${timestamp}-${randomString}`,
    legalName: `Test Corporation Ltd ${randomString}`,
    business: {
      businessType: 'SERVICE',  // Valid enum value as per the tenant.enums.ts file
      businessScale: 'MEDIUM',  // Valid enum value as per the tenant.enums.ts file
      industry: 'OTHER',
      foundedDate: '2020-01-01',
    },
    registration: {
      cinNumber: `CIN-${randomString}`,        // Using proper field names as per the entity
      panNumber: `PAN-${randomString}`,        // Using proper field names as per the entity
      gstNumber: `GST-${randomString}`,        // Using proper field names as per the entity
    },
    contact: {
      website: `https://${randomString}.example.com`,
      primaryEmail: `contact@${randomString}.example.com`,
      primaryPhone: `+123456${randomString}`,
      supportEmail: `support@${randomString}.example.com`,
    },
    isActive: true,
    // Don't set 'status' field, let the backend set the default
  };

  console.log('Creating new tenant with data:', {
    name: newTenant.name,
    subdomain: newTenant.subdomain,
    businessType: newTenant.business.businessType
  });

  try {
    const response = await withRetry(() => 
      axios.post(`${API_BASE_URL}/tenants`, newTenant, { headers })
    );
    
    console.log('Created tenant:', JSON.stringify(response.data, null, 2));
    
    // Save the created tenant ID for later tests
    testData.createdTenants.push(response.data);
    console.log(`Saved created tenant ID: ${response.data.id}`);
  } catch (error) {
    // Enhanced error handling
    console.error('Failed to create tenant:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
      
      // If we got a validation error, log the validation details
      if (error.response.data && error.response.data.message) {
        if (Array.isArray(error.response.data.message)) {
          console.error('Validation errors:');
          error.response.data.message.forEach((msg, i) => {
            console.error(`${i+1}. ${msg}`);
          });
        } else {
          console.error('Error message:', error.response.data.message);
        }
      }
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error setting up request:', error.message);
    }
    throw error; // Re-throw to mark the test as failed
  }
}

/**
 * Test 3: Get a specific tenant by ID
 */
async function testGetTenantById() {
  // Use the ID of a tenant we created or found
  const tenantId = testData.createdTenants.length > 0 
    ? testData.createdTenants[0].id 
    : testData.existingTenantId;
  
  if (!tenantId) {
    throw new Error('No tenant ID available for testing');
  }
  
  console.log(`Getting tenant with ID: ${tenantId}`);
  
  const response = await withRetry(() =>
    axios.get(`${API_BASE_URL}/tenants/${tenantId}`, { headers })
  );
  
  console.log('Retrieved tenant by ID:', JSON.stringify(response.data, null, 2));
  
  // Verify we got the expected tenant
  if (response.data.id !== tenantId) {
    throw new Error(`Expected tenant ID ${tenantId} but got ${response.data.id}`);
  }
}

/**
 * Test 4: Get a tenant with full data
 */
async function testGetTenantWithFullData() {
  // Use the ID of a tenant we created or found
  const tenantId = testData.createdTenants.length > 0 
    ? testData.createdTenants[0].id 
    : testData.existingTenantId;
  
  if (!tenantId) {
    throw new Error('No tenant ID available for testing');
  }
  
  console.log(`Getting tenant with full data for ID: ${tenantId}`);
  
  const response = await withRetry(() =>
    axios.get(`${API_BASE_URL}/tenants/${tenantId}/full`, { headers })
  );
  
  console.log('Retrieved tenant with full data:', JSON.stringify(response.data, null, 2));
  
  // Verify we got additional data like addresses and contacts if they exist
  console.log('Addresses included:', Array.isArray(response.data.addresses));
  console.log('Contacts included:', Array.isArray(response.data.contacts));
}

/**
 * Test 5: Update a tenant
 */
async function testUpdateTenant() {
  // First, create a tenant to update
  const newTenant = {
    name: `Update Test Tenant ${Date.now()}`,
    subdomain: `update-test-${Date.now()}`,
    legalName: 'Update Test Corporation Ltd',
    business: {
      businessType: 'SERVICE',
      businessScale: 'SMALL',
      industry: 'OTHER',
      foundedDate: '2021-01-01',
    },
    contact: {
      website: 'https://update-test.example.com',
      primaryEmail: 'contact@update-test.example.com',
      primaryPhone: '+0987654321',
    },
    isActive: true,
  };

  // Create the tenant with retry logic
  console.log('Creating tenant for update test with data:', {
    name: newTenant.name,
    subdomain: newTenant.subdomain
  });
  
  const createResponse = await withRetry(() => 
    axios.post(`${API_BASE_URL}/tenants`, newTenant, { headers })
  );
  console.log('Created tenant for update test:', createResponse.data.id);
  
  // Save the created tenant ID for updating
  const tenantId = createResponse.data.id;
  testData.createdTenants.push(createResponse.data);
  
  // Update data
  const updateData = {
    name: `${newTenant.name} - Updated`,
    legalName: 'Updated Corporation Ltd',
    business: {
      businessScale: 'MEDIUM', // Changed from SMALL to MEDIUM
    },
    contact: {
      supportEmail: 'support@update-test.example.com', // Added support email
    },
  };
  
  // Send the update request with retry logic
  console.log(`Sending update request for tenant ${tenantId} with data:`, updateData);
  
  try {
    const updateResponse = await withRetry(() => 
      axios.patch(`${API_BASE_URL}/tenants/${tenantId}`, updateData, { headers })
    );
    
    console.log('Updated tenant:', JSON.stringify(updateResponse.data, null, 2));
    
    // Verify the updates were applied
    if (!updateResponse.data.name.includes('Updated')) {
      throw new Error('Update to name field was not applied');
    }
    
    if (updateResponse.data.business.businessScale !== 'MEDIUM') {
      throw new Error('Update to business.businessScale was not applied');
    }
    
    console.log('Update successfully verified');
  } catch (error) {
    console.error('Failed to update tenant:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error setting up request:', error.message);
    }
    throw error;
  }
}

/**
 * Test 6: Delete a tenant
 */
async function testDeleteTenant() {
  // First, create a tenant to delete
  const tenantToDelete = {
    name: `Delete Test Tenant ${Date.now()}`,
    subdomain: `delete-test-${Date.now()}`,
    legalName: 'Delete Test Corporation Ltd',
    business: {
      businessType: 'SERVICE',
      businessScale: 'SMALL',  // Changed from MICRO to SMALL as MICRO doesn't exist
      industry: 'OTHER',
    },
    contact: {
      website: 'https://delete-test.example.com',
    },
    isActive: true,
  };

  // Create the tenant
  const createResponse = await axios.post(`${API_BASE_URL}/tenants`, tenantToDelete, { headers });
  console.log('Created tenant for delete test:', createResponse.data.id);
  
  const tenantId = createResponse.data.id;
  
  // Delete the tenant
  const deleteResponse = await axios.delete(`${API_BASE_URL}/tenants/${tenantId}`, { headers });
  
  console.log('Delete response:', deleteResponse.data);
  
  // Try to get the deleted tenant (should fail or return a properly marked deleted tenant)
  try {
    const getResponse = await axios.get(`${API_BASE_URL}/tenants/${tenantId}`, { headers });
    
    // If we got a response, make sure it's marked as deleted (most systems implement soft delete)
    if (getResponse.data && !getResponse.data.isDeleted) {
      throw new Error('Tenant was not marked as deleted');
    }
    
    console.log('Tenant was soft-deleted as expected');
  } catch (error) {
    // It's also acceptable if the API returns a 404 Not Found
    if (error.response && error.response.status === 404) {
      console.log('Tenant was hard-deleted as expected (404 Not Found)');
    } else {
      // If it's some other error, rethrow it
      throw error;
    }
  }
}

/**
 * Test 7: Add an address to a tenant
 */
async function testAddAddressToTenant() {
  // First, create a tenant or use existing one
  let tenantId;
  
  if (testData.createdTenants.length > 0) {
    // Use the first created tenant that's not deleted
    const nonDeletedTenant = testData.createdTenants.find(t => !t.isDeleted);
    if (nonDeletedTenant) {
      tenantId = nonDeletedTenant.id;
    }
  }
  
  if (!tenantId && testData.existingTenantId) {
    tenantId = testData.existingTenantId;
  }
  
  if (!tenantId) {
    // Create a new tenant if none are available
    const newTenant = {
      name: `Address Test Tenant ${Date.now()}`,
      subdomain: `address-test-${Date.now()}`,
      legalName: 'Address Test Corporation',
      business: {
        businessType: 'SERVICE',
        businessScale: 'SMALL',
      },
      isActive: true,
    };
    
    const response = await axios.post(`${API_BASE_URL}/tenants`, newTenant, { headers });
    tenantId = response.data.id;
    testData.createdTenants.push(response.data);
    console.log('Created new tenant for address test:', tenantId);
  }
  
  // Create address data
  const addressData = {
    addressLine1: '123 Test Street',
    addressLine2: 'Suite 456',
    city: 'Test City',
    state: 'Test State',
    postalCode: '12345',
    country: 'Test Country',
    addressType: 'HEADQUARTERS',
    isPrimary: true,
    isVerified: false,
  };
  
  // Add the address to the tenant
  const response = await axios.post(
    `${API_BASE_URL}/tenants/${tenantId}/addresses`,
    addressData,
    { headers }
  );
  
  console.log('Added address to tenant:', JSON.stringify(response.data, null, 2));
  
  // Save the address ID for later tests
  testData.createdAddresses.push(response.data);
  console.log(`Saved created address ID: ${response.data.id}`);
}

/**
 * Test 8: Get all addresses for a tenant
 */
async function testGetTenantAddresses() {
  // Use a tenant that we've added an address to
  let tenantId;
  
  if (testData.createdAddresses.length > 0) {
    // Get the tenant ID from the first created address
    tenantId = testData.createdAddresses[0].entityId;
  } else if (testData.createdTenants.length > 0) {
    tenantId = testData.createdTenants[0].id;
  } else if (testData.existingTenantId) {
    tenantId = testData.existingTenantId;
  }
  
  if (!tenantId) {
    throw new Error('No tenant ID available for testing');
  }
  
  const response = await axios.get(`${API_BASE_URL}/tenants/${tenantId}/addresses`, { headers });
  
  console.log(`Retrieved ${response.data.length} addresses for tenant ${tenantId}`);
  console.log('Sample address (if available):', response.data.length > 0 ? JSON.stringify(response.data[0], null, 2) : 'None');
}

/**
 * Test 9: Update an address
 */
async function testUpdateAddress() {
  // First, make sure we have an address to update
  let addressId;
  
  if (testData.createdAddresses.length > 0) {
    addressId = testData.createdAddresses[0].id;
  } else {
    // We need to create a tenant and address first
    await testAddAddressToTenant();
    if (testData.createdAddresses.length === 0) {
      throw new Error('Failed to create an address for update test');
    }
    addressId = testData.createdAddresses[0].id;
  }
  
  // Update data
  const updateData = {
    addressLine1: '789 Updated Street',
    city: 'Updated City',
    postalCode: '54321',
    isPrimary: true,
  };
  
  // Send the update request
  const response = await axios.patch(
    `${API_BASE_URL}/tenants/addresses/${addressId}`,
    updateData,
    { headers }
  );
  
  console.log('Updated address:', JSON.stringify(response.data, null, 2));
  
  // Verify the updates were applied
  if (response.data.addressLine1 !== '789 Updated Street') {
    throw new Error('Update to addressLine1 was not applied');
  }
  
  if (response.data.city !== 'Updated City') {
    throw new Error('Update to city was not applied');
  }
  
  console.log('Address update successfully verified');
}

/**
 * Test 10: Delete an address
 */
async function testDeleteAddress() {
  // First, make sure we have an address to delete
  // (We'll create a new one since we don't want to delete the one we're using for other tests)
  
  // Find a tenant to add the address to
  let tenantId;
  
  if (testData.createdTenants.length > 0) {
    tenantId = testData.createdTenants[0].id;
  } else if (testData.existingTenantId) {
    tenantId = testData.existingTenantId;
  } else {
    throw new Error('No tenant ID available for testing');
  }
  
  // Create a new address to delete
  const addressData = {
    addressLine1: '999 Delete Street',
    city: 'Delete City',
    state: 'Delete State',
    postalCode: '99999',
    country: 'Delete Country',
    addressType: 'BRANCH',
    isPrimary: false,
  };
  
  // Add the address to the tenant
  const createResponse = await axios.post(
    `${API_BASE_URL}/tenants/${tenantId}/addresses`,
    addressData,
    { headers }
  );
  
  console.log('Created address for delete test:', createResponse.data.id);
  const addressId = createResponse.data.id;
  
  // Delete the address
  const deleteResponse = await axios.delete(`${API_BASE_URL}/tenants/addresses/${addressId}`, { headers });
  
  console.log('Delete address response:', deleteResponse.data);
  
  // Try to get the deleted address (should fail or return a properly marked deleted address)
  try {
    // This endpoint might not exist - in that case, we'll rely on the GET addresses for tenant endpoint
    const getAddressResponse = await axios.get(`${API_BASE_URL}/tenants/addresses/${addressId}`, { headers });
    
    if (getAddressResponse.data && !getAddressResponse.data.isDeleted) {
      throw new Error('Address was not marked as deleted');
    }
    
    console.log('Address was soft-deleted as expected');
  } catch (getError) {
    // It's acceptable if the API returns a 404 Not Found or if the endpoint doesn't exist
    if (getError.response && getError.response.status === 404) {
      console.log('Address was hard-deleted as expected (404 Not Found)');
    } else {
      // Alternative: check if it shows up in the list of addresses for the tenant
      const listResponse = await axios.get(`${API_BASE_URL}/tenants/${tenantId}/addresses`, { headers });
      const deletedAddress = listResponse.data.find(addr => addr.id === addressId);
      
      if (deletedAddress && !deletedAddress.isDeleted) {
        throw new Error('Address was not properly deleted');
      } else if (!deletedAddress) {
        console.log('Address was hard-deleted as expected (not found in tenant addresses)');
      } else {
        console.log('Address was soft-deleted as expected');
      }
    }
  }
}

/**
 * Test 11: Add contact info to a tenant
 */
async function testAddContactInfoToTenant() {
  // First, create a tenant or use existing one
  let tenantId;
  
  if (testData.createdTenants.length > 0) {
    // Use the first created tenant that's not deleted
    const nonDeletedTenant = testData.createdTenants.find(t => !t.isDeleted);
    if (nonDeletedTenant) {
      tenantId = nonDeletedTenant.id;
    }
  }
  
  if (!tenantId && testData.existingTenantId) {
    tenantId = testData.existingTenantId;
  }
  
  if (!tenantId) {
    // Create a new tenant if none are available
    const newTenant = {
      name: `Contact Test Tenant ${Date.now()}`,
      subdomain: `contact-test-${Date.now()}`,
      legalName: 'Contact Test Corporation',
      business: {
        businessType: 'SERVICE',
        businessScale: 'SMALL',
      },
      isActive: true,
    };
    
    const response = await axios.post(`${API_BASE_URL}/tenants`, newTenant, { headers });
    tenantId = response.data.id;
    testData.createdTenants.push(response.data);
    console.log('Created new tenant for contact info test:', tenantId);
  }
  
  // Create contact info data
  const contactInfoData = {
    contactType: 'EMPLOYEE',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    position: 'Manager',
    department: 'Operations',
    isPrimary: true,
  };
  
  // Add the contact info to the tenant
  const response = await axios.post(
    `${API_BASE_URL}/tenants/${tenantId}/contact-info`,
    contactInfoData,
    { headers }
  );
  
  console.log('Added contact info to tenant:', JSON.stringify(response.data, null, 2));
  
  // Save the contact info ID for later tests
  testData.createdContactInfos.push(response.data);
  console.log(`Saved created contact info ID: ${response.data.id}`);
}

/**
 * Test 12: Get all contact info for a tenant
 */
async function testGetTenantContactInfo() {
  // Use a tenant that we've added contact info to
  let tenantId;
  
  if (testData.createdContactInfos.length > 0) {
    // Get the tenant ID from the first created contact info
    tenantId = testData.createdContactInfos[0].entityId;
  } else if (testData.createdTenants.length > 0) {
    tenantId = testData.createdTenants[0].id;
  } else if (testData.existingTenantId) {
    tenantId = testData.existingTenantId;
  }
  
  if (!tenantId) {
    throw new Error('No tenant ID available for testing');
  }
  
  const response = await axios.get(`${API_BASE_URL}/tenants/${tenantId}/contact-info`, { headers });
  
  console.log(`Retrieved ${response.data.length} contact info records for tenant ${tenantId}`);
  console.log('Sample contact info (if available):', response.data.length > 0 ? JSON.stringify(response.data[0], null, 2) : 'None');
}

/**
 * Test 13: Update contact info
 */
async function testUpdateContactInfo() {
  // First, make sure we have a contact info to update
  let contactInfoId;
  
  if (testData.createdContactInfos.length > 0) {
    contactInfoId = testData.createdContactInfos[0].id;
  } else {
    // We need to create a tenant and contact info first
    await testAddContactInfoToTenant();
    if (testData.createdContactInfos.length === 0) {
      throw new Error('Failed to create contact info for update test');
    }
    contactInfoId = testData.createdContactInfos[0].id;
  }
  
  // Update data
  const updateData = {
    firstName: 'Jane', // Changed from John to Jane
    email: 'jane.doe@example.com', // Updated email
    position: 'Senior Manager', // Updated position
  };
  
  // Send the update request
  const response = await axios.patch(
    `${API_BASE_URL}/tenants/contact-info/${contactInfoId}`,
    updateData,
    { headers }
  );
  
  console.log('Updated contact info:', JSON.stringify(response.data, null, 2));
  
  // Verify the updates were applied
  if (response.data.firstName !== 'Jane') {
    throw new Error('Update to firstName was not applied');
  }
  
  if (response.data.email !== 'jane.doe@example.com') {
    throw new Error('Update to email was not applied');
  }
  
  console.log('Contact info update successfully verified');
}

/**
 * Test 14: Delete contact info
 */
async function testDeleteContactInfo() {
  // First, create a tenant and contact info to delete
  // Find a tenant to add the contact info to
  let tenantId;
  
  if (testData.createdTenants.length > 0) {
    tenantId = testData.createdTenants[0].id;
  } else if (testData.existingTenantId) {
    tenantId = testData.existingTenantId;
  } else {
    throw new Error('No tenant ID available for testing');
  }
  
  // Create a new contact info to delete
  const contactInfoData = {
    contactType: 'CUSTOMER_SERVICE',
    firstName: 'Delete',
    lastName: 'User',
    email: 'delete.user@example.com',
    phone: '+9876543210',
    position: 'Assistant',
    isPrimary: false,
  };
  
  // Add the contact info to the tenant
  const createResponse = await axios.post(
    `${API_BASE_URL}/tenants/${tenantId}/contact-info`,
    contactInfoData,
    { headers }
  );
  
  console.log('Created contact info for delete test:', createResponse.data.id);
  const contactInfoId = createResponse.data.id;
  
  // Delete the contact info
  const deleteResponse = await axios.delete(`${API_BASE_URL}/tenants/contact-info/${contactInfoId}`, { headers });
  
  console.log('Delete contact info response:', deleteResponse.data);
  
  // Try to get the deleted contact info (should fail or return a properly marked deleted contact info)
  try {
    // This endpoint might not exist - in that case, we'll rely on the GET contact info for tenant endpoint
    const getContactInfoResponse = await axios.get(`${API_BASE_URL}/tenants/contact-info/${contactInfoId}`, { headers });
    
    if (getContactInfoResponse.data && !getContactInfoResponse.data.isDeleted) {
      throw new Error('Contact info was not marked as deleted');
    }
    
    console.log('Contact info was soft-deleted as expected');
  } catch (getError) {
    // It's acceptable if the API returns a 404 Not Found or if the endpoint doesn't exist
    if (getError.response && getError.response.status === 404) {
      console.log('Contact info was hard-deleted as expected (404 Not Found)');
    } else {
      // Alternative: check if it shows up in the list of contact info for the tenant
      const listResponse = await axios.get(`${API_BASE_URL}/tenants/${tenantId}/contact-info`, { headers });
      const deletedContactInfo = listResponse.data.find(contact => contact.id === contactInfoId);
      
      if (deletedContactInfo && !deletedContactInfo.isDeleted) {
        throw new Error('Contact info was not properly deleted');
      } else if (!deletedContactInfo) {
        console.log('Contact info was hard-deleted as expected (not found in tenant contact info)');
      } else {
        console.log('Contact info was soft-deleted as expected');
      }
    }
  }
}

/**
 * Test 15: Filter tenants by status
 */
async function testFilterTenantsByStatus() {
  // Get the possible status values from the log output or try a common value
  // Common values are usually: ACTIVE, PENDING, SUSPENDED, etc.
  const status = 'ACTIVE';
  
  const response = await axios.get(`${API_BASE_URL}/tenants/status/${status}`, { headers });
  
  console.log(`Retrieved ${response.data.length} tenants with status '${status}'`);
  console.log('Sample tenant (if available):', response.data.length > 0 ? JSON.stringify(response.data[0], null, 2) : 'None');
  
  // Verify that all tenants have the correct status
  for (const tenant of response.data) {
    if (tenant.status !== status) {
      throw new Error(`Tenant ${tenant.id} has status '${tenant.status}' instead of '${status}'`);
    }
  }
  
  console.log(`All tenants correctly have status '${status}'`);
}

/**
 * Test 16: Filter tenants by verification status
 */
async function testFilterTenantsByVerificationStatus() {
  // Common values are usually: VERIFIED, UNVERIFIED, PENDING, etc.
  const verificationStatus = 'VERIFIED';
  
  const response = await axios.get(`${API_BASE_URL}/tenants/verification/${verificationStatus}`, { headers });
  
  console.log(`Retrieved ${response.data.length} tenants with verification status '${verificationStatus}'`);
  console.log('Sample tenant (if available):', response.data.length > 0 ? JSON.stringify(response.data[0], null, 2) : 'None');
  
  // Verify that all tenants have the correct verification status
  // Note: This assumes verification status is stored in tenant.verification.verificationStatus
  for (const tenant of response.data) {
    if (tenant.verification?.verificationStatus !== verificationStatus) {
      throw new Error(`Tenant ${tenant.id} has verification status '${tenant.verification?.verificationStatus || 'undefined'}' instead of '${verificationStatus}'`);
    }
  }
  
  console.log(`All tenants correctly have verification status '${verificationStatus}'`);
}

/**
 * Test 17: Basic tenant search
 */
async function testBasicTenantSearch() {
  // Use a search term that will likely match something
  const searchTerm = 'Test'; // This should match our test tenants
  
  const response = await axios.get(`${API_BASE_URL}/tenants/search?query=${searchTerm}`, { headers });
  
  console.log(`Search for '${searchTerm}' returned ${response.data.length} results`);
  console.log('Sample search result (if available):', response.data.length > 0 ? JSON.stringify(response.data[0], null, 2) : 'None');
}

/**
 * Test 18: Advanced tenant search
 */
async function testAdvancedTenantSearch() {
  // Create a query with multiple parameters
  const searchParams = new URLSearchParams({
    name: 'Test',
    businessType: 'SERVICE',
    isActive: 'true',
    // Add other search parameters as needed
  });
  
  const response = await axios.get(`${API_BASE_URL}/tenants/advanced-search?${searchParams.toString()}`, { headers });
  
  console.log(`Advanced search returned ${response.data.length} results`);
  console.log('Sample search result (if available):', response.data.length > 0 ? JSON.stringify(response.data[0], null, 2) : 'None');
}

/**
 * Main function to run all tests sequentially
 */
async function runAllTests() {
  console.log('🚀 STARTING TENANT API TESTS');
  console.log('==================================================');
  
  // Run just the first 4 tests to verify our approach is working
  await runTest('Get All Tenants', testGetAllTenants);
  await runTest('Create Tenant', testCreateTenant);
  await runTest('Get Tenant By ID', testGetTenantById);
  await runTest('Get Tenant With Full Data', testGetTenantWithFullData);
  
  // Comment out the rest for now until we verify the first batch works
  /*
  await runTest('Update Tenant', testUpdateTenant);
  await runTest('Delete Tenant', testDeleteTenant);
  
  // Address management tests
  await runTest('Add Address to Tenant', testAddAddressToTenant);
  await runTest('Get Tenant Addresses', testGetTenantAddresses);
  await runTest('Update Address', testUpdateAddress);
  await runTest('Delete Address', testDeleteAddress);
  
  // Contact information management tests
  await runTest('Add Contact Info to Tenant', testAddContactInfoToTenant);
  await runTest('Get Tenant Contact Info', testGetTenantContactInfo);
  await runTest('Update Contact Info', testUpdateContactInfo);
  await runTest('Delete Contact Info', testDeleteContactInfo);
  
  // Search and filtering tests
  await runTest('Filter Tenants by Status', testFilterTenantsByStatus);
  await runTest('Filter Tenants by Verification Status', testFilterTenantsByVerificationStatus);
  await runTest('Basic Tenant Search', testBasicTenantSearch);
  await runTest('Advanced Tenant Search', testAdvancedTenantSearch);
  */
  
  console.log('\n🏁 ALL TESTS COMPLETED');
  console.log('==================================================');
  console.log('Summary:');
  console.log(`Created Tenants: ${testData.createdTenants.length}`);
  console.log(`Created Addresses: ${testData.createdAddresses.length}`);
  console.log(`Created Contact Infos: ${testData.createdContactInfos.length}`);
}

// Run the tests
runAllTests().catch(error => {
  console.error('Error running tests:', error);
});
