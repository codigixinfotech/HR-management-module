async function testBranchEmployees() {
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'branch1@gmail.com', password: 'Branch@1' }),
  });
  const tokens = await loginRes.json();
  console.log('Login tokens received, testing /api/employees...');

  const empRes = await fetch('http://localhost:3001/api/employees', {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });
  const emps = await empRes.json();
  console.log('Employees returned for Branch Admin:', emps.total, emps.items?.map(e => ({
    name: `${e.firstName} ${e.lastName}`,
    code: e.employeeCode,
    branchId: e.branchId,
  })));
}

testBranchEmployees();
