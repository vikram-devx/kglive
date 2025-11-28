/**
 * This script processes any pending bets for a Satamatka market
 * Use this when you see some bets remain in "pending" status even after results are declared
 */

import { db } from './server/db';
import { eq, and } from 'drizzle-orm';
import { games, users, SatamatkaGameMode } from './shared/schema';

async function processPendingBets() {
  try {
    // Get the market ID from command line
    const args = process.argv.slice(2);
    if (args.length === 0) {
      console.error('Please provide a market ID');
      console.error('Usage: npx tsx process-pending-bets.ts <marketId>');
      process.exit(1);
    }
    
    const marketId = parseInt(args[0]);
    if (isNaN(marketId)) {
      console.error('Invalid market ID. Please provide a valid number.');
      process.exit(1);
    }
    
    console.log(`Processing pending bets for market ID ${marketId}...`);
    
    // Get the market data
    const [market] = await db.select()
      .from('satamatka_markets')
      .where(eq('satamatka_markets.id', marketId));
    
    if (!market) {
      console.error(`Market with ID ${marketId} not found.`);
      process.exit(1);
    }
    
    if (!market.closeResult) {
      console.error(`Market with ID ${marketId} does not have a close result.`);
      process.exit(1);
    }
    
    console.log(`Market info: ${market.name}, Close Result: ${market.closeResult}`);
    
    // Get all pending games for this market
    const pendingGames = await db.select()
      .from(games)
      .where(
        and(
          eq(games.marketId, marketId),
          eq(games.result, 'pending')
        )
      );
    
    console.log(`Found ${pendingGames.length} pending games to process.`);
    
    if (pendingGames.length === 0) {
      console.log('No pending bets to process.');
      process.exit(0);
    }
    
    // Get game odds from database
    const gameOdds = await db.select()
      .from('game_odds')
      .where(eq('game_odds.setByAdmin', true));
    
    // Create a map for easy access to odds
    const oddsMap = {
      'satamatka_jodi': 900000, // Default 90x
      'satamatka_harf': 90000,  // Default 9x
      'satamatka_crossing': 900000, // Default 90x
      'satamatka_odd_even': 19000  // Default 1.9x
    };
    
    // Update odds map with values from the database
    for (const odds of gameOdds) {
      if (odds.gameType && odds.oddValue) {
        oddsMap[odds.gameType] = odds.oddValue;
      }
    }
    
    console.log('Using odds values:', oddsMap);
    
    // Process each pending game
    let processedCount = 0;
    let winnersCount = 0;
    
    for (const game of pendingGames) {
      console.log(`Processing game ID ${game.id}, mode: ${game.gameMode}, prediction: ${game.prediction}`);
      
      let isWinner = false;
      let payout = 0;
      const closeResult = market.closeResult;
      
      // Game mode specific win conditions
      if (game.gameMode === SatamatkaGameMode.JODI && game.prediction === closeResult) {
        // For Jodi mode, prediction must match closeResult exactly
        isWinner = true;
        payout = Math.round(game.betAmount * (oddsMap['satamatka_jodi'] / 10000));
      } 
      else if (game.gameMode === SatamatkaGameMode.HARF) {
        // For Harf, check if digit matches position
        const firstDigit = closeResult[0]; 
        const secondDigit = closeResult[1];
        
        // Handle different Harf prediction formats (A0, B1, etc.)
        let harfDigit = game.prediction;
        let isLeftDigit = false;
        let isRightDigit = false;
        
        // Handle formatted predictions like A0, A1, B0, B1
        if (game.prediction.startsWith('A')) {
          harfDigit = game.prediction.substring(1);
          isLeftDigit = true;
        } else if (game.prediction.startsWith('B')) {
          harfDigit = game.prediction.substring(1);
          isRightDigit = true;
        } else if (game.prediction.startsWith('L')) {
          harfDigit = game.prediction.substring(1);
          isLeftDigit = true;
        } else if (game.prediction.startsWith('R')) {
          harfDigit = game.prediction.substring(1);
          isRightDigit = true;
        }
        
        // Check if the prediction matches the appropriate position
        if (
          (isLeftDigit && harfDigit === firstDigit) || 
          (isRightDigit && harfDigit === secondDigit) ||
          // For single digit predictions without position indicator
          (!isLeftDigit && !isRightDigit && (game.prediction === firstDigit || game.prediction === secondDigit))
        ) {
          isWinner = true;
          payout = Math.round(game.betAmount * (oddsMap['satamatka_harf'] / 10000));
        }
      }
      else if (game.gameMode === SatamatkaGameMode.CROSSING) {
        // For Crossing, check if the prediction matches the result in any order
        // Clean and prepare prediction digits - handle different prediction formats
        let digits = [];
        if (game.prediction.includes(',')) {
          // Format: "0,1,2"
          digits = game.prediction.replace(/[^0-9,]/g, '').split(',').map(d => d.trim());
        } else {
          // Format: "012" or other formats without commas
          digits = game.prediction.replace(/[^0-9]/g, '').split('');
        }
        
        // Extract the actual crossing combinations from the digits
        // Crossing means any combination of the digits in any order
        const crossingCombinations = [];
        for (let i = 0; i < digits.length; i++) {
          for (let j = 0; j < digits.length; j++) {
            if (i !== j) {
              crossingCombinations.push(digits[i] + digits[j]);
            }
          }
        }
        
        // The crossing bet should only win if the prediction exactly matches the result
        // or the player's crossing combination includes the result
        if (game.prediction === closeResult || crossingCombinations.includes(closeResult)) {
          isWinner = true;
          payout = Math.round(game.betAmount * (oddsMap['satamatka_crossing'] / 10000));
        }
        
        console.log(`  Crossing combinations: ${crossingCombinations.join(',')}`);
        console.log(`  Result: ${closeResult}, Is winner: ${isWinner}`);
      }
      else if (game.gameMode === SatamatkaGameMode.ODD_EVEN) {
        // For Odd-Even, check if prediction matches the result's parity
        const resultNumber = parseInt(closeResult, 10);
        const isOdd = resultNumber % 2 !== 0;
        
        if ((isOdd && game.prediction === 'odd') || (!isOdd && game.prediction === 'even')) {
          isWinner = true;
          payout = Math.round(game.betAmount * (oddsMap['satamatka_odd_even'] / 10000));
        }
      }
      
      // Update the game result and payout
      const result = isWinner ? 'win' : 'loss';
      
      await db.update(games)
        .set({ 
          result,
          payout: isWinner ? payout : 0
        })
        .where(eq(games.id, game.id));
      
      console.log(`  Updated game result: ${result}, Payout: ${payout/100} rupees`);
      
      // If it's a win, update the user's balance
      if (isWinner) {
        const [user] = await db.select()
          .from(users)
          .where(eq(users.id, game.userId));
        
        if (user) {
          const newBalance = user.balance + payout;
          await db.update(users)
            .set({ balance: newBalance })
            .where(eq(users.id, user.userId));
          
          console.log(`  Updated user ${user.username} balance: ${user.balance/100} → ${newBalance/100} rupees`);
          winnersCount++;
        }
      }
      
      processedCount++;
    }
    
    console.log(`Processed ${processedCount} pending games.`);
    console.log(`Found ${winnersCount} winning bets.`);
    console.log('Done!');
  } catch (error) {
    console.error('Error processing pending bets:', error);
  }
}

processPendingBets().catch(err => console.error('Error executing script:', err));