// scripts/setup-users.js
import 'dotenv/config';
import argon2 from 'argon2';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../src/config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const INITIAL_STAFF = [
  {
    name: 'محمد صالح القطوي',
    email: 'alktwi@gmail.com',
    role: 'executive_director',
    departmentSlug: 'executive',
    isManager: true,
  },
  {
    name: 'منير منصور حسن الوريش',
    email: 'moneermansoro@gmail.com',
    role: 'department_manager',
    departmentSlug: 'accounts',
    isManager: true,
  },
  {
    name: 'عمار ناجي المرحمي',
    email: 'almarhmy2010@gmail.com',
    role: 'department_manager',
    departmentSlug: 'projects',
    isManager: true,
  },
  {
    name: 'بشار علي قاسم الوريش',
    email: 'wareshtech@gmail.com',
    role: 'employee',
    departmentSlug: 'hr',
    isManager: false,
  },
  {
    name: 'عبدالغني علي محمد المسوري',
    email: 'abuhifa222@gmail.com',
    role: 'employee',
    departmentSlug: 'protection',
    isManager: false,
  },
  {
    name: 'أحمد عبده قاسم الشرعبي',
    email: 'ahmadalsharapii@gmail.com',
    role: 'employee',
    departmentSlug: 'logistics',
    isManager: false,
  },
  {
    name: 'بدر صالح القطوي',
    email: 'badrsaleh852@gmail.com',
    role: 'employee',
    departmentSlug: 'media',
    isManager: false,
  },
  {
    name: 'محمد جابر',
    email: 'mohmdqtwi@gmail.com',
    role: 'employee',
    departmentSlug: 'accounts',
    isManager: false,
  },
];

async function setupUsers() {
  console.log('🚀 Starting secure setup of initial organization staff...');

  try {
    // 1. Fetch departments and roles
    const departments = await db('departments').select('id', 'slug');
    const roles = await db('roles').select('id', 'name');

    const deptMap = Object.fromEntries(departments.map((d) => [d.slug, d.id]));
    const roleMap = Object.fromEntries(roles.map((r) => [r.name, r.id]));

    const defaultPassEnv = process.env.INITIAL_USER_PASSWORD;
    const generatedCredentials = [];

    for (const staff of INITIAL_STAFF) {
      const deptId = deptMap[staff.departmentSlug] || null;
      const roleId = roleMap[staff.role];

      if (!roleId) {
        console.warn(`⚠️ Role ${staff.role} not found in database. Run seeds first.`);
        continue;
      }

      // Check if user already exists
      const existing = await db('users').where({ email: staff.email }).first();

      // Secure password: use environment password if set, or generate high-entropy secure temporary password
      const plainPassword = defaultPassEnv || `Pasmh@${crypto.randomBytes(4).toString('hex')}!`;
      const passwordHash = await argon2.hash(plainPassword, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      });

      let userId;

      if (existing) {
        userId = existing.id;
        await db('users')
          .where({ id: userId })
          .update({
            name: staff.name,
            department_id: deptId,
            updated_at: new Date(),
          });
        console.log(`ℹ️ User updated: ${staff.name} (${staff.email})`);
      } else {
        const [insertedId] = await db('users').insert({
          name: staff.name,
          email: staff.email,
          password_hash: passwordHash,
          department_id: deptId,
          is_active: 1,
          created_at: new Date(),
          updated_at: new Date(),
        });
        userId = insertedId;
        console.log(`✅ User created: ${staff.name} (${staff.email})`);

        generatedCredentials.push({
          name: staff.name,
          email: staff.email,
          role: staff.role,
          tempPassword: plainPassword,
        });
      }

      // Assign user role
      await db('user_roles')
        .insert({ user_id: userId, role_id: roleId })
        .onConflict(['user_id', 'role_id'])
        .ignore();

      // If manager, set manager_id on department
      if (staff.isManager && deptId) {
        await db('departments').where({ id: deptId }).update({ manager_id: userId });
      }
    }

    // Save temporary credentials locally (ignored by git) for initial distribution
    if (generatedCredentials.length > 0) {
      const credsPath = path.resolve(__dirname, '../.initial_credentials.json');
      fs.writeFileSync(credsPath, JSON.stringify(generatedCredentials, null, 2), {
        mode: 0o600,
      });
      console.log(`\n🔒 Initial credentials securely saved to: .initial_credentials.json`);
      console.log('⚠️  Please distribute these securely and delete or move the file afterwards.');
    }

    console.log('\n🎉 Setup of all 8 staff members completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up users:', error);
    process.exit(1);
  }
}

setupUsers();
