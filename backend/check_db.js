
const mongoose = require('mongoose');

async function check() {
    try {
        await mongoose.connect('mongodb://localhost:27017/stationery_management');
        console.log('--- DB Check ---');

        const Tenant = mongoose.model('tenants', new mongoose.Schema({ name: String }, { strict: false }));
        const User = mongoose.model('users', new mongoose.Schema({ email: String, tenantId: mongoose.Schema.Types.ObjectId }, { strict: false }));
        const Role = mongoose.model('roles', new mongoose.Schema({ name: String }, { strict: false }));

        const tenants = await Tenant.find().lean();
        console.log('Tenants:', tenants.map(t => ({ name: t.name, id: t._id })));

        const users = await User.find().lean();
        console.log('Users:', users.map(u => ({ email: u.email, tid: u.tenantId })));

        const roles = await Role.find().lean();
        console.log('Roles:', roles.map(r => r.name));

        const adminRole = await Role.findOne({ name: 'admin' }).lean();
        console.log('Admin Role exists:', !!adminRole);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

check();
