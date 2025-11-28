import { db } from "./db";
import { games } from "@shared/schema";
import { eq, and, count, desc } from "drizzle-orm";

// Default probability values
export const DEFAULT_NEW_USER_WIN_RATE = 0.60; // 60% win rate for new users
export const DEFAULT_STANDARD_WIN_RATE = 0.50; // 50% standard win rate
export const DEFAULT_HOUSE_EDGE_WIN_RATE = 0.40; // 40% win rate (60% house win)
export const DEFAULT_LOSS_RECOVERY_WIN_RATE = 0.55; // 55% win rate for loss recovery

// Track session stats per user
const userSessions: Record<number, {
  gamesPlayed: number;
  gamesWon: number;
  consecutiveLosses: number;
  lastGameTime: Date;
}> = {};

// Reset session if more than 30 minutes have passed
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Calculate the probability of a user winning the current coin flip
 * based on various factors including user history, experience level, etc.
 */
export async function calculateWinProbability(userId: number): Promise<number> {
  try {
    // Check if user session exists and is still valid
    const now = new Date();
    const userSession = userSessions[userId];
    
    if (!userSession || (now.getTime() - userSession.lastGameTime.getTime() > SESSION_TIMEOUT_MS)) {
      // Create or reset session
      userSessions[userId] = {
        gamesPlayed: 0,
        gamesWon: 0,
        consecutiveLosses: 0,
        lastGameTime: now
      };
    }
    
    // Update session timestamp
    userSessions[userId].lastGameTime = now;
    
    // Get user's game history
    const coinFlipGames = await db.query.games.findMany({
      where: and(
        eq(games.userId, userId),
        eq(games.gameType, 'coin_flip')
      ),
      orderBy: [desc(games.createdAt)]
    });
    
    // Check if this is a new user (less than 5 games played)
    if (coinFlipGames.length < 5) {
      return DEFAULT_NEW_USER_WIN_RATE; // New users get higher win rate
    }
    
    // Check for consecutive losses (loss recovery mechanic)
    const recentGames = coinFlipGames.slice(0, 5); // Last 5 games
    let consecutiveLosses = 0;
    
    for (const game of recentGames) {
      if (game.payout > 0) break; // Win breaks the streak
      consecutiveLosses++;
    }
    
    // Activate loss recovery if user has lost 3 or more consecutive games
    if (consecutiveLosses >= 3) {
      return DEFAULT_LOSS_RECOVERY_WIN_RATE;
    }
    
    // Check session win rate caps
    const currentSession = userSessions[userId];
    if (currentSession.gamesPlayed >= 10) {
      const currentWinRate = currentSession.gamesWon / currentSession.gamesPlayed;
      
      // If user has won too much in this session, reduce win chance
      if (currentWinRate > 0.4) {
        return DEFAULT_HOUSE_EDGE_WIN_RATE;
      }
      
      // If user has lost too much in this session, increase win chance slightly
      if (currentWinRate < 0.3) {
        return DEFAULT_LOSS_RECOVERY_WIN_RATE;
      }
    }
    
    // Calculate lifetime games played (experience level)
    const totalGames = coinFlipGames.length;
    
    // As user plays more games, gradually shift from neutral to house edge
    if (totalGames > 20) {
      // Experienced player (more than 20 games): house has slight edge
      return DEFAULT_HOUSE_EDGE_WIN_RATE;
    }
    
    // Standard probability for regular players
    return DEFAULT_STANDARD_WIN_RATE;
  } catch (error) {
    console.error("Error calculating win probability:", error);
    // Fall back to default win rate in case of errors
    return DEFAULT_STANDARD_WIN_RATE;
  }
}

/**
 * Update the user's session statistics after a game
 */
export function updateUserSessionStats(userId: number, isWin: boolean): void {
  // Ensure session exists
  if (!userSessions[userId]) {
    userSessions[userId] = {
      gamesPlayed: 0,
      gamesWon: 0,
      consecutiveLosses: 0,
      lastGameTime: new Date()
    };
  }
  
  // Update session stats
  userSessions[userId].gamesPlayed++;
  
  if (isWin) {
    userSessions[userId].gamesWon++;
    userSessions[userId].consecutiveLosses = 0;
  } else {
    userSessions[userId].consecutiveLosses++;
  }
}