import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Award, Calendar, User, Dice1, Target } from "lucide-react";

// Sample leaderboard data - in a real app, this would come from the API
const sampleLeaderboardData = [
  {
    id: 1,
    username: "lucky777",
    totalBets: 158,
    totalWins: 82,
    winRate: 51.9,
    totalWinnings: 125000,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lucky777"
  },
  {
    id: 2,
    username: "betmaster",
    totalBets: 203,
    totalWins: 112,
    winRate: 55.2,
    totalWinnings: 180000,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=betmaster"
  },
  {
    id: 3,
    username: "player123",
    totalBets: 89,
    totalWins: 38,
    winRate: 42.7,
    totalWinnings: 65000,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=player123"
  },
  {
    id: 4,
    username: "kingbet",
    totalBets: 176,
    totalWins: 98,
    winRate: 55.7,
    totalWinnings: 210000,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=kingbet"
  },
  {
    id: 5,
    username: "winner1",
    totalBets: 134,
    totalWins: 59,
    winRate: 44.0,
    totalWinnings: 89000,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=winner1"
  },
  {
    id: 6,
    username: "gambler456",
    totalBets: 221,
    totalWins: 105,
    winRate: 47.5,
    totalWinnings: 156000,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=gambler456"
  },
  {
    id: 7,
    username: "bettingguru",
    totalBets: 178,
    totalWins: 82,
    winRate: 46.1,
    totalWinnings: 132000,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bettingguru"
  },
  {
    id: 8,
    username: "luckycharm",
    totalBets: 92,
    totalWins: 49,
    winRate: 53.3,
    totalWinnings: 98000,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=luckycharm"
  },
  {
    id: 9,
    username: "fortuneseeker",
    totalBets: 143,
    totalWins: 65,
    winRate: 45.5,
    totalWinnings: 112000,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=fortuneseeker"
  },
  {
    id: 10,
    username: "betking123",
    totalBets: 187,
    totalWins: 94,
    winRate: 50.3,
    totalWinnings: 145000,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=betking123"
  }
];

// Top winners by game type
const sampleGameTypeLeaders = {
  "coinflip": [
    {
      id: 2,
      username: "betmaster",
      totalWins: 63,
      winRate: 58.3,
      totalWinnings: 95000,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=betmaster"
    },
    {
      id: 8,
      username: "luckycharm",
      totalWins: 32,
      winRate: 59.3,
      totalWinnings: 64000,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=luckycharm"
    },
    {
      id: 4,
      username: "kingbet",
      totalWins: 41,
      winRate: 56.2,
      totalWinnings: 82000,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=kingbet"
    }
  ],
  "cricket-toss": [
    {
      id: 4,
      username: "kingbet",
      totalWins: 48,
      winRate: 60.0,
      totalWinnings: 96000,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=kingbet"
    },
    {
      id: 1,
      username: "lucky777",
      totalWins: 41,
      winRate: 53.9,
      totalWinnings: 82000,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lucky777"
    },
    {
      id: 10,
      username: "betking123",
      totalWins: 36,
      winRate: 55.4,
      totalWinnings: 72000,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=betking123"
    }
  ],
  "market-games": [
    {
      id: 6,
      username: "gambler456",
      totalWins: 59,
      winRate: 52.2,
      totalWinnings: 118000,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=gambler456"
    },
    {
      id: 2,
      username: "betmaster",
      totalWins: 49,
      winRate: 51.6,
      totalWinnings: 98000,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=betmaster"
    },
    {
      id: 7,
      username: "bettingguru",
      totalWins: 45,
      winRate: 48.4,
      totalWinnings: 90000,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bettingguru"
    }
  ],
  "sports-betting": [
    {
      id: 10,
      username: "betking123",
      totalWins: 58,
      winRate: 48.3,
      totalWinnings: 87000,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=betking123"
    },
    {
      id: 4,
      username: "kingbet",
      totalWins: 56,
      winRate: 50.5,
      totalWinnings: 84000,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=kingbet"
    },
    {
      id: 1,
      username: "lucky777",
      totalWins: 41,
      winRate: 47.1,
      totalWinnings: 61500,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lucky777"
    }
  ]
};

