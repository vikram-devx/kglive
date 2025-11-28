/**
 * This script fixes pending bets for a market that has already had results declared
 * Use this when you see bets in "pending" status even after the market result has been set
 */

const { Client } = require('pg');
require('dotenv').config();

async function fixPendingBets() {
  try {
    // Get the market ID from command line
    const args = process.argv.slice(2);
    if (args.length === 0) {
      console.error('Please provide a market ID');
      console.error('Usage: node fix-market-pending-bets.js <marketId>');
      process.exit(1);
    }
    
    const marketId = parseInt(args[0]);
    if (isNaN(marketId)) {
      console.error('Invalid market ID. Please provide a valid number.');
      process.exit(1);
    }
    
    console.log(`Processing pending bets for market ID ${marketId}...`);
    
    // Connect to the database
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    console.log('Connected to database');
    
    // Get the market data
    const marketResult = await client.query(
      'SELECT * FROM satamatka_markets WHERE id = $1',
      [marketId]
    );
    
    if (marketResult.rows.length === 0) {
      console.error(`Market with ID ${marketId} not found.`);
      await client.end();
      process.exit(1);
    }
    
    const market = marketResult.rows[0];
    
    if (!market.close_result) {
      console.error(`Market with ID ${marketId} does not have a close result.`);
      await client.end();
      process.exit(1);
    }
    
    console.log(`Market info: ${market.name}, Close Result: ${market.close_result}`);
    
    // Get all pending games for this market
    const pendingGamesResult = await client.query(
      'SELECT * FROM games WHERE market_id = $1 AND result = $2',
      [marketId, 'pending']
    );
    
    const pendingGames = pendingGamesResult.rows;
    console.log(`Found ${pendingGames.length} pending games to process.`);
    
    if (pendingGames.length === 0) {
      console.log('No pending bets to process.');
      await client.end();
      process.exit(0);
    }
    
    // Get game odds from database
    const gameOddsResult = await client.query(
      'SELECT * FROM game_odds WHERE set_by_admin = true'
    );
    
    // Create a map for easy access to odds
    const oddsMap = {
      'satamatka_jodi': 900000, // Default 90x
      'satamatka_harf': 90000,  // Default 9x
      'satamatka_crossing': 900000, // Default 90x
      'satamatka_odd_even': 19000  // Default 1.9x
    };
    
    // Update odds map with values from the database
    for (const odds of gameOddsResult.rows) {
      if (odds.game_type && odds.odd_value) {
        oddsMap[odds.game_type] = odds.odd_value;
      }
    }
    
    console.log('Using odds values:', oddsMap);
    
    // Process each pending game
    let processedCount = 0;
    let winnersCount = 0;
    
    for (const game of pendingGames) {
      console.log(`Processing game ID ${game.id}, mode: ${game.game_mode}, prediction: ${game.prediction}`);
      
      let isWinner = false;
      let payout = 0;
      const closeResult = market.close_result;
      
      // Game mode specific win conditions
      if (game.game_mode === 'jodi' && game.prediction === closeResult) {
        // For Jodi mode, prediction must match closeResult exactly
        isWinner = true;
        payout = Math.round(game.bet_amount * (oddsMap['satamatka_jodi'] / 10000));
      } 
      else if (game.game_mode === 'harf') {
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
          payout = Math.round(game.bet_amount * (oddsMap['satamatka_harf'] / 10000));
        }
      }
      else if (game.game_mode === 'crossing') {
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
        
        // Check if the prediction exactly matches the result
        // or the player's crossing combination includes the result
        if (game.prediction === closeResult || crossingCombinations.includes(closeResult)) {
          isWinner = true;
          payout = Math.round(game.bet_amount * (oddsMap['satamatka_crossing'] / 10000));
        }
        
        console.log(`  Crossing combinations: ${crossingCombinations.join(',')}`);
        console.log(`  Result: ${closeResult}, Is winner: ${isWinner}`);
      }
      else if (game.game_mode === 'odd_even') {
        // For Odd-Even, check if prediction matches the result's parity
        const resultNumber = parseInt(closeResult, 10);
        const isOdd = resultNumber % 2 !== 0;
        
        if ((isOdd && game.prediction === 'odd') || (!isOdd && game.prediction === 'even')) {
          isWinner = true;
          payout = Math.round(game.bet_amount * (oddsMap['satamatka_odd_even'] / 10000));
        }
      }
      
      // Update the game result and payout
      const result = isWinner ? 'win' : 'loss';
      
      await client.query(
        'UPDATE games SET result = $1, payout = $2 WHERE id = $3',
        [result, isWinner ? payout : 0, game.id]
      );
      
      console.log(`  Updated game result: ${result}, Payout: ${payout/100} rupees`);
      
      // If it's a win, update the user's balance
      if (isWinner) {
        const userResult = await client.query(
          'SELECT * FROM users WHERE id = $1',
          [game.user_id]
        );
        
        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          const newBalance = user.balance + payout;
          
          await client.query(
            'UPDATE users SET balance = $1 WHERE id = $2',
            [newBalance, user.id]
          );
          
          console.log(`  Updated user ${user.username} balance: ${user.balance/100} → ${newBalance/100} rupees`);
          winnersCount++;
        }
      }
      
      processedCount++;
    }
    
    console.log(`Processed ${processedCount} pending games.`);
    console.log(`Found ${winnersCount} winning bets.`);
    console.log('Done!');
    
    // Close the database connection
    await client.end();
  } catch (error) {
    console.error('Error processing pending bets:', error);
    process.exit(1);
  }
}

fixPendingBets().catch(err => console.error('Error executing script:', err));