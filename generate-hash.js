/**
 * This script generates a crypto.scrypt hash for a given password.
 * Useful for manually creating passwords in the new format.
 */

import crypto from 'crypto';
import { promisify } from 'util';

// Promisify the scrypt function
const scryptAsync = promisify(crypto.scrypt);

// Function to hash password with crypto.scrypt
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function generateHash() {
  // You can change this password to whatever you need
  const password = "password123";
  
  try {
    const hash = await hashPassword(password);
    console.log(`\nPassword: ${password}`);
    console.log(`Hash: ${hash}`);
    console.log(`\nThis hash can be stored directly in the database.`);
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

// Run the function
generateHash();