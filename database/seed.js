const mongoose = require('mongoose');
const connectDB = require('../api/db'); // Import our new connection
const User = require('../api/models/User');
const Category = require('../api/models/Category');

// Admin Hash (password: "admin")
const ADMIN_HASH = '$2a$10$.IkohulKtE2yZ1/0G404Q.Ngq2hKt77IvEd8NZSqnDrNaT9Y0QtOG';

const seedData = async () => {
    await connectDB();

    try {
        // 1. Clear existing data
        await User.deleteMany({});
        await Category.deleteMany({});
        console.log('🧹 Cleared old data...');

        // 2. Create Admin
        await User.create({
            username: 'admin',
            password_hash: ADMIN_HASH,
            isAdmin: true
        });
        console.log('👤 Admin user created (admin/admin)');

        // 3. Create Categories
        await Category.insertMany([
            { name: 'K-Drama' },
            { name: 'Anime' },
            { name: 'Popular' },
            { name: 'Latest' }
        ]);
        console.log('🗂️ Categories created');

        console.log('✅ Seeding complete.');
        process.exit(0);

    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seedData();