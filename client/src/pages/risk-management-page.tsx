import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/dashboard-layout";
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Activity,
  TrendingDown,
  TrendingUp,
  Users,
  Target,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
}

interface RiskManagementData {
  summaries: RiskSummary[];
  detailedData: DetailedRiskData;
  userInfo: { [userId: string]: { username: string } };
  marketInfo: { [marketId: string]: { name: string; type: string } };
  message?: string;
}

// Interface for user info to display names instead of IDs
interface UserInfo {
  [userId: string]: { username: string };
}

// Interface for market info to display names instead of IDs
interface MarketInfo {
  [marketId: string]: { name: string; type: string };
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-1/4" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}

export default function SimplifiedRiskPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const isSubadmin = user?.role === UserRole.SUBADMIN;
  const [activeTab, setActiveTab] = useState('market-game');
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [marketInfo, setMarketInfo] = useState<MarketInfo>({});
  const [betTypeFilter, setBetTypeFilter] = useState<string>('all');
  const [marketFilter, setMarketFilter] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'regular' | 'odd-even' | 'harf'>('regular');
  
  // Risk level threshold configuration
  const [riskThresholds, setRiskThresholds] = useState({
    high: 1000,
    medium: 500,
    low: 100
  });
  
  // Whether risk configuration dialog is open
  const [riskConfigOpen, setRiskConfigOpen] = useState(false);
  
