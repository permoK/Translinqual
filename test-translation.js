// Simple script to test the translation endpoint using fetch
// This script uses ES modules

async function testTranslation() {
  try {
    console.log('Testing translation endpoint...');

    const response = await fetch('http://localhost:5000/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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
    console.error('Error testing translation endpoint:', error);
  }
}

testTranslation();
