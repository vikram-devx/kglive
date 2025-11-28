import express from "express";
import { db } from "./db";
import { z } from "zod";
import { 
  GameType, 
  TeamMatchResult, 
  users, 
  games, 
  teamMatches,
  type TeamMatch
} from "../shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireRole } from "./auth";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Setup multer for image uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
const cricketTossUploadsDir = path.join(uploadsDir, 'cricket-toss');

// Ensure uploads directory exists
if (!fs.existsSync(cricketTossUploadsDir)) {
  fs.mkdirSync(cricketTossUploadsDir, { recursive: true });
}

// Configure storage for cricket toss team images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, cricketTossUploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `cricket-toss-${uniqueSuffix}${ext}`);
  }
});

// File filter to accept only images
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: fileFilter
});

// Schema for creating a cricket toss match
const createCricketTossMatchSchema = z.object({
  teamA: z.string().min(1, "Team A name is required"),
  teamB: z.string().min(1, "Team B name is required"),
  description: z.string().optional(),
  matchTime: z.string().transform(val => new Date(val)),
  oddTeamA: z.number().min(100, "Odds must be at least 1.00"),
  oddTeamB: z.number().min(100, "Odds must be at least 1.00"),
  coverImage: z.string().optional(),
});

// Schema for placing a bet
const placeBetSchema = z.object({
  matchId: z.number(),
  betAmount: z.number().positive("Bet amount must be positive"),
  prediction: z.enum(["team_a", "team_b"], { 
    errorMap: () => ({ message: "Prediction must be either team_a or team_b" })
  }),
});

// Schema for declaring a result
const declareResultSchema = z.object({
  result: z.enum(["team_a", "team_b"], { 
    errorMap: () => ({ message: "Result must be either team_a or team_b" }) 
  }),
});

// Get all cricket toss matches
router.get("/matches", requireRole(["admin", "subadmin"]), async (req, res) => {
  try {
    const matches = await db.select()
      .from(teamMatches)
      .where(eq(teamMatches.category, "cricket_toss"))
      .orderBy(desc(teamMatches.id));
    
    res.json(matches);
  } catch (error) {
    console.error("Error fetching cricket toss matches:", error);
    res.status(500).json({ message: "Failed to fetch cricket toss matches" });
  }
});

// Get all open cricket toss matches (for players)
router.get("/open-matches", async (req, res) => {
  try {
    const now = new Date();
    const matches = await db.select()
      .from(teamMatches)
      .where(
        and(
          eq(teamMatches.category, "cricket_toss"),
          eq(teamMatches.status, "open")
        )
      )
      .orderBy(desc(teamMatches.matchTime));
    
    res.json(matches);
  } catch (error) {
    console.error("Error fetching open cricket toss matches:", error);
    res.status(500).json({ message: "Failed to fetch open cricket toss matches" });
  }
});

// Get cricket match betting statistics
router.get("/match-stats", requireRole(["admin", "subadmin"]), async (req, res) => {
  try {
    const matches = await db.select()
      .from(teamMatches)
      .where(eq(teamMatches.category, "cricket_toss"))
      .orderBy(desc(teamMatches.id));

    const stats = [];

    for (const match of matches) {
      // Get all bets for this match
      const bets = await db.select()
        .from(games)
        .where(
          and(
            eq(games.gameType, "cricket"),
            eq(games.matchId, match.id),
            eq(games.status, "pending")
          )
        );
      
      // Calculate stats for each team
      const teamABets = bets.filter((bet: any) => bet.betData?.prediction === 'team_a');
      const teamBBets = bets.filter((bet: any) => bet.betData?.prediction === 'team_b');
      
      const teamAStats = {
        totalBets: teamABets.length,
        potentialWin: teamABets.reduce((sum: number, bet: any) => sum + (bet.payout || 0), 0)
      };
      
      const teamBStats = {
        totalBets: teamBBets.length,
        potentialWin: teamBBets.reduce((sum: number, bet: any) => sum + (bet.payout || 0), 0)
      };

      stats.push({
        matchId: match.id,
        teamA: teamAStats,
        teamB: teamBStats
      });
    }

    res.json(stats);
  } catch (error) {
    console.error("Error fetching cricket match stats:", error);
    res.status(500).json({ message: "Failed to fetch cricket match stats" });
  }
});

