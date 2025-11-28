import express, { Request, Response, NextFunction } from "express";
import { UserRole } from "@shared/schema";
import { storage } from "./storage";
import { db } from "./db";
import {
  games,
  satamatkaMarkets,
  teamMatches,
  transactions,
  users
} from "@shared/schema";
import { eq, ne } from "drizzle-orm";
import { z } from "zod";

// Validation schema for reset request
const resetRequestSchema = z.object({
  resetType: z.enum(["all", "games", "transactions", "balance"]),
  confirmationCode: z.string().refine(
    val => val === "RESET_CONFIRM",
    { message: "Invalid confirmation code" }
  )
});

// Router for reset system endpoints
const router = express.Router();

/**
 * Reset system data
 * POST /api/admin/reset-system
 */
router.post("/reset-system", async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated() || req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: "Forbidden: Only admin can perform system reset" });
    }

    // Validate request
    const validatedData = resetRequestSchema.parse(req.body);
    const { resetType } = validatedData;

    // Perform reset based on type
    switch (resetType) {
      case "all":
        await resetAllData();
        break;
      case "games":
        await resetGameData();
        break;
      case "transactions":
        await resetTransactionData();
        break;
      case "balance":
        await resetUserBalances();
        break;
    }

    return res.status(200).json({
      success: true,
      message: `System ${resetType} reset completed successfully`
    });
  } catch (error: any) {
    console.error("Reset system error:", error);
    return res.status(400).json({
      message: error.message || "An error occurred during system reset"
    });
  }
});

/**
 * Reset all data in the system except admin accounts
 */
async function resetAllData() {
  await db.transaction(async (tx) => {
    // Delete all games
    await tx.delete(games);
    
    // Delete all markets
    await tx.delete(satamatkaMarkets);
    
    // Delete all team matches
    await tx.delete(teamMatches);
    
    // Delete all transactions
    await tx.delete(transactions);
    
    // Reset all user balances except admin
    await tx.update(users)
      .set({ balance: 0 })
      .where(ne(users.role, UserRole.ADMIN));
  });
}

/**
 * Reset only game-related data
 */
async function resetGameData() {
  await db.transaction(async (tx) => {
    // Delete all games
    await tx.delete(games);
    
    // Delete all markets
    await tx.delete(satamatkaMarkets);
    
    // Delete all team matches
    await tx.delete(teamMatches);
  });
}

/**
 * Reset all transactions and balances
 */
async function resetTransactionData() {
  await db.transaction(async (tx) => {
    // Delete all transactions
    await tx.delete(transactions);
    
    // Reset all user balances except admin
    await tx.update(users)
      .set({ balance: 0 })
      .where(ne(users.role, UserRole.ADMIN));
  });
}

/**
 * Reset user balances only
 */
async function resetUserBalances() {
  await db.transaction(async (tx) => {
    // Reset all user balances except admin
    await tx.update(users)
      .set({ balance: 0 })
      .where(ne(users.role, UserRole.ADMIN));
  });
}

export default router;