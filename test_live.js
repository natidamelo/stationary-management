async function test() {
  try {
    const res = await fetch('https://stationary-management-system-backend.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dealer@example.com',
        password: 'Dealer@123',
        computerId: 'TEST'
      })
    });
    
    if (!res.ok) {
      console.log('Login failed', res.status, await res.text());
      return;
    }
    
    const loginData = await res.json();
    console.log('Login success');
    const token = loginData.access_token;
    
    const tenantsRes = await fetch('https://stationary-management-system-backend.onrender.com/api/tenants', {
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