// Update an existing cricket toss match
router.put("/matches/:id", requireRole(["admin", "subadmin"]), upload.single('coverImage'), async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    if (isNaN(matchId)) {
      return res.status(400).json({ message: "Invalid match ID" });
    }

    // Check if the match exists and is not resulted
    const existingMatch = await db.select()
      .from(teamMatches)
      .where(
        and(
          eq(teamMatches.id, matchId),
          eq(teamMatches.category, "cricket_toss")
        )
      )
      .limit(1);

    if (existingMatch.length === 0) {
      return res.status(404).json({ message: "Cricket toss match not found" });
    }

    // Check if match is resulted (cannot edit resulted matches)
    if (existingMatch[0].status === "resulted") {
      return res.status(400).json({ message: "Cannot edit a match that has already been resulted" });
    }

    // Handle form-data
    const teamA = req.body.teamA;
    const teamB = req.body.teamB;
    const description = req.body.description;
    const matchTime = req.body.matchTime;
    
    // Process cover image if it was uploaded
    let coverImage: string | undefined = existingMatch[0].coverImage;
    
    if (req.file) {
      coverImage = `/uploads/cricket-toss/${req.file.filename}`;
    }
    
    // Validate the data
    if (!teamA || !teamB || !matchTime) {
      return res.status(400).json({ message: "Missing required fields: teamA, teamB, or matchTime" });
    }
    
    // Parse the datetime string as local time without timezone conversion
    const [datePart, timePart] = matchTime.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    
    // Create date in local timezone without UTC conversion
    const localMatchTime = new Date(year, month - 1, day, hour, minute);
    
    // Update object
    const updateData = {
      teamA,
      teamB,
      description,
      matchTime: localMatchTime,
      coverImage,
    };

    const updatedMatch = await db.update(teamMatches)
      .set(updateData)
      .where(eq(teamMatches.id, matchId))
      .returning();
    
    res.json(updatedMatch[0]);
  } catch (error) {
    console.error("Error updating cricket toss match:", error);
    res.status(500).json({ message: "Failed to update cricket toss match" });
  }
});

// Create a new cricket toss match
router.post("/matches", requireRole(["admin", "subadmin"]), upload.single('coverImage'), async (req, res) => {
  try {
    // Handle form-data
    const teamA = req.body.teamA;
    const teamB = req.body.teamB;
    const description = req.body.description;
    const matchTime = req.body.matchTime;
    // Use fixed odds of 2.00 for both teams
    const oddTeamA = 200;
    const oddTeamB = 200;
    
    // Process cover image if it was uploaded
    let coverImage: string | undefined;
    
    if (req.file) {
      coverImage = `/uploads/cricket-toss/${req.file.filename}`;
    }
    
    // Validate the data
    if (!teamA || !teamB || !matchTime) {
      return res.status(400).json({ message: "Missing required fields: teamA, teamB, or matchTime" });
    }
    
    // Create object for insertion
    // Parse the datetime string as local time without timezone conversion
    const [datePart, timePart] = matchTime.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    
    // Create date in local timezone without UTC conversion
    const localMatchTime = new Date(year, month - 1, day, hour, minute);
    
    const matchData = {
      teamA,
      teamB,
      description,
      matchTime: localMatchTime,
      oddTeamA,
      oddTeamB,
      oddDraw: null, // No draw option for cricket toss
      category: "cricket_toss", // This is the key difference from regular team matches
      result: TeamMatchResult.PENDING,
      status: "open",
      coverImage, // Store the cover image path
      teamAImage: undefined, // Set to undefined since we're not using them anymore
      teamBImage: undefined
    };

    const insertedMatch = await db.insert(teamMatches).values(matchData).returning();
    
    res.status(201).json(insertedMatch[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0].message });
    } else {
      console.error("Error creating cricket toss match:", error);
      res.status(500).json({ message: "Failed to create cricket toss match" });
    }
  }
});

