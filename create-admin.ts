/**
 * Script to create an admin user
 */
import { pool } from './server/db';

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Create admin user with direct SQL
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if admin already exists
      const checkResult = await client.query('SELECT id FROM users WHERE username = $1', ['admin']);
      
      if (checkResult.rowCount === 0) {
        // Admin doesn't exist, create one
        // Use a default bcrypt hash for 'admin123' (you can generate this with bcrypt online tools)
        const hashedPassword = '$2b$10$mA.DloIkTdF5DY3vX2Oz/OCNECnUb9SAj1h/HP0skvGQFPKpOBcZS';
        
        await client.query(`
          INSERT INTO users (username, password, email, mobile, role, balance) 
          VALUES ($1, $2, $3, $4, $5, $6)
        `, ['admin', hashedPassword, 'admin@example.com', '1234567890', 'admin', 0]);
        
        console.log('Admin user created successfully');
      } else {
        console.log('Admin user already exists');
      }
      
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

createAdminUser();