import { db } from './server/db';
import { games, GameType } from './shared/schema';

async function createSampleGames() {
  try {
    console.log('Creating sample game data for risk management testing...');
    
    const adminId = 1; // The admin user we created
    
    // Create test market games (satamatka)
    for (let i = 1; i <= 10; i++) {
      const isActive = i % 3 !== 0; // Some games will be active, some completed
      await db.insert(games).values({
        userId: adminId,
        gameType: GameType.SATAMATKA,
        betAmount: 1000 * (i % 5 + 1),
        prediction: i % 2 === 0 ? 'jodi' : 'single',
        result: isActive ? null : (i % 2 === 0 ? 'win' : 'loss'),
        payout: isActive ? 0 : (i % 2 === 0 ? 1000 * (i % 5 + 1) * 1.9 : 0),
        marketId: i % 5 + 1,
        gameMode: 'regular'
      });
      
      console.log(`Created market game ${i}`);
    }
    
    // Create test cricket toss games
    for (let i = 1; i <= 8; i++) {
      const isActive = i % 4 !== 0; // Some games will be active, some completed
      await db.insert(games).values({
        userId: adminId,
        gameType: GameType.CRICKET_TOSS,
        betAmount: 500 * (i % 3 + 1),
        prediction: i % 2 === 0 ? 'team_a' : 'team_b',
        result: isActive ? null : (i % 2 === 0 ? 'win' : 'loss'),
        payout: isActive ? 0 : (i % 2 === 0 ? 500 * (i % 3 + 1) * 1.8 : 0),
        marketId: null,
        matchId: i % 3 + 1,
        gameMode: 'regular'
      });
      
      console.log(`Created cricket toss game ${i}`);
    }
    
    console.log('Sample game data created successfully!');
    
  } catch (error) {
    console.error('Error creating sample game data:', error);
  }
}

// Run the function
createSampleGames()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Failed:', err));