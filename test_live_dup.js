async function test() {
  const companyName = 'Duplicate Shop';
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
    
    console.log('Register 1 Status:', res.status);
    
    // Try again with same company name
    const res2 = await fetch('https://stationary-management-6h9o.onrender.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test' + (Date.now() + 100) + '@example.com',
        password: 'Password123!',
        fullName: 'Test User',
        companyName: companyName
      })
    });
    
    console.log('Register 2 Status:', res2.status);
    const data2 = await res2.json();
    console.log('Response 2:', data2);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
