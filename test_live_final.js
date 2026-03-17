async function test() {
  const baseURL = 'https://stationary-management-6h9o.onrender.com';
  try {
    // 1. Get token
    const loginRes = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dealer@example.com',
        password: 'Dealer@123',
        computerId: 'TEST-COMP'
      })
    });
    
    if (!loginRes.ok) {
        console.error('Login failed:', loginRes.status, await loginRes.text());
        return;
    }
    const loginData = await loginRes.json();
    const token = loginData.access_token;
    console.log('Got token');
    
    // 2. Fetch tenants
    const tenantsRes = await fetch(`${baseURL}/api/tenants`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Tenants status:', tenantsRes.status);
    const tenantsText = await tenantsRes.text();
    console.log('Tenants body:', tenantsText);
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
