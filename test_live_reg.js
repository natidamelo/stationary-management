async function test() {
  const companyName = 'Test Shop ' + Date.now();
  try {
    const res = await fetch('https://stationary-management-6h9o.onrender.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test' + Date.now() + '@example.com',
        password: 'Password123!',
        fullName: 'Test User',
        companyName: companyName
      })
    });
    
    console.log('Register Status:', res.status);
    const data = await res.json();
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