// Close betting for a match
router.post("/matches/:id/close", requireRole(["admin", "subadmin"]), async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    if (isNaN(matchId)) {
      return res.status(400).json({ message: "Invalid match ID" });
    }
    
    // First check if the match exists and is still open
    const match = await db.select()
      .from(teamMatches)
      .where(
        and(
          eq(teamMatches.id, matchId),
          eq(teamMatches.category, "cricket_toss"),
          eq(teamMatches.status, "open")
        )
      )
      .limit(1);
    
    if (match.length === 0) {
      return res.status(404).json({ 
        message: "Match not found or already closed" 
      });
    }
    
    // Close the match
    const updatedMatch = await db.update(teamMatches)
      .set({ status: "closed" })
      .where(eq(teamMatches.id, matchId))
      .returning();
    
    res.json(updatedMatch[0]);
  } catch (error) {
    console.error("Error closing cricket toss match:", error);
    res.status(500).json({ message: "Failed to close cricket toss match" });
  }
});

// Declare result for a match
router.post("/matches/:id/result", requireRole(["admin", "subadmin"]), async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    if (isNaN(matchId)) {
      return res.status(400).json({ message: "Invalid match ID" });
    }
    
    const validatedData = declareResultSchema.parse(req.body);
    
    // First check if the match exists and is closed
    const match = await db.select()
      .from(teamMatches)
      .where(
        and(
          eq(teamMatches.id, matchId),
          eq(teamMatches.category, "cricket_toss"),
          eq(teamMatches.status, "closed")
        )
      )
      .limit(1);
    
    if (match.length === 0) {
      return res.status(404).json({ 
        message: "Match not found or not in closed state" 
      });
    }
    
    const matchData = match[0];
    
    // Update the match with the result
    const updatedMatch = await db.update(teamMatches)
      .set({ 
        status: "resulted",
        result: validatedData.result
      })
      .where(eq(teamMatches.id, matchId))
      .returning();
    
    // Process all bets for this match
    const bets = await db.select()
      .from(games)
      .where(
        and(
          eq(games.matchId, matchId),
          eq(games.gameType, GameType.CRICKET_TOSS)
          // We'll filter unresolved bets after the query
        )
      );
    
    // For each bet, determine win/loss and update user balance
    for (const bet of bets) {
      // Skip bets that already have a result
      if (bet.result !== null) continue;
      
      let payout = 0;
      const win = bet.prediction === validatedData.result;
      
      if (win) {
        // Calculate payout based on which team was predicted
        const odds = bet.prediction === "team_a" ? matchData.oddTeamA : matchData.oddTeamB;
        payout = Math.floor(bet.betAmount * (odds / 100));
      }
      
      // Get current user balance
      const userResult = await db.select({ balance: users.balance })
        .from(users)
        .where(eq(users.id, bet.userId))
        .limit(1);
      
      if (userResult.length === 0) {
        console.error(`User ${bet.userId} not found when processing bet ${bet.id}`);
        continue;
      }
      
      const currentBalance = userResult[0].balance;
      const newBalance = currentBalance + payout;
      
      // Update user balance
      if (payout > 0) {
        await db.update(users)
          .set({ balance: newBalance })
          .where(eq(users.id, bet.userId));
      }
      
      // Update bet with result and payout
      await db.update(games)
        .set({
          result: validatedData.result,
          payout: payout,
          balanceAfter: newBalance
        })
        .where(eq(games.id, bet.id));
    }
    
    res.json({
      match: updatedMatch[0],
      processedBets: bets.length
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0].message });
    } else {
      console.error("Error declaring cricket toss result:", error);
      res.status(500).json({ message: "Failed to declare cricket toss result" });
    }
  }
});

