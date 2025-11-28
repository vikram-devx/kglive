/**
 * Utility functions for formatting values consistently across the application
 */

/**
 * Game types that store amounts in paisa (1 rupee = 100 paisa)
 */
export const PAISA_BASED_GAMES = ['coin_flip', 'team_match', 'cricket_toss', 'satamatka'];

/**
 * Threshold for amount to be considered in paisa
 * (amounts 10000+ are likely in paisa)
 */
export const PAISA_THRESHOLD = 10000;

/**
 * Format a currency amount consistently based on game type
 * 
 * @param amount - The amount to format
 * @param gameType - The type of game (used to determine if amount is in paisa)
 * @param includeSymbol - Whether to include the ₹ symbol
 * @param gameMode - Optional game mode for special cases like odd_even
 * @returns Formatted amount string
 */
export function formatCurrency(
  amount: number, 
  gameType?: string, 
  includeSymbol = true, 
  gameMode?: string
): string {
  if (!amount && amount !== 0) return includeSymbol ? '₹0.00' : '0.00';
  
  // Determine if we need to convert from paisa to rupees
  let convertedAmount = amount;
  
  // For safety, always convert large numbers (likely stored in paisa)
  // This is the root cause of the ₹1,020,000.00 vs ₹10,200.00 issue
  if (amount >= 1000) {
    convertedAmount = amount / 100;
  }
  // Always convert for known paisa-based games regardless of amount size
  else if (gameType && PAISA_BASED_GAMES.includes(gameType)) {
    // All satamatka game modes (jodi, harf, crossing, odd_even) need to display in rupees
    // Potential win amounts need to show in rupees (e.g., ₹900 for jodi) instead of paisa
    convertedAmount = amount / 100;
  } 
  // If no game type but amount looks like paisa (for backward compatibility)
  else if (!gameType && amount >= PAISA_THRESHOLD) {
    convertedAmount = amount / 100;
  }
  
  // Format with 2 decimal places and add symbol if requested
  const formattedAmount = convertedAmount.toFixed(2);
  return includeSymbol ? `₹${formattedAmount}` : formattedAmount;
}

/**
 * Calculate and format profit/loss amount
 * 
 * @param betAmount - Original bet amount
 * @param payout - Payout amount (0 if loss)
 * @param gameType - Type of game
 * @param result - Game result (optional)
 * @returns Formatted profit/loss string with sign
 */
export function formatProfitLoss(
  betAmount: number, 
  payout: number, 
  gameType?: string, 
  result?: string | null
): string {
  const isPaisaBased = gameType && PAISA_BASED_GAMES.includes(gameType);
  
  // Convert to rupees if needed
  let normalizedBet = betAmount;
  let normalizedPayout = payout;
  
  // Always convert for paisa-based games
  if (isPaisaBased) {
    normalizedBet = betAmount / 100;
    normalizedPayout = payout / 100;
  }
  // For backward compatibility with non-typed amounts
  else if (!gameType && betAmount >= PAISA_THRESHOLD) {
    normalizedBet = betAmount / 100;
    normalizedPayout = payout / 100;
  }
  
  // Different calculation based on game state
  let profitLoss: number;
  
  // If the result is not set (pending game), show as "potential win/loss"
  if (!result || result === 'pending') {
    // For pending games, show the potential win amount (this will be positive)
    profitLoss = normalizedPayout - normalizedBet;
  } else {
    // For games with a result, calculate actual win/loss
    if (gameType === 'cricket_toss') {
      // For cricket toss games with a result declared
      if (result === 'team_a' || result === 'team_b') {
        if (normalizedPayout > 0) {
          // Player won - show the FULL payout amount as profit (not just profit)
          // This matches what admin declared and what user expects
          profitLoss = normalizedPayout;
        } else {
          // Player lost - show negative bet amount as the loss
          profitLoss = -normalizedBet;
        }
      } else {
        // If result is invalid or unexpected, fall back to default calculation
        profitLoss = normalizedPayout > 0 ? normalizedPayout : -normalizedBet;
      }
    } else {
      // For other game types, use the standard calculation
      // If payout is 0, the player lost - show negative bet amount
      if (normalizedPayout <= 0) {
        profitLoss = -normalizedBet;
      } else {
        // Player won - show the full payout amount (including original bet)
        profitLoss = normalizedPayout;
      }
    }
  }
  
  // Format with sign and 2 decimal places
  // No additional division needed as we already converted from paisa to rupees above
  // Removing this condition as it's causing 800 rupees to display as 15.60 instead of 1560
  
  return `${profitLoss > 0 ? '+' : ''}₹${Math.abs(profitLoss).toFixed(2)}`;
}

/**
 * Format bet amount for display in forms
 * @param amount - Current amount (might be in paisa)
 * @param gameType - Game type
 * @returns Amount ready for display in input field
 */
export function formatBetAmountForInput(amount: number, gameType?: string): string {
  if (!amount) return '';
  
  const isPaisaBased = gameType && PAISA_BASED_GAMES.includes(gameType);
  
  // Always convert for paisa-based games
  if (isPaisaBased) {
    return (amount / 100).toString();
  }
  // For backward compatibility
  else if (!gameType && amount >= PAISA_THRESHOLD) {
    return (amount / 100).toString();
  }
  
  return amount.toString();
}

/**
 * Parse user input to internal amount format
 * @param value - User input value
 * @param gameType - Game type
 * @returns Amount in the correct format for storage
 */
export function parseInputAmount(value: string, gameType?: string): number {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return 0;
  
  const isPaisaBased = gameType && PAISA_BASED_GAMES.includes(gameType);
  
  // For paisa-based games, multiply by 100 to convert to paisa
  if (isPaisaBased) {
    return parsed * 100;
  }
  
  return parsed;
}