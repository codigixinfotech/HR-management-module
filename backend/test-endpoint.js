const http = require('http');

const url = 'http://localhost:3001/api/workforce/machines?companyId=cmtwjbe5900zoj7op4c3xxxb5&branchId=HEAD_OFFICE';

http.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Headers:', res.headers);
    console.log('Body:', data);
  });
}).on('error', err => {
  console.error('Network Error:', err.message);
});
