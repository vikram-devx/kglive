/**
 * This script fixes the crossing bets for a specific Satamatka market
 * It reprocesses the results for crossing bets that should be wins
 */

import { db } from './server/db';
import { eq, and } from 'drizzle-orm';
import { games, SatamatkaGameMode } from './shared/schema';
import { storage } from './server/storage';

async function fixCrossingBets() {
  try {
    console.log('Starting to fix crossing bets...');
    
    // Market ID to fix (change this to the specific market ID you want to fix)
    const marketId = 4;
    
    // Get market details
    const market = await storage.getSatamatkaMarket(marketId);
    if (!market) {
      console.error(`Market with ID ${marketId} not found`);
      return;
    }
    
    console.log(`Processing market: ${market.name} (ID: ${marketId})`);
    console.log(`Result: ${market.closeResult}`);
    
    if (!market.closeResult) {
      console.error('Market does not have a close result set');
      return;
    }
    
    // Get all crossing games for this market
    const crossingGames = await db.select()
      .from(games)
      .where(
        and(
          eq(games.marketId, marketId),
          eq(games.gameMode, SatamatkaGameMode.CROSSING)
        )
      );
    
    console.log(`Found ${crossingGames.length} crossing games to check`);
    
    // Process each game to check if it should be a win
    for (const game of crossingGames) {
      // For Crossing, check if the prediction matches the result in any order
      const digits = game.prediction.replace(/[^0-9,]/g, '').split(',');
      
      // Extract all possible crossing combinations from the digits
      const crossingCombinations = [];
      for (let i = 0; i < digits.length; i++) {
        for (let j = 0; j < digits.length; j++) {
          if (i !== j) {
            crossingCombinations.push(digits[i] + digits[j]);
          }
        }
      }
      
      // Check both normal and reverse ordering of the result
      const resultToCheck = market.closeResult;
      const reverseResult = resultToCheck.length === 2 ? resultToCheck[1] + resultToCheck[0] : resultToCheck;
      
      // Determine if this should be a win
      const shouldBeWin = crossingCombinations.includes(resultToCheck) || crossingCombinations.includes(reverseResult);
      
      console.log(`Game ID: ${game.id}, Prediction: ${game.prediction}, Combinations: ${JSON.stringify(crossingCombinations)}`);
      console.log(`  Result: ${resultToCheck} (or ${reverseResult}), Should be win: ${shouldBeWin}, Current result: ${game.result}`);
      
      // If the game should be a win but is marked as loss, update it
      if (shouldBeWin && game.result === 'loss') {
        console.log(`  FIXING: Game ID ${game.id} should be a win`);
        
        // Get appropriate odds 
        let gameTypeOdds = await db.select()
          .from('game_odds')
          .where(
            and(
              eq('game_odds.gameType', 'satamatka_crossing'),
              eq('game_odds.setByAdmin', true)
            )
          );
        
        let oddValue = gameTypeOdds.length > 0 ? gameTypeOdds[0].oddValue : 950000; // Default to 95x if not found
        
        // Calculate payout (betAmount is stored in paisa)
        const payout = Math.round(game.betAmount * (oddValue / 10000));
        
        // Update the game result to win and set payout
        const [updatedGame] = await db.update(games)
          .set({ result: 'win', payout })
          .where(eq(games.id, game.id))
          .returning();
        
        // Now update the user's balance to add the payout amount
        const user = await storage.getUser(game.userId);
        if (user) {
          const newBalance = user.balance + payout;
          await storage.updateUserBalance(user.id, newBalance);
          console.log(`  Updated user ${user.username} balance: ${user.balance/100} → ${newBalance/100} (+${payout/100})`);
        }
        
        console.log(`  ✓ Fixed game ID ${game.id}: Changed to win, Payout: ${payout/100}`);
      }
    }
    
    console.log('Completed fixing crossing bets!');
  } catch (error) {
    console.error('Error fixing crossing bets:', error);
  }
}

fixCrossingBets().catch(err => console.error('Error:', err));