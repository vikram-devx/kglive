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
import { AlertCircle, ArrowLeft, Percent, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Commission schema
const commissionSchema = z.object({
  cricketToss: z.coerce.number().min(0).max(100),
  coinFlip: z.coerce.number().min(0).max(100),
  satamatkaJodi: z.coerce.number().min(0).max(100),
  satamatkaHarf: z.coerce.number().min(0).max(100),
  satamatkaOddEven: z.coerce.number().min(0).max(100),
  satamatkaCrossing: z.coerce.number().min(0).max(100),
});

type Commission = z.infer<typeof commissionSchema>;

export default function SubadminCommissionManagementPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.split('?')[1] || '');
  const subadminId = queryParams.get('id') ? parseInt(queryParams.get('id') || '0') : null;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("commission");

  // This could be a userId for setting discounts on users under a subadmin
  const userId = queryParams.get('userId') ? parseInt(queryParams.get('userId') || '0') : null;

  // Get subadmin details
  const { data: subadmin, isLoading: isLoadingSubadmin } = useQuery({
    queryKey: ['/api/users', subadminId],
    queryFn: getQueryFn,
    enabled: !!subadminId,
  });

  // Get commission settings - need to use the API endpoint with proper params format
  const { data: commissions, isLoading: isLoadingCommissions } = useQuery({
    queryKey: [`/api/commissions/subadmin/${subadminId}`],
    queryFn: getQueryFn,
    enabled: !!subadminId,
  });

  // Form for commission settings
  const form = useForm<Commission>({
    resolver: zodResolver(commissionSchema),
    defaultValues: {
      cricketToss: 0,
      coinFlip: 0,
      satamatkaJodi: 0,
      satamatkaHarf: 0,
      satamatkaOddEven: 0,
      satamatkaCrossing: 0,
    }
  });

  // Update commission mutation
  const updateCommissionMutation = useMutation({
    mutationFn: async (values: Commission) => {
      console.log('Sending commission values:', values);
      return apiRequest('/api/commissions/subadmin/' + subadminId, {
        method: 'POST',
        data: {
          commissions: [
            { gameType: 'cricket_toss', commissionRate: Math.round(values.cricketToss * 10000) },
            { gameType: 'coin_flip', commissionRate: Math.round(values.coinFlip * 10000) },
            { gameType: 'satamatka_jodi', commissionRate: Math.round(values.satamatkaJodi * 10000) },
            { gameType: 'satamatka_harf', commissionRate: Math.round(values.satamatkaHarf * 10000) },
            { gameType: 'satamatka_odd_even', commissionRate: Math.round(values.satamatkaOddEven * 10000) },
            { gameType: 'satamatka_crossing', commissionRate: Math.round(values.satamatkaCrossing * 10000) },
          ]
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/commissions/subadmin/${subadminId}`] });
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

  // Handle commission form submission
  const onSubmitCommission = (values: Commission) => {
    updateCommissionMutation.mutate(values);
  };

  // Set form values when commissions data is loaded
  useEffect(() => {
    if (commissions && Array.isArray(commissions) && commissions.length > 0) {
      const formValues: any = {
        cricketToss: 0,
        coinFlip: 0,
        satamatkaJodi: 0,
        satamatkaHarf: 0,
        satamatkaOddEven: 0,
        satamatkaCrossing: 0,
      };

      // Log commission data to debug
      console.log('Commission data received:', commissions);

      commissions.forEach((commission: any) => {
        if (commission.gameType === 'cricket_toss') {
          formValues.cricketToss = commission.commissionRate / 10000;
        } else if (commission.gameType === 'coin_flip') {
          formValues.coinFlip = commission.commissionRate / 10000;
        } else if (commission.gameType === 'satamatka_jodi') {
          formValues.satamatkaJodi = commission.commissionRate / 10000;
        } else if (commission.gameType === 'satamatka_harf') {
          formValues.satamatkaHarf = commission.commissionRate / 10000;
        } else if (commission.gameType === 'satamatka_odd_even') {
          formValues.satamatkaOddEven = commission.commissionRate / 10000;
        } else if (commission.gameType === 'satamatka_crossing') {
          formValues.satamatkaCrossing = commission.commissionRate / 10000;
        }
      });

      // Log form values for debugging 
      console.log('Setting form values to:', formValues);
      form.reset(formValues);
    }
  }, [commissions, form]);

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
              Settings for {subadmin.username}
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
                  Commission Settings
                </TabsTrigger>
                {/* Add more tabs here for other settings if needed */}
              </TabsList>
              
              <TabsContent value="commission">
                {isLoadingCommissions ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <Alert>
                      <AlertCircle className="h-5 w-5" />
                      <AlertTitle>Important</AlertTitle>
                      <AlertDescription>
                        Commission rates determine how much of the player's bets the subadmin earns.
                        Rates are set as percentages (0-100%).
                      </AlertDescription>
                    </Alert>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmitCommission)} className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium mb-2">Sports Betting Games</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            
                            <FormField
                              control={form.control}
                              name="cricketToss"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cricket Toss Commission</FormLabel>
                                  <div className="flex items-center gap-2">
                                    <FormControl>
                                      <Input {...field} type="number" min="0" max="100" step="0.1" />
                                    </FormControl>
                                    <Percent className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <FormDescription>
                                    Commission for cricket toss bets
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-lg font-medium mb-2">Casino Games</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="coinFlip"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Coin Flip Commission</FormLabel>
                                  <div className="flex items-center gap-2">
                                    <FormControl>
                                      <Input {...field} type="number" min="0" max="100" step="0.1" />
                                    </FormControl>
                                    <Percent className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <FormDescription>
                                    Commission for coin flip games
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-lg font-medium mb-2">Market Games</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="satamatkaJodi"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Jodi (Pair) Commission</FormLabel>
                                  <div className="flex items-center gap-2">
                                    <FormControl>
                                      <Input {...field} type="number" min="0" max="100" step="0.1" />
                                    </FormControl>
                                    <Percent className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <FormDescription>
                                    Commission for Jodi game mode in Satamatka
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="satamatkaHarf"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Harf Commission</FormLabel>
                                  <div className="flex items-center gap-2">
                                    <FormControl>
                                      <Input {...field} type="number" min="0" max="100" step="0.1" />
                                    </FormControl>
                                    <Percent className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <FormDescription>
                                    Commission for Harf game mode in Satamatka
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="satamatkaOddEven"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Odd/Even Commission</FormLabel>
                                  <div className="flex items-center gap-2">
                                    <FormControl>
                                      <Input {...field} type="number" min="0" max="100" step="0.1" />
                                    </FormControl>
                                    <Percent className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <FormDescription>
                                    Commission for Odd/Even game mode in Satamatka
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="satamatkaCrossing"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Other Market Game Commission</FormLabel>
                                  <div className="flex items-center gap-2">
                                    <FormControl>
                                      <Input {...field} type="number" min="0" max="100" step="0.1" />
                                    </FormControl>
                                    <Percent className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <FormDescription>
                                    Commission for other Satamatka game modes
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button type="submit" disabled={updateCommissionMutation.isPending}>
                            {updateCommissionMutation.isPending && (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            )}
                            <Save className="h-4 w-4 mr-2" />
                            Save Commission Settings
                          </Button>
                        </div>
                      </form>
                    </Form>
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