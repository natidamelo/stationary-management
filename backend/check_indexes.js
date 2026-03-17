
const mongoose = require('mongoose');

async function checkIndexes() {
    try {
        await mongoose.connect('mongodb://localhost:27017/stationery_management');
        const db = mongoose.connection.db;
        const indexes = await db.collection('tenants').indexes();
        console.log('Tenants Indexes:', JSON.stringify(indexes, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkIndexes();
