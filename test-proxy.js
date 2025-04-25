// Simple script to test the proxy endpoint
const fetch = require('node-fetch');

async function testProxy() {
  try {
    console.log('Testing proxy endpoint...');
    
    const response = await fetch('http://localhost:3000/api/proxy/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Hello, how are you?'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Translation result:', data);
      
      if (data.translated) {
        console.log('Success! Endpoint returns { translated: "..." } format');
      } else {
        console.log('Warning: Endpoint does not return { translated: "..." } format');
        console.log('Actual response format:', data);
      }
    } else {
      console.error('Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error testing proxy endpoint:', error);
  }
}

testProxy();
