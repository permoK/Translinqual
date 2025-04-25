// Simple script to test the translation endpoint using XMLHttpRequest
const xhr = new XMLHttpRequest();
xhr.open('POST', 'http://localhost:5000/translate', true);
xhr.setRequestHeader('Content-Type', 'application/json');
xhr.timeout = 60000; // 60 second timeout

xhr.onload = function() {
  if (xhr.status >= 200 && xhr.status < 300) {
    try {
      const data = JSON.parse(xhr.responseText);
      console.log('Translation result:', data);
      
      if (data.translated) {
        console.log('Success! Endpoint returns { translated: "..." } format');
      } else {
        console.log('Warning: Endpoint does not return { translated: "..." } format');
        console.log('Actual response format:', data);
      }
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
    }
  } else {
    console.error('Request failed with status:', xhr.status);
  }
};

xhr.onerror = function() {
  console.error('Network error occurred');
};

xhr.ontimeout = function() {
  console.error('Request timed out');
};

console.log('Sending translation request...');
xhr.send(JSON.stringify({ text: 'Hello, how are you?' }));
console.log('Request sent. Waiting for response...');
