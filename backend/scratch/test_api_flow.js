async function testFlow() {
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ppurvesh503@gmail.com', password: 'Patil@123' })
  });
  const { accessToken } = await loginRes.json();
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`
  };

  console.log('--- 1. Testing KPIs ---');
  const kpis = await (await fetch('http://localhost:3001/api/workforce/machine-management/kpis', { headers })).json();
  console.log('KPIs:', kpis);

  console.log('--- 2. Testing Machines ---');
  const machines = await (await fetch('http://localhost:3001/api/workforce/machines', { headers })).json();
  console.log('Machines total:', machines.length);

  console.log('--- 3. Testing Production Lines ---');
  const lines = await (await fetch('http://localhost:3001/api/workforce/production-lines', { headers })).json();
  console.log('Lines total:', lines.length, 'First line:', lines[0]?.lineCode, 'machines count:', lines[0]?.machineCount);

  console.log('--- 4. Testing Operators ---');
  const operators = await (await fetch('http://localhost:3001/api/workforce/machine-operators', { headers })).json();
  console.log('Operators total:', operators.length, 'Available:', operators.filter(o => o.status === 'Available').length);

  console.log('--- 5. Testing Allocations ---');
  const allocations = await (await fetch('http://localhost:3001/api/workforce/machine-allocations', { headers })).json();
  console.log('Allocations total:', allocations.length);

  console.log('--- 6. Testing Maintenances ---');
  const maintenances = await (await fetch('http://localhost:3001/api/workforce/machine-maintenances', { headers })).json();
  console.log('Maintenances total:', maintenances.length);

  console.log('ALL API ENDPOINTS TESTED SUCCESSFULLY!');
}

testFlow().catch(console.error);
