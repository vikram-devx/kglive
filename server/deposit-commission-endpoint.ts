import { db } from './db';
import express, { Request, Response, NextFunction } from 'express';
import { UserRole, depositCommissions, users, systemSettings } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Helper function to get deposit commission for a subadmin
export async function getSubadminDepositCommission(subadminId: number): Promise<number> {
  try {
    // Fetch the deposit commission setting for this subadmin
    const commissionResult = await db.select()
      .from(depositCommissions)
      .where(and(eq(depositCommissions.subadminId, subadminId), eq(depositCommissions.isActive, true)))
      .limit(1);
    
    if (commissionResult.length > 0) {
      return commissionResult[0].commissionRate;
    }
    
    // If no specific commission is set, get the default value from system settings
    const defaultSetting = await db.select()
      .from(systemSettings)
      .where(and(
        eq(systemSettings.settingType, 'commission_default'),
        eq(systemSettings.settingKey, 'deposit')
      ))
      .limit(1);
      
    if (defaultSetting.length > 0) {
      // Platform default now uses same 10000-based system as individual commissions
      return parseInt(defaultSetting[0].settingValue);
    }
    
    // If no system default, use 10% as fallback
    return 1000; // Default 10% commission rate (1000 = 10% in 10000-based system)
  } catch (error) {
    console.error('Error getting subadmin commission rate:', error);
    return 1000; // Default to 10% on error
  }
}

