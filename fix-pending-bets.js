/**
 * Simple script to fix pending bets for the current market
 */

const { Pool } = require('pg');
require('dotenv').config();

async function fixPendingBets() {
  // Connect to database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    // Get the market ID from command line or use default 5
    const marketId = process.argv[2] || 5;
    console.log(`Processing pending bets for market ID ${marketId}...`);
    
    // Get market information
    const marketResult = await pool.query(
      'SELECT * FROM satamatka_markets WHERE id = $1',
      [marketId]
    );
    
    if (marketResult.rows.length === 0) {
      console.error(`Market with ID ${marketId} not found`);
      return;
    }
    
    const market = marketResult.rows[0];
    console.log(`Market: ${market.name}, Close result: ${market.close_result}`);
    
    if (!market.close_result) {
      console.error(`Market ${marketId} does not have a close result`);
      return;
    }
    
    // Find all pending games for this market
    const pendingGames = await pool.query(
      'SELECT * FROM games WHERE market_id = $1 AND result = $2',
      [marketId, 'pending']
    );
    
    console.log(`Found ${pendingGames.rows.length} pending games`);
    
    // Process each game
    for (const game of pendingGames.rows) {
      console.log(`Processing game ${game.id}, mode: ${game.game_mode}, prediction: ${game.prediction}`);
      
      let isWinner = false;
      let payout = 0;
      
      // Get odds for this game type
      const gameTypeMap = {
        'jodi': 'satamatka_jodi',
        'harf': 'satamatka_harf',
        'crossing': 'satamatka_crossing',
        'odd_even': 'satamatka_odd_even'
      };
      
      const gameType = gameTypeMap[game.game_mode];
      if (!gameType) {
        console.log(`Unknown game mode: ${game.game_mode}`);
        continue;
      }
      
      const oddsResult = await pool.query(
        'SELECT * FROM game_odds WHERE game_type = $1 AND set_by_admin = true',
        [gameType]
      );
      
      // Default odds if not configured
      let oddValue = 0;
      switch (game.game_mode) {
        case 'jodi': oddValue = 900000; break; // 90x
        case 'harf': oddValue = 90000; break;  // 9x
        case 'crossing': oddValue = 900000; break; // 90x
        case 'odd_even': oddValue = 19000; break; // 1.9x
      }
      
      // Use configured odds if available
      if (oddsResult.rows.length > 0) {
        oddValue = oddsResult.rows[0].odd_value;
      }
      
      console.log(`Using odds: ${oddValue/10000}x`);
      
      // Check if this is a winning bet based on game mode
      if (game.game_mode === 'jodi') {
        // Jodi: exact match with close result
        isWinner = (game.prediction === market.close_result);
      }
      else if (game.game_mode === 'harf') {
        // Harf: digit matches position
        const firstDigit = market.close_result[0]; 
        const secondDigit = market.close_result[1];
        
        // Handle different prediction formats
        let harfDigit = game.prediction;
        let isLeftDigit = false;
        let isRightDigit = false;
        
        if (game.prediction.startsWith('A') || game.prediction.startsWith('L')) {
          harfDigit = game.prediction.substring(1);
          isLeftDigit = true;
        } else if (game.prediction.startsWith('B') || game.prediction.startsWith('R')) {
          harfDigit = game.prediction.substring(1);
          isRightDigit = true;
        }
        
        if ((isLeftDigit && harfDigit === firstDigit) || 
            (isRightDigit && harfDigit === secondDigit) ||
            (!isLeftDigit && !isRightDigit && (game.prediction === firstDigit || game.prediction === secondDigit))) {
          isWinner = true;
        }
      }
      else if (game.game_mode === 'crossing') {
        // For crossing, we check if the prediction EXACTLY matches the result
        // This is what the client wants - only exact matches win
        isWinner = (game.prediction === market.close_result);
        
        // If not exact match, generate crossing combinations and check
        if (!isWinner) {
          // Parse digits from prediction
          let digits = [];
          if (game.prediction.includes(',')) {
            // Format: "0,1,2"
            digits = game.prediction.replace(/[^0-9,]/g, '').split(',').map(d => d.trim());
          } else {
            // Format: "012" or other formats without commas
            digits = game.prediction.replace(/[^0-9]/g, '').split('');
          }
          
          // Generate crossing combinations
          const combinations = [];
          for (let i = 0; i < digits.length; i++) {
            for (let j = 0; j < digits.length; j++) {
              if (i !== j) {
                combinations.push(digits[i] + digits[j]);
              }
            }
          }
          
          console.log(`  Crossing combinations: ${combinations.join(',')}`);
          
          // Check if the result is in the combinations - MUST MATCH EXACTLY
          isWinner = combinations.includes(market.close_result);
        }
      }
      else if (game.game_mode === 'odd_even') {
        // For Odd-Even, check if prediction matches result's parity
        const resultNum = parseInt(market.close_result, 10);
        const isOdd = resultNum % 2 !== 0;
        
        if ((isOdd && game.prediction === 'odd') || (!isOdd && game.prediction === 'even')) {
          isWinner = true;
        }
      }
      
      // Calculate payout for winners
      if (isWinner) {
        payout = Math.round(game.bet_amount * (oddValue / 10000));
      }
      
      // Update game status
      const gameStatus = isWinner ? 'win' : 'loss';
      await pool.query(
        'UPDATE games SET result = $1, payout = $2 WHERE id = $3',
        [gameStatus, payout, game.id]
      );
      
      console.log(`  Updated game ${game.id} to ${gameStatus}, payout: ${payout/100} rupees`);
      
      // If winner, update user balance
      if (isWinner) {
        const userResult = await pool.query(
          'SELECT * FROM users WHERE id = $1',
          [game.user_id]
        );
        
        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          const newBalance = user.balance + payout;
          
          await pool.query(
            'UPDATE users SET balance = $1 WHERE id = $2',
            [newBalance, user.id]
          );
          
          console.log(`  Updated user ${user.username} balance: ${user.balance/100} → ${newBalance/100} rupees`);
        }
      }
    }
    
    console.log('Finished processing pending bets!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

fixPendingBets();