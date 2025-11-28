import { useState, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { format, parseISO } from "date-fns";
import DashboardLayout from "@/components/dashboard-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  Calendar, 
  Search, 
  Plus,
  Clock, 
  CheckCircle2, 
  AlertCircle,
  X,
  Edit,
  Filter
} from "lucide-react";
import { GiCricketBat } from "react-icons/gi";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameType, TeamMatchResult } from "@shared/schema";

// Type for Cricket Toss Game
type CricketTossGame = {
  id: number;
  userId: number;
  gameType: string;
  betAmount: number;
  prediction: string;
  status: string;
  result: string | null;
  payout: number;
  createdAt: string;
  gameData: {
    teamA: string;
    teamB: string;
    tossTime: string;
    description: string;
    oddTeamA: number;
    oddTeamB: number;
    imageUrl?: string;
    status?: string; // "open" | "closed"
    openTime?: string;
    closeTime?: string;
  };
};

// Define the props for the cricket toss table component
interface CricketTossTableProps {
  games: CricketTossGame[];
  isLoading: boolean;
  handleEditGame: (game: CricketTossGame) => void;
  handleDeclareResult: (game: CricketTossGame) => void;
  handleChangeStatus: (game: CricketTossGame) => void;
  formatDate: (date: string | undefined) => string;
  StatusBadge: React.FC<{ result: string | null }>;
  getResultDisplay: (result: string | null, game: CricketTossGame) => string;
}

// Form schema for declaring toss results
const resultFormSchema = z.object({
  result: z.string().min(1, "Result is required")
});

// Form schema for changing game status
const statusFormSchema = z.object({
  status: z.enum(["open", "closed"], {
    required_error: "Status is required"
  })
});

// Form schema for creating/editing cricket toss games
const tossGameFormSchema = z.object({
  teamA: z.string().min(2, "Team A name must be at least 2 characters"),
  teamB: z.string().min(2, "Team B name must be at least 2 characters"),
  description: z.string().optional(),
  tossDate: z.string().min(1, "Toss date is required"),
  tossTime: z.string().min(1, "Toss time is required"),
  imageUrl: z.string().optional(),
});

