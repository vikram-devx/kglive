// This script creates test accounts to validate the game odds system
import { db } from './server/db.js';
import { users, gameOdds } from './shared/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function createTestSetup() {
  try {
    console.log('Starting test setup...');
    
    // Hash the password
    const password = 'testing123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create or find test subadmin
    let subadmin;
    const existingSubadmin = await db.select().from(users).where(eq(users.username, 'oddstester'));
    
    if (existingSubadmin.length === 0) {
      console.log('Creating new test subadmin...');
      const [newSubadmin] = await db.insert(users).values({
        username: 'oddstester',
        email: 'oddstester@example.com',
        password: hashedPassword,
        mobile: '1234567890',
        role: 'subadmin',
        balance: 10000,
        isBlocked: false
      }).returning();
      
      subadmin = newSubadmin;
    } else {
      console.log('Using existing subadmin...');
      subadmin = existingSubadmin[0];
    }
    
    console.log(`Subadmin ID: ${subadmin.id}`);
    
    // Create or find test player
    let player;
    const existingPlayer = await db.select().from(users).where(eq(users.username, 'playertester'));
    
    if (existingPlayer.length === 0) {
      console.log('Creating new test player...');
      const [newPlayer] = await db.insert(users).values({
        username: 'playertester',
        email: 'playertester@example.com',
        password: hashedPassword,
        mobile: '9876543210',
        role: 'player',
        balance: 5000,
        assignedTo: subadmin.id,
        isBlocked: false
      }).returning();
      
      player = newPlayer;
    } else {
      console.log('Using existing player...');
      player = existingPlayer[0];
      
      // Ensure player is assigned to our test subadmin
      if (player.assignedTo !== subadmin.id) {
        await db.update(users)
          .set({ assignedTo: subadmin.id })
          .where(eq(users.id, player.id));
        console.log(`Updated player to be assigned to subadmin ID: ${subadmin.id}`);
      }
    }
    
    console.log(`Player ID: ${player.id}`);
    
    // Set custom coin flip odds for the subadmin (different from platform default)
    const existingOdds = await db.select()
      .from(gameOdds)
      .where(eq(gameOdds.gameType, 'coin_flip'))
      .where(eq(gameOdds.subadminId, subadmin.id));
    
    const customOddValue = 210; // 2.10x (stored as 210 in DB)
    
    if (existingOdds.length === 0) {
      console.log('Creating new custom odds...');
      await db.insert(gameOdds).values({
        gameType: 'coin_flip',
        oddValue: customOddValue,
        setByAdmin: false,
        subadminId: subadmin.id
      });
    } else {
      console.log('Updating existing odds...');
      await db.update(gameOdds)
        .set({ oddValue: customOddValue })
        .where(eq(gameOdds.gameType, 'coin_flip'))
        .where(eq(gameOdds.subadminId, subadmin.id));
    }
    
    console.log(`Set custom coin flip odds for subadmin to ${customOddValue/100}x`);
    
    // Print login details
    console.log('\nTest setup completed successfully!');
    console.log('Login credentials:');
    console.log(`Subadmin: username=oddstester, password=${password}`);
    console.log(`Player: username=playertester, password=${password}`);
    
  } catch (error) {
    console.error('Error in test setup:', error);
  }
}

createTestSetup();