const axios = require('axios');

async function testRegister() {
  try {
    const res = await axios.post('http://localhost:3000/api/auth/register', {
      email: 'test' + Date.now() + '@example.com',
      password: 'password123',
      fullName: 'Test User',
      companyName: 'Test Company ' + Date.now()
    });
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error Status:', err.response?.status);
    console.error('Error Data:', JSON.stringify(err.response?.data, null, 2));
  }
}

testRegister();
