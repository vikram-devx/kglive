import express from 'express';
import { requireRole } from './auth';
import { UserRole } from '../shared/schema';
import { fixCrossingBets } from './fix-crossing-bets';

const router = express.Router();

// Route to fix crossing bets for a specific market
router.post('/fix-crossing-bets/:marketId', requireRole([UserRole.ADMIN]), fixCrossingBets);

export default router;