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
import { Loader2, ArrowUp, ArrowDown, FileCheck, CheckCircle, XCircle, Clock, IndianRupee, Wallet, History, Ban, CheckCircle2, CircleDollarSign, Landmark, Banknote, RefreshCw, CreditCard, User } from "lucide-react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
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

  // Form for handling deposits
  const depositForm = useForm<DepositFormValues>({
    resolver: zodResolver(depositFormSchema),
    defaultValues: {
      amount: 0,
      paymentMode: "upi",
      paymentDetails: {},
      notes: "",
    },
  });

  // Form for handling withdrawals
  const withdrawalForm = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalFormSchema),
    defaultValues: {
      amount: 0,
      paymentMode: "upi",
      paymentDetails: {},
      notes: "",
    },
  });

  // Create wallet request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: {
      amount: number;
      requestType: RequestType;
      paymentMode: PaymentMode;
      paymentDetails: Record<string, string>;
      proofImageUrl?: string;
      notes?: string;
    }) => {
      const res = await apiRequest("POST", "/api/wallet/requests", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted",
        description: "Your request has been submitted successfully and is pending approval.",
      });
      // Reset forms
      depositForm.reset();
      withdrawalForm.reset();
      setProofImage(null);
      
      // Refetch user data to update balance
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Refetch transactions data
      refetchRequests();
      refetchTransactions();
      
      // Switch to history tab
      updateTab("history");
    },
    onError: (error: Error) => {
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle deposit form submission
  const handleDepositSubmit = async (values: DepositFormValues) => {
    try {
      // Filter out undefined values from payment details
      const paymentDetails: Record<string, string> = {};
      Object.entries(values.paymentDetails).forEach(([key, value]) => {
        if (value) paymentDetails[key] = value;
      });

      // Proof image is required for all payment methods
      if (!proofImage) {
        toast({
          title: "Error",
          description: "Please upload proof of payment",
          variant: "destructive",
        });
        return;
      }

      let imageUrl = undefined;
      
      // Upload proof image
      if (proofImage) {
        try {
          imageUrl = await uploadProofImage(proofImage);
        } catch (uploadError) {
          toast({
            title: "Upload Failed",
            description: "Failed to upload payment proof. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      // Create deposit request
      await createRequestMutation.mutateAsync({
        amount: values.amount,
        requestType: RequestType.DEPOSIT,
        paymentMode: values.paymentMode as PaymentMode,
        paymentDetails,
        proofImageUrl: imageUrl,
        notes: values.notes,
      });
    } catch (error: any) {
      toast({
        title: "Deposit Request Failed",
        description: error.message || "An error occurred while processing your deposit request.",
        variant: "destructive",
      });
    }
  };

  // Handle withdrawal form submission
  const handleWithdrawalSubmit = async (values: WithdrawalFormValues) => {
    try {
      // Check if user has sufficient balance
      if (user && user.balance < values.amount) {
        toast({
          title: "Insufficient Balance",
          description: "You don't have enough balance for this withdrawal.",
          variant: "destructive",
        });
        return;
      }

      // Filter out undefined values from payment details
      const paymentDetails: Record<string, string> = {};
      Object.entries(values.paymentDetails).forEach(([key, value]) => {
        if (value) paymentDetails[key] = value;
      });

      // Create withdrawal request
      await createRequestMutation.mutateAsync({
        amount: values.amount,
        requestType: RequestType.WITHDRAWAL,
        paymentMode: values.paymentMode as PaymentMode,
        paymentDetails,
        notes: values.notes,
      });
      
      // Success notification handled by the createRequestMutation onSuccess
      
    } catch (error: any) {
      toast({
        title: "Withdrawal Request Failed",
        description: error.message || "An error occurred while processing your withdrawal request.",
        variant: "destructive",
      });
    }
  };

  // Get color and icon for request status
  const getStatusInfo = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.APPROVED:
        return { 
          color: "text-green-600", 
          bgColor: "bg-green-100", 
          icon: <CheckCircle className="h-5 w-5 text-green-600" />
        };
      case RequestStatus.REJECTED:
        return { 
          color: "text-red-600", 
          bgColor: "bg-red-100", 
          icon: <XCircle className="h-5 w-5 text-red-600" />
        };
      case RequestStatus.PENDING:
      default:
        return { 
          color: "text-yellow-600", 
          bgColor: "bg-yellow-100", 
          icon: <Clock className="h-5 w-5 text-yellow-600" />
        };
    }
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

  // Payment mode fields - what to show based on selected payment mode
  const renderDepositPaymentFields = () => {
    const paymentMode = depositForm.watch("paymentMode");
    
    switch (paymentMode) {
      case "upi":
        return (
          <>
            <div className="space-y-2">

              <FormField
                control={depositForm.control}
                name="paymentDetails.utrNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UTR Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter UTR number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Display system UPI details */}
            {paymentModeDetails?.upiDetails && (
              <div className="mt-4 p-4 rounded-lg bg-slate-900/70 border border-slate-800 text-slate-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600">
                    <FileCheck className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-fuchsia-300">UPI Payment Details</h3>
                </div>
                <div className="pl-9">
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-slate-300"><strong className="text-slate-200">UPI ID:</strong> {paymentModeDetails.upiDetails.upiId}</p>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                      onClick={() => {
                        if (paymentModeDetails?.upiDetails?.upiId) {
                          navigator.clipboard.writeText(paymentModeDetails.upiDetails.upiId);
                          toast({
                            title: "Copied!",
                            description: "UPI ID copied to clipboard",
                          });
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </Button>
                  </div>
                  {paymentModeDetails.upiDetails.qrImageUrl && (
                    <div className="mt-3">
                      <p className="text-slate-200 font-medium">Scan QR Code:</p>
                      <img 
                        src={paymentModeDetails.upiDetails.qrImageUrl} 
                        alt="UPI QR Code" 
                        className="w-48 h-48 mt-2 border border-slate-700 rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        );
      
      case "bank":
        return (
          <>
            <div className="space-y-2">
              <FormField
                control={depositForm.control}
                name="paymentDetails.transactionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Reference</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter bank transfer reference" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Display system bank details */}
            {paymentModeDetails?.bankDetails && (
              <div className="mt-4 p-4 rounded-lg bg-slate-900/70 border border-slate-800 text-slate-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600">
                    <FileCheck className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-fuchsia-300">Bank Transfer Details</h3>
                </div>
                <div className="pl-9">
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-slate-300"><strong className="text-slate-200">Account Name:</strong> {paymentModeDetails.bankDetails.accountName}</p>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                      onClick={() => {
                        if (paymentModeDetails?.bankDetails?.accountName) {
                          navigator.clipboard.writeText(paymentModeDetails.bankDetails.accountName);
                          toast({
                            title: "Copied!",
                            description: "Account name copied to clipboard",
                          });
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </Button>
                  </div>
                  
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-slate-300"><strong className="text-slate-200">Account Number:</strong> {paymentModeDetails.bankDetails.accountNumber}</p>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                      onClick={() => {
                        if (paymentModeDetails?.bankDetails?.accountNumber) {
                          navigator.clipboard.writeText(paymentModeDetails.bankDetails.accountNumber);
                          toast({
                            title: "Copied!",
                            description: "Account number copied to clipboard",
                          });
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </Button>
                  </div>
                  
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-slate-300"><strong className="text-slate-200">IFSC Code:</strong> {paymentModeDetails.bankDetails.ifscCode}</p>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                      onClick={() => {
                        if (paymentModeDetails?.bankDetails?.ifscCode) {
                          navigator.clipboard.writeText(paymentModeDetails.bankDetails.ifscCode);
                          toast({
                            title: "Copied!",
                            description: "IFSC code copied to clipboard",
                          });
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </Button>
                  </div>
                  
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-slate-300"><strong className="text-slate-200">Bank Name:</strong> {paymentModeDetails.bankDetails.bankName}</p>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300"
                      onClick={() => {
                        if (paymentModeDetails?.bankDetails?.bankName) {
                          navigator.clipboard.writeText(paymentModeDetails.bankDetails.bankName);
                          toast({
                            title: "Copied!",
                            description: "Bank name copied to clipboard",
                          });
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      
      default:
        return null;
    }
  };

  const renderWithdrawalPaymentFields = () => {
    const paymentMode = withdrawalForm.watch("paymentMode");
    
    switch (paymentMode) {
      case "upi":
        return (
          <FormField
            control={withdrawalForm.control}
            name="paymentDetails.upiId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>UPI ID</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your UPI ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case "bank":
        return (
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
        );
      
      default:
        return null;
    }
  };

  return (
    <DashboardLayout title="Wallet">
      <div className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div 
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              activeTab === "balance" 
                ? "bg-slate-900/90 border-primary shadow-md" 
                : "bg-slate-900/50 border-slate-800 hover:border-primary/40"
            }`}
            onClick={() => setActiveTab("balance")}
          >
            <div className="flex flex-col items-center justify-center text-center">
              <div className={`p-3 rounded-full mb-2 ${
                activeTab === "balance" 
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600" 
                  : "bg-slate-800"
              }`}>
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className={`font-medium ${
                activeTab === "balance" ? "text-primary" : "text-slate-300"
              }`}>Balance</span>
            </div>
          </div>
          
          {/* Deposit option - Only for direct players (assigned to admin or null) */}
          {user?.role === "player" && (!user.assignedTo || user.assignedTo === 1) && (
            <div 
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                activeTab === "deposit" 
                  ? "bg-slate-900/90 border-primary shadow-md" 
                  : "bg-slate-900/50 border-slate-800 hover:border-primary/40"
              }`}
              onClick={() => setActiveTab("deposit")}
            >
              <div className="flex flex-col items-center justify-center text-center">
                <div className={`p-3 rounded-full mb-2 ${
                  activeTab === "deposit" 
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600" 
                    : "bg-slate-800"
                }`}>
                  <ArrowDown className="w-5 h-5 text-white" />
                </div>
                <span className={`font-medium ${
                  activeTab === "deposit" ? "text-primary" : "text-slate-300"
                }`}>Deposit</span>
              </div>
            </div>
          )}
          
          {/* Withdraw option - Only for direct players (assigned to admin or null) */}
          {user?.role === "player" && (!user.assignedTo || user.assignedTo === 1) && (
            <div 
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                activeTab === "withdraw" 
                  ? "bg-slate-900/90 border-primary shadow-md" 
                  : "bg-slate-900/50 border-slate-800 hover:border-primary/40"
              }`}
              onClick={() => setActiveTab("withdraw")}
            >
              <div className="flex flex-col items-center justify-center text-center">
                <div className={`p-3 rounded-full mb-2 ${
                  activeTab === "withdraw" 
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600" 
                    : "bg-slate-800"
                }`}>
                  <ArrowUp className="w-5 h-5 text-white" />
                </div>
                <span className={`font-medium ${
                  activeTab === "withdraw" ? "text-primary" : "text-slate-300"
                }`}>Withdraw</span>
              </div>
            </div>
          )}
          
          <div 
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              activeTab === "history" 
                ? "bg-slate-900/90 border-primary shadow-md" 
                : "bg-slate-900/50 border-slate-800 hover:border-primary/40"
            }`}
            onClick={() => setActiveTab("history")}
          >
            <div className="flex flex-col items-center justify-center text-center">
              <div className={`p-3 rounded-full mb-2 ${
                activeTab === "history" 
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600" 
                  : "bg-slate-800"
              }`}>
                <History className="w-5 h-5 text-white" />
              </div>
              <span className={`font-medium ${
                activeTab === "history" ? "text-primary" : "text-slate-300"
              }`}>History</span>
            </div>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="balance" value={activeTab} onValueChange={updateTab} className="w-full">

        {/* Balance Tab */}
        <TabsContent value="balance" className="space-y-4">
          <Card className="bg-slate-900/70 shadow-lg border border-slate-800">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col items-center md:flex-row md:justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="p-3 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 mr-4">
                    <IndianRupee className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Current Balance</p>
                    <p className="text-3xl font-bold text-fuchsia-300">₹{user?.balance ? (user.balance / 100).toFixed(2) : '0.00'}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Last updated: {new Date().toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
                {user?.role === "player" && (
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => updateTab("deposit")}
                      className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white"
                    >
                      <ArrowDown className="mr-2 h-4 w-4" />
                      Deposit
                    </Button>
                    <Button 
                      onClick={() => updateTab("withdraw")} 
                      variant="outline"
                      className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <ArrowUp className="mr-2 h-4 w-4" />
                      Withdraw
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your most recent wallet activities</CardDescription>
            </CardHeader>
            <CardContent>
              {(loadingRequests || loadingTransactions) ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (walletRequests.length === 0 && transactions.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recent transactions found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Direct transactions from admin/subadmin */}
                  {transactions.slice(0, 3).map((transaction) => (
                    <div key={`tx-${transaction.id}`} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center">
                        <div className="mr-4">
                          {transaction.amount > 0 ? (
                            <ArrowDown className="h-5 w-5 text-green-600" />
                          ) : (
                            <ArrowUp className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {transaction.amount > 0 ? "Fund Credit" : "Fund Debit"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" /> 
                              By {transaction.performer?.username || `Admin #${transaction.performedBy}`}
                              <span className="mx-1">•</span>
                              {formatDate(transaction.createdAt)}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-semibold ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                          {transaction.amount > 0 ? "+" : ""}
                          ₹{(Math.abs(transaction.amount) / 100).toFixed(2)}
                        </span>
                        <div className={`p-1 rounded-full ${transaction.amount > 0 ? "bg-green-100" : "bg-red-100"}`}>
                          {transaction.amount > 0 ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Ban className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Deposit/Withdrawal requests */}
                  {walletRequests.slice(0, 3).map((request) => {
                    const { color, bgColor, icon } = getStatusInfo(request.status as RequestStatus);
                    const { title, icon: typeIcon } = getRequestTypeInfo(request.requestType as RequestType);
                    
                    return (
                      <div key={`req-${request.id}`} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center">
                          <div className="mr-4">
                            {typeIcon}
                          </div>
                          <div>
                            <h4 className="font-medium">{title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(request.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">
                            ₹{request.amount.toFixed(2)}
                          </span>
                          <div className={`p-1 rounded-full ${bgColor}`}>
                            {icon}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                <form onSubmit={depositForm.handleSubmit(handleDepositSubmit)} className="space-y-6">
                  <FormField
                    control={depositForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (₹)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter amount" 
                            {...field} 
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
                          <div className="grid grid-cols-2 gap-3">
                            <div 
                              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                field.value === "upi" 
                                  ? "bg-slate-900/90 border-primary shadow-md" 
                                  : "bg-slate-900/50 border-slate-800 hover:border-primary/40"
                              }`}
                              onClick={() => depositForm.setValue("paymentMode", "upi")}
                            >

                              <div className="flex flex-col items-center justify-center text-center">
                                <div className={`p-3 rounded-full mb-2 ${
                                  field.value === "upi" 
                                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600" 
                                    : "bg-slate-800"
                                }`}>
                                  <IndianRupee className="w-5 h-5 text-white" />
                                </div>
                                <span className={`font-medium ${
                                  field.value === "upi" ? "text-primary" : "text-slate-300"
                                }`}>UPI</span>
                              </div>
                            </div>
                            
                            <div 
                              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                field.value === "bank" 
                                  ? "bg-slate-900/90 border-primary shadow-md" 
                                  : "bg-slate-900/50 border-slate-800 hover:border-primary/40"
                              }`}
                              onClick={() => depositForm.setValue("paymentMode", "bank")}
                            >

                              <div className="flex flex-col items-center justify-center text-center">
                                <div className={`p-3 rounded-full mb-2 ${
                                  field.value === "bank" 
                                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600" 
                                    : "bg-slate-800"
                                }`}>
                                  <Landmark className="w-5 h-5 text-white" />
                                </div>
                                <span className={`font-medium ${
                                  field.value === "bank" ? "text-primary" : "text-slate-300"
                                }`}>Bank</span>
                              </div>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {renderDepositPaymentFields()}

                  <div className="space-y-2">
                    <Label htmlFor="proofImage">Payment Proof Image</Label>
                    <Input
                      id="proofImage"
                      type="file"
                      accept="image/*"
                      onChange={handleProofImageChange}
                      className="cursor-pointer"
                    />
                    {proofImage && (
                      <div className="mt-2">
                        <p className="text-sm text-green-600">
                          Image selected: {proofImage.name}
                        </p>
                      </div>
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
                            placeholder="Any additional information" 
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
                    disabled={createRequestMutation.isPending}
                  >
                    {createRequestMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Submit Deposit Request
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
              <div className="mb-6 p-4 rounded-lg bg-slate-900/70 border border-slate-800 text-slate-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600">
                    <IndianRupee className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-fuchsia-300">Your balance: ₹{user?.balance ? (user.balance / 100).toFixed(2) : '0.00'}</h3>
                </div>
                <p className="pl-9 text-sm text-slate-400">
                  Minimum withdrawal amount is ₹500. Maximum is ₹50,000.
                </p>
              </div>

              <Form {...withdrawalForm}>
                <form onSubmit={withdrawalForm.handleSubmit(handleWithdrawalSubmit)} className="space-y-6">
                  <FormField
                    control={withdrawalForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (₹)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter amount" 
                            {...field}
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
                          <div className="grid grid-cols-2 gap-3">
                            <div 
                              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                field.value === "upi" 
                                  ? "bg-slate-900/90 border-primary shadow-md" 
                                  : "bg-slate-900/50 border-slate-800 hover:border-primary/40"
                              }`}
                              onClick={() => withdrawalForm.setValue("paymentMode", "upi")}
                            >

                              <div className="flex flex-col items-center justify-center text-center">
                                <div className={`p-3 rounded-full mb-2 ${
                                  field.value === "upi" 
                                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600" 
                                    : "bg-slate-800"
                                }`}>
                                  <IndianRupee className="w-5 h-5 text-white" />
                                </div>
                                <span className={`font-medium ${
                                  field.value === "upi" ? "text-primary" : "text-slate-300"
                                }`}>UPI</span>
                              </div>
                            </div>
                            
                            <div 
                              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                field.value === "bank" 
                                  ? "bg-slate-900/90 border-primary shadow-md" 
                                  : "bg-slate-900/50 border-slate-800 hover:border-primary/40"
                              }`}
                              onClick={() => withdrawalForm.setValue("paymentMode", "bank")}
                            >

                              <div className="flex flex-col items-center justify-center text-center">
                                <div className={`p-3 rounded-full mb-2 ${
                                  field.value === "bank" 
                                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600" 
                                    : "bg-slate-800"
                                }`}>
                                  <Landmark className="w-5 h-5 text-white" />
                                </div>
                                <span className={`font-medium ${
                                  field.value === "bank" ? "text-primary" : "text-slate-300"
                                }`}>Bank</span>
                              </div>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {renderWithdrawalPaymentFields()}

                  <FormField
                    control={withdrawalForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Any additional information" 
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
                    disabled={createRequestMutation.isPending}
                  >
                    {createRequestMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Submit Withdrawal Request
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  All your wallet transactions
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="pt-4">
              {(loadingRequests || loadingTransactions) ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (walletRequests.length === 0 && transactions.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No transaction history found.</p>
                </div>
              ) : (
                <>
                  {/* Mobile-optimized transaction table */}
                  {(() => {
                    // Define types for our combined transactions
                    type RequestTransaction = {
                      id: string;
                      isRequest: true;
                      createdAt: string;
                      requestData: WalletRequest;
                    };
                    
                    type DirectTransaction = {
                      id: string;
                      isRequest: false;
                      createdAt: string;
                      transactionData: any;
                    };
                    
                    type CombinedTransaction = RequestTransaction | DirectTransaction;
                    
                    // Create transaction-like objects from wallet requests for unified sorting
                    const requestTransactions: RequestTransaction[] = walletRequests.map(request => ({
                      id: `req-${request.id}`,
                      isRequest: true,
                      createdAt: request.createdAt,
                      requestData: request
                    }));
                    
                    // Mark direct transactions
                    const directTransactions: DirectTransaction[] = transactions.map(tx => ({
                      id: `tx-${tx.id}`,
                      isRequest: false,
                      createdAt: tx.createdAt,
                      transactionData: tx
                    }));
                    
                    // Combine and sort by date (newest first)
                    const allTransactions: CombinedTransaction[] = [...requestTransactions, ...directTransactions]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    
                    // Pagination calculation
                    const totalItems = allTransactions.length;
                    const totalPages = Math.ceil(totalItems / itemsPerPage);
                    const startIndex = (currentPage - 1) * itemsPerPage;
                    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
                    const currentItems = allTransactions.slice(startIndex, endIndex);
                      
                    return (
                      <>
                        {/* Mobile-Optimized Transaction Table */}
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[100px]">Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                <TableHead className="w-[80px]">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {currentItems.map(item => {
                                if (item.isRequest) {
                                  // It's a wallet request
                                  const request = item.requestData;
                                  const { title } = getRequestTypeInfo(request.requestType as RequestType);
                                  
                                  return (
                                    <TableRow key={item.id}>
                                      <TableCell className="text-sm">
                                        {formatDate(request.createdAt).split(' ')[0]}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex flex-col">
                                          <span className="font-medium text-sm">{title} Request</span>
                                          <span className="text-xs text-muted-foreground">
                                            {request.paymentMode}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <span className={
                                          request.requestType === RequestType.DEPOSIT 
                                            ? "text-green-600" 
                                            : "text-red-600"
                                        }>
                                          {request.requestType === RequestType.DEPOSIT ? '+' : '-'}
                                          ₹{request.amount.toFixed(2)}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-right text-sm text-muted-foreground">
                                        -
                                      </TableCell>
                                      <TableCell>
                                        <Badge 
                                          variant={
                                            request.status === RequestStatus.APPROVED 
                                              ? "default" 
                                              : request.status === RequestStatus.REJECTED 
                                                ? "destructive" 
                                                : "secondary"
                                          }
                                          className="text-xs"
                                        >
                                          {request.status}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                } else {
                                  // It's a direct transaction
                                  const transaction = item.transactionData;
                                  return (
                                    <TableRow key={item.id}>
                                      <TableCell className="text-sm">
                                        {formatDate(transaction.createdAt).split(' ')[0]}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex flex-col">
                                          <span className="font-medium text-sm">
                                            {transaction.amount > 0 ? "Credit" : "Debit"}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {transaction.description?.split(' ').slice(0, 3).join(' ') || "Balance update"}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <span className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                                          {transaction.amount > 0 ? '+' : ''}
                                          ₹{(Math.abs(transaction.amount) / 100).toFixed(2)}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <span className="font-medium text-primary">
                                          ₹{(transaction.balanceAfter / 100).toFixed(2)}
                                        </span>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="default" className="text-xs">
                                          Complete
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  );
                                }
                              })}
                            </TableBody>
                          </Table>
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="mt-6 flex justify-center">
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious 
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                  />
                                </PaginationItem>
                                
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                  const pageNum = i + 1;
                                  return (
                                    <PaginationItem key={pageNum}>
                                      <PaginationLink
                                        onClick={() => setCurrentPage(pageNum)}
                                        isActive={currentPage === pageNum}
                                        className="cursor-pointer"
                                      >
                                        {pageNum}
                                      </PaginationLink>
                                    </PaginationItem>
                                  );
                                })}
                                
                                <PaginationItem>
                                  <PaginationNext 
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                  />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          </div>
                        )}
                      </>
                    );
                  })()}
                                          {formatDate(transaction.createdAt)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                      <Badge variant={transaction.amount > 0 ? "outline" : "secondary"}>
                                        <div className="flex items-center gap-1">
                                          <CreditCard className="h-3 w-3" />
                                          {transaction.performer ? 
                                            `${transaction.performer.username} (${transaction.performer.role})` : 
                                            `Admin #${transaction.performedBy}`}
                                        </div>
                                      </Badge>
                                      {transaction.balanceAfter !== undefined && (
                                        <div className="text-sm text-muted-foreground">
                                          <span className="font-medium">Your Balance After: </span>
                                          ₹{(transaction.balanceAfter / 100).toFixed(2)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {transaction.description && (
                                    <div className="px-4 pb-4 text-sm border-t border-slate-800 bg-slate-950/50">
                                      <p className="mt-2">
                                        <strong>Description:</strong>{" "}
                                        {/* Handle different transaction description formats */}
                                        {(() => {
                                          // For descriptions that match our new simple format (Fund added to/Fund deducted from)
                                          if (transaction.description?.includes("Fund added to") || 
                                              transaction.description?.includes("Fund deducted from") ||
                                              transaction.description?.includes("Fund transferred to")) {
                                            return transaction.description;
                                          }
                                          
                                          // Special case for "Funds deducted by KingGames" format (old format)
                                          if (transaction.description === "Funds deducted by KingGames" && transaction.performer) {
                                            // Convert to proper format for Fund Debit
                                            return `Fund deducted from ${user?.username} (${user?.role}) by ${transaction.performer.username} (${transaction.performer.role})`;
                                          }
                                          
                                          // Special case for "Funds recovered from subadmin" format (old format) 
                                          if (transaction.description?.includes("Funds recovered from subadmin") && transaction.performer) {
                                            // Convert to proper format for Fund Credit (commission case)
                                            return `Fund added to ${transaction.performer.username} (${transaction.performer.role}) from ${user?.username} (${user?.role}) for withdrawal (Commission applied)`;
                                          }
                                          
                                          // Special case for "Funds transferred to subadmin" format (old format)
                                          if (transaction.description?.includes("Funds transferred to subadmin") && transaction.performer) {
                                            // Convert to proper format for Fund Debit (commission case)
                                            return `Fund transferred to ${user?.username} (${user?.role}) deducted from ${transaction.performer.username} (${transaction.performer.role}) (Commission applied)`;
                                          }
                                          
                                          // Old format: "Funds added to/deducted from"
                                          if (transaction.description?.includes("Funds added to") || 
                                              transaction.description?.includes("Funds deducted from")) {
                                            return transaction.description.replace("Funds ", "Fund ");
                                          }
                                          
                                          // Special case for older "Funds added by admin" format
                                          if (transaction.description === "Funds added by admin" && transaction.performer) {
                                            if (transaction.amount > 0) {
                                              // Fund credit
                                              return `Fund added to ${user?.username} (${user?.role}) by ${transaction.performer.username} (${transaction.performer.role})`;
                                            } else {
                                              // Fund debit
                                              return `Fund deducted from ${user?.username} (${user?.role}) by ${transaction.performer.username} (${transaction.performer.role})`;
                                            }
                                          }
                                          
                                          // Special case for older "Funds added by [username]" format
                                          if (transaction.description?.startsWith("Funds added by ") && transaction.performer) {
                                            if (transaction.amount > 0) {
                                              // Fund credit
                                              return `Fund added to ${user?.username} (${user?.role}) by ${transaction.performer.username} (${transaction.performer.role})`;
                                            } else {
                                              // Fund debit
                                              return `Fund deducted from ${user?.username} (${user?.role}) by ${transaction.performer.username} (${transaction.performer.role})`;
                                            }
                                          }
                                          
                                          // For "Added by" format without recipient info
                                          if (transaction.description?.includes("Added by ") && !transaction.description?.includes("added to") && transaction.performer) {
                                            return transaction.description.replace("Added by ", `Fund added to ${user?.username} (${user?.role}) by `);
                                          }
                                          
                                          // Replace generic "processed by" patterns
                                          if (transaction.description?.includes("processed by") && transaction.performer) {
                                            return transaction.description.replace(/processed by \d+/, 
                                              `processed by ${transaction.performer.username} (${transaction.performer.role})`
                                            );
                                          }
                                          
                                          // Default: return the description as is
                                          return transaction.description;
                                        })()}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          })}
                          
                          {/* Pagination controls */}
                          {totalItems > itemsPerPage && (
                            <div className="mt-6 flex flex-col items-center space-y-4">
                              <Pagination>
                                <PaginationContent>
                                  <PaginationItem>
                                    <PaginationPrevious 
                                      href="#"
                                      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                        e.preventDefault();
                                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                                      }}
                                      className={currentPage === 1 ? "cursor-not-allowed opacity-50" : ""}
                                    />
                                  </PaginationItem>
                                  
                                  {/* Page numbers */}
                                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                    let pageNum = i + 1;
                                    
                                    if (totalPages > 5) {
                                      if (currentPage <= 3) {
                                        // Show first 5 pages
                                        pageNum = i + 1;
                                      } else if (currentPage >= totalPages - 2) {
                                        // Show last 5 pages
                                        pageNum = totalPages - 4 + i;
                                      } else {
                                        // Show current page in middle
                                        pageNum = currentPage - 2 + i;
                                      }
                                    }
                                    
                                    return (
                                      <PaginationItem key={pageNum}>
                                        <PaginationLink
                                          href="#"
                                          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                            e.preventDefault();
                                            setCurrentPage(pageNum);
                                          }}
                                          isActive={currentPage === pageNum}
                                        >
                                          {pageNum}
                                        </PaginationLink>
                                      </PaginationItem>
                                    );
                                  })}
                                  
                                  <PaginationItem>
                                    <PaginationNext 
                                      href="#"
                                      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                        e.preventDefault();
                                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                                      }}
                                      className={currentPage === totalPages ? "cursor-not-allowed opacity-50" : ""}
                                    />
                                  </PaginationItem>
                                </PaginationContent>
                              </Pagination>
                              
                              {/* Items per page selector */}
                              <div className="flex items-center gap-2">
                                <Label htmlFor="items-per-page" className="text-sm text-muted-foreground">
                                  Items per page:
                                </Label>
                                <Select 
                                  value={itemsPerPage.toString()} 
                                  onValueChange={(value) => {
                                    setItemsPerPage(parseInt(value));
                                    setCurrentPage(1); // Reset to first page when changing items per page
                                  }}
                                >
                                  <SelectTrigger id="items-per-page" className="w-[80px]">
                                    <SelectValue placeholder="20" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}