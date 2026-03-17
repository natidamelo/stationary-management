const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb://localhost:27017/stationery_management');
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  console.log('--- Users ---');
  users.forEach(u => {
    console.log(`Email: ${u.email}, tenantId: ${u.tenantId}`);
  });
  
  const tenants = await mongoose.connection.db.collection('tenants').find({}).toArray();
  console.log('--- Tenants ---');
  tenants.forEach(t => console.log(`Name: ${t.name}, ID: ${t._id}`));

  await mongoose.disconnect();
}

check().catch(console.error);
