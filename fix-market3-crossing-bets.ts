/**
 * This script specifically fixes the Satamatka crossing bets for market ID 3
 * It will update any crossing bets that should be wins but are showing as losses
 */

import { db } from './server/db';
import { eq, and } from 'drizzle-orm';
import { games, SatamatkaGameMode } from './shared/schema';
import { storage } from './server/storage';

async function fixMarket3CrossingBets() {
  try {
    console.log('Starting to fix crossing bets for market ID 3...');
    
    // Market ID 3 has the close result of "01"
    const marketId = 3;
    
    // Get the market details to confirm
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
    
    const resultToCheck = market.closeResult;
    console.log(`Checking bets against result: ${resultToCheck}`);
    
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
      console.log(`\nChecking game ID ${game.id} with prediction: ${game.prediction}`);
      
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
      const reverseResult = resultToCheck.length === 2 ? resultToCheck[1] + resultToCheck[0] : resultToCheck;
      
      console.log(`  Digits: ${digits.join(', ')}`);
      console.log(`  Possible crossings: ${crossingCombinations.join(', ')}`);
      console.log(`  Result: ${resultToCheck} (or reverse: ${reverseResult})`);
      
      // Determine if this should be a win
      const shouldBeWin = crossingCombinations.includes(resultToCheck) || crossingCombinations.includes(reverseResult);
      
      console.log(`  Should be win: ${shouldBeWin}, Current result: ${game.result}`);
      
      // If the game should be a win but is marked as loss, update it
      if (shouldBeWin && game.result === 'loss') {
        console.log(`  FIXING: Game ID ${game.id} should be a win`);
        
        // Get appropriate odds for satamatka_crossing
        let gameTypeOdds = await db.select()
          .from('game_odds')
          .where(
            and(
              eq('game_odds.gameType', 'satamatka_crossing'),
              eq('game_odds.setByAdmin', true)
            )
          );
        
        let oddValue = gameTypeOdds.length > 0 ? gameTypeOdds[0].oddValue : 950000; // Default to 95x if not found
        
        console.log(`  Using odds value: ${oddValue/10000}x`);
        
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
          console.log(`  Updated user ${user.username} balance: ${user.balance/100} → ${newBalance/100} rupees (+${payout/100})`);
        }
        
        console.log(`  ✓ Fixed game ID ${game.id}: Changed to win, Payout: ${payout/100} rupees`);
      } else if (shouldBeWin && game.result === 'win') {
        console.log(`  ✓ Game ID ${game.id} is already correctly marked as a win`);
      } else if (!shouldBeWin && game.result === 'loss') {
        console.log(`  ✓ Game ID ${game.id} is correctly marked as a loss`);
      }
    }
    
    console.log('\nCompleted fixing crossing bets!');
  } catch (error) {
    console.error('Error fixing crossing bets:', error);
  }
}

fixMarket3CrossingBets().catch(err => console.error('Error:', err));