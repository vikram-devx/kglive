import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import ResponsiveHeader from "@/components/responsive-header";
import ProfessionalFooter from "@/components/professional-footer";
import GameCard from "@/components/game-card";
import HeroSlider from "@/components/hero-slider";
import { HomePageHeroSlider } from "@/components/home/HomePageHeroSlider";
import RecentResults from "@/components/recent-results";
import RecentWinners from "@/components/recent-winners";
import FloatingWhatsApp from "@/components/floating-whatsapp";
import { Trophy, Target, Shield, ArrowRight } from "lucide-react";

// Component to display real market results from API
function PublicRecentResults() {
  const { data: results = [], isLoading, error } = useQuery({
    queryKey: ['/api/public/market-results', 'limit=8'],
    queryFn: async () => {
      const response = await fetch('/api/public/market-results?limit=8');
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-3 rounded-lg border border-slate-800 bg-slate-800/50 animate-pulse">
            <div className="h-4 w-32 bg-slate-700 rounded mb-2"></div>
            <div className="h-8 w-16 bg-slate-700 rounded mx-auto"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || results.length === 0) {
    return (
      <div className="text-center py-8">
        <Target className="h-12 w-12 text-slate-700 mx-auto mb-4" />
        <p className="text-slate-500 text-sm">
          {error ? 'Unable to load results' : 'No recent results available'}
        </p>
      </div>
    );
  }

  return <RecentResults results={results} />;
}

// Sample recent results data for Dishawar and Gali markets (two digits 00-99)
const sampleRecentResults = [
  {
    id: 1,
    name: "Dishawar",
    type: "night",
    openTime: "2023-04-14T21:00:00Z",
    closeTime: "2023-04-14T23:00:00Z",
    openResult: "78",
    closeResult: null,
    status: "resulted",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Gali",
    type: "night",
    openTime: "2023-04-14T20:00:00Z",
    closeTime: "2023-04-14T22:00:00Z",
    openResult: "45",
    closeResult: null,
    status: "resulted",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 3,
    name: "Dishawar",
    type: "night",
    openTime: "2023-04-13T21:00:00Z",
    closeTime: "2023-04-13T23:00:00Z",
    openResult: "23",
    closeResult: null,
    status: "resulted",
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  {
    id: 4,
    name: "Gali",
    type: "night",
    openTime: "2023-04-13T20:00:00Z",
    closeTime: "2023-04-13T22:00:00Z",
    openResult: "67",
    closeResult: null,
    status: "resulted",
    createdAt: new Date(Date.now() - 86400000 - 3600000).toISOString(), // 1 day + 1 hour ago
  },
  {
    id: 5,
    name: "Dishawar",
    type: "night",
    openTime: "2023-04-12T21:00:00Z",
    closeTime: "2023-04-12T23:00:00Z",
    openResult: "09",
    closeResult: null,
    status: "resulted",
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  },
  {
    id: 6,
    name: "Gali",
    type: "night",
    openTime: "2023-04-12T20:00:00Z",
    closeTime: "2023-04-12T22:00:00Z",
    openResult: "34",
    closeResult: null,
    status: "resulted",
    createdAt: new Date(Date.now() - 172800000 - 3600000).toISOString(), // 2 days + 1 hour ago
  },
  {
    id: 7,
    name: "Dishawar",
    type: "night",
    openTime: "2023-04-11T21:00:00Z",
    closeTime: "2023-04-11T23:00:00Z",
    openResult: "56",
    closeResult: null,
    status: "resulted",
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
  },
  {
    id: 8,
    name: "Madhur Day",
    type: "day",
    openTime: "2023-04-14T11:30:00Z",
    closeTime: "2023-04-14T17:30:00Z",
    openResult: "901",
    closeResult: "234",
    status: "resulted",
    createdAt: new Date(Date.now() - 25200000).toISOString(),
  },
  {
    id: 9,
    name: "Supreme Day",
    type: "day",
    openTime: "2023-04-14T13:00:00Z",
    closeTime: "2023-04-14T19:00:00Z",
    openResult: "012",
    closeResult: "345",
    status: "resulted",
    createdAt: new Date(Date.now() - 28800000).toISOString(),
  },
  {
    id: 10,
    name: "Worli Mumbai",
    type: "day",
    openTime: "2023-04-14T14:00:00Z",
    closeTime: "2023-04-14T20:00:00Z",
    openResult: "123",
    closeResult: "456",
    status: "resulted",
    createdAt: new Date(Date.now() - 32400000).toISOString(),
  }
];

// Sample recent winners data
const sampleRecentWinners = [
  {
    id: 1,
    username: "lucky777",
    game: "Coin Flip",
    amount: 5000,
    payout: 9500,
    createdAt: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: 2,
    username: "betmaster",
    game: "Market Game",
    amount: 10000,
    payout: 50000,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 3,
    username: "winner123",
    game: "Cricket Betting",
    amount: 2000,
    payout: 6000,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 4,
    username: "highroller",
    game: "Coin Flip",
    amount: 20000,
    payout: 40000,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 5,
    username: "gameknight",
    game: "Market Game",
    amount: 5000,
    payout: 25000,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: 6,
    username: "bettingpro",
    game: "Cricket Betting",
    amount: 15000,
    payout: 45000,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: 7,
    username: "levelupgamer",
    game: "Coin Flip",
    amount: 3000,
    payout: 6000,
    createdAt: new Date(Date.now() - 18000000).toISOString(),
  },
  {
    id: 8,
    username: "wagermasters",
    game: "Market Game",
    amount: 7500,
    payout: 37500,
    createdAt: new Date(Date.now() - 21600000).toISOString(),
  },
  {
    id: 9,
    username: "luckybets",
    game: "Cricket Betting",
    amount: 4000,
    payout: 12000,
    createdAt: new Date(Date.now() - 25200000).toISOString(),
  },
  {
    id: 10,
    username: "fortuneplayer",
    game: "Coin Flip",
    amount: 10000,
    payout: 20000,
    createdAt: new Date(Date.now() - 28800000).toISOString(),
  }
];

// Sample game data
const gameCards = [
  {
    id: "coinflip",
    title: "Coin Flip",
    description: "Classic heads or tails betting with 50/50 odds for instant wins.",
    imageBg: "linear-gradient(135deg, #0f1729 0%, #1e293b 100%)",
    path: "/coinflip",
    popularity: "high" as const,
    winRate: 50,
    gameType: "coinflip" as const // Using game type for automatic image selection
  },
  {
    id: "satamatka",
    title: "Market Game",
    description: "Play market-based games with multiple betting options and high payouts.",
    imageBg: "linear-gradient(135deg, #0f1729 0%, #1e293b 100%)",
    path: "/markets", // Updated to point to markets page
    popularity: "medium" as const,
    winRate: 36,
    gameType: "market" as const // Using game type for automatic image selection
  },
  {
    id: "cricket",
    title: "Cricket Toss",
    description: "Predict the cricket match toss outcome for quick wins.",
    imageBg: "linear-gradient(135deg, #0f1729 0%, #1e293b 100%)",
    path: "/cricket-toss", // Updated to point to cricket toss page
    popularity: "high" as const,
    winRate: 50,
    gameType: "cricket" as const // Using game type for automatic image selection
  },
  {
    id: "sportsexchange",
    title: "Sports Exchange",
    description: "Coming soon! Cricket, Tennis, and Football match betting with competitive odds.",
    imageBg: "linear-gradient(135deg, #2d3b4d, #4c6583)",
    path: "#",
    popularity: "medium" as const,
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

export default function PublicHomePage() {
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Define Winner type to match what RecentWinners component expects
  interface Winner {
    id: number;
    username: string;
    game: string;
    amount: number;
    payout: number;
    createdAt: string;
  }
  
  // Fetch real winners data from API
  const { data: realWinners = [], isLoading: isLoadingWinners } = useQuery<Winner[]>({
    queryKey: ['/api/games/top-winners'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    // If user is logged in, redirect to dashboard
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <ResponsiveHeader />

      {/* Hero Slider Section */}
      <HomePageHeroSlider />

      {/* Game Cards Section */}
      <section className="py-16" id="games">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold">Popular Games</h2>
            <Button 
              variant="ghost" 
              className="text-primary"
              onClick={() => setLocation("/auth")}
            >
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {gameCards.map((game) => (
              <div key={game.id} className="mx-auto w-full max-w-[400px] sm:max-w-none">
                <GameCard 
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-slate-900/40" id="features">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Why Choose Us</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-border">
              <CardHeader>
                <div className="mb-2 h-12 w-12 rounded-lg bg-slate-800 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Simple Betting</CardTitle>
                <CardDescription>
                  Easy to understand games with excellent odds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Place bets on various games and win up to 95x your bet amount. Our intuitive interface makes betting easy for everyone.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-border">
              <CardHeader>
                <div className="mb-2 h-12 w-12 rounded-lg bg-slate-800 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Real-Time Results</CardTitle>
                <CardDescription>
                  Watch games unfold in real-time as you wait for the outcome
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our beautiful animations and real-time updates show you the results as they happen. No waiting, no delays.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-border">
              <CardHeader>
                <div className="mb-2 h-12 w-12 rounded-lg bg-slate-800 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Safe & Secure</CardTitle>
                <CardDescription>
                  Your funds and data are protected with the highest security standards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We use advanced encryption and security protocols to ensure your information and funds are always protected.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How to Play Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">How to Play</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 flex flex-row items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-primary text-xl font-bold shrink-0 shadow-sm">
                  1
                </div>
                <div>
                  <CardTitle className="text-xl mb-1">Create an Account</CardTitle>
                  <CardDescription>
                    Fast and secure sign-up process
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sign up for a free account in just a few seconds. Track your bets, manage your balance, and access exclusive offers.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 flex flex-row items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-primary text-xl font-bold shrink-0 shadow-sm">
                  2
                </div>
                <div>
                  <CardTitle className="text-xl mb-1">Place Your Bet</CardTitle>
                  <CardDescription>
                    Simple and intuitive betting
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Select from our variety of games, set your bet amount, and make your prediction. Our user-friendly interface makes betting straightforward.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 flex flex-row items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-primary text-xl font-bold shrink-0 shadow-sm">
                  3
                </div>
                <div>
                  <CardTitle className="text-xl mb-1">Win Prizes</CardTitle>
                  <CardDescription>
                    Instant payouts on winning bets
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Watch the results in real-time and receive your winnings instantly. Withdraw your earnings or use them to place more bets.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-8">
            <Button 
              className="px-6 py-6 text-lg bg-primary hover:bg-primary/90"
              onClick={() => setLocation("/auth")}
            >
              Register Now
            </Button>
          </div>
        </div>
      </section>

      {/* Recent Activity Section */}
      <section className="py-16 bg-slate-950/30" id="recent-activity">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Recent Activity</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Results */}
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-primary" />
                  Recent Results
                </CardTitle>
                <CardDescription>
                  Latest market results from our games
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PublicRecentResults />
              </CardContent>
            </Card>
            
            {/* Recent Winners */}
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-primary" />
                  Recent Winners
                </CardTitle>
                <CardDescription>
                  Players who recently won big on our platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingWinners ? (
                  <div className="py-8 flex justify-center">
                    <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
                  </div>
                ) : (
                  <RecentWinners winners={realWinners} />
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-8">
            <Button 
              variant="outline"
              className="border-primary/30"
              onClick={() => setLocation("/auth")}
            >
              Join Now to Start Winning
            </Button>
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <ProfessionalFooter />
      
      {/* Floating WhatsApp Button */}
      <FloatingWhatsApp />
    </div>
  );
}