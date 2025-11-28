import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function testPasswordVerification() {
  try {
    console.log("Testing password verification...");
    
    // The admin user password from the database
    const storedPassword = "5d4acce791647cb0fdd02c1f8c5cf3915d139008a05a7c4e0fb23654e9cb1d00c7fe0ba22d527d438892f704af626efef3e12a40673aa8d75ef9fa51a7a7077f.ff1e7c493fd990361cd2bd69c18cea2a";
    
    // The password being tested
    const suppliedPassword = "admin123";
    
    // Split the stored password to get the hash and salt
    const parts = storedPassword.split('.');
    if (parts.length !== 2) {
      console.log("Invalid password format");
      return;
    }
    
    const [hashedPart, salt] = parts;
    console.log(`Hash part length: ${hashedPart.length}`);
    console.log(`Salt part length: ${salt.length}`);
    
    // Hash the supplied password with the same salt
    const hashedBuf = Buffer.from(hashedPart, 'hex');
    const suppliedBuf = await scryptAsync(suppliedPassword, salt, 64);
    
    console.log(`Stored hash buffer length: ${hashedBuf.length}`);
    console.log(`Computed hash buffer length: ${suppliedBuf.length}`);
    
    // Compare the hashes
    const result = timingSafeEqual(hashedBuf, suppliedBuf);
    console.log(`Password verification result: ${result ? "MATCHED" : "FAILED"}`);
    
    // Log the generated hash for reference
    console.log(`\nGenerated hash from 'admin123':`);
    console.log(suppliedBuf.toString('hex'));
    
  } catch (error) {
    console.error("Error testing password verification:", error);
  }
}

testPasswordVerification();