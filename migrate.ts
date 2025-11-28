import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './shared/schema';
import { eq } from 'drizzle-orm';
import { createHash, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

neonConfig.webSocketConstructor = ws;

// Create a connection to the database
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

// Create a promisified version of scrypt
const scryptAsync = promisify(scrypt);

// Function to hash a password with crypto.scrypt
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  return `${derivedKey.toString('hex')}.${salt}`;
}

async function main() {
  try {
    console.log('Creating tables from schema...');
    // Push the schema to the database
    await migrate.drizzle({ client: pool }, {
      migrationsFolder: './drizzle'
    });
    
    console.log('Tables created successfully');
    
    // Check if admin user exists
    const adminUser = await db.select()
      .from(schema.users)
      .where(eq(schema.users.username, 'admin'))
      .limit(1);
    
    if (adminUser.length === 0) {
      console.log('Creating admin user...');
      
      // Hash the password
      const hashedPassword = await hashPassword('admin123');
      
      // Insert the admin user
      await db.insert(schema.users).values({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@example.com',
        mobile: '1234567890',
        role: 'admin',
        balance: 100000, // Initial balance (in cents)
      });
      
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
    
    console.log('Migration complete');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

main();