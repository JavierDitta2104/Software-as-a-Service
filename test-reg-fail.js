const axios = require('axios');

const testRegistration = async () => {
    try {
        const res = await axios.post('http://localhost:5000/api/auth/register', {
            name: 'Test Phase 3',
            email: `test_p3_${Date.now()}@example.com`,
            password: 'password123'
        });
        console.log('Registration Status:', res.status);
        console.log('Registration Data:', res.data);
    } catch (err) {
        console.error('Registration failed!');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        } else {
            console.error('Error:', err.message);
        }
    }
};

testRegistration();