// Place a bet on a cricket toss match
router.post("/bet", async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: "You must be logged in to place a bet" });
    }
    
    const validatedData = placeBetSchema.parse(req.body);
    
    // Check if the match exists and is open for betting
    const match = await db.select()
      .from(teamMatches)
      .where(
        and(
          eq(teamMatches.id, validatedData.matchId),
          eq(teamMatches.category, "cricket_toss"),
          eq(teamMatches.status, "open")
        )
      )
      .limit(1);
    
    if (match.length === 0) {
      return res.status(404).json({ 
        message: "Match not found or not open for betting" 
      });
    }
    
    const matchData = match[0] as TeamMatch;
    
    // Check if the user has enough balance
    const userResult = await db.select({ balance: users.balance })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);
    
    if (userResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const currentBalance = userResult[0].balance;
    
    if (currentBalance < validatedData.betAmount) {
      return res.status(400).json({ 
        message: "Insufficient balance to place this bet" 
      });
    }
    
    // Calculate potential payout
    const odds = validatedData.prediction === "team_a" 
      ? matchData.oddTeamA 
      : matchData.oddTeamB;
    
    // Ensure bet amount is a number and correctly scaled
    // Convert to paisa (multiply by 100) as the system stores amounts in paisa
    const betAmount = parseInt(validatedData.betAmount.toString()) * 100;
    
    const potentialWin = Math.floor(betAmount * (odds / 100));
    
    // Deduct bet amount from user balance
    const newBalance = currentBalance - betAmount;
    
    await db.update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, req.user.id));
    
    // Create the bet record
    const gameData = {
      teamA: matchData.teamA,
      teamB: matchData.teamB,
      coverImage: matchData.coverImage,
      matchId: matchData.id,
      oddTeamA: matchData.oddTeamA,
      oddTeamB: matchData.oddTeamB,
      matchTime: matchData.matchTime,
      status: matchData.status,
    };
    
    const createdBet = await db.insert(games)
      .values({
        userId: req.user.id,
        gameType: GameType.CRICKET_TOSS,
        matchId: validatedData.matchId,
        betAmount: betAmount,
        prediction: validatedData.prediction,
        gameData: gameData,
        balanceAfter: newBalance,
      })
      .returning();
    
    res.status(201).json({
      bet: createdBet[0],
      currentBalance: newBalance,
      potentialWin: potentialWin
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0].message });
    } else {
      console.error("Error placing cricket toss bet:", error);
      res.status(500).json({ message: "Failed to place bet" });
    }
  }
});

// Get betting history for the current user
router.get("/my-bets", async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: "You must be logged in to view your bets" });
    }
    
    const bets = await db.select()
      .from(games)
      .where(
        and(
          eq(games.userId, req.user.id),
          eq(games.gameType, GameType.CRICKET_TOSS)
        )
      )
      .orderBy(desc(games.createdAt));
    
    res.json(bets);
  } catch (error) {
    console.error("Error fetching user cricket toss bets:", error);
    res.status(500).json({ message: "Failed to fetch your betting history" });
  }
});

