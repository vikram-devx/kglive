import { db } from './server/db';
import { games, satamatkaMarkets, teamMatches, MarketType, MarketStatus, GameType } from './shared/schema';
import { eq, sql } from 'drizzle-orm';

async function setupRiskManagementData() {
  try {
    console.log('Setting up sample data for risk management testing...');
    
    // Set a default admin ID for testing - typically ID 1 is admin in the system
    const adminId = 1;
    console.log(`Using admin ID: ${adminId}`);
    
    // Clear existing test data
    console.log('Cleaning up any existing test data...');
    await db.delete(games).where(eq(games.gameType, GameType.SATAMATKA));
    await db.delete(games).where(eq(games.gameType, GameType.CRICKET_TOSS));
    await db.delete(satamatkaMarkets).execute();
    await db.delete(teamMatches).execute();

    // Create sample satamatka markets first
    console.log('Creating sample satamatka markets...');
    const markets = [];
    for (let i = 1; i <= 5; i++) {
      const [market] = await db.insert(satamatkaMarkets).values({
        name: `Test Market ${i}`,
        type: i % 2 === 0 ? 'mumbai' : 'kalyan',  // Using the required values based on schema
        openTime: new Date(),
        closeTime: new Date(Date.now() + 3600000), // 1 hour from now
        status: MarketStatus.OPEN,
        isRecurring: false
      }).returning();
      
      markets.push(market);
      console.log(`Created market ${i}: ${market.name} (ID: ${market.id})`);
    }
    
    // Create sample cricket matches
    console.log('\nCreating sample cricket matches...');
    const matches = [];
    for (let i = 1; i <= 3; i++) {
      const [match] = await db.insert(teamMatches).values({
        teamA: `Team A${i}`,
        teamB: `Team B${i}`,
        matchTime: new Date(Date.now() + 86400000 * i), // Future dates
        status: "open" // Using string literal based on schema
      }).returning();
      
      matches.push(match);
      console.log(`Created cricket match ${i}: ${match.teamA} vs ${match.teamB} (ID: ${match.id})`);
    }
    
    // Create test market games (satamatka)
    console.log('\nCreating sample market games...');
    for (let i = 1; i <= 10; i++) {
      const isActive = i % 3 !== 0; // Some games will be active, some completed
      const marketId = markets[i % markets.length].id;
      
      const [game] = await db.insert(games).values({
        userId: adminId,
        gameType: GameType.SATAMATKA,
        betAmount: 1000 * (i % 5 + 1),
        prediction: i % 2 === 0 ? 'jodi' : 'single',
        result: isActive ? null : (i % 2 === 0 ? 'win' : 'loss'),
        payout: isActive ? 0 : (i % 2 === 0 ? 1000 * (i % 5 + 1) * 1.9 : 0),
        marketId: marketId,
        gameMode: 'regular'
      }).returning();
      
      console.log(`Created market game ${i} (ID: ${game.id})`);
    }
    
    // Create test cricket toss games
    console.log('\nCreating sample cricket toss games...');
    for (let i = 1; i <= 8; i++) {
      const isActive = i % 4 !== 0; // Some games will be active, some completed
      const matchId = matches[i % matches.length].id;
      
      const [game] = await db.insert(games).values({
        userId: adminId,
        gameType: GameType.CRICKET_TOSS,
        betAmount: 500 * (i % 3 + 1),
        prediction: i % 2 === 0 ? 'team_a' : 'team_b',
        result: isActive ? null : (i % 2 === 0 ? 'win' : 'loss'),
        payout: isActive ? 0 : (i % 2 === 0 ? 500 * (i % 3 + 1) * 1.8 : 0),
        matchId: matchId,
        gameMode: 'regular'
      }).returning();
      
      console.log(`Created cricket toss game ${i} (ID: ${game.id})`);
    }
    
    console.log('\nSample data for risk management created successfully!');
    
  } catch (error) {
    console.error('Error creating risk management data:', error);
  }
}

// Run the function
setupRiskManagementData()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Failed:', err));