import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import CoinFlipGame from "@/components/coin-flip-game";
import GameHistoryTable from "@/components/game-history-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function GamePage() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  
  // Import Game type from the game-history-table component
  type Game = React.ComponentProps<typeof GameHistoryTable>['games'][number];
  
  // Fetch recent games for the user, filtered by coin_flip game type
  const { data: games = [], isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games/my-history"],
    enabled: !!user,
  });
  
  // Filter only coinflip games
  const coinFlipGames = games.filter(game => game.gameType === "coin_flip");
  
  return (
    <DashboardLayout title="Royal Coin Toss">
      {/* Coin Toss Game */}
      <CoinFlipGame />
      
      {/* Recent Bets History */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Recent Coin Flip Bets</CardTitle>
            <CardDescription>
              Your last 10 coin flip bets and their results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <GameHistoryTable games={coinFlipGames} />
                
                {coinFlipGames.length > 0 && (
                  <div className="mt-4 flex justify-center">
                    <Button
                      onClick={() => setLocation("/game-history")}
                      variant="outline"
                      className="border-slate-700 text-blue-300 hover:bg-slate-800 hover:text-blue-200"
                    >
                      View Full Game History
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