// Recent big wins
const sampleRecentBigWins = [
  {
    id: 1,
    username: "kingbet",
    game: "Cricket Toss",
    betAmount: 10000,
    winAmount: 19000,
    date: "2025-04-18T03:24:00",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=kingbet"
  },
  {
    id: 2,
    username: "betmaster",
    game: "Market Game",
    betAmount: 20000,
    winAmount: 95000,
    date: "2025-04-17T18:45:00",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=betmaster"
  },
  {
    id: 3,
    username: "gambler456",
    game: "Sports Betting",
    betAmount: 15000,
    winAmount: 28500,
    date: "2025-04-17T14:12:00",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=gambler456"
  },
  {
    id: 4,
    username: "lucky777",
    game: "Coin Flip",
    betAmount: 25000,
    winAmount: 47500,
    date: "2025-04-17T10:08:00",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lucky777"
  },
  {
    id: 5,
    username: "bettingguru",
    game: "Market Game",
    betAmount: 30000,
    winAmount: 135000,
    date: "2025-04-16T22:32:00",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bettingguru"
  }
];

export default function LeaderboardPage() {
  const [timeFrame, setTimeFrame] = useState("all-time");
  const [sortBy, setSortBy] = useState("totalWinnings");

  // Fetch leaderboard data from API
  const { 
    data: leaderboardData = [], 
    isLoading: isLoadingLeaderboard,
    error: leaderboardError
  } = useQuery({
    queryKey: ['/api/leaderboard', timeFrame, sortBy],
    queryFn: async () => {
      const response = await fetch(`/api/leaderboard?timeFrame=${timeFrame}&sortBy=${sortBy}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard data');
      return response.json();
    }
  });

  // Fetch game-specific leaderboard data
  const { 
    data: coinflipLeaderboardData = [], 
    isLoading: isLoadingCoinflipLeaderboard,
    error: coinflipLeaderboardError
  } = useQuery({
    queryKey: ['/api/leaderboard', timeFrame, sortBy, 'coin_flip'],
    queryFn: async () => {
      const response = await fetch(`/api/leaderboard?timeFrame=${timeFrame}&sortBy=${sortBy}&gameType=coin_flip`);
      if (!response.ok) throw new Error('Failed to fetch coin flip leaderboard data');
      return response.json();
    }
  });

  const { 
    data: cricketTossLeaderboardData = [], 
    isLoading: isLoadingCricketTossLeaderboard,
    error: cricketTossLeaderboardError
  } = useQuery({
    queryKey: ['/api/leaderboard', timeFrame, sortBy, 'cricket_toss'],
    queryFn: async () => {
      const response = await fetch(`/api/leaderboard?timeFrame=${timeFrame}&sortBy=${sortBy}&gameType=cricket_toss`);
      if (!response.ok) throw new Error('Failed to fetch cricket toss leaderboard data');
      return response.json();
    }
  });

  const { 
    data: satamatkaLeaderboardData = [], 
    isLoading: isLoadingSatamatkaLeaderboard,
    error: satamatkaLeaderboardError
  } = useQuery({
    queryKey: ['/api/leaderboard', timeFrame, sortBy, 'satamatka'],
    queryFn: async () => {
      const response = await fetch(`/api/leaderboard?timeFrame=${timeFrame}&sortBy=${sortBy}&gameType=satamatka`);
      if (!response.ok) throw new Error('Failed to fetch satamatka leaderboard data');
      return response.json();
    }
  });

  // Team match leaderboard query removed
  const teamMatchLeaderboardData = [];
  const isLoadingTeamMatchLeaderboard = false;
  const teamMatchLeaderboardError = null;

  // Fetch recent big wins data
  const {
    data: recentWinsData = [],
    isLoading: isLoadingRecentWins,
    error: recentWinsError
  } = useQuery({
    queryKey: ['/api/games/top-winners'],
    queryFn: async () => {
      const response = await fetch('/api/games/top-winners');
      if (!response.ok) throw new Error('Failed to fetch recent wins data');
      return response.json();
    }
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  return (
    <DashboardLayout title="Leaderboard">
      <div className="space-y-6">
        {/* Top section - filters and stats */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center mb-2">
              <Trophy className="h-6 w-6 mr-2 text-amber-400" />
              Top Players Leaderboard
            </h1>
            <p className="text-slate-400 text-sm">
              See who's winning big and claiming glory across all our games
            </p>
          </div>
          
          <div className="flex gap-2">
            <Select 
              value={timeFrame} 
              onValueChange={setTimeFrame}
            >
              <SelectTrigger className="w-[160px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="all-time">All Time</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={sortBy} 
              onValueChange={setSortBy}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="totalWinnings">Total Winnings</SelectItem>
                <SelectItem value="winRate">Win Rate</SelectItem>
                <SelectItem value="totalWins">Total Wins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Main tabs section */}
        <Tabs defaultValue="overall" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overall" className="flex items-center">
              <Trophy className="h-4 w-4 mr-2" />
              Overall Ranking
            </TabsTrigger>
            <TabsTrigger value="by-game" className="flex items-center">
              <Dice1 className="h-4 w-4 mr-2" />
              By Game Type
            </TabsTrigger>
            <TabsTrigger value="recent-wins" className="flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Recent Big Wins
            </TabsTrigger>
          </TabsList>
          
          {/* Overall Ranking Tab */}
          <TabsContent value="overall" className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Top Players</CardTitle>
                <CardDescription>
                  Players ranked by {sortBy === "totalWinnings" ? "total winnings" : 
                    sortBy === "winRate" ? "win rate" : "total wins"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingLeaderboard ? (
                  <div className="py-12 flex justify-center">
                    <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent"></div>
                  </div>
                ) : leaderboardError ? (
                  <div className="py-12 text-center text-red-400">
                    <p>Failed to load leaderboard data. Please try again later.</p>
                  </div>
                ) : leaderboardData.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <p>No leaderboard data available for the selected time period.</p>
                    <p className="text-sm mt-2">Try selecting a different time period or check back later.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Rank</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead className="text-right">Bets</TableHead>
                        <TableHead className="text-right">Wins</TableHead>
                        <TableHead className="text-right">Win Rate</TableHead>
                        <TableHead className="text-right">Total Winnings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboardData.map((player, index) => (
                        <TableRow key={player.userId} className={index < 3 ? "bg-slate-800/30" : ""}>
                          <TableCell className="font-medium">
                            <div className="flex items-center justify-center">
                              {index === 0 ? (
                                <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                                  <Trophy className="h-4 w-4 text-amber-400" />
                                </div>
                              ) : index === 1 ? (
                                <div className="h-8 w-8 rounded-full bg-slate-400/20 flex items-center justify-center">
                                  <Medal className="h-4 w-4 text-slate-300" />
                                </div>
                              ) : index === 2 ? (
                                <div className="h-8 w-8 rounded-full bg-amber-700/20 flex items-center justify-center">
                                  <Award className="h-4 w-4 text-amber-700" />
                                </div>
                              ) : (
                                <span className="text-slate-400">{index + 1}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full overflow-hidden mr-3 bg-slate-800">
                                <img 
                                  src={player.avatar} 
                                  alt={player.username}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <span className={index < 3 ? "font-medium" : ""}>{player.username}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{player.totalBets}</TableCell>
                          <TableCell className="text-right">{player.totalWins}</TableCell>
                          <TableCell className="text-right">{player.winRate}%</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(player.totalWinnings)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* By Game Type Tab */}
          <TabsContent value="by-game" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coin Flip Leaders */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center">
                    <Dice1 className="h-5 w-5 mr-2 text-blue-400" />
                    Coin Flip Leaders
                  </CardTitle>
                  <CardDescription>Top players in our coin flip game</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingCoinflipLeaderboard ? (
                    <div className="py-12 flex justify-center">
                      <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent"></div>
                    </div>
                  ) : coinflipLeaderboardError ? (
                    <div className="py-6 text-center text-red-400">
                      <p>Failed to load coin flip leaderboard data.</p>
                    </div>
                  ) : coinflipLeaderboardData.length === 0 ? (
                    <div className="py-6 text-center text-slate-400">
                      <p>No coin flip leaderboard data available.</p>
                    </div>
                  ) : (
                    coinflipLeaderboardData.slice(0, 3).map((player, index) => (
                      <div 
                        key={player.userId}
                        className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0"
                      >
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center mr-3 bg-slate-800/60">
                            {index === 0 ? (
                              <Trophy className="h-4 w-4 text-amber-400" />
                            ) : index === 1 ? (
                              <Medal className="h-4 w-4 text-slate-300" />
                            ) : (
                              <Award className="h-4 w-4 text-amber-700" />
                            )}
                          </div>
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full overflow-hidden mr-3 bg-slate-800">
                              <img 
                                src={player.avatar} 
                                alt={player.username}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium">{player.username}</p>
                              <p className="text-xs text-slate-400">{player.totalWins} wins • {player.winRate}% win rate</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-medium">
                          {formatCurrency(player.totalWinnings)}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              
              {/* Cricket Toss Leaders */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2 text-emerald-400" />
                    Cricket Toss Leaders
                  </CardTitle>
                  <CardDescription>Top players in cricket toss betting</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingCricketTossLeaderboard ? (
                    <div className="py-12 flex justify-center">
                      <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent"></div>
                    </div>
                  ) : cricketTossLeaderboardError ? (
                    <div className="py-6 text-center text-red-400">
                      <p>Failed to load cricket toss leaderboard data.</p>
                    </div>
                  ) : cricketTossLeaderboardData.length === 0 ? (
                    <div className="py-6 text-center text-slate-400">
                      <p>No cricket toss leaderboard data available.</p>
                    </div>
                  ) : (
                    cricketTossLeaderboardData.slice(0, 3).map((player, index) => (
                      <div 
                        key={player.userId}
                        className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0"
                      >
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center mr-3 bg-slate-800/60">
                            {index === 0 ? (
                              <Trophy className="h-4 w-4 text-amber-400" />
                            ) : index === 1 ? (
                              <Medal className="h-4 w-4 text-slate-300" />
                            ) : (
                              <Award className="h-4 w-4 text-amber-700" />
                            )}
                          </div>
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full overflow-hidden mr-3 bg-slate-800">
                              <img 
                                src={player.avatar} 
                                alt={player.username}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium">{player.username}</p>
                              <p className="text-xs text-slate-400">{player.totalWins} wins • {player.winRate}% win rate</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-medium">
                          {formatCurrency(player.totalWinnings)}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              
              {/* Market Games Leaders */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-violet-400" />
                    Market Game Leaders
                  </CardTitle>
                  <CardDescription>Top players in market betting games</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingSatamatkaLeaderboard ? (
                    <div className="py-12 flex justify-center">
                      <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent"></div>
                    </div>
                  ) : satamatkaLeaderboardError ? (
                    <div className="py-6 text-center text-red-400">
                      <p>Failed to load satamatka leaderboard data.</p>
                    </div>
                  ) : satamatkaLeaderboardData.length === 0 ? (
                    <div className="py-6 text-center text-slate-400">
                      <p>No market game leaderboard data available.</p>
                    </div>
                  ) : (
                    satamatkaLeaderboardData.slice(0, 3).map((player, index) => (
                      <div 
                        key={player.userId}
                        className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0"
                      >
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center mr-3 bg-slate-800/60">
                            {index === 0 ? (
                              <Trophy className="h-4 w-4 text-amber-400" />
                            ) : index === 1 ? (
                              <Medal className="h-4 w-4 text-slate-300" />
                            ) : (
                              <Award className="h-4 w-4 text-amber-700" />
                            )}
                          </div>
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full overflow-hidden mr-3 bg-slate-800">
                              <img 
                                src={player.avatar} 
                                alt={player.username}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium">{player.username}</p>
                              <p className="text-xs text-slate-400">{player.totalWins} wins • {player.winRate}% win rate</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-medium">
                          {formatCurrency(player.totalWinnings)}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              
              {/* Sports Betting Leaders section removed */}
            </div>
          </TabsContent>
          
          {/* Recent Big Wins Tab */}
          <TabsContent value="recent-wins" className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Recent Big Wins</CardTitle>
                <CardDescription>
                  Players who have recently won big on our platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRecentWins ? (
                  <div className="py-12 flex justify-center">
                    <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent"></div>
                  </div>
                ) : recentWinsError ? (
                  <div className="py-12 text-center text-red-400">
                    <p>Failed to load recent wins data. Please try again later.</p>
                  </div>
                ) : recentWinsData.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <p>No recent big wins available yet.</p>
                    <p className="text-sm mt-2">Check back later as more players win big!</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead>Game</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead className="text-right">Bet Amount</TableHead>
                        <TableHead className="text-right">Win Amount</TableHead>
                        <TableHead className="text-right">Multiplier</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentWinsData.map((win) => (
                        <TableRow key={win.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full overflow-hidden mr-3 bg-slate-800">
                                <img 
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${win.username}`} 
                                  alt={win.username}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <span>{win.username}</span>
                            </div>
                          </TableCell>
                          <TableCell>{win.game}</TableCell>
                          <TableCell>{formatDate(win.createdAt)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(win.amount)}</TableCell>
                          <TableCell className="text-right font-medium text-emerald-400">
                            {formatCurrency(win.payout)}
                          </TableCell>
                          <TableCell className="text-right">
                            {(win.payout / win.amount).toFixed(1)}x
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            
            {/* Call to action */}
            <div className="bg-gradient-to-r from-slate-800/70 to-indigo-900/30 p-6 rounded-lg border border-slate-700 text-center">
              <h3 className="text-xl font-bold mb-2">Want to join the leaderboard?</h3>
              <p className="text-slate-400 mb-4">Start playing now and climb your way to the top!</p>
              <div className="flex justify-center gap-4">
                <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500">
                  Play Now
                </Button>
                <Button variant="outline" className="border-slate-600">
                  View All Games
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}