// Set up all deposit commission endpoints
export function setupDepositCommissionEndpoints(app: express.Express) {
  // Additional endpoint to handle the specific API path for subadmin deposit commission
  // GET endpoint to retrieve a specific subadmin's deposit commission rate
  app.get('/api/subadmin/:subadminId/deposit-commission', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const subadminId = parseInt(req.params.subadminId);
      
      if (isNaN(subadminId)) {
        return res.status(400).json({ message: 'Invalid subadmin ID' });
      }
      
      // Only admins or the subadmin themselves can access their commission info
      if (req.user?.role !== UserRole.ADMIN && 
          (req.user?.role !== UserRole.SUBADMIN || req.user?.id !== subadminId)) {
        return res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
      }
      
      // Get commission rate using the helper function
      const commissionRate = await getSubadminDepositCommission(subadminId);
      
      res.json({ 
        subadminId,
        commissionRate
      });
    } catch (error) {
      next(error);
    }
  });
  
  // POST endpoint to set/update a specific subadmin's deposit commission rate
  app.post('/api/subadmin/:subadminId/deposit-commission', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Only admin can set deposit commission
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: 'Forbidden - Only admins can set deposit commission' });
      }
      
      const subadminId = parseInt(req.params.subadminId);
      const { commissionRate } = req.body;
      
      if (isNaN(subadminId) || typeof commissionRate !== 'number' || commissionRate < 0 || commissionRate > 10000) {
        return res.status(400).json({ 
          message: 'Invalid request data. Commission rate must be between 0 and 10000 (0% to 100%)' 
        });
      }
      
      // Verify the user is a subadmin
      const userResult = await db.select()
        .from(users)
        .where(and(eq(users.id, subadminId), eq(users.role, UserRole.SUBADMIN)))
        .limit(1);
      
      if (userResult.length === 0) {
        return res.status(404).json({ message: 'Subadmin not found' });
      }
      
      // Check if a commission already exists
      const existingCommission = await db.select()
        .from(depositCommissions)
        .where(eq(depositCommissions.subadminId, subadminId))
        .limit(1);
      
      if (existingCommission.length > 0) {
        // Update existing commission
        await db.update(depositCommissions)
          .set({
            commissionRate,
            isActive: true,
            updatedAt: new Date()
          })
          .where(eq(depositCommissions.subadminId, subadminId));
      } else {
        // Create new commission
        await db.insert(depositCommissions).values({
          subadminId,
          commissionRate,
          isActive: true
        });
      }
      
      res.json({ 
        success: true, 
        message: 'Deposit commission set successfully',
        data: {
          subadminId,
          username: userResult[0].username,
          commissionRate
        }
      });
    } catch (error) {
      next(error);
    }
  });
  // Endpoint for subadmin to get their own deposit commission rate
  app.get('/api/deposit-commission', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // User must be a subadmin
      if (req.user?.role !== UserRole.SUBADMIN) {
        return res.status(403).json({ message: 'Forbidden - Only subadmins can view their deposit commission' });
      }
      
      const subadminId = req.user.id;
      
      // Get commission rate using the helper function
      const commissionRate = await getSubadminDepositCommission(subadminId);
      
      // Get the actual commission record if it exists
      const commissionResult = await db.select()
        .from(depositCommissions)
        .where(eq(depositCommissions.subadminId, subadminId))
        .limit(1);
      
      const commission = commissionResult.length > 0 ? commissionResult[0] : null;
      
      res.json({ 
        subadminId,
        commissionRate,
        isActive: commission ? commission.isActive : true,
        isDefault: commissionResult.length === 0
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Admin endpoint to get all deposit commissions
  app.get('/api/admin/deposit-commissions', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Only admin can access this endpoint
      if (req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: 'Forbidden - Only admins can view all deposit commissions' });
      }
      
      // Get all subadmins with their deposit commissions
      const commissions = await db.select({
        commission: depositCommissions,
        subadmin: {
          id: users.id,
          username: users.username
        }
      })
      .from(depositCommissions)
      .innerJoin(users, eq(depositCommissions.subadminId, users.id))
      .where(eq(depositCommissions.isActive, true));
      
      res.json(commissions);
    } catch (err) {
      next(err);
    }
  });
  
  // GET endpoint to retrieve a specific subadmin's deposit commission rate
  app.get('/api/admin/deposit-commissions/:subadminId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Only admin can access this endpoint
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: 'Forbidden - Only admins can view deposit commissions' });
      }
      
      const subadminId = parseInt(req.params.subadminId);
      
      if (isNaN(subadminId)) {
        return res.status(400).json({ message: 'Invalid subadmin ID' });
      }
      
      // Verify the user is a subadmin
      const userResult = await db.select()
        .from(users)
        .where(and(eq(users.id, subadminId), eq(users.role, UserRole.SUBADMIN)))
        .limit(1);
      
      if (userResult.length === 0) {
        return res.status(404).json({ message: 'Subadmin not found' });
      }
      
      // Get commission rate using the helper function
      const commissionRate = await getSubadminDepositCommission(subadminId);
      
      // Get the actual commission record if it exists
      const commissionResult = await db.select()
        .from(depositCommissions)
        .where(eq(depositCommissions.subadminId, subadminId))
        .limit(1);
      
      res.json({
        subadminId,
        username: userResult[0].username,
        commissionRate,
        isDefault: commissionResult.length === 0
      });
    } catch (error) {
      next(error);
    }
  });

  // POST endpoint to set/update a deposit commission for a specific subadmin
  app.post('/api/admin/deposit-commissions/:subadminId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Only admin can access this endpoint
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: 'Forbidden - Only admins can manage deposit commissions' });
      }
      
      const subadminId = parseInt(req.params.subadminId);
      const { commissionRate } = req.body;
      
      if (isNaN(subadminId) || typeof commissionRate !== 'number' || commissionRate < 0 || commissionRate > 10000) {
        return res.status(400).json({ 
          message: 'Invalid request data. Commission rate must be between 0 and 10000 (0% to 100%)' 
        });
      }
      
      // Verify the user is a subadmin
      const userResult = await db.select()
        .from(users)
        .where(and(eq(users.id, subadminId), eq(users.role, UserRole.SUBADMIN)))
        .limit(1);
      
      if (userResult.length === 0) {
        return res.status(404).json({ message: 'Subadmin not found' });
      }
      
      // Check if a commission already exists
      const existingCommission = await db.select()
        .from(depositCommissions)
        .where(eq(depositCommissions.subadminId, subadminId))
        .limit(1);
      
      if (existingCommission.length > 0) {
        // Update existing commission
        await db.update(depositCommissions)
          .set({
            commissionRate,
            isActive: true,
            updatedAt: new Date()
          })
          .where(eq(depositCommissions.subadminId, subadminId));
      } else {
        // Create new commission
        await db.insert(depositCommissions).values({
          subadminId,
          commissionRate,
          isActive: true
        });
      }
      
      res.json({ 
        success: true, 
        message: 'Deposit commission set successfully',
        data: {
          subadminId,
          username: userResult[0].username,
          commissionRate
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Generic POST endpoint for deposit commission (using request body for subadmin ID)
  app.post('/api/admin/deposit-commissions', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Only admin can access this endpoint
      if (req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: 'Forbidden - Only admins can manage deposit commissions' });
      }
      
      const { subadminId, commissionRate } = req.body;
      
      if (!subadminId || typeof commissionRate !== 'number' || commissionRate < 0 || commissionRate > 10000) {
        return res.status(400).json({ 
          message: 'Invalid request data. Commission rate must be between 0 and 10000 (0% to 100%)' 
        });
      }
      
      // Verify the user is a subadmin
      const userResult = await db.select()
        .from(users)
        .where(and(eq(users.id, subadminId), eq(users.role, UserRole.SUBADMIN)))
        .limit(1);
      
      if (userResult.length === 0) {
        return res.status(404).json({ message: 'Subadmin not found' });
      }
      
      // Check if a commission already exists
      const existingCommission = await db.select()
        .from(depositCommissions)
        .where(eq(depositCommissions.subadminId, subadminId))
        .limit(1);
      
      if (existingCommission.length > 0) {
        // Update existing commission
        await db.update(depositCommissions)
          .set({
            commissionRate,
            isActive: true,
            updatedAt: new Date()
          })
          .where(eq(depositCommissions.subadminId, subadminId));
      } else {
        // Create new commission
        await db.insert(depositCommissions).values({
          subadminId,
          commissionRate,
          isActive: true
        });
      }
      
      res.json({ 
        success: true, 
        message: 'Deposit commission set successfully',
        data: {
          subadminId,
          username: userResult[0].username,
          commissionRate
        }
      });
    } catch (err) {
      next(err);
    }
  });
}