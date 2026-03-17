
const axios = require('axios');

async function testRegister() {
    try {
        const res = await axios.post('http://localhost:3000/api/auth/register', {
            email: 'test@example.com',
            password: 'password123',
            fullName: 'Test User',
            companyName: 'Test Company ' + Date.now()
        });
        console.log('SUCCESS:', res.data);
    } catch (err) {
        console.log('FAILED:', err.response?.status, err.response?.data);
    }
}

testRegister();
