import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatCurrency } from "@/lib/format-utils";
import { ChevronRight, ChevronLeft, RefreshCw, AlertCircle, Hash, Type, ArrowLeftRight, Divide, Clock, CheckCircle, AlignHorizontalJustifyStart, Grid2X2 } from "lucide-react";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

// Define SatamatkaMarket interface
interface SatamatkaMarket {
  id: number;
  name: string;
  type: string;
  openTime: string;
  closeTime: string;
  openResult?: string;
  closeResult?: string;
  status: string;
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

// Game modes in the Satamatka game
const GAME_MODES = {
  jodi: "Jodi (Full Number)",
  harf: "Harf",
  crossing: "Crossing Digit",
  odd_even: "Odd-Even",
};

// Define the form schema
const formSchema = z.object({
  gameMode: z.enum(["jodi", "harf", "crossing", "odd_even"], {
    required_error: "Please select a game mode",
  }),
  prediction: z.string().min(1, "Prediction is required"),
  betAmount: z.coerce
    .number()
    .min(10, "Minimum bet amount is 10")
    .max(10000, "Maximum bet amount is 10,000"),
});

// Game data interface for Satamatka game
interface SatamatkaGameData {
  gameMode: string;
  marketId: number;
  marketName?: string;
}

// Game interface for recent bets
interface Game {
  id: number;
  userId: number;
  gameType: string;
  prediction: string;
  betAmount: number;
  result: string | null;
  status: string;
  payout: number | null;
  marketId?: number;
  marketName?: string;
  createdAt: string;
  gameData?: SatamatkaGameData | any; // Using any as fallback since different game types have different data structures
}

export default function SatamatkaGame() {
  const { id } = useParams<{ id: string }>();
  const marketId = parseInt(id);
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedNumber, setSelectedNumber] = useState<string>("");
  const [selectedGameMode, setSelectedGameMode] = useState<string>("jodi");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [betDetails, setBetDetails] = useState<{prediction: string; betAmount: number} | null>(null);
  const [gameOdds, setGameOdds] = useState<Record<string, number>>({});
  
