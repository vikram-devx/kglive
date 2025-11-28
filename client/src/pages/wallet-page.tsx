import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowUp, ArrowDown, FileCheck, CheckCircle, XCircle, Clock, IndianRupee, Wallet, History, Ban, CheckCircle2, CircleDollarSign, Landmark, Banknote, RefreshCw, CreditCard, User, Copy, CheckCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { formatDistance } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/dashboard-layout";
import { PaymentMode, RequestType, RequestStatus, WalletRequest, PaymentDetails } from "@/lib/types";

// API response type for payment details
interface SystemPaymentDetails {
  upi?: {
    id: string;
    qrCode: string | null;
  };
  bank?: {
    name: string;
    accountNumber: string;
    ifscCode: string;
    accountHolder: string;
  };
}

// Form schemas
const depositFormSchema = z.object({
  amount: z.coerce.number().min(100, "Minimum deposit amount is ₹100").max(100000, "Maximum deposit amount is ₹100,000"),
  paymentMode: z.enum(["upi", "bank"]),
  paymentDetails: z.object({
    upiId: z.string().optional(),
    transactionId: z.string().optional(),
    utrNumber: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
  }),
  notes: z.string().optional(),
});

const withdrawalFormSchema = z.object({
  amount: z.coerce.number().min(500, "Minimum withdrawal amount is ₹500").max(50000, "Maximum withdrawal amount is ₹50,000"),
  paymentMode: z.enum(["upi", "bank"]),
  paymentDetails: z.object({
    upiId: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
  }),
  notes: z.string().optional(),
});

