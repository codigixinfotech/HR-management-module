async function testHttpLogin() {
  const accounts = [
    { email: 'branch1@gmail.com', password: 'Branch@1' },
    { email: 'ppurvesh503@gmail.com', password: 'Patil@123' },
    { email: 'ppurvesh503@gmail.com', password: 'Admin@123' },
    { email: 'admin@ehcm.local', password: 'Admin@123' },
  ];

  for (const acc of accounts) {
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: acc.password }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`SUCCESS: ${acc.email} with "${acc.password}" -> status ${res.status}`);
        const meRes = await fetch('http://localhost:3001/api/auth/me', {
          headers: { Authorization: `Bearer ${data.accessToken}` }
        });
        const me = await meRes.json();
        console.log(`  /auth/me SUCCESS: role=${me.primaryRole}, email=${me.email}, company=${me.companyName}, branch=${me.branchName}`);
      } else {
        console.log(`FAILED: ${acc.email} with "${acc.password}" -> status ${res.status}, body: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      console.log(`FETCH ERROR: ${acc.email} -> ${err.message}`);
    }
  }
}

testHttpLogin();
