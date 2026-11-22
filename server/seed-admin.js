import { loadEnv } from './lib/env.js';
loadEnv();

import { connectDb, isDbConfigured } from './lib/db.js';
import User from './models/User.js';

async function seedAdmin() {
  if (!isDbConfigured()) {
    console.error('MONGODB_URI is not set. Please define MONGODB_URI before running seed:admin.');
    process.exit(1);
  }

  await connectDb();

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@jmtransport.com').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@1985';
  const adminName = process.env.ADMIN_NAME || 'Ramakishan Prajapat (Admin)';
  const adminPhone = process.env.ADMIN_PHONE || '9829575967';

  let existing = await User.findOne({ email: adminEmail });

  if (existing) {
    existing.role = 'admin';
    existing.fullName = adminName;
    existing.phone = adminPhone;
    existing.password = adminPassword; // Will trigger pre-save bcrypt hash
    await existing.save();
    console.log(`Admin account updated: ${adminEmail}`);
  } else {
    await User.create({
      fullName: adminName,
      email: adminEmail,
      phone: adminPhone,
      password: adminPassword,
      role: 'admin',
      companyName: 'Jammu Makrana Transport Co.',
    });
    console.log(`Admin account created successfully!`);
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
  }

  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('Failed to seed admin:', err);
  process.exit(1);
});
