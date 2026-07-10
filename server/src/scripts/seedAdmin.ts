import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { Admin } from '../model/Admin.js';

process.loadEnvFile?.();

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/server';
const email = process.env.SEED_ADMIN_EMAIL || 'admin@admin.com';
const password = process.env.SEED_ADMIN_PASSWORD || 'admin';
const name = process.env.SEED_ADMIN_NAME || 'Super Admin';

async function main() {
  await mongoose.connect(DATABASE_URL);

  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log(`[seed] Admin already exists: ${email}`);
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const admin = await Admin.create({
    name,
    email,
    password: hashed,
    role: 'admin',
    permissions: ['*'],
    isActive: true,
  });

  console.log(`[seed] Admin created: ${admin.email} (id: ${admin.id})`);
  console.log(`[seed] Password: ${password}`);
}

main()
  .catch((err) => {
    console.error('[seed] Failed:', err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
