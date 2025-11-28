import express, { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { GameType, TeamMatchResult, games } from '@shared/schema';
import { z } from 'zod';
import { db, pool } from './db';
import { eq } from 'drizzle-orm';

// Schema for creating a cricket toss game
const createCricketTossSchema = z.object({
  teamA: z.string().min(2, "Team A name must be at least 2 characters"),
  teamB: z.string().min(2, "Team B name must be at least 2 characters"),
  description: z.string().optional(),
  tossTime: z.string(),
  imageUrl: z.string().optional(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
});

export function setupCricketTossRoutes(app: express.Express) {
  // Change cricket toss game status (open/close)
  app.patch("/api/cricket-toss-games/:id/status", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== "admin") {
        return res.status(403).json({ message: "Only admin can change game status" });
      }

      const gameId = Number(req.params.id);
      const { status } = req.body;

      if (!status || !["open", "closed"].includes(status)) {
        return res.status(400).json({ message: "Status must be 'open' or 'closed'" });
      }

      // Get the existing game
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.gameType !== GameType.CRICKET_TOSS) {
        return res.status(400).json({ message: "Game is not a cricket toss game" });
      }

      // Update the game data with new status
      const gameData = typeof game.gameData === 'object' && game.gameData !== null 
        ? { ...game.gameData as any } 
        : {};

      gameData.status = status;

      // Update the game data
      try {
        const result = await pool.query(
          `UPDATE games SET game_data = $1 WHERE id = $2 RETURNING *`,
          [JSON.stringify(gameData), gameId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ message: "Failed to update game status" });
        }

        // Return the updated game
        const updatedGame = await storage.getGame(gameId);
        res.json(updatedGame);
      } catch (error) {
        console.error("Error updating game status:", error);
        return res.status(500).json({ 
          message: "Failed to update game status", 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    } catch (err) {
      next(err);
    }
  });
  // Get all cricket toss games
  app.get("/api/cricket-toss-games", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const allGames = await storage.getAllGames();
      const cricketTossGames = allGames.filter(game => 
        game.gameType === GameType.CRICKET_TOSS && 
        game.userId === 1 && // Admin-created games
        (!game.matchId) // No match ID means it's a standalone cricket toss game
      );
      
      res.json(cricketTossGames);
    } catch (err) {
      next(err);
    }
  });
  
  // Update cricket toss game result (admin only)
  app.patch("/api/cricket-toss-games/:id/result", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== "admin") {
        return res.status(403).json({ message: "Only admin can declare results" });
      }
      
      const gameId = Number(req.params.id);
      const { result } = req.body;
      
      if (!result || !["team_a", "team_b"].includes(result)) {
        return res.status(400).json({ message: "Invalid result value" });
      }
      
      const game = await storage.getGame(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      if (game.gameType !== GameType.CRICKET_TOSS) {
        return res.status(400).json({ message: "Game is not a cricket toss game" });
      }
      
      // Process the result and handle user balance updates
      try {
        // Get the user who placed the bet
        const user = await storage.getUser(game.userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Calculate payout based on result
        let payout = 0;
        if (game.prediction === result) {
          // If prediction matches, calculate payout based on the odds in gameData
          // Include the bet amount in the payout (total return, not just profit)
          const gameData = game.gameData as any;
          const odds = result === 'team_a' ? gameData.oddTeamA : gameData.oddTeamB;
          // Calculate total payout including original bet amount 
          const winAmount = Math.floor(game.betAmount * (odds / 100));
          payout = winAmount + game.betAmount;
        }
        
        // Update user balance with the payout
        const updatedBalance = user.balance + payout;
        await storage.updateUserBalance(user.id, updatedBalance);
        
        // Update the game with result, balanceAfter
        const updateResult = await db.update(games)
          .set({
            result,
            payout,
            balanceAfter: updatedBalance, // Track the balance after this result is applied
          })
          .where(eq(games.id, gameId))
          .returning();
        
        if (updateResult.length === 0) {
          return res.status(404).json({ message: "Game not found or could not be updated" });
        }
        
        // Get the updated game to return to the client
        const updatedGame = await storage.getGame(gameId);
        
        if (!updatedGame) {
          return res.status(404).json({ message: "Failed to retrieve updated game" });
        }
        
        // Return the updated game
        res.json(updatedGame);
      } catch (error) {
        console.error("Error updating game result:", error);
        return res.status(500).json({ 
          message: "Failed to update game result", 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    } catch (err) {
      next(err);
    }
  });
  
  // Update cricket toss game details (admin only)
  app.patch("/api/cricket-toss-games/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== "admin") {
        return res.status(403).json({ message: "Only admin can edit cricket toss games" });
      }
      
      const gameId = Number(req.params.id);
      const validationResult = createCricketTossSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid data", 
          details: validationResult.error.format() 
        });
      }
      
      // Get the existing game
      const existingGame = await storage.getGame(gameId);
      
      if (!existingGame) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      if (existingGame.gameType !== GameType.CRICKET_TOSS) {
        return res.status(400).json({ message: "Game is not a cricket toss game" });
      }
      
      const { teamA, teamB, description, tossTime, imageUrl, openTime, closeTime } = validationResult.data;
      
      // Get odds from database settings
      let odds = await storage.getGameOdds(GameType.CRICKET_TOSS);
      
      // If no odds found, use existing values or default
      let oddTeamA = 190; // Default 1.9x odd (stored as 190)
      let oddTeamB = 190; // Default 1.9x odd (stored as 190)
      
      if (odds && odds.length > 0) {
        // Use the first odds setting (admin setting should be prioritized in the getGameOdds function)
        const oddSetting = odds[0];
        oddTeamA = oddSetting.oddValue;
        oddTeamB = oddSetting.oddValue;
      } else if (existingGame.gameData && (existingGame.gameData as any).oddTeamA) {
        // Preserve existing odds if available
        oddTeamA = (existingGame.gameData as any).oddTeamA;
        oddTeamB = (existingGame.gameData as any).oddTeamB;
      }
      
      // Update only the game data field, creating a new object
      const existingGameData = typeof existingGame.gameData === 'object' && existingGame.gameData !== null 
        ? existingGame.gameData as Record<string, any>
        : {};
        
      const updatedGameData = {
        ...existingGameData,
        teamA,
        teamB,
        description: description || "",
        tossTime,
        oddTeamA,
        oddTeamB,
        imageUrl: imageUrl || "",
        openTime: openTime || tossTime, // Use provided openTime or default to toss time
        closeTime: closeTime || tossTime, // Use provided closeTime or default to toss time
      };
      
      // Create a simpler method for updating the game data
      try {
        // Use the Node PostgreSQL client directly
        const result = await pool.query(
          `UPDATE games SET game_data = $1 WHERE id = $2 RETURNING *`,
          [JSON.stringify(updatedGameData), gameId]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ message: "Failed to update game" });
        }
        
        // Return the updated game
        const updatedGame = await storage.getGame(gameId);
        res.json(updatedGame);
      } catch (error) {
        console.error("Error updating game:", error);
        return res.status(500).json({ 
          message: "Failed to update game data", 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    } catch (err) {
      next(err);
    }
  });

  // Get active cricket toss games
  app.get("/api/cricket-toss-games/active", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const allGames = await storage.getAllGames();
      const activeGames = allGames.filter(game => 
        game.gameType === GameType.CRICKET_TOSS && 
        game.userId === 1 && // Admin-created games
        (!game.matchId) && // No match ID means it's a standalone cricket toss game
        (game.gameData as any)?.status === 'open'
      );
      
      res.json(activeGames);
    } catch (err) {
      next(err);
    }
  });

  // Admin create cricket toss game
  app.post("/api/cricket-toss-games", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admin can create cricket toss games" });
      }

      const validationResult = createCricketTossSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid data", 
          details: validationResult.error.format() 
        });
      }
      
      const { teamA, teamB, description, tossTime, imageUrl, openTime, closeTime } = validationResult.data;
      
      // Get odds from database settings
      let odds = await storage.getGameOdds(GameType.CRICKET_TOSS);
      
      // If no odds found, use default values
      let oddTeamA = 190; // Default 1.9x odd (stored as 190)
      let oddTeamB = 190; // Default 1.9x odd (stored as 190)
      
      if (odds && odds.length > 0) {
        // Use the first odds setting (admin setting should be prioritized in the getGameOdds function)
        const oddSetting = odds[0];
        oddTeamA = oddSetting.oddValue;
        oddTeamB = oddSetting.oddValue;
      }
      
      // Create a standalone cricket toss game (not linked to team matches)
      const newGame = {
        userId: req.user.id, // Admin user
        gameType: GameType.CRICKET_TOSS,
        betAmount: 0, // This is a game template, not an actual bet
        prediction: "pending", // Required by schema, using "pending" as placeholder
        gameData: {
          teamA,
          teamB,
          description: description || "",
          tossTime,
          oddTeamA,   // Use odds value from settings
          oddTeamB,   // Use odds value from settings
          imageUrl: imageUrl || "",
          openTime: openTime || tossTime, // If no specific open time, use toss time
          closeTime: closeTime || tossTime, // If no specific close time, use toss time
          status: "open" // Game is open for betting
        },
        result: "pending",
        payout: 0
      };
      
      const createdGame = await storage.createGame(newGame);
      res.status(201).json(createdGame);
    } catch (err) {
      next(err);
    }
  });

  // Place a bet on a cricket toss game
  app.post("/api/cricket-toss-games/:id/play", async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (req.user!.isBlocked) {
        return res.status(403).json({ message: "Your account is blocked" });
      }

      const gameId = Number(req.params.id);
      
      // Validate the request body
      const playSchema = z.object({
        betAmount: z.number().min(10, "Minimum bet amount is 10"),
        betOn: z.enum([TeamMatchResult.TEAM_A, TeamMatchResult.TEAM_B], {
          errorMap: () => ({ message: "Bet must be on either team_a or team_b" })
        })
      });
      
      // Handle potential parsing errors (client may send string instead of number)
      const parsedBody = {
        ...req.body,
        betAmount: typeof req.body.betAmount === 'string' 
          ? parseInt(req.body.betAmount, 10)
          : req.body.betAmount
      };
      
      const validationResult = playSchema.safeParse(parsedBody);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid bet amount or prediction" 
        });
      }
      
      const { betAmount, betOn } = validationResult.data;
      
      // Get the cricket toss game directly
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Cricket Toss game not found" });
      }
      
      if (game.gameType !== GameType.CRICKET_TOSS) {
        return res.status(400).json({ message: "Game is not a Cricket Toss game" });
      }
      
      if ((game.gameData as any)?.status !== 'open') {
        return res.status(400).json({ message: "Game is not open for betting" });
      }
      
      // Check if user has sufficient balance
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.balance < betAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Deduct the bet amount from user's balance
      await storage.updateUserBalance(user.id, user.balance - betAmount);
      
      // Calculate potential payout based on odds from the game data
      const gameData = game.gameData as any;
      const odds = betOn === TeamMatchResult.TEAM_A ? gameData.oddTeamA : gameData.oddTeamB;
      // Calculate potential winnings based on odds and include original bet amount
      const winAmount = Math.floor((betAmount * odds) / 100);
      const potentialPayout = winAmount + betAmount;
      
      // Create a new game entry for this user's bet
      const newBalance = user.balance - betAmount;
      const userBet = {
        userId: user.id,
        gameType: GameType.CRICKET_TOSS,
        betAmount,
        prediction: betOn, // Use betOn as prediction to match the schema
        gameData: {
          teamA: gameData.teamA,
          teamB: gameData.teamB,
          tossGameId: game.id, // Link to the original cricket toss game
          oddTeamA: gameData.oddTeamA,
          oddTeamB: gameData.oddTeamB,
          description: gameData.description,
          tossTime: gameData.tossTime,
          openTime: gameData.openTime,
          closeTime: gameData.closeTime,
          status: 'pending'
        },
        result: "pending", // Use pending instead of null
        payout: potentialPayout,
        balanceAfter: newBalance // Track the balance after this bet
      };
      
      const createdBet = await storage.createGame(userBet);
      
      res.status(201).json({
        message: "Bet placed successfully",
        bet: createdBet,
        user: {
          ...user,
          balance: newBalance,
          password: undefined,
        }
      });
    } catch (error) {
      next(error);
    }
  });
}