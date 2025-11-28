/**
 * This script fixes login issues with older admin accounts created before
 * email and mobile fields were required.
 * 
 * It adds default values for these fields to existing accounts that lack them.
 */

const { Pool } = require('pg');

async function fixAdminLogin() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();

    try {
      // First check if the email and mobile columns exist
      const columnsExist = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name IN ('email', 'mobile')
      `);

      // If the columns don't exist, we need to add them
      if (columnsExist.rows.length < 2) {
        console.log('Adding missing email and/or mobile columns...');
        
        // Check which columns need to be added
        const existingColumns = columnsExist.rows.map(row => row.column_name);
        
        if (!existingColumns.includes('email')) {
          await client.query(`ALTER TABLE users ADD COLUMN email TEXT`);
          console.log('Added email column');
        }
        
        if (!existingColumns.includes('mobile')) {
          await client.query(`ALTER TABLE users ADD COLUMN mobile TEXT`);
          console.log('Added mobile column');
        }
      }

      // Update admin accounts to have default values for email and mobile if they are NULL
      console.log('Updating admin accounts with default values for email and mobile...');
      const result = await client.query(`
        UPDATE users 
        SET 
          email = COALESCE(email, username || '@admin.example.com'),
          mobile = COALESCE(mobile, '1234567890')
        WHERE 
          role = 'admin' AND (email IS NULL OR mobile IS NULL)
        RETURNING id, username
      `);

      if (result.rows.length > 0) {
        console.log(`Updated ${result.rows.length} admin accounts:`);
        result.rows.forEach(user => {
          console.log(`- Admin ID: ${user.id}, Username: ${user.username}`);
        });
      } else {
        console.log('No admin accounts needed updating');
      }

      // Check for any other accounts (subadmins, players) without email/mobile
      const otherAccounts = await client.query(`
        UPDATE users 
        SET 
          email = COALESCE(email, username || '@user.example.com'),
          mobile = COALESCE(mobile, '9876543210')
        WHERE 
          role != 'admin' AND (email IS NULL OR mobile IS NULL)
        RETURNING id, username, role
      `);

      if (otherAccounts.rows.length > 0) {
        console.log(`Updated ${otherAccounts.rows.length} other accounts:`);
        otherAccounts.rows.forEach(user => {
          console.log(`- ${user.role} ID: ${user.id}, Username: ${user.username}`);
        });
      } else {
        console.log('No other accounts needed updating');
      }

      console.log('Account fixes completed successfully!');

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fixing admin accounts:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
fixAdminLogin().catch(console.error);
