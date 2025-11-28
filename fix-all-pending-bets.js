/**
 * This script fixes all pending bets in the system by reprocessing them
 * with the correct win/loss calculation logic for all game modes.
 */

import pg from 'pg';
const { Client } = pg;

async function fixAllPendingBets() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get all markets that have results declared but still have pending bets
    const marketsResult = await client.query(`
      SELECT DISTINCT m.id, m.name, m.close_result, m.open_result 
      FROM satamatka_markets m
      INNER JOIN games g ON m.id = g.market_id
      WHERE m.close_result IS NOT NULL 
      AND g.result = 'pending'
      AND g.game_type = 'satamatka'
    `);

    const markets = marketsResult.rows;
    console.log(`Found ${markets.length} markets with pending bets to process`);

    if (markets.length === 0) {
      console.log('No pending bets found to process.');
      await client.end();
      return;
    }

    // Get game odds from database
    const gameOddsResult = await client.query(
      'SELECT * FROM game_odds WHERE set_by_admin = true'
    );

    // Create a map for easy access to odds
    const oddsMap = {
      'satamatka_jodi': 900000,     // Default 90x
      'satamatka_harf': 90000,      // Default 9x 
      'satamatka_crossing': 900000, // Default 90x
      'satamatka_odd_even': 19000   // Default 1.9x
    };

    // Update odds map with values from the database
    for (const odds of gameOddsResult.rows) {
      if (odds.game_type && odds.odd_value) {
        oddsMap[odds.game_type] = odds.odd_value;
      }
    }

    console.log('Using odds values:', oddsMap);

    let totalProcessed = 0;
    let totalWinners = 0;

    // Process each market
    for (const market of markets) {
      console.log(`\nProcessing market: ${market.name} (ID: ${market.id})`);
      console.log(`Market result: ${market.close_result}`);

      // Get all pending games for this market
      const gamesResult = await client.query(`
        SELECT * FROM games 
        WHERE market_id = $1 AND result = 'pending' AND game_type = 'satamatka'
      `, [market.id]);

      const pendingGames = gamesResult.rows;
      console.log(`Found ${pendingGames.length} pending bets for this market`);

      for (const game of pendingGames) {
        console.log(`\nProcessing game ID ${game.id}:`);
        console.log(`  Mode: ${game.game_mode}`);
        console.log(`  Prediction: ${game.prediction}`);
        console.log(`  Bet Amount: ${game.bet_amount / 100} rupees`);

        let isWinner = false;
        let payout = 0;
        const closeResult = market.close_result;

        // Game mode specific win conditions
        if (game.game_mode === 'jodi') {
          // Jodi: exact match with close result
          isWinner = (game.prediction === closeResult);
          if (isWinner) {
            payout = game.bet_amount * (oddsMap['satamatka_jodi'] / 10000);
          }
        }
        else if (game.game_mode === 'harf') {
          // Harf: digit matches position
          const firstDigit = closeResult[0]; 
          const secondDigit = closeResult[1];
          
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
            payout = game.bet_amount * (oddsMap['satamatka_harf'] / 10000);
          }
        }
        else if (game.game_mode === 'crossing') {
          // For Crossing, check combinations
          let digits = [];
          if (game.prediction.includes(',')) {
            // Format: "0,1,2"
            digits = game.prediction.replace(/[^0-9,]/g, '').split(',').map(d => d.trim());
          } else {
            // Format: "012" or other formats without commas
            digits = game.prediction.replace(/[^0-9]/g, '').split('');
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
          
          // Check if the prediction exactly matches the result
          if (game.prediction === closeResult) {
            isWinner = true;
          } 
          // Check if the prediction is a comma-separated list and result is in combinations
          else if (game.prediction.includes(',') && crossingCombinations.includes(closeResult)) {
            isWinner = true;
          }
          
          if (isWinner) {
            payout = game.bet_amount * (oddsMap['satamatka_crossing'] / 10000);
          }
          
          console.log(`  Crossing analysis:`);
          console.log(`    Digits: ${JSON.stringify(digits)}`);
          console.log(`    Combinations: ${JSON.stringify(crossingCombinations)}`);
          console.log(`    Result matches: ${isWinner}`);
        }
        else if (game.game_mode === 'odd_even') {
          // For Odd-Even, check if prediction matches the result's parity
          const resultNumber = parseInt(closeResult, 10);
          const isResultOdd = resultNumber % 2 !== 0;
          
          if ((game.prediction === "odd" && isResultOdd) || 
              (game.prediction === "even" && !isResultOdd)) {
            isWinner = true;
            payout = game.bet_amount * (oddsMap['satamatka_odd_even'] / 10000);
          }
        }

        const result = isWinner ? "win" : "loss";
        console.log(`  Result: ${result}`);
        
        if (isWinner) {
          console.log(`  Payout: ${payout / 100} rupees`);
          totalWinners++;
        }

        // Update game result in database
        await client.query(
          'UPDATE games SET result = $1, payout = $2 WHERE id = $3',
          [result, payout, game.id]
        );

        // Update user balance if they won
        if (isWinner) {
          await client.query(
            'UPDATE users SET balance = balance + $1 WHERE id = $2',
            [payout, game.user_id]
          );
          
          // Update the balanceAfter field for the game
          const userBalanceResult = await client.query(
            'SELECT balance FROM users WHERE id = $1',
            [game.user_id]
          );
          
          if (userBalanceResult.rows.length > 0) {
            const newBalance = userBalanceResult.rows[0].balance;
            await client.query(
              'UPDATE games SET balance_after = $1 WHERE id = $2',
              [newBalance, game.id]
            );
          }
        }

        totalProcessed++;
      }
    }

    console.log(`\n✅ Processing complete!`);
    console.log(`Total bets processed: ${totalProcessed}`);
    console.log(`Total winners: ${totalWinners}`);
    console.log(`Total losers: ${totalProcessed - totalWinners}`);

  } catch (error) {
    console.error('Error processing pending bets:', error);
  } finally {
    await client.end();
  }
}

fixAllPendingBets();