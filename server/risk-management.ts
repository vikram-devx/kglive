import { Request, Response } from "express";
import { storage } from "./storage";
import { UserRole, GameType } from "../shared/schema";

/**
 * Types for risk management data
 */
interface RiskSummary {
  totalBetAmount: number;
  potentialLiability: number;
  potentialProfit: number;
  exposureAmount: number;
  activeBets: number;
  totalBets: number;
  highRiskBets: number;
  gameType: string;
  gameTypeFormatted: string;
}

interface DetailedRiskData {
  userExposure: { [userId: number]: number };
  marketExposure: { [marketId: number]: number };
  gameData: any[];
  cricketMatchAnalysis?: any[];
}

interface RiskManagementResponse {
  summaries: RiskSummary[];
  detailedData: DetailedRiskData;
  userInfo: { [userId: number]: { username: string; } };
  marketInfo: { [marketId: number]: { name: string; type: string; } };
  message?: string;
}

/**
 * Get risk management data for admins (platform-wide risk analysis)
 */
export async function getAdminRiskManagement(req: Request, res: Response) {
  try {
    // Check if admin wants to filter by specific subadmin
    const subadminId = req.query.subadminId ? parseInt(req.query.subadminId as string) : null;
    
    console.log("🔍 Admin risk management request with subadminId:", subadminId);
    
    // Admin gets platform-wide risk management data or filtered by subadmin
    const marketGameRiskData = await getMarketGameRiskData(subadminId);
    const cricketTossRiskData = await getCricketTossRiskData(subadminId);
    
    // Fetch real user information for all users involved in games
    const userIds = Array.from(new Set([
      ...Object.keys(marketGameRiskData.userExposure).map(id => parseInt(id)),
      ...Object.keys(cricketTossRiskData.userExposure).map(id => parseInt(id))
    ]));
    
    // Fetch real market information for all markets with games
    const marketIds = Array.from(new Set(
      Object.keys(marketGameRiskData.marketExposure).map(id => parseInt(id))
    ));
    
    // Get user information from database
    const userInfo: { [userId: number]: { username: string } } = {};
    if (userIds.length > 0) {
      const users = await storage.getUsersByIds(userIds);
      users.forEach(user => {
        userInfo[user.id] = { username: user.username };
      });
    }
    
    // Get market information from database
    const marketInfo: { [marketId: number]: { name: string; type: string } } = {};
    if (marketIds.length > 0) {
      const markets = await storage.getSatamatkaMarketsByIds(marketIds);
      markets.forEach(market => {
        marketInfo[market.id] = { 
          name: market.name,
          type: market.type
        };
      });
    }
    
    const response: RiskManagementResponse = {
      summaries: [
        {
          ...marketGameRiskData.summary,
          gameType: GameType.SATAMATKA,
          gameTypeFormatted: "Market Game"
        },
        {
          ...cricketTossRiskData.summary,
          gameType: GameType.CRICKET_TOSS,
          gameTypeFormatted: "Cricket Toss"
        }
      ],
      detailedData: {
        userExposure: {
          ...marketGameRiskData.userExposure,
          ...cricketTossRiskData.userExposure
        },
        marketExposure: marketGameRiskData.marketExposure,
        gameData: [
          ...marketGameRiskData.games,
          ...cricketTossRiskData.games
        ],
        cricketMatchAnalysis: cricketTossRiskData.matchAnalysis || []
      },
      userInfo,
      marketInfo
    };
    
    console.log("🔍 Cricket match analysis found:", cricketTossRiskData.matchAnalysis?.length || 0);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in admin risk management:", error);
    return res.status(500).json({ message: "Failed to get risk management data" });
  }
}

/**
 * Get risk management data for subadmins (data only for their assigned players)
 */
