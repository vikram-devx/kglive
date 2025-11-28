import { db } from './db';
import { eq, and, like } from 'drizzle-orm';
import { games, users, SatamatkaGameMode } from '../shared/schema';

// Endpoint to fix specific crossing bets that should be wins
export async function fixCrossingBets(req: any, res: any) {
  try {
    // Check if admin
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can fix crossing bets' });
    }

    console.log('Admin requested to fix crossing bets...');
    
    // Market ID to check is in req.params
    const marketId = parseInt(req.params.marketId);
    if (isNaN(marketId)) {
      return res.status(400).json({ message: 'Invalid market ID' });
    }
    
    // Get the market to check its result
    const [market] = await db.select()
      .from('satamatka_markets')
      .where(eq('satamatka_markets.id', marketId));
    
    if (!market) {
      return res.status(404).json({ message: 'Market not found' });
    }
    
    if (!market.closeResult) {
      return res.status(400).json({ message: 'Market does not have a close result' });
    }
    
    console.log(`Fixing crossing bets for market ${marketId} with result ${market.closeResult}`);
    
    // Find all crossing games for this market
    const crossingGames = await db.select()
      .from(games)
      .where(
        and(
          eq(games.marketId, marketId),
          eq(games.gameMode, SatamatkaGameMode.CROSSING),
          eq(games.result, 'loss') // Only look at games currently marked as losses
        )
      );
    
    console.log(`Found ${crossingGames.length} crossing games to check`);
    
    // Track fixed games
    const fixedGames = [];
    
    // Process each game
    for (const game of crossingGames) {
      // Extract the digits from the prediction
      let digits = [];
      
      // Handle different prediction formats (e.g., "0,1,2", "012", etc.)
      if (game.prediction.includes(',')) {
        digits = game.prediction.split(',').map(d => d.trim());
      } else {
        // If no commas, treat each character as a digit
        digits = game.prediction.split('');
      }
      
      // Generate all crossing combinations
      const crossingCombinations = [];
      for (let i = 0; i < digits.length; i++) {
        for (let j = 0; j < digits.length; j++) {
          if (i !== j) {
            crossingCombinations.push(digits[i] + digits[j]);
          }
        }
      }
      
      // Check if result or its reverse matches any crossing combination
      const resultToCheck = market.closeResult;
      const reverseResult = resultToCheck.length === 2 
        ? resultToCheck[1] + resultToCheck[0] 
        : resultToCheck;
      
      const shouldBeWin = crossingCombinations.includes(resultToCheck) || 
                         crossingCombinations.includes(reverseResult);
      
      console.log(`Game ${game.id}: Prediction=${game.prediction}, Combinations=${crossingCombinations.join(',')}, Result=${market.closeResult}, ShouldBeWin=${shouldBeWin}`);
      
      // If should be a win but currently a loss, fix it
      if (shouldBeWin) {
        // Get the appropriate odds from game_odds
        const odds = await db.select()
          .from('game_odds')
          .where(
            and(
              eq('game_odds.gameType', 'satamatka_crossing'),
              eq('game_odds.setByAdmin', true)
            )
          );
        
        let oddValue = odds.length > 0 ? odds[0].oddValue : 950000; // Default to 95x
        
        // Calculate payout
        const payout = Math.round(game.betAmount * (oddValue / 10000));
        
        // Update the game
        await db.update(games)
          .set({ 
            result: 'win',
            payout 
          })
          .where(eq(games.id, game.id));
        
        // Update user balance
        const user = await db.select().from(users).where(eq(users.id, game.userId)).limit(1);
        if (user && user.length > 0) {
          const newBalance = user[0].balance + payout;
          await db.update(users)
            .set({ balance: newBalance })
            .where(eq(users.id, game.userId));
            
          console.log(`Updated user ${user[0].username} balance: ${user[0].balance/100} → ${newBalance/100}`);
        }
        
        fixedGames.push({
          gameId: game.id,
          prediction: game.prediction,
          previousResult: 'loss',
          newResult: 'win',
          payout: payout / 100 // Convert to rupees for display
        });
      }
    }
    
    return res.json({
      success: true,
      fixed: fixedGames.length,
      details: fixedGames
    });
  } catch (error) {
    console.error('Error fixing crossing bets:', error);
    return res.status(500).json({ message: 'Error fixing crossing bets', error: String(error) });
  }
}