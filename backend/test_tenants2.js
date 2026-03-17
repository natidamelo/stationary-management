async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dealer@example.com',
        password: 'Dealer@123',
        computerId: 'TEST-COMP-ID'
      })
    });
    
    if (!res.ok) {
      console.log('Login failed', res.status, await res.text());
      return;
    }
    
    const loginData = await res.json();
    console.log('Login success');
    const token = loginData.access_token;
    
    const tenantsRes = await fetch('http://localhost:3000/api/tenants', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!tenantsRes.ok) {
      console.log('Tenants fetch failed', tenantsRes.status, await tenantsRes.text());
      return;
    }
    
    const tenantsData = await tenantsRes.json();
    console.log('Tenants:', tenantsData.length);
  } catch (err) {
    console.error('Network Error:', err.message);
  }
}
test();
