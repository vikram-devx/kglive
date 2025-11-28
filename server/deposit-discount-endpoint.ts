import { Router } from 'express';
import { storage } from './storage';
import { z } from 'zod';
import { UserRole } from '@shared/schema';

const router = Router();

// Middleware to check if user is a subadmin
const isSubadmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.user.role !== UserRole.SUBADMIN) {
    return res.status(403).json({ error: 'Only subadmins can manage deposit discounts' });
  }
  
  next();
};

// Get deposit discount for a specific player
router.get('/deposit-discount/:userId', isSubadmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const subadminId = req.user.id;
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const discount = await storage.getPlayerDepositDiscount(userId, subadminId);
    return res.json(discount || { discountRate: 0 });
  } catch (error) {
    console.error('Error getting deposit discount:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Set or update deposit discount for a player
router.post('/deposit-discount/:userId', isSubadmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const subadminId = req.user.id;
    
    const schema = z.object({
      discountRate: z.number().int().min(0).max(100)
    });
    
    const validationResult = schema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Invalid discount rate. Must be a number between 0 and 100.' });
    }
    
    const { discountRate } = validationResult.data;
    
    // Verify the player exists and is assigned to this subadmin
    const player = await storage.getUser(userId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    if (player.role !== UserRole.PLAYER) {
      return res.status(400).json({ error: 'User is not a player' });
    }
    
    if (player.assignedTo !== subadminId) {
      return res.status(403).json({ error: 'Player is not assigned to this subadmin' });
    }
    
    const updatedDiscount = await storage.upsertPlayerDepositDiscount(subadminId, userId, discountRate);
    return res.json(updatedDiscount);
  } catch (error) {
    console.error('Error setting deposit discount:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all deposit discounts for this subadmin's players
router.get('/deposit-discounts', isSubadmin, async (req, res) => {
  try {
    const subadminId = req.user.id;
    
    // Get all players assigned to this subadmin
    const players = await storage.getUsersByAssignedTo(subadminId);
    
    // Get discount for each player
    const results = await Promise.all(
      players.map(async (player) => {
        const discount = await storage.getPlayerDepositDiscount(player.id, subadminId);
        return {
          userId: player.id,
          username: player.username,
          discountRate: discount?.discountRate || 0
        };
      })
    );
    
    return res.json(results);
  } catch (error) {
    console.error('Error getting deposit discounts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;