export default function AdminCricketTossPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<CricketTossGame | null>(null);
  const [declareResultGame, setDeclareResultGame] = useState<CricketTossGame | null>(null);
  const queryClient = useQueryClient();

  // Form for result declaration
  const resultForm = useForm<z.infer<typeof resultFormSchema>>({
    resolver: zodResolver(resultFormSchema),
    defaultValues: {
      result: "",
    },
  });

  // Form for add/edit game
  const gameForm = useForm<z.infer<typeof tossGameFormSchema>>({
    resolver: zodResolver(tossGameFormSchema),
    defaultValues: {
      teamA: "",
      teamB: "",
      description: "",
      tossDate: format(new Date(), "yyyy-MM-dd"),
      tossTime: "12:00",
      imageUrl: "",
    },
  });

  // Mock data for Cricket Toss games (replace with API calls later)
  const mockGames: CricketTossGame[] = [
    {
      id: 1,
      userId: 1,
      gameType: GameType.CRICKET_TOSS,
      betAmount: 0,
      prediction: "",
      status: "open",
      result: null,
      payout: 0,
      createdAt: "2025-04-17T10:30:00",
      gameData: {
        teamA: "India",
        teamB: "Australia",
        tossTime: "2025-04-20T14:00:00",
        description: "T20 World Cup 2025",
        oddTeamA: 180,
        oddTeamB: 220,
        imageUrl: "/images/india-vs-australia.svg"
      }
    },
    {
      id: 2,
      userId: 1,
      gameType: GameType.CRICKET_TOSS,
      betAmount: 0,
      prediction: "",
      status: "open",
      result: null,
      payout: 0,
      createdAt: "2025-04-16T09:15:00",
      gameData: {
        teamA: "England",
        teamB: "New Zealand",
        tossTime: "2025-04-18T15:30:00",
        description: "Test Match Day 1",
        oddTeamA: 200,
        oddTeamB: 200,
        imageUrl: "/images/england-vs-nz.svg"
      }
    },
    {
      id: 3,
      userId: 1,
      gameType: GameType.CRICKET_TOSS,
      betAmount: 0,
      prediction: "",
      status: "resulted",
      result: "team_a",
      payout: 0,
      createdAt: "2025-04-14T11:20:00",
      gameData: {
        teamA: "Pakistan",
        teamB: "South Africa",
        tossTime: "2025-04-15T13:00:00",
        description: "ODI Series Match 2",
        oddTeamA: 210,
        oddTeamB: 190,
        imageUrl: "/images/pakistan-vs-sa.svg"
      }
    }
  ];

  // Query for all cricket toss games (from both APIs for backward compatibility)
  const { data: legacyGames = [], isLoading: isLoadingLegacyGames } = useQuery<CricketTossGame[]>({
    queryKey: ["/api/cricket-toss"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });
  
  // Query for standalone cricket toss games (new API)
  const { data: standaloneGames = [], isLoading: isLoadingStandaloneGames } = useQuery<CricketTossGame[]>({
    queryKey: ["/api/cricket-toss-games"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });
  
  // Combine both data sources with unique keys by adding a source identifier
  const allGames = [
    ...legacyGames.map(game => ({ ...game, source: 'legacy' })),
    ...standaloneGames.map(game => ({ ...game, source: 'standalone' }))
  ];
  const isLoadingGames = isLoadingLegacyGames || isLoadingStandaloneGames;

  // Filter games by result status
  const openGames = allGames.filter(game => 
    (game.result === null || game.result === "" || game.result === "pending"));
  const resultedGames = allGames.filter(game => 
    (game.result === "team_a" || game.result === "team_b"));
  const closedGames = allGames.filter(game => 
    (game.result !== null && game.result !== "" && game.result !== "pending" && 
     game.result !== "team_a" && game.result !== "team_b"));

  // Get games for current tab
  const getGamesForTab = () => {
    switch (activeTab) {
      case "open": return openGames;
      case "closed": return closedGames;
      case "resulted": return resultedGames;
      default: return allGames;
    }
  };

  // Filter games by search query
  const filteredGames = getGamesForTab().filter(game => {
    // If search query is empty, return all games
    if (searchQuery === "") return true;
    
    // If no gameData, still show it in the results but only when search is empty
    if (!game.gameData) return false;
    
    // Otherwise, filter by team names and description
    return game.gameData.teamA.toLowerCase().includes(searchQuery.toLowerCase()) || 
    game.gameData.teamB.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.gameData.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      return format(parseISO(dateString), "MMM d, yyyy h:mm a");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Handle opening edit game dialog
  const handleEditGame = (game: CricketTossGame) => {
    if (!game.gameData) return;
    
    setEditingGame(game);
    
    try {
      // Add safe handling of date parsing for toss time
      let tossDate = new Date();
      let tossTimeStr = "12:00";
      
      if (game.gameData.tossTime) {
        const parsedDate = parseISO(game.gameData.tossTime);
        tossDate = parsedDate;
        tossTimeStr = format(parsedDate, "HH:mm");
      }
      
      gameForm.reset({
        teamA: game.gameData.teamA,
        teamB: game.gameData.teamB,
        description: game.gameData.description || "",
        tossDate: format(tossDate, "yyyy-MM-dd"),
        tossTime: tossTimeStr,
        imageUrl: game.gameData.imageUrl || "",
      });
    } catch (error) {
      console.error("Error parsing game data:", error);
      toast({
        title: "Error",
        description: "Failed to load game data for editing. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle opening declare result dialog
  const handleDeclareResult = (game: CricketTossGame) => {
    try {
      setDeclareResultGame(game);
      resultForm.reset({ result: game.result || "" });
    } catch (error) {
      console.error("Error handling declare result:", error);
      toast({
        title: "Error",
        description: "Failed to open result declaration dialog. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Handle closing a match
  const handleCloseMatch = (game: CricketTossGame) => {
    try {
      // Check if this is a standalone cricket toss game and use the appropriate API
      const isStandalone = isStandaloneTossGame(game);
      
      // Confirm with the user before closing the match
      if (confirm(`Are you sure you want to close the match between ${game.gameData.teamA} and ${game.gameData.teamB}? This will prevent further betting.`)) {
        updateTossStatus.mutate({
          id: game.id,
          status: "closed",
          isStandalone: isStandalone
        });
      }
    } catch (error) {
      console.error("Error closing match:", error);
      toast({
        title: "Error",
        description: "Failed to close the match. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Helper to identify standalone cricket toss games vs legacy games
  const isStandaloneTossGame = (game: CricketTossGame): boolean => {
    // Games fetched from the new API are identifiable by source
    // This is a heuristic - we'd need a more reliable way to identify in production
    if ((game as any).matchId !== undefined) {
      return !(game as any).matchId;
    }
    // Default to true for new games
    return true;
  };

  // Mutation for declaring toss result
  const updateTossResult = useMutation({
    mutationFn: ({ id, result, isStandalone }: { id: number, result: string, isStandalone: boolean }) => {
      // Use the appropriate API endpoint based on game type
      const endpoint = isStandalone 
        ? `/api/cricket-toss-games/${id}/result` // New standalone endpoint
        : `/api/cricket-toss/${id}/result`;      // Legacy endpoint
        
      return apiRequest(
        'PATCH',
        endpoint,
        { result }
      );
    },
    onSuccess: () => {
      setDeclareResultGame(null);
      resultForm.reset();
      // Invalidate both query keys to ensure all data is updated
      queryClient.invalidateQueries({ queryKey: ["/api/cricket-toss"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cricket-toss-games"] });
      toast({
        title: "Result declared",
        description: "Toss result has been declared successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to declare result. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Mutation for updating game status (close/open)
  const updateTossStatus = useMutation({
    mutationFn: ({ id, status, isStandalone }: { id: number, status: string, isStandalone: boolean }) => {
      // Use the appropriate API endpoint based on game type
      const endpoint = isStandalone 
        ? `/api/cricket-toss-games/${id}/status` // New standalone endpoint
        : `/api/cricket-toss/${id}/status`;      // Legacy endpoint
        
      return apiRequest(
        'PATCH',
        endpoint,
        { status }
      );
    },
    onSuccess: () => {
      // Invalidate both query keys to ensure all data is updated
      queryClient.invalidateQueries({ queryKey: ["/api/cricket-toss"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cricket-toss-games"] });
      toast({
        title: "Status updated",
        description: "Match status has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle submit for declaring result
  const onSubmitResult = (data: z.infer<typeof resultFormSchema>) => {
    if (declareResultGame) {
      // Check if this is a standalone cricket toss game and use the appropriate API
      const isStandalone = isStandaloneTossGame(declareResultGame);
      
      updateTossResult.mutate({ 
        id: declareResultGame.id, 
        result: data.result,
        isStandalone: isStandalone
      });
    }
  };

  // Mutation for creating a standalone cricket toss game
  const createTossGame = useMutation({
    mutationFn: (data: any) => {
      // Use the new standalone endpoint
      return apiRequest(
        'POST',
        '/api/cricket-toss-games', // New standalone endpoint
        data
      );
    },
    onSuccess: () => {
      setIsAddGameOpen(false);
      gameForm.reset();
      // Invalidate both query keys to ensure all data is updated
      queryClient.invalidateQueries({ queryKey: ["/api/cricket-toss"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cricket-toss-games"] });
      toast({
        title: "Game created",
        description: "New Cricket Toss game has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create game. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation for updating a cricket toss game
  const updateTossGame = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => {
      return apiRequest(
        'PATCH',
        `/api/cricket-toss-games/${id}`,
        data
      );
    },
    onSuccess: () => {
      setEditingGame(null);
      gameForm.reset();
      // Invalidate both query keys to ensure all data is updated
      queryClient.invalidateQueries({ queryKey: ["/api/cricket-toss"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cricket-toss-games"] });
      toast({
        title: "Game updated",
        description: "Cricket Toss game has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update game. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle submit for adding/editing game
  const onSubmitGame = (formData: z.infer<typeof tossGameFormSchema>) => {
    // Combine date and time into a single ISO string for tossTime
    const { 
      tossDate, tossTime, 
      ...restData 
    } = formData;
    
    // Convert toss time to ISO string
    const combinedTossDateTime = `${tossDate}T${tossTime}:00`;
    
    // Create the data object with combined date/time
    const data = {
      ...restData,
      tossTime: combinedTossDateTime,
      // Use toss time for open/close time as well - admin will manage these manually
      openTime: combinedTossDateTime,
      closeTime: combinedTossDateTime,
    };
    
    if (editingGame) {
      // Update existing game
      updateTossGame.mutate({ 
        id: editingGame.id, 
        data: data
      });
    } else {
      // Create a new cricket toss game
      createTossGame.mutate(data);
    }
  };

  // Prepare to add a new game
  const handleAddGame = () => {
    setIsAddGameOpen(true);
    
    // Get today's date for the form fields
    const todayFormatted = format(new Date(), "yyyy-MM-dd");
    
    gameForm.reset({
      teamA: "",
      teamB: "",
      description: "",
      tossDate: todayFormatted,
      tossTime: "12:00",
      imageUrl: "",
    });
  };

  // Status badge component based on result field
  const StatusBadge = ({ result }: { result: string | null }) => {
    let color = "";
    let statusText = "";
    
    if (result === null || result === "" || result === "pending") {
      color = "bg-green-500 hover:bg-green-600";
      statusText = "Open";
    } else if (result === "team_a" || result === "team_b") {
      color = "bg-blue-500 hover:bg-blue-600";
      statusText = "Resulted";
    } else {
      color = "bg-yellow-500 hover:bg-yellow-600";
      statusText = "Closed";
    }
    
    return (
      <Badge className={color}>
        {statusText}
      </Badge>
    );
  };

  // Get result display
  const getResultDisplay = (result: string | null, game: CricketTossGame) => {
    if (result === null || result === "" || result === "pending") return "Pending";
    if (result === "team_a") {
      return game.gameData ? game.gameData.teamA : "Team A";
    }
    if (result === "team_b") {
      return game.gameData ? game.gameData.teamB : "Team B";
    }
    return result;
  };

  // Get today's date for display
  const today = new Date();
  const dateString = format(today, "EEEE, MMMM d, yyyy");

  return (
    <DashboardLayout title="Cricket Toss Management">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-5 w-5 mr-2" />
            <span>{dateString}</span>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleAddGame} className="bg-gradient-to-r from-blue-600 to-indigo-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Cricket Toss Game
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Create and manage Cricket Toss games for users to bet on which team will win the toss
        </p>
      </div>

      {/* Search and filter bar */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="relative flex items-center flex-1 min-w-[200px]">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search games..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center justify-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>All ({allGames.length})</span>
          </TabsTrigger>
          <TabsTrigger value="open" className="flex items-center justify-center">
            <Clock className="h-4 w-4 mr-2" />
            <span>Open ({openGames.length})</span>
          </TabsTrigger>
          <TabsTrigger value="closed" className="flex items-center justify-center">
            <X className="h-4 w-4 mr-2" />
            <span>Closed ({closedGames.length})</span>
          </TabsTrigger>
          <TabsTrigger value="resulted" className="flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            <span>Resulted ({resultedGames.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <CricketTossTable 
            games={filteredGames} 
            isLoading={isLoadingGames}
            handleEditGame={handleEditGame}
            handleDeclareResult={handleDeclareResult}
            handleChangeStatus={handleCloseMatch}
            formatDate={formatDate}
            StatusBadge={StatusBadge}
            getResultDisplay={getResultDisplay}
          />
        </TabsContent>
        
        <TabsContent value="open" className="space-y-6">
          <CricketTossTable 
            games={filteredGames} 
            isLoading={isLoadingGames}
            handleEditGame={handleEditGame}
            handleDeclareResult={handleDeclareResult}
            handleChangeStatus={handleCloseMatch}
            formatDate={formatDate}
            StatusBadge={StatusBadge}
            getResultDisplay={getResultDisplay}
          />
        </TabsContent>
        
        <TabsContent value="closed" className="space-y-6">
          <CricketTossTable 
            games={filteredGames} 
            isLoading={isLoadingGames}
            handleEditGame={handleEditGame}
            handleDeclareResult={handleDeclareResult}
            handleChangeStatus={handleCloseMatch}
            formatDate={formatDate}
            StatusBadge={StatusBadge}
            getResultDisplay={getResultDisplay}
          />
        </TabsContent>

        <TabsContent value="resulted" className="space-y-6">
          <CricketTossTable 
            games={filteredGames} 
            isLoading={isLoadingGames}
            handleEditGame={handleEditGame}
            handleDeclareResult={handleDeclareResult}
            handleChangeStatus={handleCloseMatch}
            formatDate={formatDate}
            StatusBadge={StatusBadge}
            getResultDisplay={getResultDisplay}
          />
        </TabsContent>
      </Tabs>

      {/* Declare Result Dialog */}
      <Dialog open={!!declareResultGame} onOpenChange={(open) => !open && setDeclareResultGame(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Declare Toss Result</DialogTitle>
            <DialogDescription>
              {declareResultGame && declareResultGame.gameData ? (
                <span>
                  Select which team won the toss: {declareResultGame.gameData.teamA} vs {declareResultGame.gameData.teamB}.
                </span>
              ) : (
                <span>
                  Select which team won the toss for Game #{declareResultGame?.id}.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...resultForm}>
            <form onSubmit={resultForm.handleSubmit(onSubmitResult)} className="space-y-4">
              <FormField
                control={resultForm.control}
                name="result"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Toss Winner</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select winner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TeamMatchResult.TEAM_A}>
                          {declareResultGame?.gameData ? `${declareResultGame.gameData.teamA} Won the Toss` : "Team A Won the Toss"}
                        </SelectItem>
                        <SelectItem value={TeamMatchResult.TEAM_B}>
                          {declareResultGame?.gameData ? `${declareResultGame.gameData.teamB} Won the Toss` : "Team B Won the Toss"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDeclareResultGame(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                >
                  Declare Result
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Cricket Toss Game Dialog */}
      <Dialog 
        open={isAddGameOpen || !!editingGame} 
        onOpenChange={(open) => {
          if (!open) {
            setIsAddGameOpen(false);
            setEditingGame(null);
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-secondary">
          <DialogHeader>
            <DialogTitle>{editingGame ? "Edit Cricket Toss Game" : "Add New Cricket Toss Game"}</DialogTitle>
            <DialogDescription>
              {editingGame 
                ? "Edit the details of the existing Cricket Toss game." 
                : "Fill in the details to create a new Cricket Toss game."}
            </DialogDescription>
          </DialogHeader>
          <Form {...gameForm}>
            <form onSubmit={gameForm.handleSubmit(onSubmitGame)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={gameForm.control}
                  name="teamA"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team A</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Mumbai Indians" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={gameForm.control}
                  name="teamB"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team B</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Chennai Super Kings" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={gameForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. IPL 2025 Match #12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Toss Date and Time Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={gameForm.control}
                  name="tossDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Toss Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={gameForm.control}
                  name="tossTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Toss Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          step="60"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Note: Open/Close buttons removed since admin manages these manually */}
              
              {/* Banner Image Selection */}
              <div className="space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <Label>Match Banner Image</Label>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex-1">
                      <FormField
                        control={gameForm.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                placeholder="Image URL" 
                                {...field} 
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex-none">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          // Show file picker and handle upload
                          const fileInput = document.createElement('input');
                          fileInput.type = 'file';
                          fileInput.accept = 'image/*';
                          
                          fileInput.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (!file) return;
                            
                            // Create form data for upload
                            const formData = new FormData();
                            formData.append('matchBannerImage', file);
                            
                            try {
                              // Upload the file
                              const response = await fetch('/api/upload/match-banner', {
                                method: 'POST',
                                body: formData,
                              });
                              
                              if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.error || 'Failed to upload image');
                              }
                              
                              const data = await response.json();
                              
                              if (data.imageUrl) {
                                // Set the image URL in the form
                                gameForm.setValue('imageUrl', data.imageUrl);
                                toast({
                                  title: "Image uploaded",
                                  description: "Banner image has been uploaded successfully",
                                });
                              }
                            } catch (error) {
                              console.error('Error uploading image:', error);
                              toast({
                                title: "Upload failed",
                                description: error instanceof Error ? error.message : 'Failed to upload image',
                                variant: "destructive"
                              });
                            }
                          };
                          
                          fileInput.click();
                        }}
                      >
                        Upload Image
                      </Button>
                    </div>
                  </div>
                  {gameForm.watch('imageUrl') && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Preview:</p>
                      <div className="relative w-full h-40 overflow-hidden rounded-md border border-input">
                        <img 
                          src={gameForm.watch('imageUrl')} 
                          alt="Match Banner Preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Image+Not+Found";
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    Upload a banner image for the cricket toss game (optional)
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddGameOpen(false);
                    setEditingGame(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingGame ? "Update Game" : "Create Game"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// Cricket Toss Table Component

function CricketTossTable({ 
  games, 
  isLoading,
  handleEditGame,
  handleDeclareResult,
  handleChangeStatus,
  formatDate,
  StatusBadge,
  getResultDisplay
}: {
  games: CricketTossGame[];
  isLoading: boolean;
  handleEditGame: (game: CricketTossGame) => void;
  handleDeclareResult: (game: CricketTossGame) => void;
  handleChangeStatus: (game: CricketTossGame) => void;
  formatDate: (date: string | undefined) => string;
  StatusBadge: React.FC<{ result: string | null }>;
  getResultDisplay: (result: string | null, game: CricketTossGame) => string;
}) {
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="w-full h-12" />
        <Skeleton className="w-full h-12" />
        <Skeleton className="w-full h-12" />
      </div>
    );
  }
  
  if (games.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-background">
        <GiCricketBat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-xl font-medium">No Cricket Toss games found</p>
        <p className="text-muted-foreground mt-1">
          Create a new Cricket Toss game to get started
        </p>
      </div>
    );
  }

  // Check if any games have gameData property - if at least one has it, we'll show the full table
  const hasAnyGameData = games.some((game: CricketTossGame) => game.gameData);

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Teams</TableHead>
            <TableHead>Toss Time</TableHead>
            <TableHead>Open/Close Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Result</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {games.map((game: CricketTossGame) => (
            <TableRow key={`${game.id}-${(game as any).source || 'default'}`}>
              <TableCell>
                {game.gameData ? (
                  <>
                    <div className="font-medium">
                      {game.gameData.teamA} vs {game.gameData.teamB}
                    </div>
                    {game.gameData.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {game.gameData.description}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="font-medium">
                    Game #{game.id}
                  </div>
                )}
              </TableCell>
              <TableCell>{game.gameData ? formatDate(game.gameData.tossTime) : formatDate(game.createdAt)}</TableCell>
              <TableCell>
                {game.gameData ? (
                  <div className="text-xs">
                    <div>Open: {game.gameData.openTime ? formatDate(game.gameData.openTime) : "Same as toss"}</div>
                    <div>Close: {game.gameData.closeTime ? formatDate(game.gameData.closeTime) : "Same as toss"}</div>
                  </div>
                ) : '-'}
              </TableCell>

              <TableCell>
                <StatusBadge result={game.result} />
              </TableCell>
              <TableCell className="font-medium">
                {getResultDisplay(game.result, game)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  {game.gameData && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditGame(game)}
                      disabled={!(game.result === null || game.result === "" || game.result === "pending")}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  
                  {/* Close Match Button - Only shown for open matches */}
                  {(game.result === null || game.result === "" || game.result === "pending") && (
                    <Button 
                      variant="secondary"
                      size="sm" 
                      onClick={() => handleChangeStatus(game)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Close Match
                    </Button>
                  )}
                  
                  <Button 
                    variant={(game.result === "team_a" || game.result === "team_b") ? "outline" : "default"}
                    size="sm" 
                    onClick={() => handleDeclareResult(game)}
                    disabled={!(game.result === null || game.result === "" || game.result === "pending")}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    {(game.result === "team_a" || game.result === "team_b") ? "Update Result" : "Declare Result"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}