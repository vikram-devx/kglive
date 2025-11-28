/**
 * Script to create an admin user
 */
import { pool, db } from './server/db.js';
import { users } from './shared/schema.js';
import bcrypt from 'bcrypt';

async function createAdmin() {
  try {
    console.log('Creating admin user...');
    
    // Check if admin already exists
    const existingAdmin = await db.select().from(users).where({ username: 'admin' }).limit(1);
    
    if (existingAdmin.length > 0) {
      console.log('Admin user already exists');
      return;
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);
    
    // Insert admin user
    const [admin] = await db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@example.com',
      mobile: '1234567890',
      role: 'admin'
    }).returning();
    
    console.log('Admin user created successfully:', admin);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

createAdmin();