// Play (place a bet on) a cricket toss match by ID
router.post("/:id/play", async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: "You must be logged in to place a bet" });
    }
    
    const matchId = parseInt(req.params.id);
    if (isNaN(matchId)) {
      return res.status(400).json({ message: "Invalid match ID" });
    }
    
    // Log the request body and headers for debugging
    console.log("Cricket toss play request:", {
      body: req.body,
      headers: req.headers,
      contentType: req.headers['content-type']
    });
    
    // For simplicity, extract data directly from the request
    // This bypasses the schema validation temporarily until we understand the data format
    let betAmount = 0;
    let betOn = "";
    
    // Try to extract values from the request body based on different possible formats
    if (req.body) {
      if (typeof req.body === 'string') {
        try {
          // Try to parse JSON string
          const parsedBody = JSON.parse(req.body);
          betAmount = parsedBody.betAmount || parsedBody.amount || 0;
          betOn = parsedBody.betOn || parsedBody.prediction || "";
        } catch (e) {
          console.error("Error parsing JSON body:", e);
          // Handle form-urlencoded format
          const params = new URLSearchParams(req.body);
          betAmount = parseInt(params.get('betAmount') || params.get('amount') || '0');
          betOn = params.get('betOn') || params.get('prediction') || '';
        }
      } else {
        // Object format
        betAmount = parseInt(req.body.betAmount) || parseInt(req.body.amount) || 0;
        betOn = req.body.betOn || req.body.prediction || "";
      }
    }
    
    // Simple validation
    if (!betAmount || betAmount < 10) {
      return res.status(400).json({ message: "Bet amount must be at least 10" });
    }
    
    if (!betOn || (betOn !== "team_a" && betOn !== "team_b" && betOn !== "TeamA" && betOn !== "TeamB")) {
      return res.status(400).json({ message: "Invalid team selection" });
    }
    
    // Normalize betOn value
    if (betOn === "TeamA") betOn = "team_a";
    if (betOn === "TeamB") betOn = "team_b";
    
    // Check if the match exists and is open for betting
    const match = await db.select()
      .from(teamMatches)
      .where(
        and(
          eq(teamMatches.id, matchId),
          eq(teamMatches.category, "cricket_toss"),
          eq(teamMatches.status, "open")
        )
      )
      .limit(1);
    
    if (match.length === 0) {
      return res.status(404).json({ 
        message: "Match not found or not open for betting" 
      });
    }
    
    const matchData = match[0] as TeamMatch;
    
    // Check if the user has enough balance
    const userResult = await db.select({ balance: users.balance })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);
    
    if (userResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const currentBalance = userResult[0].balance;
    
    if (currentBalance < betAmount) {
      return res.status(400).json({ 
        message: "Insufficient balance to place this bet" 
      });
    }
    
    // Calculate potential payout
    const odds = betOn === "team_a" 
      ? matchData.oddTeamA 
      : matchData.oddTeamB;
    
    // Ensure bet amount is a number and correctly scaled
    // Convert to paisa (multiply by 100) as the system stores amounts in paisa
    betAmount = parseInt(betAmount.toString()) * 100;
    
    const potentialWin = Math.floor(betAmount * (odds / 100));
    
    // Deduct bet amount from user balance
    const newBalance = currentBalance - betAmount;
    
    await db.update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, req.user.id));
    
    // Create the bet record
    const gameData = {
      teamA: matchData.teamA,
      teamB: matchData.teamB,
      coverImage: matchData.coverImage,
      matchId: matchData.id,
      oddTeamA: matchData.oddTeamA,
      oddTeamB: matchData.oddTeamB,
      matchTime: matchData.matchTime,
      status: matchData.status,
    };
    
    const createdBet = await db.insert(games)
      .values({
        userId: req.user.id,
        gameType: GameType.CRICKET_TOSS,
        matchId: matchId,
        betAmount: betAmount,
        prediction: betOn,
        gameData: gameData,
        balanceAfter: newBalance,
      })
      .returning();
    
    res.status(200).json({
      game: createdBet[0],
      user: {
        ...req.user,
        balance: newBalance
      },
      potentialWin: potentialWin
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: error.errors[0].message });
    } else {
      console.error("Error placing cricket toss bet:", error);
      res.status(500).json({ message: "Failed to place bet" });
    }
  }
});

// Get all bets for a specific match (admin/subadmin only)
router.get("/bets/:matchId", requireRole(["admin", "subadmin"]), async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    if (isNaN(matchId)) {
      return res.status(400).json({ message: "Invalid match ID" });
    }
    
    // Join games with users to get usernames
    const bets = await db.select({
      id: games.id,
      userId: games.userId,
      username: users.username,
      betAmount: games.betAmount,
      prediction: games.prediction,
      result: games.result,
      payout: games.payout,
      createdAt: games.createdAt,
      gameData: games.gameData,
    })
    .from(games)
    .innerJoin(users, eq(games.userId, users.id))
    .where(
      and(
        eq(games.matchId, matchId),
        eq(games.gameType, GameType.CRICKET_TOSS)
      )
    )
    .orderBy(desc(games.createdAt));
    
    // Calculate potential win for each bet
    const betsWithPotential = bets.map(bet => {
      const gameData = bet.gameData as any;
      const odds = bet.prediction === 'team_a' ? gameData.oddTeamA : gameData.oddTeamB;
      const potential = Math.floor(bet.betAmount * (odds / 100));
      
      return {
        ...bet,
        potential
      };
    });
    
    res.json(betsWithPotential);
  } catch (error) {
    console.error(`Error fetching bets for match ${req.params.matchId}:`, error);
    res.status(500).json({ message: "Failed to fetch bets for this match" });
  }
});

export default router;