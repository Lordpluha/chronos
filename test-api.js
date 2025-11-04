#!/usr/bin/env node

// Simple API test script
console.log('🧪 Testing Chronos API...');

async function testAPI() {
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test user registration
    console.log('\n2. Testing user registration...');
    const registerResponse = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login: 'testuser123',
        email: 'test@example.com',
        password: 'TestPassword123'
      })
    });

    const registerData = await registerResponse.json();
    console.log('✅ Registration response:', registerData);

    // Test user login
    console.log('\n3. Testing user login...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login: 'testuser123',
        password: 'TestPassword123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('✅ Login response:', loginData);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();