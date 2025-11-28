/**
 * Script to update a subadmin password to make it work with the authentication system
 */
const { Pool } = require('pg');
const { promisify } = require('util');
const { scrypt, randomBytes } = require('crypto');

// Promisify the scrypt function
const scryptAsync = promisify(scrypt);

// Connect to database using environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function hashPassword(password) {
  // Use our native crypto.scrypt function for password hashing
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function fixSubadminPassword() {
  console.log('Updating subadmin password...');
  
  const client = await pool.connect();
  
  try {
    // Check if the user exists
    const checkResult = await client.query(
      `SELECT * FROM users WHERE username = 'shubham'`
    );
    
    if (checkResult.rows.length === 0) {
      console.log("User 'shubham' not found in the database.");
      return;
    }
    
    // Generate a proper crypto.scrypt hash for 'asdf1234'
    const hashedPassword = await hashPassword('asdf1234');
    console.log('Generated hash:', hashedPassword);
    
    // Update the password
    const result = await client.query(
      `UPDATE users SET password = $1 WHERE username = 'shubham' RETURNING id, username, role`,
      [hashedPassword]
    );
    
    if (result.rows.length > 0) {
      console.log('Updated password for user:', result.rows[0]);
      console.log('You can now login with:');
      console.log('Username: shubham');
      console.log('Password: asdf1234');
    } else {
      console.log('No user was updated.');
    }
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    client.release();
  }
}

// Run the script
fixSubadminPassword().catch(console.error);