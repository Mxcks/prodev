// Test authentication endpoints
const API_BASE = 'http://localhost:3000/api';

async function testRegister() {
  console.log('\n📝 Testing Registration...');
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
      }),
    });
    const data = await response.json();
    console.log('✅ Register Response:', JSON.stringify(data, null, 2));
    return data.token;
  } catch (error) {
    console.error('❌ Register Error:', error);
  }
}

async function testLogin() {
  console.log('\n🔐 Testing Login...');
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123',
      }),
    });
    const data = await response.json();
    console.log('✅ Login Response:', JSON.stringify(data, null, 2));
    return data.token;
  } catch (error) {
    console.error('❌ Login Error:', error);
  }
}

async function testProfile(token: string) {
  console.log('\n👤 Testing Profile...');
  try {
    const response = await fetch(`${API_BASE}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    console.log('✅ Profile Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Profile Error:', error);
  }
}

async function runTests() {
  console.log('🧪 Starting API Tests...\n');
  
  // Test registration
  await testRegister();
  
  // Test login with seed user
  const token = await testLogin();
  
  // Test profile endpoint
  if (token) {
    await testProfile(token);
  }
  
  console.log('\n✅ All tests completed!');
}

runTests();
