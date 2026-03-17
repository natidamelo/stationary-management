const mongoose = require('mongoose');
const fs = require('fs');

async function check() {
  await mongoose.connect('mongodb://localhost:27017/stationery_management');
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  let output = '--- Users ---\n';
  users.forEach(u => {
    output += `Email: ${u.email}, tenantId: ${u.tenantId}\n`;
  });
  
  const tenants = await mongoose.connection.db.collection('tenants').find({}).toArray();
  output += '\n--- Tenants ---\n';
  tenants.forEach(t => {
    output += `Name: ${t.name}, ID: ${t._id}\n`;
  });

  fs.writeFileSync('db_summary.txt', output);
  await mongoose.disconnect();
  console.log('Summary written to db_summary.txt');
}

check().catch(console.error);
