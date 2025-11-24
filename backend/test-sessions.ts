// Test typing session endpoints
const API_BASE = 'http://localhost:3000/api';

let authToken = '';
let sessionId = '';

async function login() {
  console.log('\n🔐 Logging in...');
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword123',
    }),
  });
  const data = await response.json();
  authToken = data.token;
  console.log('✅ Logged in successfully');
  return authToken;
}

async function testStartSession() {
  console.log('\n📝 Testing Start Session...');
  try {
    const response = await fetch(`${API_BASE}/sessions/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Start Session Failed:', data);
      return null;
    }
    
    sessionId = data.id;
    console.log('✅ Session Started:', {
      id: data.id,
      duration: data.duration,
      keySequenceLength: data.keySequence?.length || 0,
      firstKeys: data.keySequence?.slice(0, 10).join('') || '',
    });
    return data;
  } catch (error) {
    console.error('❌ Start Session Error:', error);
    return null;
  }
}

async function testRecordKeyPress(targetKey: string, pressedKey: string, isCorrect: boolean) {
  try {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/keypress`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetKey,
        pressedKey,
        isCorrect,
        responseTime: Math.floor(Math.random() * 500) + 200, // Random 200-700ms
      }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Record Key Press Error:', error);
  }
}

async function testRecordMultipleKeyPresses() {
  console.log('\n⌨️  Testing Record Key Presses...');
  
  // Simulate 20 key presses
  const keys = 'ABCDEFGHIJKLMNOPQRST'.split('');
  let correctCount = 0;
  
  for (const key of keys) {
    const isCorrect = Math.random() > 0.1; // 90% accuracy
    const pressedKey = isCorrect ? key : String.fromCharCode(key.charCodeAt(0) + 1);
    
    await testRecordKeyPress(key, pressedKey, isCorrect);
    if (isCorrect) correctCount++;
  }
  
  console.log(`✅ Recorded 20 key presses (${correctCount} correct, ${20 - correctCount} incorrect)`);
}

async function testEndSession() {
  console.log('\n🏁 Testing End Session...');
  try {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/end`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ End Session Failed:', data);
      return null;
    }
    
    console.log('✅ Session Ended:', {
      sessionId: data.sessionId,
      totalKeyPresses: data.totalKeyPresses,
      correctKeyPresses: data.correctKeyPresses,
      accuracy: data.accuracy?.toFixed(2) + '%',
      kpm: data.kpm?.toFixed(2),
      averageResponseTime: data.averageResponseTime?.toFixed(2) + 'ms',
    });
    return data;
  } catch (error) {
    console.error('❌ End Session Error:', error);
    return null;
  }
}

async function testGetStatistics() {
  console.log('\n📊 Testing Get Statistics...');
  try {
    const response = await fetch(`${API_BASE}/statistics`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    console.log('✅ User Statistics:', {
      totalSessions: data.totalSessions,
      totalKeyPresses: data.totalKeyPresses,
      correctKeyPresses: data.correctKeyPresses,
      averageKPM: data.averageKPM.toFixed(2),
      bestKPM: data.bestKPM.toFixed(2),
      averageAccuracy: data.averageAccuracy.toFixed(2) + '%',
      bestAccuracy: data.bestAccuracy.toFixed(2) + '%',
    });
  } catch (error) {
    console.error('❌ Get Statistics Error:', error);
  }
}

async function testGetSessionHistory() {
  console.log('\n📜 Testing Get Session History...');
  try {
    const response = await fetch(`${API_BASE}/sessions?limit=5`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    console.log(`✅ Retrieved ${data.length} sessions`);
    if (data.length > 0) {
      console.log('   Latest session:', {
        id: data[0].id.substring(0, 8) + '...',
        status: data[0].status,
        totalKeyPresses: data[0].totalKeyPresses,
        correctKeyPresses: data[0].correctKeyPresses,
      });
    }
  } catch (error) {
    console.error('❌ Get Session History Error:', error);
  }
}

async function runTests() {
  console.log('🧪 Starting Typing Session Tests...\n');
  
  await login();
  const session = await testStartSession();
  
  if (session) {
    await testRecordMultipleKeyPresses();
    await testEndSession();
  }
  
  await testGetStatistics();
  await testGetSessionHistory();
  
  console.log('\n✅ All tests completed!');
}

runTests();
