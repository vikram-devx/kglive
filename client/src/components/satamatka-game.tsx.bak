import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  harf: "Harf (Single Digit)",
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
      // Create a promise array for all bets
      const betPromises = bets.map(bet => {
        return apiRequest("POST", "/api/satamatka/play", {
          marketId: marketId,
          gameMode: selectedGameMode,
          prediction: bet.number,
          betAmount: bet.amount,
        });
      });
      
      // Execute all bets in parallel
      return Promise.all(betPromises);
    },
    onSuccess: () => {
      // Show success toast
      toast({
        title: "All bets placed successfully!",
        description: `${selectedNumbers.size} bets have been placed on the selected market.`,
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
      // If already selected, add the quickBetAmount to the current amount
      const currentAmount = newSelections.get(num) || 0;
      newSelections.set(num, currentAmount + quickBetAmount);
    } else {
      // If not selected, add with current bet amount
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
  const calculateTotalBetAmount = () => {
    let total = 0;
    selectedNumbers.forEach(amount => {
      total += amount;
    });
    return total;
  };
  
  // Place bets for all selected numbers
  const placeBetsForAllSelections = async () => {
    if (selectedNumbers.size === 0) {
      toast({
        title: "No numbers selected",
        description: "Please select at least one number to place a bet.",
        variant: "destructive"
      });
      return;
    }
    
    // Set bet details for confirmation dialog
    setBetDetails({
      prediction: Array.from(selectedNumbers.keys()).join(", "),
      betAmount: calculateTotalBetAmount()
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
              {/* First row: 1, 5, 10, 50 */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 5, 10, 50].map((amount) => (
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
                    ₹{amount}
                  </Button>
                ))}
              </div>
              {/* Second row: 100, 500, 1000, 5000 */}
              <div className="grid grid-cols-4 gap-2">
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
                    ₹{amount}
                  </Button>
                ))}
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
          </div>
          
          {/* Bet slip button for selected numbers */}
          {selectedNumbers.size > 0 && (
            <div className="mt-4">
              <Button 
                variant="default" 
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
                onClick={() => setShowBetSlip(true)}
              >
                View Bet Slip ({selectedNumbers.size} numbers, ₹{calculateTotalBetAmount()})
              </Button>
            </div>
          )}
        </div>
      );
    } else if (selectedGameMode === "harf") {
      // Create improved Harf bet type UI with left digit, right digit selection
      return (
        <div className="space-y-4">
          <div className="text-sm font-medium mb-2">Quick Bet Amount</div>
          <div className="space-y-2 mb-4">
            {/* First row: 1, 5, 10, 50 */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 5, 10, 50].map((amount) => (
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
                  ₹{amount}
                </Button>
              ))}
            </div>
            {/* Second row: 100, 500, 1000, 5000 */}
            <div className="grid grid-cols-4 gap-2">
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
                  ₹{amount}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Digit Selection (First digit 0-9) */}
            <Card className="border border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Left Digit (First Position)</CardTitle>
                <CardDescription className="text-xs">Select the first position (0-9)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }, (_, i) => {
                    const num = `L${i}`;
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
            
            {/* Right Digit Selection (Second digit 0-9) */}
            <Card className="border border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Right Digit (Second Position)</CardTitle>
                <CardDescription className="text-xs">Select the second position (0-9)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }, (_, i) => {
                    const num = `R${i}`;
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
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
                onClick={() => setShowBetSlip(true)}
              >
                View Bet Slip ({selectedNumbers.size} numbers, ₹{calculateTotalBetAmount()})
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
              {/* First row: 1, 5, 10, 50 */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 5, 10, 50].map((amount) => (
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
                    ₹{amount}
                  </Button>
                ))}
              </div>
              {/* Second row: 100, 500, 1000, 5000 */}
              <div className="grid grid-cols-4 gap-2">
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
                    ₹{amount}
                  </Button>
                ))}
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
                  <span className="font-medium">₹{quickBetAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total bet amount:</span>
                  <span className="font-medium">₹{totalCombinations * quickBetAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Potential win (max):</span>
                  <span className="font-medium text-amber-500">₹{calculatePotentialWin(selectedGameMode, quickBetAmount) * totalCombinations}</span>
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
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
                onClick={() => {
                  // Generate prediction text describing the combinations
                  const combinationsText = selectedDigits.length > 3 
                    ? `${selectedDigits.length} digits (${totalCombinations} combinations)`
                    : `Combinations of ${selectedDigits.join(",")}`;
                  
                  // Set bet details for confirmation dialog
                  setBetDetails({
                    prediction: combinationsText,
                    betAmount: totalCombinations * quickBetAmount
                  });
                  
                  // Open confirmation dialog
                  setConfirmDialogOpen(true);
                }}
              >
                Place Bets on {totalCombinations} Combinations (₹{totalCombinations * quickBetAmount})
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
              {/* First row: 1, 5, 10, 50 */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 5, 10, 50].map((amount) => (
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
                    ₹{amount}
                  </Button>
                ))}
              </div>
              {/* Second row: 100, 500, 1000, 5000 */}
              <div className="grid grid-cols-4 gap-2">
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
                    ₹{amount}
                  </Button>
                ))}
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
                  <div className="mt-3 flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full">
                    <div className="h-4 w-4 mr-1 text-green-600">✓</div>
                    <span className="text-sm font-medium">Selected</span>
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
                  <div className="mt-3 flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full">
                    <div className="h-4 w-4 mr-1 text-green-600">✓</div>
                    <span className="text-sm font-medium">Selected</span>
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
                    <span className="font-medium ml-2">₹{calculateTotalBetAmount()}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Payout Ratio:</span>
                    <span className="font-medium ml-2">1.8x</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Potential Win:</span>
                    <span className="font-medium ml-2 text-amber-500">
                      ₹{calculatePotentialWin(selectedGameMode, calculateTotalBetAmount())}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="default" 
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
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
        return "Predict the exact two-digit number (00-99). Payout ratio: 90x";
      case "harf":
        return "Predict digits in specific positions (left/right). Select first digit, second digit, or both. Payout ratio: 9x";
      case "crossing":
        return "Select multiple digits (0-9) to create two-digit combinations. For example, selecting 1,2,3 creates: 12, 21, 13, 31, 23, 32. Payout ratio: 4.5x";
      case "odd_even":
        return "Predict if the result will be odd or even. Payout ratio: 1.8x";
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
                      <TableCell>₹{amount}</TableCell>
                      <TableCell className="text-amber-500">
                        ₹{calculatePotentialWin(selectedGameMode, amount)}
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
              <span className="font-bold">₹{calculateTotalBetAmount()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Potential Win:</span>
              <span className="font-bold text-amber-500">
                ₹{Array.from(selectedNumbers.values()).reduce(
                  (total, amount) => total + calculatePotentialWin(selectedGameMode, amount),
                  0
                )}
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
              className="bg-gradient-to-r from-green-500 to-emerald-600"
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
                <p className="text-lg font-bold">₹{betDetails?.betAmount}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Potential Win</p>
                <p className="text-lg font-bold text-amber-500">
                  ₹{betDetails ? calculatePotentialWin(selectedGameMode, betDetails.betAmount) : 0}
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
              className="bg-gradient-to-r from-green-500 to-emerald-600"
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
                  
                  {/* Only show manual bet form if no number is selected via the grid */}
                  {selectedNumbers.size === 0 && !selectedNumber && (
                    <>
                      <FormField
                        control={form.control}
                        name="prediction"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prediction</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your prediction" {...field} />
                            </FormControl>
                            <FormDescription>
                              {selectedGameMode === "jodi"
                                ? "Enter a 2-digit number (00-99)"
                                : selectedGameMode === "harf"
                                ? "Enter single digit with position (e.g., L5 for left 5)"
                                : selectedGameMode === "crossing"
                                ? "Enter multiple digits (e.g., 1,2,3)"
                                : "Enter 'odd' or 'even'"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="betAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bet Amount</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <span className="mr-2 text-muted-foreground">₹</span>
                                <Input
                                  type="number"
                                  placeholder="Enter bet amount"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Minimum bet amount is ₹10, maximum is ₹10,000
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={form.formState.isSubmitting}
                      >
                        {form.formState.isSubmitting ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Placing Bet...
                          </>
                        ) : (
                          "Place Bet"
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>


      </div>

      {/* Recent Bets Table */}
      <div className="mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
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
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Market</TableHead>
                  <TableHead>Game Type</TableHead>
                  <TableHead>Prediction</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(recentBets as Game[]).slice(0, 10).map((bet) => (
                  <TableRow key={bet.id}>
                    <TableCell>
                      {bet.marketName || 
                       (bet.gameType === 'satamatka' && bet.marketId ? 
                        (bet.marketId === marketId ? typedMarket.name : `Market #${bet.marketId}`) : 
                        'Unknown')}
                    </TableCell>
                    <TableCell>
                      {bet.gameType === 'satamatka' && bet.gameData ? 
                        (GAME_MODES[bet.gameData.gameMode as keyof typeof GAME_MODES] || bet.gameData.gameMode) : 
                        bet.gameType}
                    </TableCell>
                    <TableCell>{bet.prediction}</TableCell>
                    <TableCell>₹{bet.betAmount}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          bet.status === "win" ? "success" : 
                          bet.status === "loss" ? "destructive" : 
                          bet.status === "pending" ? "secondary" : "outline"
                        }
                      >
                        {bet.status === "pending" ? "Pending" : 
                         bet.status === "win" ? "Won" : 
                         bet.status === "loss" ? "Lost" : bet.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(bet.createdAt), "MMM d, h:mm a")}</TableCell>
                  </TableRow>
                ))}
                {(recentBets as Game[]).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      No recent bets found. Place your first bet!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
                <p className="text-sm text-muted-foreground">₹{betDetails?.betAmount}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Potential Win</h4>
                <p className="text-sm text-muted-foreground">
                  ₹{betDetails ? calculatePotentialWin(selectedGameMode, betDetails.betAmount) : 0}
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
function calculatePotentialWin(gameMode: string, betAmount: number): number {
  let payoutRatio = 1;
  
  switch (gameMode) {
    case "jodi":
      payoutRatio = 90;
      break;
    case "harf":
      payoutRatio = 9;
      break;
    case "crossing":
      payoutRatio = 4.5;
      break;
    case "odd_even":
      payoutRatio = 1.8;
      break;
  }
  
  return Math.floor(betAmount * payoutRatio);
}