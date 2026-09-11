const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/attendance-leave/overtime',
  method: 'GET',
  headers: {
    'Accept': 'application/json',
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('Returned Records:', json.length);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Raw output:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.end();
