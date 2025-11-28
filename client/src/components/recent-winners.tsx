import { formatDistanceToNow } from "date-fns";
import { Trophy, Award, Medal, User, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Winner {
  id: number;
  username: string;
  game: string;
  amount: number;
  payout: number;
  createdAt: string;
}

interface RecentWinnersProps {
  winners: Winner[];
}

export default function RecentWinners({ winners }: RecentWinnersProps) {
  if (winners.length === 0) {
    return (
      <Card className="bg-slate-900/70 border-slate-800">
        <CardHeader>
          <CardTitle className="text-xl flex items-center text-slate-200">
            <Trophy className="w-5 h-5 text-blue-400 mr-2" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <Award className="h-12 w-12 text-slate-700 mb-2" />
            <p className="text-slate-500 text-sm">No winners yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort winners by highest profit (payout - amount) and take top 10
  const topWinners = [...winners]
    .sort((a, b) => (b.payout - b.amount) - (a.payout - a.amount))
    .slice(0, 10);

  return (
    <Card className="bg-slate-900/70 border-slate-800">
      <CardHeader>
        <CardTitle className="text-xl flex items-center text-slate-200">
          <Trophy className="w-5 h-5 text-blue-400 mr-2" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="space-y-1">
          {topWinners.map((winner, index) => {
            const profit = (winner.payout - winner.amount) / 100;
            const formattedProfit = profit.toFixed(2);
            const timeAgo = formatDistanceToNow(new Date(winner.createdAt), { addSuffix: true });
            
            return (
              <div 
                key={winner.id}
                className="flex items-center px-6 py-2 hover:bg-slate-800/50 transition-colors cursor-default"
              >
                <div className="flex-shrink-0 mr-3">
                  {index === 0 ? (
                    <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-400/30">
                      <Trophy className="h-5 w-5 text-amber-400" />
                    </div>
                  ) : index === 1 ? (
                    <div className="w-9 h-9 rounded-full bg-slate-400/20 flex items-center justify-center border border-slate-400/30">
                      <Medal className="h-5 w-5 text-slate-300" />
                    </div>
                  ) : index === 2 ? (
                    <div className="w-9 h-9 rounded-full bg-amber-700/20 flex items-center justify-center border border-amber-700/30">
                      <Award className="h-5 w-5 text-amber-700" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                      <span className="text-sm text-slate-400 font-medium">{index + 1}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-center">
                    <p className="font-medium truncate text-slate-200">
                      {winner.username}
                    </p>
                    <span className="mx-1.5 text-slate-600">•</span>
                    <p className="text-sm text-slate-400 truncate">
                      {winner.game}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {timeAgo}
                  </p>
                </div>
                
                <div className="flex-shrink-0 ml-2 flex items-center">
                  {profit > 100 ? (
                    <Badge variant="outline" className="bg-emerald-900/30 text-emerald-300 border-emerald-500/30 flex items-center">
                      <Sparkles className="h-3 w-3 mr-1" />
                      +₹{formattedProfit}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-teal-900/30 text-teal-300 border-teal-500/30">
                      +₹{formattedProfit}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Link to full leaderboard */}
          <div className="pt-2 pb-1 px-6 text-center">
            <Link 
              to="/leaderboard" 
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-center"
            >
              <Trophy className="h-3 w-3 mr-1" />
              View Full Leaderboard
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}