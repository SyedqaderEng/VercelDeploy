// Test script to verify Firebase and Gemini API configurations
const https = require('https');

const GEMINI_API_KEY = "AIzaSyC3aRcnYp5NpQ0lwYns1VzlvMcdbNVDDy4";

const firebaseConfig = {
  apiKey: "AIzaSyCYULcYAA-fuugA3QLsGw5_uhDT3-vd9wQ",
  authDomain: "aidemo-5aac9.firebaseapp.com",
  projectId: "aidemo-5aac9",
  storageBucket: "aidemo-5aac9.firebasestorage.app",
  messagingSenderId: "760932009750",
  appId: "1:760932009750:web:39ef5614140e1378627237",
  measurementId: "G-TJ2TG78PZL"
};

function httpsRequest(url, method, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = data ? JSON.stringify(data) : '';

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

async function testGeminiAPI() {
  console.log('🧪 Testing Gemini API...');
  console.log('Model: gemini-2.5-flash-preview-09-2025');

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

    const result = await httpsRequest(url, 'POST', {
      contents: [{
        parts: [{ text: 'Say "API working!" if you receive this.' }]
      }]
    });

    if (result.status === 200) {
      const generatedText = result.data.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log('✅ Gemini API is WORKING!');
      console.log('Response:', generatedText);
      return true;
    } else {
      console.log('❌ Gemini API Error:', result.status);
      console.log('Error details:', JSON.stringify(result.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ Gemini API Connection Error:', error.message);
    return false;
  }
}

async function testFirebaseConfig() {
  console.log('\n🧪 Testing Firebase Configuration...');
  console.log('Firebase Config:');
  console.log('  Project ID:', firebaseConfig.projectId);
  console.log('  Auth Domain:', firebaseConfig.authDomain);
  console.log('  API Key:', firebaseConfig.apiKey.substring(0, 10) + '...');

  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`;

    const result = await httpsRequest(url, 'POST', {
      returnSecureToken: true
    });

    if (result.status === 200 || result.data.error?.message === 'OPERATION_NOT_ALLOWED') {
      console.log('✅ Firebase API Key is VALID!');
      console.log('✅ Firebase project is accessible');

      if (result.data.error?.message === 'OPERATION_NOT_ALLOWED') {
        console.log('⚠️  Anonymous auth may be disabled (this is OK, the key works)');
      }
      return true;
    } else {
      console.log('❌ Firebase Configuration Error:', result.data.error?.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Firebase Connection Error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════');
  console.log('  API Configuration Test');
  console.log('═══════════════════════════════════════════\n');

  const geminiResult = await testGeminiAPI();
  const firebaseResult = await testFirebaseConfig();

  console.log('\n═══════════════════════════════════════════');
  console.log('  Test Results Summary');
  console.log('═══════════════════════════════════════════');
  console.log('Gemini API:', geminiResult ? '✅ WORKING' : '❌ FAILED');
  console.log('Firebase Config:', firebaseResult ? '✅ VALID' : '❌ INVALID');
  console.log('═══════════════════════════════════════════\n');

  if (geminiResult && firebaseResult) {
    console.log('🎉 All API configurations are working correctly!');
  } else {
    console.log('⚠️  Some configurations need attention.');
  }
}

runTests();