  // Player details modal state
  const [playerDetailsModal, setPlayerDetailsModal] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalTitle, setModalTitle] = useState('');
  const playersPerPage = 10;
  
  // Subadmin filtering state (only for admin users)
  const [selectedSubadminId, setSelectedSubadminId] = useState<number | null>(null);
  const [subadminSearch, setSubadminSearch] = useState('');
  
  // Form for risk threshold configuration
  const riskConfigForm = useForm({
    defaultValues: {
      highRisk: riskThresholds.high / 100,
      mediumRisk: riskThresholds.medium / 100,
      lowRisk: riskThresholds.low / 100
    }
  });

  // Get the appropriate API endpoint based on user role
  const endpoint = isAdmin ? '/api/risk/admin' : '/api/risk/subadmin';

  // Fetch risk management data
  const { data, isLoading, error } = useQuery<RiskManagementData>({
    queryKey: [endpoint, selectedSubadminId],
    queryFn: async () => {
      const url = selectedSubadminId ? `${endpoint}?subadminId=${selectedSubadminId}` : endpoint;
      const response = await apiRequest('GET', url);
      const data = await response.json();
      return data as RiskManagementData;
    },
    refetchInterval: 60000 // Refetch every minute to keep data fresh
  });

  // Fetch subadmins list for admin users
  const { data: subadmins = [], isLoading: isLoadingSubadmins } = useQuery({
    queryKey: ["/api/users"],
    select: (data: any) => data.filter((user: any) => user.role === UserRole.SUBADMIN),
    enabled: !!user && user.role === UserRole.ADMIN,
  });
  
  // Fetch game odds for the current user (admin or subadmin)
  const { data: gameOddsData, isLoading: isLoadingOdds } = useQuery({
    queryKey: [isAdmin ? '/api/odds/admin' : `/api/game-odds/subadmin/${user?.id}`, user?.id],
    queryFn: async () => {
      try {
        // Use the proper endpoint based on user role
        // For subadmins, use their specific ID to get their custom odds
        const endpoint = isAdmin 
          ? '/api/odds/admin' 
          : `/api/game-odds/subadmin/${user?.id}`;
        
        console.log(`Fetching game odds from: ${endpoint}`);
        const response = await apiRequest('GET', endpoint);
        const data = await response.json();
        console.log('Retrieved game odds data:', data);
        return data;
      } catch (error) {
        console.error("Error fetching game odds:", error);
        // Return default odds in case of error
        return [
          { gameType: 'satamatka_jodi', oddValue: 95 },
          { gameType: 'satamatka_odd_even', oddValue: 1.95 },
          { gameType: 'satamatka_harf', oddValue: 9.5 },
          { gameType: 'satamatka_single', oddValue: 9.5 }
        ];
      }
    },
    enabled: !!user,
  });
  
  // Use real user names from the API
  React.useEffect(() => {
    if (data?.userInfo) {
      setUserInfo(data.userInfo);
    }
  }, [data]);
  
  // Use real market names from the API
  React.useEffect(() => {
    if (data?.marketInfo) {
      setMarketInfo(data.marketInfo);
    }
  }, [data]);

  // Function to save risk thresholds
  const saveRiskThresholds = (values: any) => {
    // Convert rupees back to database values (multiply by 100)
    setRiskThresholds({
      high: values.highRisk * 100,
      medium: values.mediumRisk * 100,
      low: values.lowRisk * 100
    });
    setRiskConfigOpen(false);
  };

  // Helper function for risk level badge
  const getRiskLevelBadge = (level: string) => {
    if (level === 'high') return <Badge className="bg-[#9333EA] text-white">High</Badge>;
    if (level === 'medium') return <Badge className="bg-[#9333EA] text-white">Medium</Badge>;
    if (level === 'low') return <Badge className="bg-[#9333EA] text-white">Low</Badge>;
    return null;
  };

  // Function to show player details in modal
  const showPlayerDetails = (players: any[], title: string) => {
    setSelectedPlayers(players);
    setModalTitle(title);
    setCurrentPage(1);
    setPlayerDetailsModal(true);
  };

  // Calculate pagination for player details
  const totalPages = Math.ceil(selectedPlayers.length / playersPerPage);
  const startIndex = (currentPage - 1) * playersPerPage;
  const endIndex = startIndex + playersPerPage;
  const currentPlayers = selectedPlayers.slice(startIndex, endIndex);

  // Filter subadmins based on search
  const filteredSubadmins = subadmins.filter((subadmin: any) =>
    subadmin.username.toLowerCase().includes(subadminSearch.toLowerCase())
  );

  // Prepare data conditionally but without using hooks
  let marketGameData = null;
  let cricketTossData = null;
  
  if (data && data.summaries) {
    marketGameData = data.summaries.find(summary => summary.gameType === 'satamatka');
    cricketTossData = data.summaries.find(summary => summary.gameType === 'cricket_toss');
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Jantri Management" activeTab="risk-management">
        <div className="p-6">
          <LoadingSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Jantri Management" activeTab="risk-management">
        <div className="p-6">
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-300 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Error Loading Jantri Management Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>There was a problem loading the jantri management data. Please try again later.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!data || !data.summaries || data.summaries.length === 0) {
    return (
      <DashboardLayout title="Jantri Management" activeTab="risk-management">
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>Jantri Management</CardTitle>
              <CardDescription>No game data available</CardDescription>
            </CardHeader>
            <CardContent>
              <p>There's currently no data to display. This may be because there are no active games or bets in the system.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Jantri Management" activeTab="risk-management">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {isAdmin ? 'Platform-wide Jantri Analysis' : 'Jantri Analysis for Your Players'}
            </h2>
            <p className="text-muted-foreground">
              Monitor and manage Satamatka numbers with comprehensive betting data
            </p>
          </div>
        </div>

        {/* Subadmin Filter Section (Admin Only) */}
        {isAdmin && (
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border-primary/20 dark:border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" />
                Filter by Subadmin
              </CardTitle>
              <CardDescription>
                Filter jantri data by specific subadmin to analyze their players' betting patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search subadmins..."
                    value={subadminSearch}
                    onChange={(e) => setSubadminSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Subadmin Dropdown */}
                <div className="flex-1">
                  <Select
                    value={selectedSubadminId?.toString() || "all"}
                    onValueChange={(value) => {
                      setSelectedSubadminId(value === "all" ? null : parseInt(value));
                      setSubadminSearch(''); // Clear search when selecting
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select subadmin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subadmins</SelectItem>
                      {filteredSubadmins.map((subadmin: any) => (
                        <SelectItem key={subadmin.id} value={subadmin.id.toString()}>
                          {subadmin.username}
                          {subadmin.isBlocked && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              Blocked
                            </Badge>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Clear Filter Button */}
                {selectedSubadminId && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedSubadminId(null);
                      setSubadminSearch('');
                    }}
                    className="shrink-0"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
              
              {/* Selected Subadmin Info */}
              {selectedSubadminId && (
                <div className="mt-4 p-3 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">
                      Viewing data for: {subadmins.find((s: any) => s.id === selectedSubadminId)?.username}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Risk Configuration Dialog */}
        <Dialog open={riskConfigOpen} onOpenChange={setRiskConfigOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Configure Risk Thresholds</DialogTitle>
              <DialogDescription>
                Set the bet amount thresholds for different risk levels. Values are in rupees.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...riskConfigForm}>
              <form onSubmit={riskConfigForm.handleSubmit(saveRiskThresholds)} className="space-y-4">
                <FormField
                  control={riskConfigForm.control}
                  name="highRisk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>High Risk Threshold (₹)</FormLabel>
                      <FormDescription>
                        Bets above this amount will be marked as high risk (red)
                      </FormDescription>
                      <FormControl>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[field.value]}
                            min={100}
                            max={10000}
                            step={100}
                            onValueChange={(vals) => field.onChange(vals[0])}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={field.value}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            className="w-24"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={riskConfigForm.control}
                  name="mediumRisk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medium Risk Threshold (₹)</FormLabel>
                      <FormDescription>
                        Bets above this amount but below high risk will be marked as medium risk (orange)
                      </FormDescription>
                      <FormControl>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[field.value]}
                            min={50}
                            max={9900}
                            step={100}
                            onValueChange={(vals) => field.onChange(vals[0])}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={field.value}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            className="w-24"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={riskConfigForm.control}
                  name="lowRisk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Low Risk Threshold (₹)</FormLabel>
                      <FormDescription>
                        Bets above this amount but below medium risk will be marked as low risk (blue)
                      </FormDescription>
                      <FormControl>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[field.value]}
                            min={1}
                            max={5000}
                            step={10}
                            onValueChange={(vals) => field.onChange(vals[0])}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={field.value}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            className="w-24"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setRiskConfigOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Player Details Modal */}
        <Dialog open={playerDetailsModal} onOpenChange={setPlayerDetailsModal}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {modalTitle}
              </DialogTitle>
              <DialogDescription>
                Player betting details with risk analysis
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 min-h-0">
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-4">
                  {currentPlayers.map((player, index) => (
                    <Card key={startIndex + index} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="font-semibold text-base mb-2">
                              {userInfo[player.userId] ? userInfo[player.userId].username : `Player ${player.userId}`}
                            </h4>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div>Player ID: {player.userId}</div>
                              <div>Market: {marketInfo[player.marketId] ? marketInfo[player.marketId].name : `Market ${player.marketId}`}</div>
                              <div>Prediction: <span className="font-medium text-foreground">{player.prediction}</span></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">Bet Amount:</span>
                                <span className="font-semibold">₹{(player.betAmount / 100).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Potential Win:</span>
                                <span className="font-semibold text-green-600">
                                  {(() => {
                                    // Determine the appropriate multiplier based on game type and prediction
                                    let multiplier = 90; // Default fallback
                                    
                                    if (gameOddsData && Array.isArray(gameOddsData)) {
                                      // Determine the game type based on player's bet
                                      let gameTypeKey = 'satamatka_jodi'; // Default
                                      
                                      if (player.gameMode === 'harf' || 
                                          player.prediction?.startsWith('A') || 
                                          player.prediction?.startsWith('B')) {
                                        gameTypeKey = 'satamatka_harf';
                                      } else if (player.gameMode === 'oddeven' || 
                                                player.prediction === 'odd' || 
                                                player.prediction === 'even') {
                                        gameTypeKey = 'satamatka_odd_even';
                                      } else if (/^\d{2}$/.test(player.prediction)) {
                                        gameTypeKey = 'satamatka_jodi';
                                      }
                                      
                                      // Find odds for this game type
                                      const odds = gameOddsData.find((odd: any) => odd.gameType === gameTypeKey);
                                      
                                      if (odds && odds.oddValue !== undefined) {
                                        // Parse odds value based on format
                                        if (odds.oddValue >= 100000) {
                                          multiplier = odds.oddValue / 10000;
                                        } else if (odds.oddValue >= 10) {
                                          multiplier = odds.oddValue;
                                        } else {
                                          multiplier = odds.oddValue;
                                        }
                                      }
                                    }
                                    
                                    return `₹${((player.betAmount * multiplier) / 100).toFixed(2)}`;
                                  })()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Bet Type:</span>
                                <span className="text-sm">{player.gameMode || player.betType || 'jodi'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end">
                            <div className="mb-2">
                              {(() => {
                                let riskLevel = 'low';
                                if (player.betAmount > riskThresholds.high) riskLevel = 'high';
                                else if (player.betAmount > riskThresholds.medium) riskLevel = 'medium';
                                return getRiskLevelBadge(riskLevel);
                              })()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Game ID: {player.id}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Status: {player.result || 'Pending'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {currentPlayers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No player data available
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, selectedPlayers.length)} of {selectedPlayers.length} players
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setPlayerDetailsModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Separator />

        {/* Detailed Analysis Tabs */}
        <Tabs defaultValue="market-game" className="w-full mt-6" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="market-game">Satamatka Analysis</TabsTrigger>
            <TabsTrigger value="cricket-toss">Cricket Toss Risk</TabsTrigger>
          </TabsList>
          
          <TabsContent value="market-game" className="mt-0">
            
            {marketGameData && (
              <>
                {/* Satamatka Overview Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Active Bets
                      </CardTitle>
                      <Activity className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {data.detailedData.gameData.filter(game => 
                          game.gameType === 'satamatka' && 
                          (!game.result || game.result === 'pending')
                        ).length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        All bet types in Satamatka markets
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Potential Win
                      </CardTitle>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ₹{(data.detailedData.gameData
                          .filter(game => 
                            game.gameType === 'satamatka' && 
                            (!game.result || game.result === 'pending')
                          )
                          .reduce((sum, game) => sum + ((game.betAmount || 0) * 90), 0) / 100
                        ).toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Maximum possible payout
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Bet Amount
                      </CardTitle>
                      <Target className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ₹{(data.detailedData.gameData
                          .filter(game => 
                            game.gameType === 'satamatka' && 
                            (!game.result || game.result === 'pending')
                          )
                          .reduce((sum, game) => sum + (game.betAmount || 0), 0) / 100
                        ).toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total amount wagered
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Unique Active Users
                      </CardTitle>
                      <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {new Set(data.detailedData.gameData
                          .filter(game => 
                            game.gameType === 'satamatka' && 
                            (!game.result || game.result === 'pending')
                          )
                          .map(game => game.userId)
                        ).size}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Players with active bets
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <Card className="mb-6 border-primary/20 bg-primary/5">
                  <CardHeader className="border-b border-primary/20">
                    <CardTitle>Jantri Risk Analysis</CardTitle>
                    <CardDescription>
                      View and analyze bets by number, market, and player
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-5 mb-6">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold w-24">Market:</span>
                          <select 
                            className="p-2 border rounded-md w-48 bg-background/70 border-border/60 focus:border-primary/70 focus:ring-1 focus:ring-primary/50"
                            value={marketFilter === 'all' ? 'all' : marketFilter.toString()}
                            onChange={(e) => setMarketFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                          >
                            <option value="all">All Markets</option>
                            {Object.entries(marketInfo).map(([id, market]) => (
                              <option key={id} value={id}>
                                {market.name} ({market.type})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* View Selector */}
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold w-24">View Mode:</span>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge 
                              className={`cursor-pointer px-3 py-1 ${viewMode === 'regular' && betTypeFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-primary/20 hover:bg-primary/30 text-foreground'}`}
                              onClick={() => {
                                setViewMode('regular');
                                setBetTypeFilter('all');
                              }}
                            >
                              All Numbers
                            </Badge>
                            <Badge 
                              className={`cursor-pointer px-3 py-1 ${viewMode === 'regular' && betTypeFilter === 'jodi' ? 'bg-primary text-primary-foreground' : 'bg-primary/20 hover:bg-primary/30 text-foreground'}`}
                              onClick={() => {
                                setViewMode('regular');
                                setBetTypeFilter('jodi');
                              }}
                            >
                              Jodi Only
                            </Badge>
                            <Badge 
                              className={`cursor-pointer px-3 py-1 ${viewMode === 'odd-even' ? 'bg-primary text-primary-foreground' : 'bg-primary/20 hover:bg-primary/30 text-foreground'}`}
                              onClick={() => setViewMode('odd-even')}
                            >
                              Odd/Even
                            </Badge>
                            <Badge 
                              className={`cursor-pointer px-3 py-1 ${viewMode === 'harf' ? 'bg-primary text-primary-foreground' : 'bg-primary/20 hover:bg-primary/30 text-foreground'}`}
                              onClick={() => setViewMode('harf')}
                            >
                              Harf (A0-B9)
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 py-3 px-4 bg-muted/30 rounded-md border border-border/30">
                          <div className="flex items-center space-x-1">
                            <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                            <span className="text-xs">High Risk (₹{(riskThresholds.high/100).toFixed(2)}+)</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="inline-block w-3 h-3 rounded-full bg-orange-500"></span>
                            <span className="text-xs">Medium Risk (₹{(riskThresholds.medium/100).toFixed(2)}+)</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
                            <span className="text-xs">Low Risk (Above ₹0)</span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="ml-auto text-xs bg-background/70 hover:bg-background" 
                            onClick={() => setRiskConfigOpen(true)}
                          >
                            Configure Risk Levels
                          </Button>
                        </div>
                    </div>
                    
                    {/* Statistics Cards Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {(() => {
                        // Calculate filtered statistics based on current filters
                        const filteredGames = data.detailedData.gameData.filter(game => {
                          if (game.gameType !== 'satamatka') return false;
                          if (game.result && game.result !== 'pending') return false;
                          if (marketFilter !== 'all' && game.marketId !== marketFilter) return false;
                          
                          // Apply bet type filters
                          if (viewMode === 'regular') {
                            if (betTypeFilter === 'jodi') {
                              return game.gameMode === 'jodi';
                            } else if (betTypeFilter === 'all') {
                              return true; // Include all regular bet types
                            }
                          } else if (viewMode === 'odd-even') {
                            return game.gameMode === 'odd_even';
                          } else if (viewMode === 'harf') {
                            return game.gameMode === 'harf';
                          }
                          
                          return true;
                        });
                        
                        // Calculate totals
                        const totalBets = filteredGames.length;
                        const totalBetAmount = filteredGames.reduce((sum, game) => sum + (game.betAmount || 0), 0);
                        const uniqueUsers = new Set(filteredGames.map(game => game.playerId)).size;
                        
                        // Calculate potential win based on bet types and odds
                        const potentialWin = filteredGames.reduce((sum, game) => {
                          // Default multipliers in case game odds data is unavailable
                          const defaultMultipliers = {
                            jodi: 95,
                            odd_even: 1.95,
                            harf: 9.5,
                            single: 9.5,
                            crossing: 9.5,
                            default: 9.5
                          };
                          
                          // Initialize with default multiplier based on game mode
                          let multiplier = defaultMultipliers[game.gameMode as keyof typeof defaultMultipliers] || defaultMultipliers.default;
                          
                          // If game odds data is available, use it instead of defaults
                          if (gameOddsData && Array.isArray(gameOddsData)) {
                            let gameTypeKey = '';
                            
                            // Map game mode to the corresponding game type in the odds data
                            switch (game.gameMode) {
                              case 'jodi':
                                gameTypeKey = 'satamatka_jodi';
                                break;
                              case 'odd_even':
                                gameTypeKey = 'satamatka_odd_even';
                                break;
                              case 'harf':
                                gameTypeKey = 'satamatka_harf';
                                break;
                              case 'single':
                                gameTypeKey = 'satamatka_single';
                                break;
                              case 'crossing':
                                gameTypeKey = 'satamatka_crossing';
                                break;
                              default:
                                gameTypeKey = '';
                            }
                            
                            if (gameTypeKey) {
                              const odds = gameOddsData.find((odd: any) => odd.gameType === gameTypeKey);
                              if (odds && odds.oddValue) {
                                multiplier = odds.oddValue;
                              }
                            }
                          }
                          
                          // Calculate potential win amount for this game
                          return sum + ((game.betAmount || 0) * multiplier);
                        }, 0);
                        
                        return (
                          <>
                            {/* Total Active Bet Amount */}
                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Bet Amount</p>
                                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">₹{(totalBetAmount / 100).toFixed(2)}</p>
                                  </div>
                                  <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
                                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            
                            {/* Potential Win */}
                            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Potential Win</p>
                                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">₹{(potentialWin / 100).toFixed(2)}</p>
                                  </div>
                                  <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            
                            {/* Total Active Users */}
                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Active Users</p>
                                    <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">{uniqueUsers}</p>
                                  </div>
                                  <div className="h-12 w-12 bg-purple-500 rounded-full flex items-center justify-center">
                                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            
                            {/* Total Bet Count */}
                            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Total Bets</p>
                                    <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">{totalBets}</p>
                                  </div>
                                  <div className="h-12 w-12 bg-orange-500 rounded-full flex items-center justify-center">
                                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </>
                        );
                      })()}
                    </div>
                    
                    <ScrollArea className="h-[600px]">
                      {viewMode === 'odd-even' ? (
                        <div className="p-4">
                          <h3 className="text-lg font-bold mb-4">Odd/Even Risk Management</h3>
                          <div className="grid grid-cols-2 gap-6">
                            {/* Odd Numbers Section */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">Odd Bet Type</CardTitle>
                              </CardHeader>
                              <CardContent>
                                {(() => {
                                  // Filter games specifically for "odd" bet type in odd_even game mode
                                  const oddGames = data.detailedData.gameData.filter(game => {
                                    if (game.gameType !== 'satamatka') return false;
                                    if (game.result && game.result !== 'pending') return false;
                                    if (marketFilter !== 'all' && game.marketId !== marketFilter) return false;
                                    
                                    // Look for games specifically with "odd" bet type in odd_even game mode
                                    return game.gameMode === 'odd_even' && game.prediction === 'odd';
                                  });
                                  
                                  // Get game odds from context if available
                                  let oddEvenMultiplier = 1.9; // Default odds multiplier
                                  
                                  // Try to get the custom odds for satamatka_odd_even game type
                                  if (data.gameOdds && Array.isArray(data.gameOdds)) {
                                    const oddEvenData = data.gameOdds.find(odd => 
                                      odd.gameType === 'satamatka_odd_even');
                                    
                                    if (oddEvenData && oddEvenData.oddValue) {
                                      // Database stores odds as integer values (e.g., 19000 for 1.9)
                                      oddEvenMultiplier = oddEvenData.oddValue / 10000;
                                      console.log('Using satamatka_odd_even odds from database:', oddEvenMultiplier);
                                    }
                                  }
                                  
                                  // Calculate totals
                                  const totalBets = oddGames.length;
                                  const totalBetAmount = oddGames.reduce((sum, game) => sum + (game.betAmount || 0), 0);
                                  // Using the gameOddsData directly to calculate potential win
                                  let oddEvenMultiplierValue = 1.9; // Default fallback
                                  
                                  if (gameOddsData && Array.isArray(gameOddsData)) {
                                    console.log('Game odds data:', gameOddsData);
                                    const oddEvenOdds = gameOddsData.find((odd: any) => 
                                      odd.gameType === 'satamatka_odd_even');
                                    
                                    if (oddEvenOdds && oddEvenOdds.oddValue !== undefined) {
                                      console.log('Raw odd_even odds value:', oddEvenOdds.oddValue, 'Type:', typeof oddEvenOdds.oddValue);
                                      
                                      // The value is already in the correct format (1.95)
                                      oddEvenMultiplierValue = oddEvenOdds.oddValue;
                                      
                                      console.log('Using actual odd_even multiplier:', oddEvenMultiplierValue);
                                    }
                                  }
                                  
                                  const potentialWin = oddGames.reduce((sum, game) => sum + ((game.betAmount || 0) * oddEvenMultiplierValue), 0);
                                  
                                  // Define risk level
                                  let riskLevel = 'none';
                                  if (totalBetAmount > riskThresholds.high) riskLevel = 'high';
                                  else if (totalBetAmount > riskThresholds.medium) riskLevel = 'medium';
                                  else if (totalBetAmount > 0) riskLevel = 'low';
                                  
                                  return (
                                    <div className="space-y-4">
                                      <div className="flex justify-between">
                                        <span className="font-medium">Active Bets:</span>
                                        <span>{totalBets}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="font-medium">Total Bet Amount:</span>
                                        <span>₹{(totalBetAmount / 100).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="font-medium">Potential Win:</span>
                                        <span>₹{(potentialWin / 100).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium">Risk Level:</span>
                                        <span>{getRiskLevelBadge(riskLevel)}</span>
                                      </div>
                                      {totalBets > 0 && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="w-full mt-3"
                                          onClick={() => showPlayerDetails(oddGames, `Odd Numbers Players (${totalBets} players)`)}
                                        >
                                          <Eye className="h-4 w-4 mr-2" />
                                          View Players
                                        </Button>
                                      )}
                                    </div>
                                  );
                                })()}
                              </CardContent>
                            </Card>
                            
                            {/* Even Numbers Section */}
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-base">Even Bet Type</CardTitle>
                              </CardHeader>
                              <CardContent>
                                {(() => {
                                  // Filter games specifically for "even" bet type in odd_even game mode
                                  const evenGames = data.detailedData.gameData.filter(game => {
                                    if (game.gameType !== 'satamatka') return false;
                                    if (game.result && game.result !== 'pending') return false;
                                    if (marketFilter !== 'all' && game.marketId !== marketFilter) return false;
                                    
                                    // Look for games specifically with "even" bet type in odd_even game mode
                                    return game.gameMode === 'odd_even' && game.prediction === 'even';
                                  });
                                  
                                  // Get game odds from context if available
                                  let oddEvenMultiplier = 1.9; // Default odds multiplier
                                  
                                  // Try to get the custom odds for satamatka_odd_even game type
                                  if (data.gameOdds && Array.isArray(data.gameOdds)) {
                                    const oddEvenData = data.gameOdds.find(odd => 
                                      odd.gameType === 'satamatka_odd_even');
                                    
                                    if (oddEvenData && oddEvenData.oddValue) {
                                      // Database stores odds as integer values (e.g., 19000 for 1.9)
                                      oddEvenMultiplier = oddEvenData.oddValue / 10000;
                                      console.log('Using satamatka_odd_even odds from database for even bets:', oddEvenMultiplier);
                                    }
                                  }
                                  
                                  // Calculate totals
                                  const totalBets = evenGames.length;
                                  const totalBetAmount = evenGames.reduce((sum, game) => sum + (game.betAmount || 0), 0);
                                  // Using the gameOddsData directly to calculate potential win
                                  let oddEvenMultiplierValue = 1.9; // Default fallback
                                  
                                  if (gameOddsData && Array.isArray(gameOddsData)) {
                                    console.log('Game odds data for even bets:', gameOddsData);
                                    const oddEvenOdds = gameOddsData.find((odd: any) => 
                                      odd.gameType === 'satamatka_odd_even');
                                    
                                    if (oddEvenOdds && oddEvenOdds.oddValue !== undefined) {
                                      console.log('Raw odd_even odds value for even:', oddEvenOdds.oddValue, 'Type:', typeof oddEvenOdds.oddValue);
                                      
                                      // The value is already in the correct format (1.95)
                                      oddEvenMultiplierValue = oddEvenOdds.oddValue;
                                      
                                      console.log('Using actual odd_even multiplier for even:', oddEvenMultiplierValue);
                                    }
                                  }
                                  
                                  const potentialWin = evenGames.reduce((sum, game) => sum + ((game.betAmount || 0) * oddEvenMultiplierValue), 0);
                                  
                                  // Define risk level
                                  let riskLevel = 'none';
                                  if (totalBetAmount > riskThresholds.high) riskLevel = 'high';
                                  else if (totalBetAmount > riskThresholds.medium) riskLevel = 'medium';
                                  else if (totalBetAmount > 0) riskLevel = 'low';
                                  
                                  return (
                                    <div className="space-y-4">
                                      <div className="flex justify-between">
                                        <span className="font-medium">Active Bets:</span>
                                        <span>{totalBets}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="font-medium">Total Bet Amount:</span>
                                        <span>₹{(totalBetAmount / 100).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="font-medium">Potential Win:</span>
                                        <span>₹{(potentialWin / 100).toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium">Risk Level:</span>
                                        <span>{getRiskLevelBadge(riskLevel)}</span>
                                      </div>
                                      {totalBets > 0 && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="w-full mt-3"
                                          onClick={() => showPlayerDetails(evenGames, `Even Numbers Players (${totalBets} players)`)}
                                        >
                                          <Eye className="h-4 w-4 mr-2" />
                                          View Players
                                        </Button>
                                      )}
                                    </div>
                                  );
                                })()}
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      ) : viewMode === 'harf' ? (
                        <div className="p-4">
                          <h3 className="text-lg font-bold mb-4 text-primary-foreground">Harf Risk Management</h3>
                          
                          {/* Left Digits (A0-A9) Table */}
                          <Card className="mb-6 border-primary/20 bg-primary/5">
                            <CardHeader className="border-b border-primary/20">
                              <CardTitle className="text-base">Left Digit (A0-A9) - Position 1</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Number</TableHead>
                                    <TableHead>Active Bets</TableHead>
                                    <TableHead>Bet Amount</TableHead>
                                    <TableHead>Potential Win</TableHead>
                                    <TableHead>Risk Level</TableHead>
                                    <TableHead>Action</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {Array.from({ length: 10 }, (_, i) => {
                                    const digit = i.toString();
                                    
                                    // Filter games for this left digit
                                    const gamesForLeftDigit = data.detailedData.gameData.filter(game => {
                                      if (game.gameType !== 'satamatka') return false;
                                      if (game.result && game.result !== 'pending') return false;
                                      if (marketFilter !== 'all' && game.marketId !== marketFilter) return false;
                                      
                                      // For left digit (A0-A9), check if it's a harf bet with "A" prefix
                                      return game.gameMode === 'harf' && game.prediction === `A${digit}`;
                                    });
                                    
                                    // Calculate totals
                                    const totalBets = gamesForLeftDigit.length;
                                    const totalBetAmount = gamesForLeftDigit.reduce((sum, game) => sum + (game.betAmount || 0), 0);
                                    // Get the actual odds for harf games from fetched data
                                    let harfMultiplier = 9; // Default fallback
                                    
                                    if (gameOddsData && Array.isArray(gameOddsData)) {
                                      const harfOdds = gameOddsData.find((odd: any) => 
                                        odd.gameType === 'satamatka_harf');
                                      
                                      if (harfOdds && harfOdds.oddValue !== undefined) {
                                        console.log('Raw harf odds value:', harfOdds.oddValue, 'Type:', typeof harfOdds.oddValue);
                                        
                                        // Handle different formats of the odds value
                                        if (harfOdds.oddValue >= 10000) {
                                          // Format: 90000 = 9
                                          harfMultiplier = harfOdds.oddValue / 10000;
                                        } else if (harfOdds.oddValue >= 10) {
                                          // Format: 95 = 9.5
                                          harfMultiplier = harfOdds.oddValue;
                                        } else {
                                          // Direct value format
                                          harfMultiplier = harfOdds.oddValue;
                                        }
                                        
                                        console.log('Using actual harf multiplier:', harfMultiplier);
                                      }
                                    }
                                    
                                    const potentialWin = gamesForLeftDigit.reduce((sum, game) => sum + ((game.betAmount || 0) * harfMultiplier), 0);
                                    
                                    // Define risk level
                                    let riskLevel = 'none';
                                    if (totalBetAmount > riskThresholds.high) riskLevel = 'high';
                                    else if (totalBetAmount > riskThresholds.medium) riskLevel = 'medium';
                                    else if (totalBetAmount > 0) riskLevel = 'low';
                                    
                                    return (
                                      <TableRow key={`left-${digit}`} className={
                                        riskLevel === 'high' ? 'bg-primary/20 hover:bg-primary/25 border-b border-primary/30' :
                                        riskLevel === 'medium' ? 'bg-primary/10 hover:bg-primary/15 border-b border-primary/20' :
                                        riskLevel === 'low' ? 'bg-primary/5 hover:bg-primary/10 border-b border-primary/10' : 
                                        'hover:bg-primary/5 border-b border-primary/5'
                                      }>
                                        <TableCell className="font-medium">A{digit}</TableCell>
                                        <TableCell>{totalBets}</TableCell>
                                        <TableCell>₹{(totalBetAmount / 100).toFixed(2)}</TableCell>
                                        <TableCell>₹{(potentialWin / 100).toFixed(2)}</TableCell>
                                        <TableCell>{getRiskLevelBadge(riskLevel)}</TableCell>
                                        <TableCell>
                                          {totalBets > 0 && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => showPlayerDetails(gamesForLeftDigit, `Left Digit A${digit} Players (${totalBets} players)`)}
                                            >
                                              <Eye className="h-4 w-4" />
                                            </Button>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                          
                          {/* Right Digits (B0-B9) Table */}
                          <Card className="border-primary/20 bg-primary/5">
                            <CardHeader className="border-b border-primary/20">
                              <CardTitle className="text-base">Right Digit (B0-B9) - Position 2</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Number</TableHead>
                                    <TableHead>Active Bets</TableHead>
                                    <TableHead>Bet Amount</TableHead>
                                    <TableHead>Potential Win</TableHead>
                                    <TableHead>Risk Level</TableHead>
                                    <TableHead>Action</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {Array.from({ length: 10 }, (_, i) => {
                                    const digit = i.toString();
                                    
                                    // Filter games for this right digit
                                    const gamesForRightDigit = data.detailedData.gameData.filter(game => {
                                      if (game.gameType !== 'satamatka') return false;
                                      if (game.result && game.result !== 'pending') return false;
                                      if (marketFilter !== 'all' && game.marketId !== marketFilter) return false;
                                      
                                      // For right digit (B0-B9), check if it's a harf bet with "B" prefix
                                      return game.gameMode === 'harf' && game.prediction === `B${digit}`;
                                    });
                                    
                                    // Calculate totals
                                    const totalBets = gamesForRightDigit.length;
                                    const totalBetAmount = gamesForRightDigit.reduce((sum, game) => sum + (game.betAmount || 0), 0);
                                    // Get the actual odds for harf games from fetched data
                                    let harfMultiplier = 9; // Default fallback
                                    
                                    if (gameOddsData && Array.isArray(gameOddsData)) {
                                      const harfOdds = gameOddsData.find((odd: any) => 
                                        odd.gameType === 'satamatka_harf');
                                      
                                      if (harfOdds && harfOdds.oddValue !== undefined) {
                                        console.log('Raw harf odds value for right digit:', harfOdds.oddValue, 'Type:', typeof harfOdds.oddValue);
                                        
                                        // Handle different formats of the odds value
                                        if (harfOdds.oddValue >= 10000) {
                                          // Format: 90000 = 9
                                          harfMultiplier = harfOdds.oddValue / 10000;
                                        } else if (harfOdds.oddValue >= 10) {
                                          // Format: 95 = 9.5
                                          harfMultiplier = harfOdds.oddValue;
                                        } else {
                                          // Direct value format
                                          harfMultiplier = harfOdds.oddValue;
                                        }
                                        
                                        console.log('Using actual harf multiplier for right digit:', harfMultiplier);
                                      }
                                    }
                                    
                                    const potentialWin = gamesForRightDigit.reduce((sum, game) => sum + ((game.betAmount || 0) * harfMultiplier), 0);
                                    
                                    // Define risk level
                                    let riskLevel = 'none';
                                    if (totalBetAmount > riskThresholds.high) riskLevel = 'high';
                                    else if (totalBetAmount > riskThresholds.medium) riskLevel = 'medium';
                                    else if (totalBetAmount > 0) riskLevel = 'low';
                                    
                                    return (
                                      <TableRow key={`right-${digit}`} className={
                                        riskLevel === 'high' ? 'bg-primary/20 hover:bg-primary/25 border-b border-primary/30' :
                                        riskLevel === 'medium' ? 'bg-primary/10 hover:bg-primary/15 border-b border-primary/20' :
                                        riskLevel === 'low' ? 'bg-primary/5 hover:bg-primary/10 border-b border-primary/10' : 
                                        'hover:bg-primary/5 border-b border-primary/5'
                                      }>
                                        <TableCell className="font-medium">B{digit}</TableCell>
                                        <TableCell>{totalBets}</TableCell>
                                        <TableCell>₹{(totalBetAmount / 100).toFixed(2)}</TableCell>
                                        <TableCell>₹{(potentialWin / 100).toFixed(2)}</TableCell>
                                        <TableCell>{getRiskLevelBadge(riskLevel)}</TableCell>
                                        <TableCell>
                                          {totalBets > 0 && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => showPlayerDetails(gamesForRightDigit, `Right Digit B${digit} Players (${totalBets} players)`)}
                                            >
                                              <Eye className="h-4 w-4" />
                                            </Button>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
                        <Table className="border-collapse bg-primary/5">
                          <TableHeader className="sticky top-0 z-10">
                            <TableRow className="border-b border-primary/30 bg-primary/10 backdrop-blur-sm">
                              <TableHead className="w-[80px] font-semibold text-foreground">Number</TableHead>
                              <TableHead className="w-[100px] font-semibold text-foreground">Active Bets</TableHead>
                              <TableHead className="w-[150px] font-semibold text-foreground">Bet Amount</TableHead>
                              <TableHead className="w-[150px] font-semibold text-foreground">Potential Win</TableHead>
                              <TableHead className="font-semibold text-foreground">Bet Types</TableHead>
                              <TableHead className="w-[120px] font-semibold text-foreground">Market</TableHead>
                              <TableHead className="w-[100px] font-semibold text-foreground">Risk Level</TableHead>
                              <TableHead className="w-[120px] font-semibold text-foreground">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="bg-transparent">
                            {Array.from({ length: 100 }, (_, i) => {
                              // Format number as two digits (e.g., 00, 01, ..., 99)
                              const num = i.toString().padStart(2, '0');
                              
                              // Filter games for this number
                              const gamesForNumber = data.detailedData.gameData.filter(game => {
                                if (game.gameType !== 'satamatka') return false;
                                if (game.result && game.result !== 'pending') return false;
                                if (marketFilter !== 'all' && game.marketId !== marketFilter) return false;
                                if (betTypeFilter !== 'all' && game.prediction !== betTypeFilter && game.prediction !== num) return false;
                                
                                // Match exact number predictions (jodi format - 00 to 99)
                                return game.prediction === num;
                              });
                              
                              // Calculate total bet amount for this number
                              const totalBetAmount = gamesForNumber.reduce((sum, game) => sum + (game.betAmount || 0), 0);
                              
                              // Get the actual odds for jodi games from fetched data
                              let jodiMultiplier = 90; // Default fallback
                              
                              if (gameOddsData && Array.isArray(gameOddsData)) {
                                const jodiOdds = gameOddsData.find((odd: any) => 
                                  odd.gameType === 'satamatka_jodi');
                                
                                if (jodiOdds && jodiOdds.oddValue !== undefined) {
                                  console.log('Raw jodi odds value:', jodiOdds.oddValue, 'Type:', typeof jodiOdds.oddValue);
                                  
                                  // Handle different formats of the odds value
                                  if (jodiOdds.oddValue >= 100000) {
                                    // Format: 900000 = 90
                                    jodiMultiplier = jodiOdds.oddValue / 10000;
                                  } else if (jodiOdds.oddValue >= 10) {
                                    // Format: 95 = 95
                                    jodiMultiplier = jodiOdds.oddValue;
                                  } else {
                                    // Direct value format
                                    jodiMultiplier = jodiOdds.oddValue;
                                  }
                                  
                                  console.log('Using actual jodi multiplier:', jodiMultiplier);
                                }
                              }
                              
                              // Calculate potential win using dynamic odds
                              const potentialWin = gamesForNumber.reduce((sum, game) => sum + ((game.betAmount || 0) * jodiMultiplier), 0);
                              
                              // Get bet types for this number
                              const betTypes = Array.from(new Set(gamesForNumber.map(game => 
                                game.gameMode || "Jodi"
                              ))).join(', ');
                              
                              // Define the risk level based on bet amount using configurable thresholds
                              let riskLevel = 'none';
                              if (totalBetAmount > riskThresholds.high) riskLevel = 'high';
                              else if (totalBetAmount > riskThresholds.medium) riskLevel = 'medium';
                              else if (totalBetAmount > 0) riskLevel = 'low';
                              
                              // Skip rows with no bets
                              if (gamesForNumber.length === 0) {
                                return null;
                              }
                              
                              return (
                                <TableRow 
                                  key={num}
                                  className={
                                    riskLevel === 'high' ? 'bg-primary-foreground/5 hover:bg-primary-foreground/10 border-b border-primary/30' :
                                    riskLevel === 'medium' ? 'bg-primary/5 hover:bg-primary/10 border-b border-primary/20' :
                                    riskLevel === 'low' ? 'bg-primary/10 hover:bg-primary/15 border-b border-primary/30' : 
                                    'bg-background hover:bg-primary/5 border-b border-primary/10'
                                  }
                                >
                                  <TableCell className="font-medium">{num}</TableCell>
                                  <TableCell>{gamesForNumber.length}</TableCell>
                                  <TableCell>₹{(totalBetAmount / 100).toFixed(2)}</TableCell>
                                  <TableCell>₹{(potentialWin / 100).toFixed(2)}</TableCell>
                                  <TableCell>{betTypes}</TableCell>
                                  <TableCell>
                                    {Array.from(new Set(gamesForNumber.map(game => {
                                      const marketId = game.marketId?.toString();
                                      return marketId && marketInfo[marketId] 
                                        ? marketInfo[marketId].name 
                                        : 'Unknown';
                                    }))).join(', ')}
                                  </TableCell>
                                  <TableCell>
                                    {getRiskLevelBadge(riskLevel)}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => showPlayerDetails(gamesForNumber, `Number ${num} Players (${gamesForNumber.length} players)`)}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Players
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            }).filter(Boolean)}
                          </TableBody>
                        </Table>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="cricket-toss" className="mt-0">
            {cricketTossData ? (
              <div className="space-y-6">
                {/* Cricket Overview Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Active Cricket Bets
                      </CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{cricketTossData.activeBets}</div>
                      <p className="text-xs text-muted-foreground">
                        From {cricketTossData.totalBets} total bets
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Bet Amount
                      </CardTitle>
                      <Target className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">₹{(cricketTossData.totalBetAmount/100).toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">
                        Across all cricket toss bets
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Active Betted Users
                      </CardTitle>
                      <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {(() => {
                          // Calculate actual active users from cricket match analysis
                          let activeUsers = 0;
                          if (data.detailedData?.cricketMatchAnalysis) {
                            const allUsers = new Set();
                            data.detailedData.cricketMatchAnalysis.forEach((match: any) => {
                              if (match.teamAStats?.users) {
                                match.teamAStats.users.forEach((userId: number) => allUsers.add(userId));
                              }
                              if (match.teamBStats?.users) {
                                match.teamBStats.users.forEach((userId: number) => allUsers.add(userId));
                              }
                            });
                            activeUsers = allUsers.size;
                          }
                          return activeUsers;
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Players with active cricket bets
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Potential Win
                      </CardTitle>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ₹{(() => {
                          // Calculate actual cricket match potential payout
                          let totalPotentialPayout = 0;
                          if (data.detailedData?.cricketMatchAnalysis) {
                            totalPotentialPayout = data.detailedData.cricketMatchAnalysis.reduce((sum: number, match: any) => {
                              return sum + (match.summary?.maxPotentialPayout || 0);
                            }, 0);
                          }
                          return (totalPotentialPayout / 100).toFixed(2);
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Maximum possible payout
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Cricket Match Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>Cricket Toss Match Analysis</CardTitle>
                    <CardDescription>Detailed risk assessment for each cricket match with team-wise betting data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.detailedData?.cricketMatchAnalysis && data.detailedData.cricketMatchAnalysis.length > 0 ? (
                      <div className="space-y-6">
                        {data.detailedData.cricketMatchAnalysis.map((match: any) => (
                          <Card key={match.matchId} className="border-l-4 border-l-blue-500">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="text-lg">
                                    {match.matchInfo.teamA} vs {match.matchInfo.teamB}
                                  </CardTitle>
                                  <CardDescription className="mt-1">
                                    {match.matchInfo.description} • {new Date(match.matchInfo.matchTime).toLocaleString()}
                                  </CardDescription>
                                </div>
                                <Badge className={
                                  match.summary.riskLevel === 'high' ? 'bg-red-500' :
                                  match.summary.riskLevel === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                                }>
                                  {match.summary.riskLevel.toUpperCase()} RISK
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {/* Match Summary */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="text-center p-3 bg-primary/10 border border-primary/20 rounded-lg">
                                  <div className="text-lg font-bold text-foreground">{match.summary.totalBets}</div>
                                  <div className="text-xs text-muted-foreground">Total Bets</div>
                                </div>
                                <div className="text-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                  <div className="text-lg font-bold text-foreground">₹{(match.summary.totalAmount / 100).toFixed(0)}</div>
                                  <div className="text-xs text-muted-foreground">Total Amount</div>
                                </div>
                                <div className="text-center p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                  <div className="text-lg font-bold text-foreground">₹{(match.summary.potentialProfit / 100).toFixed(0)}</div>
                                  <div className="text-xs text-muted-foreground">Potential Profit</div>
                                </div>
                                <div className="text-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                  <div className="text-lg font-bold text-foreground">₹{(match.summary.potentialLoss / 100).toFixed(0)}</div>
                                  <div className="text-xs text-muted-foreground">Potential Loss</div>
                                </div>
                              </div>

                              {/* Team-wise Analysis */}
                              <div className="grid md:grid-cols-2 gap-6">
                                {/* Team A */}
                                <Card className="border-primary/30 bg-primary/5">
                                  <CardHeader className="pb-3 border-b border-primary/20">
                                    <div className="flex items-center justify-between">
                                      <CardTitle className="text-base text-foreground">{match.matchInfo.teamA}</CardTitle>
                                      <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30">
                                        Odds: {(match.matchInfo.oddTeamA / 100).toFixed(2)}x
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Active Bets:</span>
                                      <span className="font-medium">{match.teamAStats.totalBets}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Total Amount:</span>
                                      <span className="font-medium">₹{(match.teamAStats.totalAmount / 100).toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Potential Payout:</span>
                                      <span className="font-bold text-red-600">₹{(match.teamAStats.potentialPayout / 100).toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Players:</span>
                                      <span className="font-medium">{match.teamAStats.users.length}</span>
                                    </div>
                                    {match.teamAStats.users.length > 0 && (
                                      <div className="mt-3">
                                        <span className="text-xs text-muted-foreground">Players:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {match.teamAStats.users.slice(0, 3).map((userId: number) => (
                                            <Badge key={userId} variant="secondary" className="text-xs">
                                              {userInfo[userId]?.username || `User ${userId}`}
                                            </Badge>
                                          ))}
                                          {match.teamAStats.users.length > 3 && (
                                            <Badge variant="secondary" className="text-xs">
                                              +{match.teamAStats.users.length - 3} more
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>

                                {/* Team B */}
                                <Card className="border-primary/30 bg-primary/5">
                                  <CardHeader className="pb-3 border-b border-primary/20">
                                    <div className="flex items-center justify-between">
                                      <CardTitle className="text-base text-foreground">{match.matchInfo.teamB}</CardTitle>
                                      <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30">
                                        Odds: {(match.matchInfo.oddTeamB / 100).toFixed(2)}x
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Active Bets:</span>
                                      <span className="font-medium">{match.teamBStats.totalBets}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Total Amount:</span>
                                      <span className="font-medium">₹{(match.teamBStats.totalAmount / 100).toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Potential Payout:</span>
                                      <span className="font-bold text-red-600">₹{(match.teamBStats.potentialPayout / 100).toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Players:</span>
                                      <span className="font-medium">{match.teamBStats.users.length}</span>
                                    </div>
                                    {match.teamBStats.users.length > 0 && (
                                      <div className="mt-3">
                                        <span className="text-xs text-muted-foreground">Players:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {match.teamBStats.users.slice(0, 3).map((userId: number) => (
                                            <Badge key={userId} variant="secondary" className="text-xs">
                                              {userInfo[userId]?.username || `User ${userId}`}
                                            </Badge>
                                          ))}
                                          {match.teamBStats.users.length > 3 && (
                                            <Badge variant="secondary" className="text-xs">
                                              +{match.teamBStats.users.length - 3} more
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Active Cricket Matches</h3>
                        <p className="text-muted-foreground">
                          There are currently no cricket toss matches with active bets in the system.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Cricket Toss Risk Management</CardTitle>
                  <CardDescription>No cricket toss data available</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>There are currently no active cricket toss games in the system.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}