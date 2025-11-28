import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/dashboard-layout";

// Interface for a cricket toss match
interface CricketTossMatch {
  id: number;
  teamA: string;
  teamB: string;
  description?: string;
  matchTime: string;
  teamAImage?: string;
  teamBImage?: string;
  coverImage?: string;
  oddTeamA: number;
  oddTeamB: number;
  status: string;
  result?: string;
  createdAt: string;
}

// Interface for bet history
interface BetHistory {
  id: number;
  userId: number;
  gameType: string;
  betAmount: number;
  prediction: string;
  payout: number;
  result?: string;
  createdAt: string;
  gameData: {
    teamA: string;
    teamB: string;
    teamAImage?: string;
    teamBImage?: string;
    coverImage?: string;
    oddTeamA: number;
    oddTeamB: number;
    matchTime: string;
  };
}

export default function CricketTossPage() {
  const [selectedMatch, setSelectedMatch] = useState<CricketTossMatch | null>(null);
  const [betAmount, setBetAmount] = useState<string>("100");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to fetch open cricket toss matches
  const { data: openMatches = [], isLoading: loadingMatches } = useQuery({
    queryKey: ["/api/cricket-toss/open-matches"],
    staleTime: 30000, // 30 seconds
  });

  // Query to fetch user's betting history
  const { data: betHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ["/api/cricket-toss/my-bets"],
    staleTime: 30000, // 30 seconds
  });

  // Mutation to place a bet
  const placeBetMutation = useMutation({
    mutationFn: async ({
      matchId,
      betAmount,
      prediction,
    }: {
      matchId: number;
      betAmount: number;
      prediction: string;
    }) => {
      return await fetch(`/api/cricket-toss/${matchId}/play`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prediction,
          betAmount
        }),
        credentials: "include"
      }).then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || res.statusText);
        }
        return res.json();
      });
    },
    onSuccess: () => {
      toast({
        title: "Bet Placed Successfully",
        description: "Your bet has been placed on the cricket toss match.",
      });
      setBetAmount("100");
      setSelectedTeam(null);
      setSelectedMatch(null);
      queryClient.invalidateQueries({ queryKey: ["/api/cricket-toss/my-bets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Refresh user balance
    },
    onError: (error: Error) => {
      toast({
        title: "Error Placing Bet",
        description: error.message || "Failed to place your bet. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Function to handle placing a bet
  const handlePlaceBet = () => {
    if (!selectedMatch || !selectedTeam || !betAmount) {
      toast({
        title: "Incomplete Bet",
        description: "Please select a team and enter a bet amount.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseInt(betAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Bet Amount",
        description: "Please enter a valid bet amount.",
        variant: "destructive",
      });
      return;
    }

    placeBetMutation.mutate({
      matchId: selectedMatch.id,
      betAmount: amount,
      prediction: selectedTeam,
    });
  };

  // Function to calculate potential win amount
  const calculateWin = (amount: number, team: string) => {
    return amount * 1.9; // Standard multiplier without displaying odds
  };

  // Function to calculate potential win amount
  const calculatePotentialWin = (amount: string, team: string | null) => {
    if (!selectedMatch || !team || !amount) return 0;
    
    const betAmountNum = parseInt(amount);
    if (isNaN(betAmountNum)) return 0;
    
    const odds = team === "team_a" ? selectedMatch.oddTeamA : selectedMatch.oddTeamB;
    return betAmountNum * (odds / 100);
  };

  // Format the team name based on the prediction value
  const formatPrediction = (prediction: string, bet: BetHistory) => {
    if (prediction === "team_a") return bet.gameData.teamA;
    if (prediction === "team_b") return bet.gameData.teamB;
    return prediction;
  };

  // Get appropriate badge for match status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-500">Open</Badge>;
      case "closed":
        return <Badge className="bg-yellow-500">Closed</Badge>;
      case "resulted":
        return <Badge className="bg-blue-500">Resulted</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get result text for bet history
  const getResultText = (bet: BetHistory) => {
    if (!bet.result) return "Pending";
    if (bet.result === bet.prediction) return "Won";
    return "Lost";
  };

  // Get class for result text
  const getResultClass = (bet: BetHistory) => {
    if (!bet.result) return "text-yellow-600";
    if (bet.result === bet.prediction) return "text-green-600 font-bold";
    return "text-red-600";
  };

  return (
    <DashboardLayout title="Cricket Toss">
      <div className="container mx-auto p-4">
        <Tabs defaultValue="matches" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="matches">Available Matches</TabsTrigger>
            <TabsTrigger value="history">My Betting History</TabsTrigger>
          </TabsList>

          <TabsContent value="matches">
            {loadingMatches ? (
              <div className="flex justify-center p-8">Loading cricket toss matches...</div>
            ) : openMatches && openMatches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {openMatches.map((match: CricketTossMatch) => (
                  <Card key={match.id} className={selectedMatch?.id === match.id ? "border-primary" : ""}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          {match.teamA} vs {match.teamB}
                        </CardTitle>
                        {getStatusBadge(match.status)}
                      </div>
                      <CardDescription>
                        {match.description || "Cricket Toss Match"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Match Time:</span>
                          <span>{(() => {
                            // Parse the time string as local time to avoid timezone conversion
                            const timeString = match.matchTime.replace('T', ' ').replace('.000Z', '').replace('Z', '');
                            const localDate = new Date(timeString);
                            return localDate.toLocaleString('en-IN', { 
                              year: 'numeric',
                              month: 'short', 
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            });
                          })()}</span>
                        </div>
                        <Separator />
                        {match.coverImage && (
                          <div className="mb-4">
                            <img 
                              src={match.coverImage} 
                              alt={`${match.teamA} vs ${match.teamB}`}
                              className="w-full h-32 object-cover rounded-md" 
                            />
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-center p-2 rounded border">
                            <div className="font-bold">{match.teamA}</div>
                          </div>
                          <div className="text-center p-2 rounded border">
                            <div className="font-bold">{match.teamB}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button
                        onClick={() => {
                          setSelectedMatch(match);
                          setSelectedTeam(null);
                          setBetAmount("100");
                        }}
                      >
                        Place Bet
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertTitle>No Matches Available</AlertTitle>
                <AlertDescription>
                  There are no open cricket toss matches available for betting at this time.
                </AlertDescription>
              </Alert>
            )}

            {selectedMatch && (
              <div className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Place Your Bet</CardTitle>
                    <CardDescription>
                      {selectedMatch.teamA} vs {selectedMatch.teamB} - {(() => {
                        const timeString = selectedMatch.matchTime.replace('T', ' ').replace('.000Z', '').replace('Z', '');
                        const localDate = new Date(timeString);
                        return localDate.toLocaleString('en-IN', { 
                          year: 'numeric',
                          month: 'short', 
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        });
                      })()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Team Selection - Mobile Optimized */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium block">Choose Your Team</label>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant={selectedTeam === "team_a" ? "default" : "outline"}
                          className="h-20 p-4 text-center"
                          onClick={() => setSelectedTeam("team_a")}
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="font-bold text-lg">{selectedMatch.teamA}</div>
                          </div>
                        </Button>
                        <Button
                          variant={selectedTeam === "team_b" ? "default" : "outline"}
                          className="h-20 p-4 text-center"
                          onClick={() => setSelectedTeam("team_b")}
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="font-bold text-lg">{selectedMatch.teamB}</div>
                          </div>
                        </Button>
                      </div>
                    </div>

                    {/* Bet Amount Section - Mobile Optimized */}
                    <div className="space-y-3">
                      <label htmlFor="betAmount" className="text-sm font-medium block">
                        Bet Amount (₹)
                      </label>
                      <Input
                        id="betAmount"
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        min="10"
                        step="10"
                        className="h-12 text-lg"
                        placeholder="Enter amount"
                      />
                      
                      {/* Quick bet amount selection - Mobile Optimized */}
                      <div className="grid grid-cols-3 gap-2">
                        {[100, 500, 1000, 2000, 5000, 10000].map((amount) => (
                          <Button
                            key={amount}
                            type="button"
                            size="sm"
                            variant={parseInt(betAmount) === amount ? "default" : "outline"}
                            onClick={() => setBetAmount(amount.toString())}
                            className="h-10 text-sm font-medium"
                          >
                            ₹{amount}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Potential Win - Mobile Optimized */}
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <label className="text-sm font-medium block mb-2">
                        Potential Win
                      </label>
                      <div className="text-2xl font-bold text-primary">
                        ₹{calculatePotentialWin(betAmount, selectedTeam).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Select a team and enter your bet amount to calculate potential winnings.
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedMatch(null)}
                      className="h-12 w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handlePlaceBet} 
                      disabled={!selectedTeam || placeBetMutation.isPending}
                      className="h-12 w-full sm:w-auto bg-primary hover:bg-primary/90"
                    >
                      {placeBetMutation.isPending ? "Placing Bet..." : "Place Bet"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {loadingHistory ? (
              <div className="flex justify-center p-8">Loading your bet history...</div>
            ) : betHistory && betHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead>Bet On</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {betHistory.map((bet: BetHistory) => (
                    <TableRow key={bet.id}>
                      <TableCell>{formatDate(new Date(bet.createdAt))}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {bet.gameData.coverImage && (
                            <img 
                              src={bet.gameData.coverImage} 
                              alt={`${bet.gameData.teamA} vs ${bet.gameData.teamB}`}
                              className="h-10 w-full max-w-[120px] object-cover rounded-md mb-1" 
                            />
                          )}
                          <div className="flex items-center">
                            <span>{bet.gameData.teamA}</span>
                            <span className="mx-1 text-xs text-gray-500">vs</span>
                            <span>{bet.gameData.teamB}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{formatPrediction(bet.prediction, bet)}</span>
                        </div>
                      </TableCell>
                      <TableCell>₹{(bet.betAmount / 100).toFixed(2)}</TableCell>
                      <TableCell className={getResultClass(bet)}>
                        {getResultText(bet)}
                      </TableCell>
                      <TableCell>
                        {bet.payout > 0 ? `₹${(bet.payout / 100).toFixed(2)}` : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Alert>
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertTitle>No Betting History</AlertTitle>
                <AlertDescription>
                  You haven't placed any bets on cricket toss matches yet.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}