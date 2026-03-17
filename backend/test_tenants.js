const axios = require('axios');
const mongoose = require('mongoose');

async function test() {
  try {
    const res = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'dealer@example.com',
      password: 'Dealer@123',
      computerId: 'TEST-COMP-ID'
    });
    console.log('Login success');
    const token = res.data.access_token;
    
    const tenantsRes = await axios.get('http://localhost:3000/api/tenants', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Tenants:', tenantsRes.data.length);
  } catch (err) {
    if (err.response) {
      console.error('Error status:', err.response.status);
      console.error('Error string:', err.response.data);
    } else {
      console.error('Network Error:', err.message);
    }
  }
}
test();
