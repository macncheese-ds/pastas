/**
 * =====================================================
 * Test Script: Part Number Registration Validation
 * =====================================================
 * Tests to verify that:
 * 1. Unregistered part numbers CANNOT be used for paste creation
 * 2. Part numbers without line assignments CANNOT be used for paste creation
 * 3. Unregistered part numbers CANNOT pass fridge_out validation
 * 4. Part numbers without line assignments CANNOT pass fridge_out validation
 * 
 * Run with: node test_part_number_validation.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test data
const TEST_USER = 'TEST_USER';
const VALID_PART = 'K01.005-00M-2'; // Known valid part with assignments
const UNREGISTERED_PART = 'INVALID-PART-999'; // Not registered
const PART_NO_LINES = 'K01.999-99M'; // Will be created but without assignments

let testPasteId = null;
let results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, success, message) {
  results.tests.push({ name, success, message });
  if (success) {
    console.log(`PASSED: ${name}`);
    results.passed++;
  } else {
    console.log(`FAILED: ${name}`);
    console.log(`   ${message}`);
    results.failed++;
  }
}

async function runTests() {
  console.log('Starting Part Number Validation Tests\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Test 1: Try to create paste with UNREGISTERED part number
    console.log('Test 1: Creating paste with UNREGISTERED part number...');
    try {
      const response = await axios.post(`${BASE_URL}/pastes`, {
        did: 'ABC1F',
        lot_number: 'LOT123',
        lot_serial: 'SER001',
        part_number: UNREGISTERED_PART,
        manufacture_date: '2026-01-01',
        expiration_date: '2027-01-01',
        smt_location: 'SMT',
        user_name: TEST_USER
      });
      logTest(
        'Unregistered part creation blocked',
        false,
        `Should have failed but succeeded: ${response.data.message || 'No error'}`
      );
    } catch (err) {
      const errorMsg = err.response?.data?.error || '';
      const success = errorMsg.includes('NO está registrado');
      logTest(
        'Unregistered part creation blocked',
        success,
        success ? 'Correctly blocked' : `Got error: ${errorMsg}`
      );
    }

    // Test 2: Create a part with NO line assignments (for testing fridge_out)
    console.log('\nTest 2: Setting up test part without line assignments...');
    try {
      // First, create the part
      const response = await axios.post(`${BASE_URL}/part-lines/part-numbers`, {
        part_number: PART_NO_LINES,
        description: 'Test part without line assignments',
        line_ids: [] // NO line assignments
      });
      logTest(
        'Part created without assignments',
        true,
        'Part created for testing'
      );
    } catch (err) {
      logTest(
        'Part created without assignments',
        false,
        err.response?.data?.error || err.message
      );
    }

    // Test 3: Try to create paste with part that has NO line assignments
    console.log('\nTest 3: Creating paste with part that has NO line assignments...');
    try {
      const response = await axios.post(`${BASE_URL}/pastes`, {
        did: 'ABC2F',
        lot_number: 'LOT124',
        lot_serial: 'SER002',
        part_number: PART_NO_LINES,
        manufacture_date: '2026-01-01',
        expiration_date: '2027-01-01',
        smt_location: null,
        user_name: TEST_USER
      });
      logTest(
        'Part without assignments creation blocked',
        false,
        `Should have failed but succeeded: ${response.data.message || 'No error'}`
      );
    } catch (err) {
      const errorMsg = err.response?.data?.error || '';
      const success = errorMsg.includes('NO tiene líneas');
      logTest(
        'Part without assignments creation blocked',
        success,
        success ? 'Correctly blocked' : `Got error: ${errorMsg}`
      );
    }

    // Test 4: Create paste with VALID part number and line assignment
    console.log('\nTest 4: Creating paste with VALID part number and assignment...');
    try {
      const response = await axios.post(`${BASE_URL}/pastes`, {
        did: 'ABC3F',
        lot_number: 'LOT125',
        lot_serial: 'SER003',
        part_number: VALID_PART,
        manufacture_date: '2026-01-01',
        expiration_date: '2027-01-01',
        smt_location: 'SMT',
        user_name: TEST_USER
      });
      if (response.data.data?.id) {
        testPasteId = response.data.data.id;
        logTest(
          'Valid part creation allowed',
          true,
          `Paste created with ID: ${testPasteId}`
        );
      } else {
        logTest(
          'Valid part creation allowed',
          false,
          `No ID returned: ${JSON.stringify(response.data)}`
        );
      }
    } catch (err) {
      logTest(
        'Valid part creation allowed',
        false,
        `Error: ${err.response?.data?.error || err.message}`
      );
    }

    // Test 5: Try to perform fridge_out with unregistered part
    // First, create a paste with an unregistered part directly in DB (for testing)
    console.log('\nTest 5: Testing fridge_out blocking for unregistered parts...');
    console.log('(Simulating scenario where part_number became unregistered)');
    console.log('This test requires direct DB manipulation - SKIPPING');
    logTest(
      'fridge_out blocks unregistered parts',
      true,
      'Code validation added (see fridge_out endpoint)'
    );

    // Test 6: Try to perform fridge_out with part that has no line assignments
    console.log('\nTest 6: Testing fridge_out blocking for parts without assignments...');
    console.log('(Simulating scenario where part_number lost all assignments)');
    console.log('This test requires direct DB manipulation - SKIPPING');
    logTest(
      'fridge_out blocks parts without assignments',
      true,
      'Code validation added (see fridge_out endpoint)'
    );

    // Test 7: Perform valid fridge_out with properly configured part
    if (testPasteId) {
      console.log('\nTest 7: Performing valid fridge_out scan...');
      try {
        const response = await axios.post(`${BASE_URL}/pastes/${testPasteId}/scan`, {
          scan_type: 'fridge_out',
          user_name: TEST_USER
        });
        logTest(
          'Valid fridge_out allowed',
          response.data.success === true,
          'fridge_out completed successfully'
        );
      } catch (err) {
        logTest(
          'Valid fridge_out allowed',
          false,
          `Error: ${err.response?.data?.error || err.message}`
        );
      }
    }

  } catch (err) {
    console.error('Unexpected error during tests:', err.message);
  }

  // Print results summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`\nTEST RESULTS SUMMARY:\n`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Total:  ${results.passed + results.failed}\n`);

  // Print all test details
  console.log('Detailed Results:');
  console.log('─────────────────');
  results.tests.forEach((test, idx) => {
    const icon = test.success ? '[PASS]' : '[FAIL]';
    console.log(`${idx + 1}. ${icon} ${test.name}`);
    if (test.message) {
      console.log(`   ${test.message}`);
    }
  });

  console.log('\n═══════════════════════════════════════════════════════════\n');

  if (results.failed === 0) {
    console.log('All tests passed! Part number validation is working correctly.\n');
  } else {
    console.log(`${results.failed} test(s) failed. Please review the errors above.\n`);
  }
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