export async function getSubadminRiskManagement(req: Request, res: Response) {
  try {
    if (!req.user || req.user.role !== UserRole.SUBADMIN) {
      return res.status(403).json({ message: "Unauthorized access" });
    }
    
    const subadminId = req.user.id;
    
    // Get all users assigned to this subadmin
    const assignedUsers = await storage.getUsersByAssignedTo(subadminId);
    if (!assignedUsers.length) {
      return res.status(200).json({
        summaries: [
          {
            totalBetAmount: 0,
            potentialLiability: 0,
            potentialProfit: 0,
            exposureAmount: 0,
            activeBets: 0,
            totalBets: 0,
            highRiskBets: 0,
            gameType: GameType.SATAMATKA,
            gameTypeFormatted: "Market Game"
          },
          {
            totalBetAmount: 0,
            potentialLiability: 0,
            potentialProfit: 0,
            exposureAmount: 0,
            activeBets: 0,
            totalBets: 0,
            highRiskBets: 0,
            gameType: GameType.CRICKET_TOSS,
            gameTypeFormatted: "Cricket Toss"
          }
        ],
        detailedData: {
          userExposure: {},
          marketExposure: {},
          gameData: []
        },
        userInfo: {},
        marketInfo: {},
        message: "No assigned players found"
      });
    }
    
    const userIds = assignedUsers.map(user => user.id);
    
    // Get odds for this subadmin
    const marketGameOdd = await storage.getGameOddBySubadminAndType(subadminId, GameType.SATAMATKA);
    const cricketTossOdd = await storage.getGameOddBySubadminAndType(subadminId, GameType.CRICKET_TOSS);
    
    // If subadmin hasn't set odds, use admin odds
    const defaultMarketOdd = !marketGameOdd ? 
      await storage.getGameOddByType(GameType.SATAMATKA) : 
      marketGameOdd;
      
    const defaultCricketOdd = !cricketTossOdd ? 
      await storage.getGameOddByType(GameType.CRICKET_TOSS) : 
      cricketTossOdd;
    
    // Get games for assigned users
    const allGames = await storage.getGamesByUserIds(userIds);
    
    // Filter by game type
    const marketGames = allGames.filter(game => game.gameType === GameType.SATAMATKA);
    const cricketTossGames = allGames.filter(game => game.gameType === GameType.CRICKET_TOSS);
    
    // Calculate risk data for each game type
    const marketRiskData = calculateRiskData(
      marketGames, 
      defaultMarketOdd?.oddValue || 90
    );
    
    const cricketRiskData = await getCricketTossRiskData(subadminId);
    
    // Create user info mapping
    const userInfo: { [userId: number]: { username: string } } = {};
    assignedUsers.forEach(user => {
      userInfo[user.id] = { username: user.username };
    });
    
    // Get market IDs from the game data
    const marketIds = Array.from(new Set(
      marketGames
        .filter(game => game.marketId)
        .map(game => game.marketId as number)
    ));
    
    // Fetch market information
    const marketInfo: { [marketId: number]: { name: string; type: string } } = {};
    if (marketIds.length > 0) {
      const markets = await storage.getSatamatkaMarketsByIds(marketIds);
      markets.forEach(market => {
        marketInfo[market.id] = { 
          name: market.name,
          type: market.type
        };
      });
    }
    
    const response: RiskManagementResponse = {
      summaries: [
        {
          ...marketRiskData.summary,
          gameType: GameType.SATAMATKA,
          gameTypeFormatted: "Market Game"
        },
        {
          ...cricketRiskData.summary,
          gameType: GameType.CRICKET_TOSS,
          gameTypeFormatted: "Cricket Toss"
        }
      ],
      detailedData: {
        userExposure: {
          ...marketRiskData.userExposure,
          ...cricketRiskData.userExposure
        },
        marketExposure: marketRiskData.marketExposure,
        gameData: [
          ...marketRiskData.games,
          ...cricketRiskData.games
        ],
        cricketMatchAnalysis: cricketRiskData.matchAnalysis || []
      },
      userInfo,
      marketInfo
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in subadmin risk management:", error);
    return res.status(500).json({ message: "Failed to get risk management data" });
  }
}

/**
 * Get risk management data for market games
 * Shows jantri for markets pending results (WAITING, OPEN, CLOSED - not yet RESULTED)
 */
async function getMarketGameRiskData(subadminId?: number | null) {
  // Get markets for jantri (open, waiting, or closed without results)
  const marketsForJantri = await storage.getMarketsForJantri();
  
  if (!marketsForJantri || marketsForJantri.length === 0) {
    // No markets pending results, return empty data
    return {
      summary: {
        totalBetAmount: 0,
        potentialLiability: 0, 
        potentialProfit: 0,
        exposureAmount: 0,
        activeBets: 0,
        totalBets: 0,
        highRiskBets: 0
      },
      userExposure: {},
      marketExposure: {},
      games: []
    };
  }
  
  // Get games only from markets pending results
  const activeMarketIds = marketsForJantri.map(market => market.id);
  let games = await storage.getGamesByType(GameType.SATAMATKA);
  let activeMarketGames = games.filter(game => 
    game.marketId && activeMarketIds.includes(game.marketId)
  );

  // Filter games by subadmin if specified
  if (subadminId) {
    // Get users assigned to this subadmin
    const subadminUsers = await storage.getUsersByAssignedTo(subadminId);
    const subadminUserIds = subadminUsers.map(user => user.id);
    
    console.log(`🔍 Subadmin ${subadminId} has ${subadminUsers.length} assigned users:`, subadminUserIds);
    console.log(`🔍 Before filtering: ${activeMarketGames.length} market games`);
    
    // Filter games to only include those from subadmin's users
    activeMarketGames = activeMarketGames.filter(game => subadminUserIds.includes(game.userId));
    
    console.log(`🔍 After filtering: ${activeMarketGames.length} market games for subadmin ${subadminId}`);
  }
  
  // Get market game odds set by admin
  const marketOdds = await storage.getGameOddByType(GameType.SATAMATKA);
  const oddValue = marketOdds?.oddValue || 90; // Default to 90 if not set
  
  return calculateRiskData(activeMarketGames, oddValue);
}

/**
 * Get risk management data for cricket toss games with detailed match analysis
 */
async function getCricketTossRiskData(subadminId?: number | null) {
  // Get all cricket toss games
  let games = await storage.getGamesByType(GameType.CRICKET_TOSS);

  // Filter games by subadmin if specified
  if (subadminId) {
    // Get users assigned to this subadmin
    const subadminUsers = await storage.getUsersByAssignedTo(subadminId);
    const subadminUserIds = subadminUsers.map(user => user.id);
    
    console.log(`🔍 Cricket: Subadmin ${subadminId} has ${subadminUsers.length} assigned users:`, subadminUserIds);
    console.log(`🔍 Cricket: Before filtering: ${games.length} cricket games`);
    console.log(`🔍 Cricket: All games:`, games.map(g => ({ id: g.id, userId: g.userId, matchId: g.matchId, result: g.result })));
    
    // Filter games to only include those from subadmin's users
    games = games.filter(game => subadminUserIds.includes(game.userId));
    
    console.log(`🔍 Cricket: After filtering: ${games.length} cricket games for subadmin ${subadminId}`);
    console.log(`🔍 Cricket: Filtered games:`, games.map(g => ({ id: g.id, userId: g.userId, matchId: g.matchId, result: g.result })));
  }
  
  // Get cricket toss odds set by admin
  const cricketOdds = await storage.getGameOddByType(GameType.CRICKET_TOSS);
  const oddValue = cricketOdds?.oddValue || 90; // Default to 90 if not set
  
  // Get match-wise analysis
  console.log(`🔍 Cricket: About to get match analysis with ${games.length} games`);
  const matchAnalysis = await getCricketMatchAnalysis(games, oddValue);
  console.log(`🔍 Cricket: Match analysis returned ${matchAnalysis.length} matches`);
  
  const riskData = calculateRiskData(games, oddValue);
  
  // Add match analysis to the response
  return {
    ...riskData,
    matchAnalysis
  };
}

/**
 * Get detailed cricket match analysis with team-wise betting data
 */
async function getCricketMatchAnalysis(games: any[], oddValue: number) {
  try {
    console.log("Getting cricket match analysis...");
    console.log("Total cricket toss games:", games.length);
    
    // Get all active cricket toss matches
    const activeMatches = await storage.getActiveTeamMatches();
    console.log("All active matches:", activeMatches.length);
    
    const cricketMatches = activeMatches.filter(match => match.category === "cricket_toss");
    console.log("Cricket toss matches:", cricketMatches.length);
    
    if (cricketMatches.length === 0) {
      console.log("No cricket toss matches found");
      return [];
    }
    
    const matchAnalysis = await Promise.all(cricketMatches.map(async (match) => {
      console.log(`Processing match ${match.id}: ${match.teamA} vs ${match.teamB}`);
      
      // Filter games for this specific match - match both null result and pending result
      const matchGames = games.filter(game => 
        game.matchId === match.id && (game.result === null || game.result === 'pending' || !game.result)
      );
      
      console.log(`Match ${match.id} has ${matchGames.length} active bets`);
      
      // Separate bets by team selection
      const teamABets = matchGames.filter(game => game.prediction === 'team_a');
      const teamBBets = matchGames.filter(game => game.prediction === 'team_b');
      
      console.log(`Team A bets: ${teamABets.length}, Team B bets: ${teamBBets.length}`);
      
      // Use custom odds from game odds system (prioritize subadmin custom odds)
      // First check if there are custom odds for cricket toss, otherwise use match odds
      let teamAOdds = match.oddTeamA / 100; // Default to match odds (2.00x)
      let teamBOdds = match.oddTeamB / 100; // Default to match odds (2.00x)
      
      // Check if any of the players in this match have subadmin with custom cricket toss odds
      const allPlayerIds = [...teamABets.map(g => g.userId), ...teamBBets.map(g => g.userId)];
      if (allPlayerIds.length > 0) {
        // Get the first player's subadmin assignment to check for custom odds
        const firstPlayer = await storage.getUser(allPlayerIds[0]);
        if (firstPlayer && firstPlayer.assignedTo) {
          const subadminOdds = await storage.getGameOddsBySubadmin(firstPlayer.assignedTo);
          const customOdds = subadminOdds.find(odd => odd.gameType === 'cricket_toss');
          if (customOdds && customOdds.oddValue) {
            // Convert from database format (19000 = 1.9) to multiplier
            const customMultiplier = customOdds.oddValue / 10000;
            teamAOdds = customMultiplier;
            teamBOdds = customMultiplier;
          }
        }
      }
      
      // Calculate team A statistics using match-specific odds
      const teamAStats = {
        totalBets: teamABets.length,
        totalAmount: teamABets.reduce((sum, game) => sum + game.betAmount, 0),
        potentialPayout: teamABets.reduce((sum, game) => sum + (game.betAmount * teamAOdds), 0),
        users: Array.from(new Set(teamABets.map(game => game.userId)))
      };
      
      // Calculate team B statistics using match-specific odds
      const teamBStats = {
        totalBets: teamBBets.length,
        totalAmount: teamBBets.reduce((sum, game) => sum + game.betAmount, 0),
        potentialPayout: teamBBets.reduce((sum, game) => sum + (game.betAmount * teamBOdds), 0),
        users: Array.from(new Set(teamBBets.map(game => game.userId)))
      };
      
      // Calculate match totals and risk
      const totalBetAmount = teamAStats.totalAmount + teamBStats.totalAmount;
      const maxPotentialPayout = Math.max(teamAStats.potentialPayout, teamBStats.potentialPayout);
      
      // For cricket toss: 
      // - Potential Profit = if house wins (keep all bet amounts)
      // - Potential Liability = worst case payout (maximum we'd pay out)
      const potentialProfit = totalBetAmount; // House keeps all ₹400 if house wins
      const potentialLoss = maxPotentialPayout; // Maximum payout to users (₹400 × 2.00 = ₹800)
      
      // Determine risk level based on potential liability
      let riskLevel = 'low';
      if (potentialLoss > 50000) { // ₹500 
        riskLevel = 'high';
      } else if (potentialLoss > 20000) { // ₹200
        riskLevel = 'medium';
      }
      
      const analysis = {
        matchId: match.id,
        matchInfo: {
          teamA: match.teamA,
          teamB: match.teamB,
          description: match.description,
          matchTime: match.matchTime,
          oddTeamA: Math.round(teamAOdds * 100), // Use actual calculated odds
          oddTeamB: Math.round(teamBOdds * 100), // Use actual calculated odds  
          status: match.status
        },
        teamAStats,
        teamBStats,
        summary: {
          totalBets: matchGames.length,
          totalAmount: totalBetAmount,
          potentialProfit: totalBetAmount, // House profit if house wins (keep all bets)
          potentialLoss: maxPotentialPayout, // Maximum payout to users
          riskLevel,
          maxPotentialPayout
        }
      };
      
      console.log(`Match ${match.id} analysis:`, JSON.stringify(analysis, null, 2));
      return analysis;
    }));
    
    // Return all matches, even those with 0 bets to show in the UI
    console.log("Final match analysis:", matchAnalysis.length);
    return matchAnalysis;
  } catch (error) {
    console.error("Error in cricket match analysis:", error);
    return [];
  }
}

/**
 * Calculate risk metrics from game data
 */
function calculateRiskData(games: any[], oddValue: number) {
  // Consider games with no result OR with result='pending' as active bets
  const activeBets = games.filter(game => !game.result || game.result === 'pending').length;
  const totalBets = games.length;
  
  // Calculate exposure by user
  const userExposure: { [userId: number]: number } = {};
  // Calculate exposure by market (for market games)
  const marketExposure: { [marketId: number]: number } = {};
  
  let totalBetAmount = 0;
  let potentialLiability = 0;
  let highRiskBets = 0;
  
  // Calculate total bet amount and potential liability
  games.forEach(game => {
    // Only count active bets for liability calculations (null result OR 'pending' result)
    if (!game.result || game.result === 'pending') {
      const betAmount = game.betAmount;
      
      // Calculate potential payout based on specific game mode
      let multiplier = 1;
      switch (game.gameMode) {
        case 'jodi': multiplier = 90; break;
        case 'harf': multiplier = 9; break;
        case 'crossing': multiplier = 95; break;
        case 'odd_even': multiplier = 1.9; break;
        default: multiplier = oddValue / 100; // Fallback to admin setting
      }
      
      const potentialPayout = betAmount * multiplier;
      
      totalBetAmount += betAmount;
      potentialLiability += potentialPayout;
      
      // Track high risk bets (bets over ₹1000)
      if (betAmount > 1000) {
        highRiskBets++;
      }
      
      // Track exposure by user
      if (!userExposure[game.userId]) {
        userExposure[game.userId] = 0;
      }
      userExposure[game.userId] += potentialPayout;
      
      // Track exposure by market (for market games)
      if (game.marketId && !marketExposure[game.marketId]) {
        marketExposure[game.marketId] = 0;
      }
      if (game.marketId) {
        marketExposure[game.marketId] += potentialPayout;
      }
    }
  });
  
  // Calculate potential profit (house edge)
  const potentialProfit = totalBetAmount - potentialLiability;
  
  // Calculate maximum exposure amount (worst-case scenario)
  const exposureAmount = Math.max(...Object.values(userExposure), 0);
  
  return {
    summary: {
      totalBetAmount,
      potentialLiability,
      potentialProfit,
      exposureAmount,
      activeBets,
      totalBets,
      highRiskBets
    },
    userExposure,
    marketExposure,
    games
  };
}