type DepositFormValues = z.infer<typeof depositFormSchema>;
type WithdrawalFormValues = z.infer<typeof withdrawalFormSchema>;

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  // Initialize forms
  const depositForm = useForm<DepositFormValues>({
    resolver: zodResolver(depositFormSchema),
    defaultValues: {
      amount: 0,
      paymentMode: "upi",
      paymentDetails: {},
      notes: "",
    },
  });

  const withdrawalForm = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalFormSchema),
    defaultValues: {
      amount: 0,
      paymentMode: "upi",
      paymentDetails: {},
      notes: "",
    },
  });
  
  // Extract tab parameter from URL or default to "balance"
  const getTabFromUrl = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    
    // Check if user is a direct player (assigned to admin or null)
    const isDirectPlayer = user?.role === "player" && (!user.assignedTo || user.assignedTo === 1);
    
    // Only direct players can access deposit/withdraw tabs
    if (!isDirectPlayer && (tab === 'deposit' || tab === 'withdraw')) {
      return 'balance';
    }
    
    // Only allow valid tabs
    return tab === 'deposit' || tab === 'withdraw' || tab === 'history' ? tab : 'balance';
  };
  
  const [activeTab, setActiveTab] = useState(getTabFromUrl());
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [paymentModeDetails, setPaymentModeDetails] = useState<PaymentDetails | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("upi");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Update URL when tab changes
  const updateTab = (tab: string) => {
    setActiveTab(tab);
    // Update URL with tab parameter
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('tab', tab);
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.replaceState(null, '', newUrl);
  };

  // Fetch payment details from the system
  const { data: systemPaymentDetails, isLoading: loadingPaymentDetails } = useQuery<SystemPaymentDetails>({
    queryKey: ["/api/wallet/payment-details"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch payment details");
      }
      const data = await res.json();
      return data;
    }
  });
  
  // Set payment details when they are fetched
  useEffect(() => {
    if (systemPaymentDetails) {
      // Transform the API response to match the expected structure
      // Use exactly what the admin has set in payment settings
      const transformedDetails: PaymentDetails = {
        upiDetails: systemPaymentDetails.upi ? {
          upiId: systemPaymentDetails.upi.id,
          qrImageUrl: systemPaymentDetails.upi.qrCode || undefined
        } : undefined,
        bankDetails: systemPaymentDetails.bank ? {
          accountName: systemPaymentDetails.bank.accountHolder,
          accountNumber: systemPaymentDetails.bank.accountNumber,
          ifscCode: systemPaymentDetails.bank.ifscCode,
          bankName: systemPaymentDetails.bank.name
        } : undefined
      };
      
      setPaymentModeDetails(transformedDetails);
    }
  }, [systemPaymentDetails]);

  // Fetch user's wallet requests
  const { 
    data: walletRequests = [], 
    isLoading: loadingRequests,
    refetch: refetchRequests
  } = useQuery<WalletRequest[]>({
    queryKey: ["/api/wallet/my-requests"],
    enabled: activeTab === "history" || activeTab === "balance",
  });
  
  // Fetch user's direct transactions (fund transfers, etc.)
  const {
    data: transactions = [],
    isLoading: loadingTransactions,
    refetch: refetchTransactions
  } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
    enabled: activeTab === "history" || activeTab === "balance"
  });

  // Deposit mutation
  const depositMutation = useMutation({
    mutationFn: async (values: DepositFormValues) => {
      let proofImageUrl = "";
      
      if (proofImage) {
        proofImageUrl = await uploadProofImage(proofImage);
      }

      const response = await fetch("/api/wallet/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...values,
          requestType: "deposit",
          proofImageUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit deposit request");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Deposit Request Submitted",
        description: "Your deposit request has been submitted successfully and is pending approval.",
      });
      depositForm.reset();
      setProofImage(null);
      refetchRequests();
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/my-requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Deposit Failed",
        description: error.message || "Failed to submit deposit request",
        variant: "destructive",
      });
    },
  });

  // Withdrawal mutation
  const withdrawalMutation = useMutation({
    mutationFn: async (values: WithdrawalFormValues) => {
      const response = await fetch("/api/wallet/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...values,
          requestType: "withdrawal",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit withdrawal request");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Request Submitted",
        description: "Your withdrawal request has been submitted successfully and is pending approval.",
      });
      withdrawalForm.reset();
      refetchRequests();
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/my-requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message || "Failed to submit withdrawal request",
        variant: "destructive",
      });
    },
  });

  // File upload handler
  const handleProofImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setProofImage(e.target.files[0]);
    }
  };

  // Upload proof image
  const uploadProofImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("proofImage", file);

    try {
      const res = await fetch('/api/upload/proof', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await res.json();
      return data.imageUrl;
    } catch (error) {
      throw error;
    }
  };

  // Copy to clipboard function
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get title and icon for request type
  const getRequestTypeInfo = (type: RequestType) => {
    switch (type) {
      case RequestType.DEPOSIT:
        return { 
          title: "Deposit", 
          icon: <ArrowDown className="h-5 w-5 text-green-600" />
        };
      case RequestType.WITHDRAWAL:
        return { 
          title: "Withdrawal", 
          icon: <ArrowUp className="h-5 w-5 text-blue-600" />
        };
      default:
        return { 
          title: "Unknown", 
          icon: null
        };
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Wallet</h1>
          <p className="text-muted-foreground">Manage your account balance and transactions</p>
        </div>

        <Tabs value={activeTab} onValueChange={updateTab}>
          {(() => {
            // Check if user is a direct player (assigned to admin or null)
            const isDirectPlayer = user?.role === "player" && (!user.assignedTo || user.assignedTo === 1);
            
            if (isDirectPlayer) {
              return (
                <TabsList className="grid w-full grid-cols-4 mb-8">
                  <TabsTrigger value="balance">Balance</TabsTrigger>
                  <TabsTrigger value="deposit">Deposit</TabsTrigger>
                  <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
              );
            } else {
              return (
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="balance">Balance</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
              );
            }
          })()}

          <TabsContent value="balance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wallet className="h-5 w-5 mr-2" />
                  Current Balance
                </CardTitle>
                <CardDescription>
                  Your available account balance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  ₹{user ? (user.balance / 100).toFixed(2) : '0.00'}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => updateTab("history")}>
                  View All Transactions
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Deposit Tab */}
          <TabsContent value="deposit">
            <Card>
              <CardHeader>
                <CardTitle>Add Funds</CardTitle>
                <CardDescription>
                  Deposit money into your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...depositForm}>
                  <form onSubmit={depositForm.handleSubmit((values) => depositMutation.mutate(values))} className="space-y-6">
                    <FormField
                      control={depositForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (₹)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter amount (min ₹100)"
                              min="100"
                              max="100000"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={depositForm.control}
                      name="paymentMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <FormControl>
                            <RadioGroup 
                              value={field.value} 
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedPaymentMethod(value);
                              }}
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="upi" id="deposit-upi" />
                                <Label htmlFor="deposit-upi">UPI Payment</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="bank" id="deposit-bank" />
                                <Label htmlFor="deposit-bank">Bank Transfer</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* UPI Payment Details */}
                    {selectedPaymentMethod === "upi" && paymentModeDetails?.upiDetails && (
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <h4 className="font-medium mb-3">UPI Payment Details</h4>
                        <div className="space-y-3">
                          {/* Parse and display each UPI ID separately */}
                          {paymentModeDetails.upiDetails.upiId.split('\n').filter(upi => upi.trim()).map((upiId, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                              <div>
                                <span className="text-sm text-muted-foreground">UPI ID {index + 1}: </span>
                                <span className="font-mono font-medium">{upiId.trim()}</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(upiId.trim(), `UPI ID ${index + 1}`)}
                                className="gap-2"
                              >
                                {copiedText === `UPI ID ${index + 1}` ? (
                                  <CheckCheck className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                                Copy
                              </Button>
                            </div>
                          ))}
                          
                          {/* Copy All UPI IDs button */}
                          {paymentModeDetails.upiDetails.upiId.includes('\n') && (
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">All UPI IDs</p>
                                  <p className="text-xs text-blue-700 dark:text-blue-300">Copy all UPI IDs at once</p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(paymentModeDetails.upiDetails!.upiId, "All UPI IDs")}
                                  className="gap-2"
                                >
                                  {copiedText === "All UPI IDs" ? (
                                    <CheckCheck className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                  Copy All
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {paymentModeDetails.upiDetails.qrImageUrl && (
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground mb-2">Scan QR Code:</p>
                              <img 
                                src={paymentModeDetails.upiDetails.qrImageUrl} 
                                alt="QR Code" 
                                className="w-40 h-40 mx-auto border rounded-lg"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bank Transfer Details */}
                    {selectedPaymentMethod === "bank" && paymentModeDetails?.bankDetails && (
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <h4 className="font-medium mb-3">Bank Transfer Details</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                            <div>
                              <span className="text-sm text-muted-foreground">Bank Name: </span>
                              <span className="font-medium">{paymentModeDetails.bankDetails.bankName}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(paymentModeDetails.bankDetails!.bankName, "Bank Name")}
                              className="gap-2"
                            >
                              {copiedText === "Bank Name" ? (
                                <CheckCheck className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                              Copy
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                            <div>
                              <span className="text-sm text-muted-foreground">Account Holder: </span>
                              <span className="font-medium">{paymentModeDetails.bankDetails.accountName}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(paymentModeDetails.bankDetails!.accountName, "Account Holder")}
                              className="gap-2"
                            >
                              {copiedText === "Account Holder" ? (
                                <CheckCheck className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                              Copy
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                            <div>
                              <span className="text-sm text-muted-foreground">Account Number: </span>
                              <span className="font-mono font-medium">{paymentModeDetails.bankDetails.accountNumber}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(paymentModeDetails.bankDetails!.accountNumber, "Account Number")}
                              className="gap-2"
                            >
                              {copiedText === "Account Number" ? (
                                <CheckCheck className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                              Copy
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                            <div>
                              <span className="text-sm text-muted-foreground">IFSC Code: </span>
                              <span className="font-mono font-medium">{paymentModeDetails.bankDetails.ifscCode}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(paymentModeDetails.bankDetails!.ifscCode, "IFSC Code")}
                              className="gap-2"
                            >
                              {copiedText === "IFSC Code" ? (
                                <CheckCheck className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                              Copy
                            </Button>
                          </div>
                          
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Complete Bank Details</p>
                                <p className="text-xs text-blue-700 dark:text-blue-300">Copy all details at once</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const allDetails = `Bank Name: ${paymentModeDetails.bankDetails!.bankName}
Account Holder: ${paymentModeDetails.bankDetails!.accountName}
Account Number: ${paymentModeDetails.bankDetails!.accountNumber}
IFSC Code: ${paymentModeDetails.bankDetails!.ifscCode}`;
                                  copyToClipboard(allDetails, "All Bank Details");
                                }}
                                className="gap-2"
                              >
                                {copiedText === "All Bank Details" ? (
                                  <CheckCheck className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                                Copy All
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <FormField
                      control={depositForm.control}
                      name="paymentDetails.transactionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transaction ID</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your transaction ID"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <Label htmlFor="proof-upload">Payment Proof (Screenshot)</Label>
                      <Input 
                        id="proof-upload"
                        type="file" 
                        accept="image/*"
                        onChange={handleProofImageChange}
                      />
                      {proofImage && (
                        <p className="text-sm text-muted-foreground">
                          Selected: {proofImage.name}
                        </p>
                      )}
                    </div>

                    <FormField
                      control={depositForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Add any additional notes"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={depositMutation.isPending}
                    >
                      {depositMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Deposit Request"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdraw Tab */}
          <TabsContent value="withdraw">
            <Card>
              <CardHeader>
                <CardTitle>Withdraw Funds</CardTitle>
                <CardDescription>
                  Withdraw money from your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-full bg-primary">
                      <IndianRupee className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">Your balance: ₹{user?.balance ? (user.balance / 100).toFixed(2) : '0.00'}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Minimum withdrawal amount is ₹500. Maximum is ₹50,000.
                  </p>
                </div>

                <Form {...withdrawalForm}>
                  <form onSubmit={withdrawalForm.handleSubmit((values) => withdrawalMutation.mutate(values))} className="space-y-6">
                    <FormField
                      control={withdrawalForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (₹)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter amount (min ₹500)"
                              min="500"
                              max="50000"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={withdrawalForm.control}
                      name="paymentMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Withdrawal Method</FormLabel>
                          <FormControl>
                            <RadioGroup value={field.value} onValueChange={field.onChange}>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="upi" id="withdraw-upi" />
                                <Label htmlFor="withdraw-upi">UPI</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="bank" id="withdraw-bank" />
                                <Label htmlFor="withdraw-bank">Bank Transfer</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {withdrawalForm.watch("paymentMode") === "upi" && (
                      <FormField
                        control={withdrawalForm.control}
                        name="paymentDetails.upiId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UPI ID</FormLabel>
                            <FormControl>
                              <Input placeholder="your-upi@bank" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {withdrawalForm.watch("paymentMode") === "bank" && (
                      <>
                        <FormField
                          control={withdrawalForm.control}
                          name="paymentDetails.bankName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bank Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your bank name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={withdrawalForm.control}
                          name="paymentDetails.accountNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your account number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={withdrawalForm.control}
                          name="paymentDetails.ifscCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>IFSC Code</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter IFSC code" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    <FormField
                      control={withdrawalForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Any additional information" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={withdrawalMutation.isPending}
                    >
                      {withdrawalMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Withdrawal Request"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <History className="h-5 w-5 mr-2" />
                    Transaction History
                  </CardTitle>
                  <CardDescription>
                    View all your wallet transactions and requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingRequests || loadingTransactions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : walletRequests.length === 0 && transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No transactions found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Combine and sort all transactions by date (newest first) */}
                      {(() => {
                        const allTransactions = [
                          ...walletRequests.map(request => ({
                            id: `req-${request.id}`,
                            type: 'request',
                            createdAt: request.createdAt,
                            data: request
                          })),
                          ...transactions.map(transaction => ({
                            id: `txn-${transaction.id}`,
                            type: 'transaction',
                            createdAt: transaction.createdAt,
                            data: transaction
                          }))
                        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                        return allTransactions.map((item) => (
                          <div key={item.id} className="p-4 border rounded-lg">
                            {item.type === 'request' ? (
                              // Wallet Request Display
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {getRequestTypeInfo(item.data.requestType).icon}
                                  <div>
                                    <h4 className="font-medium">
                                      {getRequestTypeInfo(item.data.requestType).title}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      {formatDate(item.data.createdAt)}
                                      {item.data.status === RequestStatus.APPROVED && item.data.approvedBy && (
                                        <span className="ml-2 text-green-600">
                                          • Approved by {item.data.approver?.username || `Admin #${item.data.approvedBy}`}
                                        </span>
                                      )}
                                      {item.data.status === RequestStatus.REJECTED && item.data.rejectedBy && (
                                        <span className="ml-2 text-red-600">
                                          • Rejected by {item.data.rejector?.username || `Admin #${item.data.rejectedBy}`}
                                        </span>
                                      )}
                                    </p>
                                    {item.data.notes && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Note: {item.data.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">
                                    ₹{item.data.amount.toFixed(2)}
                                  </div>
                                  <Badge variant={
                                    item.data.status === RequestStatus.APPROVED ? "default" :
                                    item.data.status === RequestStatus.REJECTED ? "destructive" :
                                    "secondary"
                                  }>
                                    {item.data.status}
                                  </Badge>
                                </div>
                              </div>
                            ) : (
                              // Direct Transaction Display (Admin Actions)
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {item.data.amount > 0 ? (
                                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                                      <ArrowDown className="h-4 w-4 text-green-600" />
                                    </div>
                                  ) : (
                                    <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
                                      <ArrowUp className="h-4 w-4 text-red-600" />
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="font-medium">
                                      {item.data.amount > 0 ? "Fund Credit" : "Fund Debit"}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      {formatDate(item.data.createdAt)}
                                      {item.data.performer && (
                                        <span className="ml-2 text-blue-600">
                                          • By {item.data.performer.username}
                                        </span>
                                      )}
                                    </p>
                                    {item.data.description && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {item.data.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`font-medium ${item.data.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                                    {item.data.amount > 0 ? "+" : ""}₹{(Math.abs(item.data.amount) / 100).toFixed(2)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Balance: ₹{(item.data.balanceAfter / 100).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}