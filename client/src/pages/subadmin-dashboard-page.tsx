import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/dashboard-layout";
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  DollarSign, 
  UserCheck, 
  Calendar, 
  BarChart3,
  ChevronUp,
  ChevronDown,
  History
} from "lucide-react";

// Type definitions for the data returned from API
interface SubadminStats {
  totalProfit: number;
  totalDeposits: number;
  totalUsers: number;
  activeUsers: number;
}

interface GameRecord {
  id: number;
  userId: number;
  gameType: string;
  betAmount: number;
  prediction: string;
  result: string;
  payout: number;
  createdAt: string;
}
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function SubadminDashboardPage() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Get subadmin stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<SubadminStats>({
    queryKey: ['/api/subadmin/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Get recent games
  const { data: recentGames, isLoading: isLoadingRecentGames } = useQuery<GameRecord[]>({
    queryKey: ['/api/games/recent'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  const formatCurrency = (amount: number) => {
    // Convert paise to rupees by dividing by 100
    const amountInRupees = (amount || 0) / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountInRupees);
  };
  
  // Function to determine trend indicator and color
  const renderTrend = (isPositive: boolean) => {
    return isPositive ? (
      <div className="flex items-center text-green-600">
        <ChevronUp className="h-4 w-4 mr-1" />
        <span>Up</span>
      </div>
    ) : (
      <div className="flex items-center text-red-600">
        <ChevronDown className="h-4 w-4 mr-1" />
        <span>Down</span>
      </div>
    );
  };
  
  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoadingStats ? (
            // Loading skeleton for stats cards
            <>
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="bg-slate-900/50 animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-4 w-24 bg-slate-800 rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 w-36 bg-slate-800 rounded"></div>
                    <div className="h-3 w-20 bg-slate-800 rounded mt-2"></div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : stats ? (
            <>
              {/* Total Profit Card */}
              <Card className="bg-slate-900/50 border-indigo-500/20 hover:border-indigo-500/50 transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Profit
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                    {formatCurrency(stats.totalProfit)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    From all player bets
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  {renderTrend(stats.totalProfit > 0)}
                </CardFooter>
              </Card>
              
              {/* Total Deposits Card */}
              <Card className="bg-slate-900/50 border-purple-500/20 hover:border-purple-500/50 transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Deposits
                  </CardTitle>
                  <Wallet className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-fuchsia-400">
                    {formatCurrency(stats.totalDeposits)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Funds added to user accounts
                  </p>
                </CardContent>
              </Card>
              
              {/* Total Users Card */}
              <Card className="bg-slate-900/50 border-blue-500/20 hover:border-blue-500/50 transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
                    {stats.totalUsers}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Players assigned to you
                  </p>
                </CardContent>
              </Card>
              
              {/* Active Users Card */}
              <Card className="bg-slate-900/50 border-green-500/20 hover:border-green-500/50 transition-all">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Users
                  </CardTitle>
                  <UserCheck className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
                    {stats.activeUsers}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Users who played games
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="text-xs text-muted-foreground">
                    {stats.activeUsers > 0 && stats.totalUsers > 0 ? 
                      `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}% engagement` : 
                      '0% engagement'}
                  </div>
                </CardFooter>
              </Card>
            </>
          ) : (
            <div className="col-span-4 text-center py-4 text-muted-foreground">
              No statistics available
            </div>
          )}
        </div>
        
        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="group"
            onClick={() => setLocation("/users")}
          >
            <Users className="h-4 w-4 mr-2 text-indigo-400 group-hover:text-indigo-300" />
            Manage Players
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="group"
            onClick={() => setLocation("/settings")}
          >
            <TrendingUp className="h-4 w-4 mr-2 text-green-400 group-hover:text-green-300" />
            Configure Game Odds
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="group"
            onClick={() => setLocation("/games/history")}
          >
            <History className="h-4 w-4 mr-2 text-purple-400 group-hover:text-purple-300" />
            Game History
          </Button>
        </div>
        
        {/* Recent Activities and Reports */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 bg-slate-800/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          </TabsList>
          
          {/* Overview Section */}
          <TabsContent value="overview">
            <Card className="bg-slate-900/50">
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
                <CardDescription>
                  Your profit and player activity summary
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center py-6 text-muted-foreground">
                  <BarChart3 className="h-16 w-16 opacity-50" />
                </div>
                <p className="text-center text-muted-foreground">
                  Detailed performance charts will be available soon
                </p>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" size="sm">
                  View Full Report
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Recent Activity Section */}
          <TabsContent value="recent">
            <Card className="bg-slate-900/50">
              <CardHeader>
                <CardTitle>Recent Games</CardTitle>
                <CardDescription>
                  Latest game activities from your players
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRecentGames ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-slate-800 pb-3 last:border-0">
                        <div className="space-y-1">
                          <div className="h-4 w-32 bg-slate-800 rounded animate-pulse"></div>
                          <div className="h-3 w-24 bg-slate-800 rounded animate-pulse"></div>
                        </div>
                        <div className="h-5 w-16 bg-slate-800 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : recentGames && recentGames.length > 0 ? (
                  <div className="space-y-4">
                    {recentGames.map((game) => (
                      <div key={game.id} className="flex items-center justify-between border-b border-slate-800 pb-3 last:border-0">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{game.gameType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</div>
                          <div className="text-xs text-muted-foreground">
                            User: {game.userId} • {new Date(game.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className={`font-medium ${game.payout > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {game.payout > 0 ? '+' : ''}{formatCurrency(game.payout)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    No recent games found
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setLocation("/games/history")}>
                  View All Games
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}