import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import DashboardLayout from "@/components/dashboard-layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ArrowLeft, Percent, Save, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define types for the API responses
interface Subadmin {
  id: number;
  username: string;
  role: string;
  balance: number;
  createdAt?: string;
}

interface CommissionItem {
  id?: number;
  subadminId: number;
  gameType: string;
  commissionRate: number;
}

interface GameOdd {
  id?: number;
  gameType: string;
  oddValue: number;
  setByAdmin: boolean;
  subadminId?: number;
}

interface UserDiscount {
  id?: number;
  userId: number;
  subadminId: number;
  gameType: string;
  discountRate: number;
}

interface Player {
  id: number;
  username: string;
  role: string;
  balance: number;
  assignedTo?: number;
  createdAt?: string;
}

// Form schema for the commission form
const commissionFormSchema = z.object({
  teamMatch: z.coerce.number().min(0).max(100),
  cricketToss: z.coerce.number().min(0).max(100),
  coinFlip: z.coerce.number().min(0).max(100),
  satamatkaJodi: z.coerce.number().min(0).max(100),
  satamatkaHarf: z.coerce.number().min(0).max(100),
  satamatkaOddEven: z.coerce.number().min(0).max(100),
  satamatkaOther: z.coerce.number().min(0).max(100),
});

// Form schema for the odds form
const oddsFormSchema = z.object({
  teamMatch: z.coerce.number().min(1),
  cricketToss: z.coerce.number().min(1),
  coinFlip: z.coerce.number().min(1),
  satamatkaJodi: z.coerce.number().min(1),
  satamatkaHarf: z.coerce.number().min(1),
  satamatkaOddEven: z.coerce.number().min(1),
  satamatkaOther: z.coerce.number().min(1),
});

// Form schema for the discount form
const discountFormSchema = z.object({
  teamMatch: z.coerce.number().min(0).max(100),
  cricketToss: z.coerce.number().min(0).max(100),
  coinFlip: z.coerce.number().min(0).max(100),
  satamatkaJodi: z.coerce.number().min(0).max(100),
  satamatkaHarf: z.coerce.number().min(0).max(100),
  satamatkaOddEven: z.coerce.number().min(0).max(100),
  satamatkaOther: z.coerce.number().min(0).max(100),
});

type CommissionFormValues = z.infer<typeof commissionFormSchema>;
type OddsFormValues = z.infer<typeof oddsFormSchema>;
type DiscountFormValues = z.infer<typeof discountFormSchema>;

