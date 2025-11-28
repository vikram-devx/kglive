import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import DashboardLayout from "@/components/dashboard-layout";
import GameCard from "@/components/game-card";
import { Play, Gamepad2 } from "lucide-react";

// All available games in the platform
const allGames = [
  {
    id: "marketgame",
    title: "Market Game",
    description: "Strategic market betting game with multiple betting options.",
    imageBg: "linear-gradient(to right, #1a1d30, #4e3a9a)",
    path: "/markets",
    popularity: "high" as const,
    winRate: 40,
    gameType: "market" as const // Using game type for automatic image selection
  },
  {
    id: "crickettoss",
    title: "Cricket Toss",
    description: "Predict the cricket match toss outcome for quick wins.",
    imageBg: "linear-gradient(to right, #1e3a30, #2a8062)",
    path: "/cricket-toss",
    popularity: "high" as const,
    winRate: 50,
    gameType: "cricket" as const // Using game type for automatic image selection
  },
  {
    id: "coinflip",
    title: "Coin Flip",
    description: "Classic heads or tails betting with 50/50 odds for instant wins.",
    imageBg: "linear-gradient(to right, #1e293b, #3b5cb8)",
    path: "/coinflip",
    popularity: "high" as const,
    winRate: 50,
    gameType: "coinflip" as const // Using game type for automatic image selection
  },
  {
    id: "sportsexchange",
    title: "Sports Exchange",
    description: "Bet on cricket, tennis, and football matches with real-time odds.",
    imageBg: "linear-gradient(to right, #1e293b, #2a5ca8)",
    path: "#",
    popularity: "upcoming" as const,
    winRate: 0,
    comingSoon: true,
    gameType: "sports" as const // Using game type for automatic image selection
  },
  {
    id: "kingsoriginal",
    title: "Kings Original",
    description: "Coming soon! Our collection of premium games including Big-Small, Color, Lottery, Roulette and more.",
    imageBg: "linear-gradient(to right, #4a4a4a, #6a6a6a)",
    path: "#",
    popularity: "low" as const,
    winRate: 0,
    comingSoon: true,
    imageUrl: "/images/royal-k-logo.svg" // Logo as feature image
  }
];

export default function GamesPage() {
  const { user } = useAuth();
  const isPlayer = user?.role === UserRole.PLAYER;

  if (!isPlayer) {
    return (
      <DashboardLayout title="Games">
        <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
          <h2 className="text-xl font-bold mb-3 text-slate-200">Admin Restricted Area</h2>
          <p className="text-slate-400">
            As an administrator, you don't have permission to play games.
            Your role is to manage the platform and users only.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="All Games">
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Gamepad2 className="h-5 w-5 mr-2 text-blue-500" />
          <h2 className="text-lg font-medium text-slate-200">
            Browse All Available Games
          </h2>
        </div>
        <p className="text-slate-400 text-sm">
          Explore our complete collection of games and start playing now
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {allGames.map((game) => (
          <GameCard 
            key={game.id}
            id={game.id}
            title={game.title}
            description={game.description}
            imageBg={game.imageBg}
            path={game.path}
            popularity={game.popularity}
            winRate={game.winRate}
            comingSoon={game.comingSoon}
            gameType={game.gameType}
            imageUrl={game.imageUrl} // Keep for backward compatibility with Kings Original
          />
        ))}
      </div>
    </DashboardLayout>
  );
}