  // New state for multi-selection and quick bet amounts
  const [quickBetAmount, setQuickBetAmount] = useState<number>(10);
  const [selectedNumbers, setSelectedNumbers] = useState<Map<string, number>>(new Map());
  const [showBetSlip, setShowBetSlip] = useState<boolean>(false);

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gameMode: "jodi",
      prediction: "",
      betAmount: 100,
    },
  });

  // Update prediction when number or game mode selection changes
  useEffect(() => {
    if (selectedNumber) {
      form.setValue("prediction", selectedNumber);
    }
  }, [selectedNumber, form]);

  // Query the market details
  const { data: market, isLoading, error: marketError } = useQuery({
    queryKey: ["/api/satamatka/markets", marketId],
    queryFn: async ({ queryKey }) => {
      try {
        const res = await fetch(`${queryKey[0]}/${queryKey[1]}`, {
          credentials: "include",
        });
        
        if (res.status === 401) {
          toast({
            variant: "destructive",
            title: "Authentication required",
            description: "Please log in to view market details.",
          });
          setLocation("/auth");
          return null;
        }
        
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`${res.status}: ${text || res.statusText}`);
        }
        
        return await res.json();
      } catch (error) {
        console.error("Market fetch error:", error);
        throw error;
      }
    },
    enabled: !!user && !isNaN(marketId)
  });

  // Fetch the game odds for Satamatka - get player-specific odds based on their assigned subadmin
  const { data: satamatkaOddsData } = useQuery<any>({
    queryKey: ['/api/game-odds', 'satamatka', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const modes = ['jodi', 'harf', 'crossing', 'odd_even'];
      
      // This will get the odds that apply to this specific player
      // which should include any subadmin overrides if applicable
      const results = await Promise.all(
        modes.map(mode => 
          apiRequest("GET", `/api/game-odds/player?gameType=satamatka_${mode}`)
            .then(res => res.json())
            .catch(err => {
              console.error(`Error fetching odds for ${mode}:`, err);
              return null;
            })
        )
      );
      
      console.log("Raw game odds data from API:", results);
      
      // Parse the odds data from the database
      // Database stores values like this: 60x is stored as 6000, 7x is stored as 700
      return { 
        // Use first item from each result, which should now correctly return subadmin override if available
        jodi: results[0]?.[0]?.oddValue || 6000, 
        harf: results[1]?.[0]?.oddValue || 600, 
        crossing: results[2]?.[0]?.oddValue || 6600,
        odd_even: results[3]?.[0]?.oddValue || 600 
      };
    },
    enabled: !!user
  });
  
  // Update game odds when they load
  useEffect(() => {
    if (satamatkaOddsData) {
      console.log("Received Satamatka odds:", satamatkaOddsData);
      // No need to divide here as the calculatePotentialWin function already handles division by 100
      setGameOdds(satamatkaOddsData);
    }
  }, [satamatkaOddsData]);

  // Log market data when it changes
  useEffect(() => {
    if (market) {
      console.log("Market data received:", market);
    }
    if (marketError) {
      console.error("Error fetching market:", marketError);
      toast({
        variant: "destructive",
        title: "Error loading market",
        description: marketError instanceof Error ? marketError.message : "Could not load market details. Please try again."
      });
    }
  }, [market, marketError, toast]);

  // Query for user's recent bets
  const { data: recentBets = [] as Game[], refetch: refetchRecentBets } = useQuery<Game[]>({
    queryKey: ["/api/games/my-history"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user
  });
  
  // Log bet history when received
  useEffect(() => {
    if (recentBets && Array.isArray(recentBets) && recentBets.length > 0) {
      console.log("Received bet history:", recentBets);
    }
  }, [recentBets]);

  // Mutation for placing a single bet
  const placeBetMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      // Fix: Use correct method parameter ordering in apiRequest
      return apiRequest("POST", "/api/satamatka/play", {
        marketId: marketId,
        gameMode: data.gameMode,
        prediction: data.prediction,
        betAmount: data.betAmount,
      });
    },
    onSuccess: () => {
      // Show success toast
      toast({
        variant: "success",
        title: "Bet placed successfully!",
        description: "Your bet has been placed on the selected market.",
      });

      // Invalidate relevant queries and refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games/my-history"] });
      
      // Reset form
      form.reset({
        gameMode: selectedGameMode as any,
        prediction: "",
        betAmount: 100,
      });
      setSelectedNumber("");
      
      // Refetch recent bets to show updated list
      refetchRecentBets();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to place bet",
        description: error.message,
      });
    },
  });
  
  // Mutation for placing multiple bets
  const placeMultipleBetsMutation = useMutation({
    mutationFn: async (bets: Array<{number: string, amount: number}>) => {
      // For crossing game type, generate all combinations
      let serverBets;
      
      if (selectedGameMode === "crossing" && bets.length > 1) {
        // Generate all possible combinations (pairs) of the selected digits
        serverBets = [];
        for (let i = 0; i < bets.length; i++) {
          for (let j = 0; j < bets.length; j++) {
            // Skip same digit combinations
            if (i !== j) {
              const digit1 = bets[i].number;
              const digit2 = bets[j].number;
              const combination = `${digit1}${digit2}`;
              
              serverBets.push({
                prediction: combination,
                betAmount: bets[i].amount * 100, // Convert to paisa
              });
            }
          }
        }
      } else {
        // For other game modes, process normally
        serverBets = bets.map(bet => {
          // For satamatka games, the stored amounts are already in rupees
          // The server expects paisa, so we need to multiply by 100
          return {
            prediction: bet.number,
            betAmount: bet.amount * 100,
          };
        });
      }
      
      // Use the new bulk betting endpoint
      const response = await apiRequest("POST", "/api/satamatka/play-multiple", {
        marketId: marketId,
        gameMode: selectedGameMode,
        bets: serverBets
      });
      
      // Parse the response JSON
      return await response.json();
    },
    onSuccess: (result) => {
      // Get the number of successful bets from the response
      console.log("Multiple bets response:", result);
      const successCount = result?.games?.length || 0;
      const totalAmount = result?.totalBetAmount || 0;
      
      toast({
        variant: "success",
        title: "All bets placed successfully!",
        description: `${successCount} bets (₹${totalAmount/100}) have been placed on the selected market.`,
      });

      // Invalidate relevant queries and refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games/my-history"] });
      
      // Reset multi-selection
      setSelectedNumbers(new Map());
      setShowBetSlip(false);
      
      // Refetch recent bets to show updated list
      refetchRecentBets();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to place bets",
        description: error.message || "Some bets could not be placed. Please try again.",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please login to place a bet.",
      });
      return;
    }

    // Set bet details and open confirmation dialog
    setBetDetails({
      prediction: data.prediction,
      betAmount: data.betAmount
    });
    setConfirmDialogOpen(true);
  };
  
  // Handle bet confirmation from dialog
  const handleConfirmBet = () => {
    if (betDetails) {
      // Check if we're confirming a single bet or multiple bets
      if (selectedNumbers.size > 0) {
        // Processing multiple bets
        const bets = Array.from(selectedNumbers.entries()).map(([number, amount]) => ({
          number, 
          amount
        }));
        
        // Use the multiple bets mutation
        placeMultipleBetsMutation.mutate(bets);
      } else {
        // Single bet from the form
        const formData = form.getValues();
        placeBetMutation.mutate(formData as any);
      }
      
      // Close dialog and reset UI
      setConfirmDialogOpen(false);
      setSelectedNumbers(new Map());
      setShowBetSlip(false);
    }
  };
  
  // Handle multi-selection of numbers with incremental bet amounts
  const handleNumberSelection = (num: string) => {
    const newSelections = new Map(selectedNumbers);
    
    if (newSelections.has(num)) {
      // Different behavior based on game mode
      if (selectedGameMode === "crossing") {
        // For crossing game type, clicking an already selected number deselects it
        newSelections.delete(num);
      } else {
        // For jodi and other game types, add the quickBetAmount to the current amount
        const currentAmount = newSelections.get(num) || 0;
        newSelections.set(num, currentAmount + quickBetAmount);
      }
    } else {
      // If not selected, add with current bet amount
      // Store the actual amount without conversion - we'll handle paisa conversion later
      newSelections.set(num, quickBetAmount);
    }
    
    setSelectedNumbers(newSelections);
  };
  
  // Remove a number from selection (used in bet slip and other UI elements)
  const removeNumberSelection = (num: string) => {
    const newSelections = new Map(selectedNumbers);
    newSelections.delete(num);
    setSelectedNumbers(newSelections);
  };
  
  // Calculate total bet amount across all selections
  const calculateTotalBetAmount = (formatted = false): number | string => {
    let total = 0;
    selectedNumbers.forEach(amount => {
      total += amount;
    });
    
    // Return formatted amount for display if requested
    // For jodi and harf, the bet amounts are already in rupees
    if (formatted) {
      return total.toFixed(2);
    }
    
    return total;
  };
  
  // Place bets for all selected numbers
  const placeBetsForAllSelections = async () => {
    if (selectedNumbers.size === 0) {
      toast({
        variant: "destructive",
        title: "No numbers selected",
        description: "Please select at least one number to place a bet."
      });
      return;
    }
    
    // Set bet details for confirmation dialog
    setBetDetails({
      prediction: Array.from(selectedNumbers.keys()).join(", "),
      betAmount: Number(calculateTotalBetAmount())
    });
    setConfirmDialogOpen(true);
  };

  // Generate the number grid based on game mode
  const renderNumberGrid = () => {
    if (selectedGameMode === "jodi") {
      return (
        <div className="space-y-4">
          {/* Quick bet amount buttons */}
          <div className="p-2 mb-4 bg-muted/30 rounded-lg">
            <div className="text-sm font-medium mb-2">Quick Bet Amount</div>
            <div className="space-y-2">
              {/* Preset amounts */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                {[100, 500, 1000, 5000].map((amount) => (
                  <Button
                    key={amount}
                    variant={quickBetAmount === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQuickBetAmount(amount)}
                    className={`${
                      quickBetAmount === amount 
                        ? "bg-primary/90 text-primary-foreground" 
                        : "hover:bg-primary/20"
                    }`}
                  >
                    ₹{amount.toLocaleString()}
                  </Button>
                ))}
              </div>
              
              {/* Custom amount input with increment/decrement */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-12 p-0"
                  onClick={() => {
                    if (quickBetAmount > 100) {
                      setQuickBetAmount(Math.max(100, quickBetAmount - 100));
                    }
                  }}
                >
                  -
                </Button>
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={quickBetAmount}
                    className="text-center pr-10"
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value === '') {
                        setQuickBetAmount(0);
                      } else {
                        setQuickBetAmount(parseInt(value));
                      }
                    }}
                  />
                  <span className="absolute right-2 top-[9px] text-gray-400">₹</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-12 p-0"
                  onClick={() => {
                    setQuickBetAmount(quickBetAmount + 100);
                  }}
                >
                  +
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-2"
                  onClick={() => {
                    if (user && user.balance > 0) {
                      // Use the user's balance converted from paisa to rupees
                      setQuickBetAmount(Math.min(10000, Math.floor(user.balance / 100)));
                    }
                  }}
                >
                  MAX
                </Button>
              </div>
            </div>
          </div>
          
          {/* Mobile-optimized number grid with 5 numbers per row */}
          <div className="space-y-4">
            <div className="text-sm font-medium">Select Numbers</div>
            
            {/* All numbers (00-99) in a scrollable container with first 20 visible initially */}
            <div className="grid grid-cols-5 gap-2 max-h-[320px] overflow-y-auto p-2 border rounded-lg border-slate-700">
              {Array.from({ length: 100 }, (_, i) => {
                const num = i.toString().padStart(2, "0");
                const isSelected = selectedNumbers.has(num);
                const betAmount = selectedNumbers.get(num) || 0;
                
                return (
                  <div key={num} className="relative">
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className={`h-12 w-full flex flex-col items-center justify-center p-1 ${
                        isSelected ? "bg-primary/90" : ""
                      }`}
                      onClick={() => handleNumberSelection(num)}
                    >
                      <span className="text-base font-medium">{num}</span>
                      {isSelected && (
                        <span className="text-xs mt-1">₹{betAmount.toFixed(2)}</span>
                      )}
                    </Button>
                    {isSelected && (
                      <button
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNumberSelection(num);
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Bet slip button for selected numbers */}
          {selectedNumbers.size > 0 && (
            <div className="mt-4">
              <Button 
                variant="default" 
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 shadow-lg transition-all duration-200"
                onClick={() => setShowBetSlip(true)}
              >
                View Bet Slip ({selectedNumbers.size} numbers, ₹{calculateTotalBetAmount(true)})
              </Button>
            </div>
          )}
        </div>
      );
    } else if (selectedGameMode === "harf") {
      // Create improved Harf bet type UI with left digit, right digit selection
      return (
        <div className="space-y-4">
          {/* Quick bet amount buttons */}
          <div className="p-2 mb-4 bg-muted/30 rounded-lg">
            <div className="text-sm font-medium mb-2">Quick Bet Amount</div>
            <div className="space-y-2">
              {/* Preset amounts */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                {[100, 500, 1000, 5000].map((amount) => (
                  <Button
                    key={amount}
                    variant={quickBetAmount === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQuickBetAmount(amount)}
                    className={`${
                      quickBetAmount === amount 
                        ? "bg-primary/90 text-primary-foreground" 
                        : "hover:bg-primary/20"
                    }`}
                  >
                    ₹{amount.toLocaleString()}
                  </Button>
                ))}
              </div>
              
              {/* Custom amount input with increment/decrement */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-12 p-0"
                  onClick={() => {
                    if (quickBetAmount > 100) {
                      setQuickBetAmount(Math.max(100, quickBetAmount - 100));
                    }
                  }}
                >
                  -
                </Button>
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={quickBetAmount}
                    className="text-center pr-10"
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value === '') {
                        setQuickBetAmount(0);
                      } else {
                        setQuickBetAmount(parseInt(value));
                      }
                    }}
                  />
                  <span className="absolute right-2 top-[9px] text-gray-400">₹</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-12 p-0"
                  onClick={() => {
                    setQuickBetAmount(quickBetAmount + 100);
                  }}
                >
                  +
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-2"
                  onClick={() => {
                    if (user && user.balance > 0) {
                      // Use the user's balance converted from paisa to rupees
                      setQuickBetAmount(Math.min(10000, Math.floor(user.balance / 100)));
                    }
                  }}
                >
                  MAX
                </Button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ander Digit Selection (First digit 0-9) */}
            <Card className="border border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ander (A)</CardTitle>
                <CardDescription className="text-xs">Select the left digit (0-9)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }, (_, i) => {
                    const num = `A${i}`;
                    const isSelected = selectedNumbers.has(num);
                    const betAmount = selectedNumbers.get(num) || 0;
                    
                    return (
                      <div key={num} className="relative">
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          className={`h-10 w-full flex flex-col items-center justify-center p-1 ${
                            isSelected ? "bg-primary/90" : ""
                          }`}
                          onClick={() => handleNumberSelection(num)}
                        >
                          <span className="text-base font-medium">{i}</span>
                          {isSelected && (
                            <span className="text-xs mt-1">₹{betAmount}</span>
                          )}
                        </Button>
                        {isSelected && (
                          <button
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNumberSelection(num);
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* Bahar Digit Selection (Second digit 0-9) */}
            <Card className="border border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Bahar (B)</CardTitle>
                <CardDescription className="text-xs">Select the right digit (0-9)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }, (_, i) => {
                    const num = `B${i}`;
                    const isSelected = selectedNumbers.has(num);
                    const betAmount = selectedNumbers.get(num) || 0;
                    
                    return (
                      <div key={num} className="relative">
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          className={`h-10 w-full flex flex-col items-center justify-center p-1 ${
                            isSelected ? "bg-primary/90" : ""
                          }`}
                          onClick={() => handleNumberSelection(num)}
                        >
                          <span className="text-base font-medium">{i}</span>
                          {isSelected && (
                            <span className="text-xs mt-1">₹{betAmount}</span>
                          )}
                        </Button>
                        {isSelected && (
                          <button
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNumberSelection(num);
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Bet slip button for selected numbers */}
          {selectedNumbers.size > 0 && (
            <div className="mt-4">
              <Button 
                variant="default" 
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 shadow-lg transition-all duration-200"
                onClick={() => setShowBetSlip(true)}
              >
                View Bet Slip ({selectedNumbers.size} numbers, ₹{calculateTotalBetAmount(true)})
              </Button>
            </div>
          )}
        </div>
      );
    } else if (selectedGameMode === "crossing") {
      // Calculate total combinations based on selected numbers
      const calculateCombinations = (digits: string[]) => {
        if (digits.length <= 1) return 0;
        
        // Number of combinations is N*(N-1) where N is the number of digits selected
        // Each pair of digits forms two combinations (e.g., 1,2 forms 12 and 21)
        return digits.length * (digits.length - 1);
      };
      
      // Extract just the digit values from the selected numbers Map keys
      const selectedDigits = Array.from(selectedNumbers.keys());
      const totalCombinations = calculateCombinations(selectedDigits);
      
      return (
        <div className="space-y-4">
          {/* Quick bet amount buttons */}
          <div className="p-2 mb-2 bg-muted/30 rounded-lg">
            <div className="text-sm font-medium mb-2">Quick Bet Amount</div>
            <div className="space-y-2">
              {/* Preset amounts */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                {[100, 500, 1000, 5000].map((amount) => (
                  <Button
                    key={amount}
                    variant={quickBetAmount === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQuickBetAmount(amount)}
                    className={`${
                      quickBetAmount === amount 
                        ? "bg-primary/90 text-primary-foreground" 
                        : "hover:bg-primary/20"
                    }`}
                  >
                    ₹{amount.toLocaleString()}
                  </Button>
                ))}
              </div>
              
              {/* Custom amount input with increment/decrement */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-12 p-0"
                  onClick={() => {
                    if (quickBetAmount > 100) {
                      setQuickBetAmount(Math.max(100, quickBetAmount - 100));
                    }
                  }}
                >
                  -
                </Button>
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={quickBetAmount}
                    className="text-center pr-10"
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value === '') {
                        setQuickBetAmount(0);
                      } else {
                        setQuickBetAmount(parseInt(value));
                      }
                    }}
                  />
                  <span className="absolute right-2 top-[9px] text-gray-400">₹</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-12 p-0"
                  onClick={() => {
                    setQuickBetAmount(quickBetAmount + 100);
                  }}
                >
                  +
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-2"
                  onClick={() => {
                    if (user && user.balance > 0) {
                      // Use the user's balance converted from paisa to rupees
                      setQuickBetAmount(Math.min(10000, Math.floor(user.balance / 100)));
                    }
                  }}
                >
                  MAX
                </Button>
              </div>
            </div>
          </div>
          
          {/* Selected digits summary */}
          {selectedDigits.length > 0 && (
            <div className="mb-2 p-3 border rounded-lg border-primary/30 bg-primary/5">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium">Selected Digits</h4>
                <Badge variant="outline" className="bg-primary/10">
                  {selectedDigits.join(", ")}
                </Badge>
              </div>
              
              <div className="flex flex-col space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Combinations:</span>
                  <span className="font-medium">{totalCombinations} numbers</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bet per combination:</span>
                  <span className="font-medium">₹{(quickBetAmount * 100 / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total bet amount:</span>
                  <span className="font-medium">₹{(totalCombinations * quickBetAmount * 100 / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Potential win (max):</span>
                  <span className="font-medium text-amber-500">₹{(calculatePotentialWin(selectedGameMode, quickBetAmount, gameOdds) * totalCombinations).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Number selection grid */}
          <div>
            <div className="text-sm font-medium mb-2">Select Numbers (0-9)</div>
            <div className="grid grid-cols-5 gap-3 p-2">
              {Array.from({ length: 10 }, (_, i) => {
                const num = i.toString();
                const isSelected = selectedNumbers.has(num);
                
                return (
                  <div key={num} className="relative">
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className={`h-12 w-full flex items-center justify-center p-1 ${
                        isSelected ? "bg-primary text-primary-foreground" : ""
                      }`}
                      onClick={() => handleNumberSelection(num)}
                    >
                      <span className="text-lg font-medium">{num}</span>
                    </Button>
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full h-5 w-5 flex items-center justify-center text-xs border border-white">
                        ✓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Combinations preview */}
          {selectedDigits.length > 1 && (
            <div className="mt-4 p-3 border rounded-lg bg-muted/10">
              <h4 className="text-sm font-medium mb-2">Generated Combinations</h4>
              <div className="grid grid-cols-5 md:grid-cols-8 gap-2">
                {selectedDigits.flatMap((digit1, i) => 
                  selectedDigits.filter((_, j) => i !== j).map(digit2 => {
                    const combination = `${digit1}${digit2}`;
                    return (
                      <Badge 
                        key={combination} 
                        variant="outline" 
                        className="py-1.5 bg-primary/5 border-primary/20"
                      >
                        {combination}
                      </Badge>
                    );
                  })
                )}
              </div>
            </div>
          )}
          
          {/* Place all bets button */}
          {selectedDigits.length > 1 && (
            <div className="mt-4">
              <Button 
                variant="default" 
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 shadow-lg transition-all duration-200"
                onClick={() => {
                  // Generate prediction text describing the combinations
                  const combinationsText = selectedDigits.length > 3 
                    ? `${selectedDigits.length} digits (${totalCombinations} combinations)`
                    : `Combinations of ${selectedDigits.join(",")}`;
                  
                  // Set bet details for confirmation dialog 
                  // Store amount as rupees, we'll convert to paisa in the mutation
                  setBetDetails({
                    prediction: combinationsText,
                    betAmount: totalCombinations * quickBetAmount
                  });
                  
                  // Open confirmation dialog
                  setConfirmDialogOpen(true);
                }}
              >
                Place Bets on {totalCombinations} Combinations ({selectedGameMode === "crossing" 
                  ? `₹${(totalCombinations * quickBetAmount * 100 / 100).toFixed(2)}` 
                  : formatCurrency(totalCombinations * quickBetAmount, 'satamatka')})
              </Button>
            </div>
          )}
        </div>
      );
    } else if (selectedGameMode === "odd_even") {
      // Enhanced Odd-Even game type UI with quick bet options and bet slip
      return (
        <div className="space-y-6">
          {/* Quick bet amount buttons */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="text-sm font-medium mb-2">Quick Bet Amount</div>
            <div className="space-y-2">
              {/* Preset amounts */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                {[100, 500, 1000, 5000].map((amount) => (
                  <Button
                    key={amount}
                    variant={quickBetAmount === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQuickBetAmount(amount)}
                    className={`${
                      quickBetAmount === amount 
                        ? "bg-primary/90 text-primary-foreground" 
                        : "hover:bg-primary/20"
                    }`}
                  >
                    ₹{amount.toLocaleString()}
                  </Button>
                ))}
              </div>
              
              {/* Custom amount input with increment/decrement */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-12 p-0"
                  onClick={() => {
                    if (quickBetAmount > 100) {
                      setQuickBetAmount(Math.max(100, quickBetAmount - 100));
                    }
                  }}
                >
                  -
                </Button>
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={quickBetAmount}
                    className="text-center pr-10"
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value === '') {
                        setQuickBetAmount(0);
                      } else {
                        setQuickBetAmount(parseInt(value));
                      }
                    }}
                  />
                  <span className="absolute right-2 top-[9px] text-gray-400">₹</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-12 p-0"
                  onClick={() => {
                    setQuickBetAmount(quickBetAmount + 100);
                  }}
                >
                  +
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-2"
                  onClick={() => {
                    if (user && user.balance > 0) {
                      // Use the user's balance converted from paisa to rupees
                      setQuickBetAmount(Math.min(10000, Math.floor(user.balance / 100)));
                    }
                  }}
                >
                  MAX
                </Button>
              </div>
            </div>
          </div>
          
          {/* Improved Odd-Even selection cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card 
              className={`cursor-pointer transition-all border ${
                selectedNumbers.has("odd") ? "border-primary shadow-md" : "border-slate-700"
              }`}
              onClick={() => handleNumberSelection("odd")}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <div className="bg-primary/10 rounded-full p-3 mb-3">
                  <Grid2X2 className="h-10 w-10 text-primary" />
                </div>
                <p className="font-bold text-xl">ODD</p>
                {selectedNumbers.has("odd") && (
                  <div className="mt-3 flex flex-col items-center gap-2">
                    <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      <div className="h-4 w-4 mr-1 text-green-600">✓</div>
                      <span className="text-sm font-medium">₹{selectedNumbers.get("odd")}</span>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="mt-1 text-xs px-2 py-0 h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNumberSelection("odd");
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card 
              className={`cursor-pointer transition-all border ${
                selectedNumbers.has("even") ? "border-primary shadow-md" : "border-slate-700"
              }`}
              onClick={() => handleNumberSelection("even")}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <div className="bg-primary/10 rounded-full p-3 mb-3">
                  <Divide className="h-10 w-10 text-primary" />
                </div>
                <p className="font-bold text-xl">EVEN</p>
                {selectedNumbers.has("even") && (
                  <div className="mt-3 flex flex-col items-center gap-2">
                    <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      <div className="h-4 w-4 mr-1 text-green-600">✓</div>
                      <span className="text-sm font-medium">₹{selectedNumbers.get("even")}</span>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="mt-1 text-xs px-2 py-0 h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNumberSelection("even");
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Bet details card */}
          {selectedNumbers.size > 0 && (
            <Card className="border border-primary/20 bg-primary/5 mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Your Bet Details</CardTitle>
                <CardDescription>
                  Review your bet details before confirming
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Selected:</span>
                    <span className="font-medium ml-2">
                      {Array.from(selectedNumbers.keys())
                        .map(n => n.charAt(0).toUpperCase() + n.slice(1))
                        .join(", ")}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium ml-2">
                      {selectedGameMode === "odd_even" 
                        ? `₹${calculateTotalBetAmount(true)}` 
                        : formatCurrency(Number(calculateTotalBetAmount()), 'satamatka')}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Payout Ratio:</span>
                    <span className="font-medium ml-2">
                      {selectedGameMode === "jodi" 
                        ? `${(gameOdds.jodi ? (gameOdds.jodi / 10000) : 60)}x` 
                        : selectedGameMode === "harf" 
                        ? `${(gameOdds.harf ? (gameOdds.harf / 10000) : 6)}x` 
                        : selectedGameMode === "crossing" 
                        ? `${(gameOdds.crossing ? (gameOdds.crossing / 10000) : 66)}x` 
                        : selectedGameMode === "odd_even" 
                        ? `${(gameOdds.odd_even ? (gameOdds.odd_even / 10000) : 6)}x` 
                        : "1x"}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Potential Win:</span>
                    <span className="font-medium ml-2 text-amber-500">
                      ₹{calculatePotentialWin(selectedGameMode, Number(calculateTotalBetAmount()), gameOdds).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="default" 
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 shadow-lg transition-all duration-200"
                  onClick={() => {
                    setBetDetails({
                      prediction: Array.from(selectedNumbers.keys())[0],
                      betAmount: Array.from(selectedNumbers.values())[0]
                    });
                    setConfirmDialogOpen(true);
                  }}
                  disabled={selectedNumbers.size === 0}
                >
                  Place Bet Now
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      );
    }

    return null;
  };

  // Generate description based on game mode
  const getGameModeDescription = () => {
    switch (selectedGameMode) {
      case "jodi":
        return `Predict the exact two-digit number (00-99). Payout ratio: ${(gameOdds.jodi ? gameOdds.jodi / 10000 : 60)}x`;
      case "harf":
        return `Predict digits in specific positions (left/right). Select first digit, second digit, or both. Payout ratio: ${(gameOdds.harf ? gameOdds.harf / 10000 : 6)}x`;
      case "crossing":
        return `Select multiple digits (0-9) to create two-digit combinations. For example, selecting 1,2,3 creates: 12, 21, 13, 31, 23, 32. Payout ratio: ${(gameOdds.crossing ? gameOdds.crossing / 10000 : 66)}x`;
      case "odd_even":
        return `Predict if the result will be odd or even. Payout ratio: ${(gameOdds.odd_even ? gameOdds.odd_even / 10000 : 1.9)}x`;
      default:
        return "Select a game mode to see details.";
    }
  };

  // Handle game mode change
  const handleGameModeChange = (value: string) => {
    setSelectedGameMode(value);
    form.setValue("gameMode", value as any);
    // Reset prediction when game mode changes
    setSelectedNumber("");
    form.setValue("prediction", "");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Skeleton className="h-[400px] rounded-lg" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Market not found or is no longer available.
            <Button
              variant="outline"
              className="mt-2 w-full"
              onClick={() => setLocation("/markets")}
            >
              Go back to Markets
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // TypeScript check to ensure market has the expected properties
  const typedMarket = market as unknown as SatamatkaMarket;
  
  if (typedMarket.status !== "open") {
    return (
      <div className="container mx-auto py-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Market Closed</AlertTitle>
          <AlertDescription>
            This market is no longer open for betting.
            <Button
              variant="outline"
              className="mt-2 w-full"
              onClick={() => setLocation("/markets")}
            >
              Go back to Markets
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="py-2">
      {/* Bet slip dialog for showing all selections */}
      <Dialog open={showBetSlip} onOpenChange={setShowBetSlip}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your Bet Slip</DialogTitle>
            <DialogDescription>
              Review your selections before placing your bet
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Potential Win</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from(selectedNumbers.entries()).map(([num, amount]) => {
                  // Format display for left/right digit selections in Harf mode
                  let displayNum = num;
                  if (selectedGameMode === "harf") {
                    if (num.startsWith("L")) {
                      displayNum = `Left: ${num.substring(1)}`;
                    } else if (num.startsWith("R")) {
                      displayNum = `Right: ${num.substring(1)}`;
                    }
                  }
                  
                  return (
                    <TableRow key={num}>
                      <TableCell className="font-medium">{displayNum}</TableCell>
                      <TableCell>₹{amount.toFixed(2)}</TableCell>
                      <TableCell className="text-amber-500">
                        ₹{calculatePotentialWin(selectedGameMode, amount, gameOdds).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full bg-red-100 text-red-700 hover:bg-red-200"
                          onClick={() => removeNumberSelection(num)}
                        >
                          ×
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Total Bet Amount:</span>
              <span className="font-bold">
                ₹{Number(calculateTotalBetAmount()).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Potential Win:</span>
              <span className="font-bold text-amber-500">
                ₹{Array.from(selectedNumbers.values()).reduce(
                  (total, amount) => total + calculatePotentialWin(selectedGameMode, amount, gameOdds),
                  0
                ).toFixed(2)}
              </span>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowBetSlip(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={placeBetsForAllSelections}
              className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 shadow-lg transition-all duration-200"
              disabled={selectedNumbers.size === 0 || placeBetMutation.isPending}
            >
              {placeBetMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Place All Bets"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirmation dialog for placing bet */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Your Bet</DialogTitle>
            <DialogDescription>
              Please review your bet details before confirming
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Market</p>
                <p className="font-medium">{typedMarket.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Game Mode</p>
                <p className="font-medium">{GAME_MODES[selectedGameMode as keyof typeof GAME_MODES]}</p>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Prediction</p>
              <p className="font-bold">{betDetails?.prediction}</p>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Bet Amount</p>
                <p className="text-lg font-bold">
                  {betDetails ? `₹${betDetails.betAmount.toFixed(2)}` : ''}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Potential Win</p>
                <p className="text-lg font-bold text-amber-500">
                  {betDetails ? `₹${calculatePotentialWin(selectedGameMode, betDetails.betAmount, gameOdds).toFixed(2)}` : ''}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleConfirmBet}
              className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 shadow-lg transition-all duration-200"
              disabled={placeBetMutation.isPending || placeMultipleBetsMutation.isPending}
            >
              {placeBetMutation.isPending || placeMultipleBetsMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Bet"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            className="mr-2"
            onClick={() => setLocation("/markets")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <p className="text-sm text-muted-foreground bg-slate-800/30 px-3 py-1 rounded-full">
            <Clock className="h-4 w-4 inline mr-1" />
            Open: {format(new Date(typedMarket.openTime), "h:mm a")} | Close:{" "}
            {format(new Date(typedMarket.closeTime), "h:mm a")}
          </p>
          <Badge className="bg-green-500 hover:bg-green-600 text-white">
            Open for Betting
          </Badge>
        </div>
      </div>

      {/* Improved responsive layout for PC/laptop screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column for game mode selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select Game Mode</CardTitle>
              <CardDescription>Choose how you want to play</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 mb-4">
                {Object.entries(GAME_MODES).map(([value, label]) => (
                  <Card 
                    key={value} 
                    className={`cursor-pointer transition-all hover:scale-105 ${selectedGameMode === value ? 'border-primary shadow-md' : 'border'}`}
                    onClick={() => handleGameModeChange(value)}
                  >
                    <CardContent className="p-4 flex flex-col items-center justify-center">
                      {value === "jodi" && <Hash className="h-10 w-10 text-primary mb-2" />}
                      {value === "harf" && <Type className="h-10 w-10 text-primary mb-2" />}
                      {value === "crossing" && <ArrowLeftRight className="h-10 w-10 text-primary mb-2" />}
                      {value === "odd_even" && <Divide className="h-10 w-10 text-primary mb-2" />}
                      <p className="font-medium text-center">{label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">
                {getGameModeDescription()}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column for bet placement */}
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Place Your Bet</CardTitle>
                  <CardDescription>Select numbers and bet amount</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Form fields will render dynamically based on game mode */}
                  {renderNumberGrid()}
                  
                  {/* Manual bet form removed as requested */}
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>


      </div>

      {/* Recent Bets Table - Enhanced with more details */}
      <div className="mt-8">
        <Card className="overflow-hidden border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between bg-slate-900">
            <div>
              <CardTitle>Your Recent Bets</CardTitle>
              <CardDescription>Latest bets you've placed</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLocation("/game-history")}
              className="ml-auto"
            >
              View Full History
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-800">
                  <TableRow>
                    <TableHead className="font-medium">ID</TableHead>
                    <TableHead className="font-medium">Market</TableHead>
                    <TableHead className="font-medium">Game Type</TableHead>
                    <TableHead className="font-medium">Prediction</TableHead>
                    <TableHead className="font-medium">Amount</TableHead>
                    <TableHead className="font-medium">Potential Win</TableHead>
                    <TableHead className="font-medium">Result</TableHead>
                    <TableHead className="font-medium">Payout</TableHead>
                    <TableHead className="font-medium">Balance After</TableHead>
                    <TableHead className="font-medium">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(recentBets as Game[]).slice(0, 10).map((bet) => {
                    // Calculate potential win amount based on game mode
                    const gameMode = bet.gameMode || (bet.gameData?.gameMode as string);
                    const potentialWin = gameMode 
                      ? (calculatePotentialWin(gameMode, bet.betAmount / 100, gameOdds)).toFixed(2)
                      : (bet.betAmount * 1.9 / 10000).toFixed(2); // Default multiplier if gameMode not available
                    
                    // Determine visual styling based on status
                    const isWin = bet.result === "win" || bet.status === "win";
                    const isLoss = bet.result === "loss" || bet.status === "loss";
                    const isPending = bet.result === "pending" || bet.status === "pending" || !bet.result;
                    
                    // Format payout amount
                    const payout = bet.payout ? (bet.payout / 100).toFixed(2) : "0.00";
                    
                    return (
                      <TableRow key={bet.id} className="border-slate-700">
                        <TableCell className="font-mono text-xs">{bet.id}</TableCell>
                        <TableCell>
                          {bet.market?.name || 
                          (bet.gameType === 'satamatka' && bet.marketId ? 
                          (bet.marketId === marketId ? typedMarket.name : `Market #${bet.marketId}`) : 
                          'Unknown')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-indigo-950/40 border-indigo-700 text-indigo-300">
                            {bet.gameType === 'satamatka' && gameMode ? 
                              (GAME_MODES[gameMode as keyof typeof GAME_MODES] || gameMode) : 
                              formatGameType(bet.gameType)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {bet.gameType === 'satamatka' && bet.gameMode === 'harf' ? 
                              bet.prediction.startsWith('L') ? 
                                `A${bet.prediction.slice(1)}` : 
                                bet.prediction.startsWith('R') ? 
                                  `B${bet.prediction.slice(1)}` : 
                                  bet.prediction 
                              : bet.prediction}
                          </span>
                        </TableCell>
                        <TableCell>₹{(bet.betAmount / 100).toFixed(2)}</TableCell>
                        <TableCell>₹{potentialWin}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              isWin ? "default" : 
                              isLoss ? "destructive" : 
                              isPending ? "secondary" : "outline"
                            }
                            className={`${
                              isWin ? "bg-green-600 hover:bg-green-700" : 
                              isPending ? "bg-amber-500 hover:bg-amber-600 text-black" : ""
                            }`}
                          >
                            {isPending ? "Pending" : 
                             isWin ? "Won" : 
                             isLoss ? "Lost" : bet.result || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className={isWin ? "text-green-500 font-medium" : ""}>
                          {isWin ? `+₹${payout}` : `₹${payout}`}
                        </TableCell>
                        <TableCell className="font-mono">
                          ₹{bet.balanceAfter ? (bet.balanceAfter / 100).toFixed(2) : "N/A"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(bet.createdAt), "MMM d, h:mm a")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(recentBets as Game[]).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No recent bets found. Place your first bet!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bet Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Bet</DialogTitle>
            <DialogDescription>
              Please review your bet details before confirming.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Market</h4>
                <p className="text-sm text-muted-foreground">{typedMarket.name}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Game Mode</h4>
                <p className="text-sm text-muted-foreground">{GAME_MODES[selectedGameMode as keyof typeof GAME_MODES]}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Prediction</h4>
                <p className="text-sm text-muted-foreground">{betDetails?.prediction}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Bet Amount</h4>
                <p className="text-sm text-muted-foreground">
                  {betDetails ? `₹${betDetails.betAmount.toFixed(2)}` : ''}
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Potential Win</h4>
                <p className="text-sm text-muted-foreground">
                  {betDetails ? `₹${calculatePotentialWin(selectedGameMode, betDetails.betAmount, gameOdds).toFixed(2)}` : ''}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmBet} 
              disabled={placeBetMutation.isPending || placeMultipleBetsMutation.isPending}
            >
              {placeBetMutation.isPending || placeMultipleBetsMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Placing Bet{selectedNumbers.size > 0 ? 's' : ''}...
                </>
              ) : (
                "Confirm Bet"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to calculate potential win based on game mode
// Function to calculate potential winnings based on current odds from the server
function calculatePotentialWin(gameMode: string, betAmount: number, odds: Record<string, number> = {}): number {
  // Default payout ratios based on the platform settings
  let payoutRatio = 1;
  
  // Get the appropriate payout ratio from the database odds
  console.log(`Game mode: ${gameMode}, Bet amount: ${betAmount}, Odds from database:`, odds);
  
  // The database stores values with multiplier * 10000
  // For example, 60x is stored as 600000, 1.9x is stored as 19000
  // We need to divide by 10000 to get the actual multiplier
  switch (gameMode) {
    case "jodi":
      // Jodi payout (default 60x)
      payoutRatio = odds.jodi ? (odds.jodi / 10000) : 60;
      break;
    case "harf":
      // Harf payout (default 6x)
      payoutRatio = odds.harf ? (odds.harf / 10000) : 6;
      break;
    case "crossing":
      // Crossing payout (default 66x)
      payoutRatio = odds.crossing ? (odds.crossing / 10000) : 66;
      break;
    case "odd_even":
      // Odd/Even payout (default 1.9x)
      payoutRatio = odds.odd_even ? (odds.odd_even / 10000) : 1.9;
      break;
  }
  
  console.log(`Game mode: ${gameMode}, Using payout ratio: ${payoutRatio}, Bet amount: ${betAmount}`);
  
  // Calculate the potential win amount 
  // For ₹100 bet on Jodi with 60x odds, win = 100 × 60 = ₹6,000
  return betAmount * payoutRatio;
}

// Helper function to format game type for display
function formatGameType(gameType: string): string {
  switch (gameType) {
    case "satamatka":
      return "Satamatka";
    case "cricket_toss":
      return "Cricket Toss";
    // team_match case removed
    case "coin_flip":
      return "Coin Flip";
    default:
      return gameType.charAt(0).toUpperCase() + gameType.slice(1).replace(/_/g, ' ');
  }
}