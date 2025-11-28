/**
 * This script directly fixes the Satamatka crossing bets where a player bet on 0,1,2 crossing
 * with result "01" which should be a win but shows as a loss
 */

import { db } from './server/db';
import { eq, and, like } from 'drizzle-orm';
import { games, SatamatkaGameMode, users } from './shared/schema';

async function fixCrossingDirectly() {
  try {
    console.log('Starting to fix crossing bets directly...');
    
    // Find markets with "01" as the close result
    const relevantGames = await db.select({
      id: games.id,
      userId: games.userId,
      marketId: games.marketId,
      betAmount: games.betAmount,
      prediction: games.prediction,
      result: games.result
    })
    .from(games)
    .where(
      and(
        eq(games.gameMode, SatamatkaGameMode.CROSSING),
        eq(games.result, 'loss'),
        // Looking for predictions that include 0,1,2 for crossing where result is 01
        like(games.prediction, '%0%1%2%')
      )
    );
    
    console.log(`Found ${relevantGames.length} crossing game(s) with 0,1,2 that need fixing`);
    
    for (const game of relevantGames) {
      console.log(`Checking game ID ${game.id} with prediction ${game.prediction}`);
      
      // Get the user to update their balance
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, game.userId));
      
      if (!user) {
        console.log(`User with ID ${game.userId} not found for game ${game.id}`);
        continue;
      }
      
      // Get the game odds for satamatka crossing
      const gameTypeOdds = await db.select()
        .from('game_odds')
        .where(
          and(
            eq('game_odds.gameType', 'satamatka_crossing'),
            eq('game_odds.setByAdmin', true)
          )
        );
        
      // Use default 95x if no odds configured
      const oddValue = gameTypeOdds.length > 0 ? gameTypeOdds[0].oddValue : 950000;
      console.log(`Using odds value: ${oddValue/10000}x`);
      
      // Calculate payout
      const payout = Math.round(game.betAmount * (oddValue / 10000));
      
      // Update the game to a win and set payout
      const [updatedGame] = await db.update(games)
        .set({ 
          result: 'win',
          payout 
        })
        .where(eq(games.id, game.id))
        .returning();
      
      if (!updatedGame) {
        console.log(`Failed to update game ${game.id}`);
        continue;
      }
      
      // Update user balance
      const newBalance = user.balance + payout;
      await db.update(users)
        .set({ balance: newBalance })
        .where(eq(users.id, user.id));
      
      console.log(`Fixed game ID ${game.id} for user ${user.username}:`);
      console.log(`  Changed result: loss → win`);
      console.log(`  Added payout: ${payout/100} rupees`);
      console.log(`  Updated balance: ${user.balance/100} → ${newBalance/100} rupees`);
    }
    
    console.log('Completed fixing crossing bets!');
  } catch (error) {
    console.error('Error fixing crossing bets:', error);
  }
}

fixCrossingDirectly().catch(err => console.error('Error executing script:', err));