export default function SubadminSettingsPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.split('?')[1] || '');
  
  // If no ID is provided in the URL, use the current logged-in user's ID (for subadmin viewing their own settings)
  const subadminId = queryParams.get('id') 
    ? parseInt(queryParams.get('id') || '0') 
    : user?.role === 'subadmin' ? user.id : null;
    
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("commission");

  // This could be a userId for setting discounts on users under a subadmin
  const userId = queryParams.get('userId') ? parseInt(queryParams.get('userId') || '0') : null;
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(userId);

  // Get subadmin details
  const { data: subadmin, isLoading: isLoadingSubadmin } = useQuery({
    queryKey: ['/api/users', subadminId],
    enabled: !!subadminId,
  });

  // Get commission settings
  const { data: commissions, isLoading: isLoadingCommissions } = useQuery({
    queryKey: ['/api/commissions/subadmin', subadminId],
    enabled: !!subadminId,
  });
  
  // Get admin game odds
  const { data: adminOdds, isLoading: isLoadingAdminOdds } = useQuery({
    queryKey: ['/api/odds/admin'],
    enabled: !!subadminId,
  });
  
  // Get subadmin game odds
  const { data: subadminOdds, isLoading: isLoadingSubadminOdds } = useQuery({
    queryKey: ['/api/odds/subadmin', subadminId],
    enabled: !!subadminId,
  });
  
  // Get players assigned to this subadmin
  const { data: players, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ['/api/users', { assignedTo: subadminId }],
    enabled: !!subadminId && activeTab === "discounts",
  });
  
  // Get player discounts if a player is selected
  const { data: playerDiscounts, isLoading: isLoadingPlayerDiscounts } = useQuery({
    queryKey: ['/api/discounts/user', selectedPlayerId, subadminId],
    enabled: !!selectedPlayerId && !!subadminId,
  });

  // Form for commission settings
  const commissionForm = useForm<CommissionFormValues>({
    resolver: zodResolver(commissionFormSchema),
    defaultValues: {
      teamMatch: 0,
      cricketToss: 0,
      coinFlip: 0,
      satamatkaJodi: 0,
      satamatkaHarf: 0,
      satamatkaOddEven: 0,
      satamatkaOther: 0,
    }
  });
  
  // Form for game odds settings
  const oddsForm = useForm<OddsFormValues>({
    resolver: zodResolver(oddsFormSchema),
    defaultValues: {
      teamMatch: 1.9,
      cricketToss: 1.9,
      coinFlip: 1.9,
      satamatkaJodi: 9,
      satamatkaHarf: 9,
      satamatkaOddEven: 1.9,
      satamatkaOther: 9,
    }
  });
  
  // Form for player discount settings
  const discountForm = useForm<DiscountFormValues>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      teamMatch: 0,
      cricketToss: 0,
      coinFlip: 0,
      satamatkaJodi: 0,
      satamatkaHarf: 0,
      satamatkaOddEven: 0,
      satamatkaOther: 0,
    }
  });

  // Update commission mutation
  const updateCommissionMutation = useMutation({
    mutationFn: async (values: CommissionFormValues) => {
      const response = await fetch('/api/commissions/subadmin/' + subadminId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commissions: [
            { gameType: 'team_match', commissionRate: values.teamMatch },
            { gameType: 'cricket_toss', commissionRate: values.cricketToss },
            { gameType: 'coin_flip', commissionRate: values.coinFlip },
            { gameType: 'satamatka_jodi', commissionRate: values.satamatkaJodi },
            { gameType: 'satamatka_harf', commissionRate: values.satamatkaHarf },
            { gameType: 'satamatka_odd_even', commissionRate: values.satamatkaOddEven },
            { gameType: 'satamatka_other', commissionRate: values.satamatkaOther },
          ]
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update commission settings');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/commissions/subadmin', subadminId] });
      toast({
        title: "Commission settings updated",
        variant: "success",
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update commission settings",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
    }
  });
  
  // Update game odds mutation
  const updateOddsMutation = useMutation({
    mutationFn: async (values: OddsFormValues) => {
      const response = await fetch('/api/odds/subadmin/' + subadminId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          odds: [
            { gameType: 'team_match', oddValue: values.teamMatch },
            { gameType: 'cricket_toss', oddValue: values.cricketToss },
            { gameType: 'coin_flip', oddValue: values.coinFlip },
            { gameType: 'satamatka_jodi', oddValue: values.satamatkaJodi },
            { gameType: 'satamatka_harf', oddValue: values.satamatkaHarf },
            { gameType: 'satamatka_odd_even', oddValue: values.satamatkaOddEven },
            { gameType: 'satamatka_other', oddValue: values.satamatkaOther },
          ]
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update game odds settings');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/odds/subadmin', subadminId] });
      toast({
        title: "Game odds settings updated",
        variant: "success",
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update game odds settings",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
    }
  });
  
  // Update player discount mutation
  const updateDiscountMutation = useMutation({
    mutationFn: async (values: DiscountFormValues) => {
      if (!selectedPlayerId) {
        throw new Error('No player selected');
      }
      
      const response = await fetch(`/api/discounts/user/${selectedPlayerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subadminId,
          discounts: [
            { gameType: 'team_match', discountRate: values.teamMatch },
            { gameType: 'cricket_toss', discountRate: values.cricketToss },
            { gameType: 'coin_flip', discountRate: values.coinFlip },
            { gameType: 'satamatka_jodi', discountRate: values.satamatkaJodi },
            { gameType: 'satamatka_harf', discountRate: values.satamatkaHarf },
            { gameType: 'satamatka_odd_even', discountRate: values.satamatkaOddEven },
            { gameType: 'satamatka_other', discountRate: values.satamatkaOther },
          ]
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update player discount settings');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/discounts/user', selectedPlayerId, subadminId] });
      toast({
        title: "Player discount settings updated",
        variant: "success",
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update player discount settings",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  // Handle commission form submission
  const onSubmitCommission = (values: CommissionFormValues) => {
    updateCommissionMutation.mutate(values);
  };
  
  // Handle odds form submission
  const onSubmitOdds = (values: OddsFormValues) => {
    updateOddsMutation.mutate(values);
  };
  
  // Handle discount form submission
  const onSubmitDiscount = (values: DiscountFormValues) => {
    updateDiscountMutation.mutate(values);
  };
  
  // Helper function to format game types for display
  const formatGameType = (gameType: string): string => {
    switch (gameType) {
      case 'team_match':
        return 'Team Match';
      case 'cricket_toss':
        return 'Cricket Toss';
      case 'coin_flip':
        return 'Coin Flip';
      case 'satamatka_jodi':
        return 'Jodi (Pair)';
      case 'satamatka_harf':
        return 'Harf';
      case 'satamatka_odd_even':
        return 'Odd/Even';
      case 'satamatka_other':
        return 'Other Market Games';
      default:
        return gameType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    }
  };
  
  // Helper function to get maximum allowed discount based on commission percentage
  const getMaxDiscount = (gameType: string): number => {
    if (!commissions || !Array.isArray(commissions)) return 0;
    
    const commission = Array.isArray(commissions) ? commissions.find((c: CommissionItem) => c.gameType === gameType) : null;
    return commission ? commission.commissionRate : 0;
  };

  // Set form values when commissions data is loaded
  useEffect(() => {
    if (commissions && Array.isArray(commissions) && commissions.length > 0) {
      const formValues: any = {
        teamMatch: 0,
        cricketToss: 0,
        coinFlip: 0,
        satamatkaJodi: 0,
        satamatkaHarf: 0,
        satamatkaOddEven: 0,
        satamatkaOther: 0,
      };

      commissions.forEach((commission: any) => {
        if (commission.gameType === 'team_match') {
          formValues.teamMatch = commission.commissionRate;
        } else if (commission.gameType === 'cricket_toss') {
          formValues.cricketToss = commission.commissionRate;
        } else if (commission.gameType === 'coin_flip') {
          formValues.coinFlip = commission.commissionRate;
        } else if (commission.gameType === 'satamatka_jodi') {
          formValues.satamatkaJodi = commission.commissionRate;
        } else if (commission.gameType === 'satamatka_harf') {
          formValues.satamatkaHarf = commission.commissionRate;
        } else if (commission.gameType === 'satamatka_odd_even') {
          formValues.satamatkaOddEven = commission.commissionRate;
        } else if (commission.gameType === 'satamatka_other') {
          formValues.satamatkaOther = commission.commissionRate;
        }
      });

      commissionForm.reset(formValues);
    }
  }, [commissions, commissionForm]);
  
  // Set form values when odds data is loaded
  useEffect(() => {
    if (subadminOdds && Array.isArray(subadminOdds) && subadminOdds.length > 0) {
      const formValues: any = {
        teamMatch: 1.9,
        cricketToss: 1.9,
        coinFlip: 1.9,
        satamatkaJodi: 9,
        satamatkaHarf: 9,
        satamatkaOddEven: 1.9,
        satamatkaOther: 9,
      };

      subadminOdds.forEach((odd: any) => {
        if (odd.gameType === 'team_match') {
          formValues.teamMatch = odd.oddValue;
        } else if (odd.gameType === 'cricket_toss') {
          formValues.cricketToss = odd.oddValue;
        } else if (odd.gameType === 'coin_flip') {
          formValues.coinFlip = odd.oddValue;
        } else if (odd.gameType === 'satamatka_jodi') {
          formValues.satamatkaJodi = odd.oddValue;
        } else if (odd.gameType === 'satamatka_harf') {
          formValues.satamatkaHarf = odd.oddValue;
        } else if (odd.gameType === 'satamatka_odd_even') {
          formValues.satamatkaOddEven = odd.oddValue;
        } else if (odd.gameType === 'satamatka_other') {
          formValues.satamatkaOther = odd.oddValue;
        }
      });

      oddsForm.reset(formValues);
    }
  }, [subadminOdds, oddsForm]);
  
  // Set form values when player discount data is loaded
  useEffect(() => {
    if (playerDiscounts && Array.isArray(playerDiscounts) && playerDiscounts.length > 0 && selectedPlayerId) {
      const formValues: any = {
        teamMatch: 0,
        cricketToss: 0,
        coinFlip: 0,
        satamatkaJodi: 0,
        satamatkaHarf: 0,
        satamatkaOddEven: 0,
        satamatkaOther: 0,
      };

      playerDiscounts.forEach((discount: any) => {
        if (discount.gameType === 'team_match') {
          formValues.teamMatch = discount.discountRate;
        } else if (discount.gameType === 'cricket_toss') {
          formValues.cricketToss = discount.discountRate;
        } else if (discount.gameType === 'coin_flip') {
          formValues.coinFlip = discount.discountRate;
        } else if (discount.gameType === 'satamatka_jodi') {
          formValues.satamatkaJodi = discount.discountRate;
        } else if (discount.gameType === 'satamatka_harf') {
          formValues.satamatkaHarf = discount.discountRate;
        } else if (discount.gameType === 'satamatka_odd_even') {
          formValues.satamatkaOddEven = discount.discountRate;
        } else if (discount.gameType === 'satamatka_other') {
          formValues.satamatkaOther = discount.discountRate;
        }
      });

      discountForm.reset(formValues);
    }
  }, [playerDiscounts, discountForm, selectedPlayerId]);

  return (
    <DashboardLayout>
      <div className="flex items-center mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => window.history.back()} 
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">
          {userId ? 'User Discount Settings' : 'Subadmin Commission Settings'}
        </h1>
      </div>

      {isLoadingSubadmin ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : subadmin ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Settings for {(subadmin as any)?.username || 'Subadmin'}
            </CardTitle>
            <CardDescription>
              {userId 
                ? 'Manage discount rates for games played by this user' 
                : 'Configure commission rates for different game types that this subadmin manages'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="commission">
                  My Commission Rates
                </TabsTrigger>
                <TabsTrigger value="odds">
                  My Game Odds
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="commission">
                {isLoadingCommissions ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <Alert>
                      <Info className="h-5 w-5" />
                      <AlertTitle>Commission Rates</AlertTitle>
                      <AlertDescription>
                        Commission rates determine how much of the player's bets you earn. These rates are set by the administrator.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Your Commission Rates</h3>
                        
                        {commissions && Array.isArray(commissions) && commissions.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {Array.isArray(commissions) && commissions.map((comm: CommissionItem) => (
                              <Card key={comm.gameType} className="bg-muted/20">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-base">
                                    {comm.gameType === 'team_match' ? 'Team Match' : 
                                     comm.gameType === 'cricket_toss' ? 'Cricket Toss' : 
                                     comm.gameType === 'coin_flip' ? 'Coin Flip' : 
                                     comm.gameType === 'satamatka_jodi' ? 'Jodi (Pair)' : 
                                     comm.gameType === 'satamatka_harf' ? 'Harf' : 
                                     comm.gameType === 'satamatka_odd_even' ? 'Odd/Even' : 
                                     comm.gameType === 'satamatka_other' ? 'Other Market Games' : 
                                     comm.gameType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Commission:</span>
                                    <span className="text-xl font-bold">{comm.commissionRate}%</span>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 border rounded-md">
                            <p className="text-center text-muted-foreground">
                              No commission rates have been set by the administrator yet.
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <Alert variant="default" className="bg-muted">
                        <AlertCircle className="h-5 w-5" />
                        <AlertTitle>Note</AlertTitle>
                        <AlertDescription>
                          You cannot modify your commission rates. Please contact the administrator if you need your commission rates adjusted.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="odds">
                {isLoadingAdminOdds || isLoadingSubadminOdds ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <Alert>
                      <Info className="h-5 w-5" />
                      <AlertTitle>Game Odds</AlertTitle>
                      <AlertDescription>
                        Game odds determine payouts for player bets. These odds apply only to players assigned to you and do not affect other subadmins or players. The base rates are set by the administrator.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-medium mb-4">Admin Odds</h3>
                          {adminOdds && Array.isArray(adminOdds) && adminOdds.length > 0 ? (
                            <Card className="bg-muted/30">
                              <CardContent className="pt-6">
                                <div className="space-y-2">
                                  {Array.isArray(adminOdds) && adminOdds.map((odd: GameOdd) => (
                                    <div key={odd.gameType} className="flex justify-between items-center border-b pb-2 last:border-0">
                                      <span className="font-medium">
                                        {odd.gameType === 'team_match' ? 'Team Match' : 
                                         odd.gameType === 'cricket_toss' ? 'Cricket Toss' : 
                                         odd.gameType === 'coin_flip' ? 'Coin Flip' : 
                                         odd.gameType === 'satamatka_jodi' ? 'Jodi (Pair)' : 
                                         odd.gameType === 'satamatka_harf' ? 'Harf' : 
                                         odd.gameType === 'satamatka_odd_even' ? 'Odd/Even' : 
                                         odd.gameType === 'satamatka_other' ? 'Other Market Games' : 
                                         odd.gameType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                      </span>
                                      <span className="text-lg font-mono font-bold">{odd.oddValue}x</span>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ) : (
                            <div className="p-4 border rounded-md">
                              <p className="text-center text-muted-foreground">
                                No game odds have been set by the administrator yet.
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium mb-4">Your Game Odds</h3>
                          {subadminOdds && Array.isArray(subadminOdds) && subadminOdds.length > 0 ? (
                            <Card className="bg-muted/30">
                              <CardContent className="pt-6">
                                <div className="space-y-2">
                                  {Array.isArray(subadminOdds) && subadminOdds.map((odd: GameOdd) => (
                                    <div key={odd.gameType} className="flex justify-between items-center border-b pb-2 last:border-0">
                                      <span className="font-medium">
                                        {odd.gameType === 'team_match' ? 'Team Match' : 
                                         odd.gameType === 'cricket_toss' ? 'Cricket Toss' : 
                                         odd.gameType === 'coin_flip' ? 'Coin Flip' : 
                                         odd.gameType === 'satamatka_jodi' ? 'Jodi (Pair)' : 
                                         odd.gameType === 'satamatka_harf' ? 'Harf' : 
                                         odd.gameType === 'satamatka_odd_even' ? 'Odd/Even' : 
                                         odd.gameType === 'satamatka_other' ? 'Other Market Games' : 
                                         odd.gameType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                      </span>
                                      <span className="text-lg font-mono font-bold">{odd.oddValue}x</span>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ) : (
                            <div className="p-4 border rounded-md">
                              <p className="text-center text-muted-foreground">
                                No game odds have been set for your account yet.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Alert variant="default" className="bg-muted">
                        <AlertCircle className="h-5 w-5" />
                        <AlertTitle>Note</AlertTitle>
                        <AlertDescription>
                          These game odds only apply to players assigned to you. You cannot modify your game odds - please contact the administrator if you need your game odds adjusted.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="discounts">
                {isLoadingPlayers ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <Alert>
                      <Info className="h-5 w-5" />
                      <AlertTitle>Player Discounts & Odds Management</AlertTitle>
                      <AlertDescription>
                        You can set discounts for players assigned to you. Player discounts cannot exceed your commission percentage.
                        For example, if your commission on cricket toss bets is 45%, you cannot offer more than 45% discount to players.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="flex flex-col space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Select Player</h3>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="border rounded-md p-4">
                            <p className="mb-2 text-sm text-muted-foreground">Choose a player to set discounts for:</p>
                            {players && Array.isArray(players) && players.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                {players.map((player: any) => (
                                  <Button 
                                    key={player.id}
                                    type="button"
                                    variant={selectedPlayerId === player.id ? "default" : "outline"}
                                    className="justify-start"
                                    onClick={() => setSelectedPlayerId(player.id)}
                                  >
                                    {player.username}
                                  </Button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted-foreground text-sm">No players assigned to you yet.</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {selectedPlayerId && (
                        <div>
                          <h3 className="text-lg font-medium mb-2">Set Discount Rates</h3>
                          {isLoadingPlayerDiscounts ? (
                            <div className="flex justify-center py-4">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                          ) : (
                            <Form {...discountForm}>
                              <form onSubmit={discountForm.handleSubmit(onSubmitDiscount)} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <FormField
                                    control={discountForm.control}
                                    name="teamMatch"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Team Match Discount</FormLabel>
                                        <div className="flex items-center gap-2">
                                          <FormControl>
                                            <Input 
                                              {...field} 
                                              type="number" 
                                              min="0" 
                                              max={getMaxDiscount('team_match')} 
                                              step="0.1" 
                                            />
                                          </FormControl>
                                          <Percent className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={discountForm.control}
                                    name="cricketToss"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Cricket Toss Discount</FormLabel>
                                        <div className="flex items-center gap-2">
                                          <FormControl>
                                            <Input
                                              {...field}
                                              type="number"
                                              min="0"
                                              max={getMaxDiscount('cricket_toss')}
                                              step="0.1"
                                            />
                                          </FormControl>
                                          <Percent className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={discountForm.control}
                                    name="coinFlip"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Coin Flip Discount</FormLabel>
                                        <div className="flex items-center gap-2">
                                          <FormControl>
                                            <Input
                                              {...field}
                                              type="number"
                                              min="0"
                                              max={getMaxDiscount('coin_flip')}
                                              step="0.1"
                                            />
                                          </FormControl>
                                          <Percent className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={discountForm.control}
                                    name="satamatkaJodi"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Jodi Discount</FormLabel>
                                        <div className="flex items-center gap-2">
                                          <FormControl>
                                            <Input {...field} type="number" min="0" max={getMaxDiscount('satamatka_jodi')} step="0.1" />
                                          </FormControl>
                                          <Percent className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={discountForm.control}
                                    name="satamatkaHarf"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Harf Discount</FormLabel>
                                        <div className="flex items-center gap-2">
                                          <FormControl>
                                            <Input {...field} type="number" min="0" max={getMaxDiscount('satamatka_harf')} step="0.1" />
                                          </FormControl>
                                          <Percent className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={discountForm.control}
                                    name="satamatkaOddEven"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Odd/Even Discount</FormLabel>
                                        <div className="flex items-center gap-2">
                                          <FormControl>
                                            <Input {...field} type="number" min="0" max={getMaxDiscount('satamatka_odd_even')} step="0.1" />
                                          </FormControl>
                                          <Percent className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <FormField
                                    control={discountForm.control}
                                    name="satamatkaOther"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Other Satamatka Games Discount</FormLabel>
                                        <div className="flex items-center gap-2">
                                          <FormControl>
                                            <Input {...field} type="number" min="0" max={getMaxDiscount('satamatka_other')} step="0.1" />
                                          </FormControl>
                                          <Percent className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                
                                <div className="flex justify-end">
                                  <Button type="submit" disabled={updateDiscountMutation.isPending}>
                                    {updateDiscountMutation.isPending && (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    )}
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Player Discount Settings
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Subadmin not found. Please check the ID and try again.
          </AlertDescription>
        </Alert>
      )}
    </DashboardLayout>
  );
}