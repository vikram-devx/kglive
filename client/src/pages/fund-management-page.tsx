import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { UserRole, RequestStatus, RequestType, PaymentMode } from "@shared/schema";
import DashboardLayout from "@/components/dashboard-layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { formatDistance } from "date-fns";
import { 
  ArrowDown, 
  ArrowUp, 
  CheckCircle2, 
  Coins, 
  Download, 
  ExternalLink, 
  Filter, 
  Info, 
  Loader2, 
  MoreHorizontal, 
  Search, 
  Trash, 
  Upload, 
  User, 
  Users, 
  XCircle 
} from "lucide-react";

// Define the schema for admin's transaction
const adminTransactionSchema = z.object({
  userId: z.number(),
  amount: z.number().min(1, "Amount must be at least 1"),
  transactionType: z.enum(["deposit", "withdraw"]),
  notes: z.string().min(3, "Notes are required").max(200, "Notes should be less than 200 characters"),
});

// Define the schema for admin's wallet request review
const reviewRequestSchema = z.object({
  requestId: z.number(),
  status: z.enum([RequestStatus.APPROVED, RequestStatus.REJECTED]),
  notes: z.string().max(200, "Notes should be less than 200 characters").optional(),
});

export default function FundManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === UserRole.ADMIN;

  // Tab state
  const [activeTab, setActiveTab] = useState<string>("pending");
  
  // Filter states
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Selected request for actions
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  
  // Dialog states
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState<boolean>(false);
  const [isAdminTransactionDialogOpen, setIsAdminTransactionDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState<boolean>(false);
  
  // Review form
  const reviewForm = useForm<z.infer<typeof reviewRequestSchema>>({
    resolver: zodResolver(reviewRequestSchema),
    defaultValues: {
      requestId: 0,
      status: RequestStatus.APPROVED,
      notes: "",
    },
  });

  // Admin transaction form
  const adminTransactionForm = useForm<z.infer<typeof adminTransactionSchema>>({
    resolver: zodResolver(adminTransactionSchema),
    defaultValues: {
      userId: 0,
      amount: 0,
      transactionType: "deposit",
      notes: "",
    },
  });

  // Get users for admin transactions
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!isAdmin && isAdminTransactionDialogOpen,
  });

  // Get all wallet requests
  const { 
    data: walletRequests = [], 
    isLoading: isLoadingRequests,
    isError: isErrorRequests,
  } = useQuery({
    queryKey: ["/api/wallet/requests", activeTab],
    enabled: !!isAdmin,
  });

  // Mutation for reviewing a wallet request
  const reviewRequestMutation = useMutation({
    mutationFn: (data: z.infer<typeof reviewRequestSchema>) => {
      return apiRequest("PATCH", `/api/wallet/requests/${data.requestId}`, {
        status: data.status,
        notes: data.notes || undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: "Request updated",
        description: "The wallet request has been processed successfully.",
      });
      setIsReviewDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process the request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for admin transaction
  const adminTransactionMutation = useMutation({
    mutationFn: (data: z.infer<typeof adminTransactionSchema>) => {
      return apiRequest("POST", "/api/admin/transactions", data);
    },
    onSuccess: () => {
      toast({
        title: "Transaction completed",
        description: "The transaction has been processed successfully.",
      });
      setIsAdminTransactionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process the transaction. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a wallet request
  const deleteRequestMutation = useMutation({
    mutationFn: (requestId: number) => {
      return apiRequest("DELETE", `/api/wallet/requests/${requestId}`);
    },
    onSuccess: () => {
      toast({
        title: "Request deleted",
        description: "The wallet request has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete the request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle review submission
  const onReviewSubmit = (data: z.infer<typeof reviewRequestSchema>) => {
    reviewRequestMutation.mutate(data);
  };

  // Handle admin transaction submission
  const onAdminTransactionSubmit = (data: z.infer<typeof adminTransactionSchema>) => {
    adminTransactionMutation.mutate(data);
  };

  // Handle request deletion
  const handleDeleteRequest = () => {
    if (selectedRequest?.id) {
      deleteRequestMutation.mutate(selectedRequest.id);
    }
  };

  // Open review dialog
  const openReviewDialog = (request: any) => {
    setSelectedRequest(request);
    reviewForm.reset({
      requestId: request.id,
      status: RequestStatus.APPROVED,
      notes: "",
    });
    setIsReviewDialogOpen(true);
  };

  // Open admin transaction dialog
  const openAdminTransactionDialog = () => {
    adminTransactionForm.reset({
      userId: 0,
      amount: 0,
      transactionType: "deposit",
      notes: "",
    });
    setIsAdminTransactionDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (request: any) => {
    setSelectedRequest(request);
    setIsDeleteDialogOpen(true);
  };

  // Open view details dialog
  const openViewDetailsDialog = (request: any) => {
    setSelectedRequest(request);
    setIsViewDetailsDialogOpen(true);
  };

  // Filter wallet requests based on current tab, type filter, and search term
  const filteredRequests = walletRequests.filter((request: any) => {
    const matchesTab = activeTab === "all" || request.status.toLowerCase() === activeTab;
    
    const matchesType = typeFilter === "all" || 
      (typeFilter === "deposit" && request.requestType === RequestType.DEPOSIT) ||
      (typeFilter === "withdraw" && request.requestType === RequestType.WITHDRAWAL);
    
    const matchesSearch = searchTerm === "" || 
      (request.user && request.user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      request.userId.toString().includes(searchTerm);
    
    return matchesTab && matchesType && matchesSearch;
  });

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${formatDistance(date, new Date(), { addSuffix: true })} (${date.toLocaleDateString()})`;
  };

  // Format amount
  const formatAmount = (amount: number) => {
    // No need to divide by 100 as amounts are stored as actual rupees
    return amount.toFixed(2);
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case RequestStatus.PENDING:
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case RequestStatus.APPROVED:
        return <Badge className="bg-green-500">Approved</Badge>;
      case RequestStatus.REJECTED:
        return <Badge className="bg-red-500">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get request type badge
  const getRequestTypeBadge = (type: string) => {
    switch (type) {
      case RequestType.DEPOSIT:
        return (
          <Badge variant="outline" className="border-green-500 text-green-500">
            <ArrowUp className="h-3 w-3 mr-1" />
            Deposit
          </Badge>
        );
      case RequestType.WITHDRAWAL:
        return (
          <Badge variant="outline" className="border-red-500 text-red-500">
            <ArrowDown className="h-3 w-3 mr-1" />
            Withdraw
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get payment mode display
  const getPaymentModeDisplay = (mode: PaymentMode) => {
    switch (mode) {
      case PaymentMode.UPI:
        return "UPI";
      case PaymentMode.BANK:
        return "Bank Transfer";
      default:
        return mode;
    }
  };

  // Render wallet requests table
  const renderRequestsTable = () => {
    if (isLoadingRequests) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (isErrorRequests) {
      return (
        <div className="py-8 text-center">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-muted-foreground">Failed to load wallet requests. Please try again.</p>
        </div>
      );
    }

    if (filteredRequests.length === 0) {
      return (
        <div className="py-8 text-center">
          <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No requests found.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Mode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((request: any) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {request.user?.username || `User #${request.userId}`}
                  </div>
                </TableCell>
                <TableCell>{getRequestTypeBadge(request.requestType)}</TableCell>
                <TableCell className="font-semibold">
                  ₹{formatAmount(request.amount)}
                </TableCell>
                <TableCell>
                  {getPaymentModeDisplay(request.paymentMode)}
                </TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell>{formatDate(request.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openViewDetailsDialog(request)}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                    
                    {request.status === RequestStatus.PENDING && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openReviewDialog(request)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openDeleteDialog(request)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // If not admin, show unauthorized message
  if (!isAdmin) {
    return (
      <DashboardLayout title="Fund Management">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized Access</CardTitle>
            <CardDescription>
              You don't have permission to access this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This page is only accessible to administrators. If you believe this is an error, please contact support.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Fund Management">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Fund Management</h1>
        <p className="text-muted-foreground">
          Manage deposit and withdrawal requests from users
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Label>Filter:</Label>
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Request type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="deposit">Deposits Only</SelectItem>
              <SelectItem value="withdraw">Withdrawals Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full md:w-60"
            />
          </div>
          
          <Button onClick={openAdminTransactionDialog}>
            <Coins className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Wallet Requests</CardTitle>
          <CardDescription>
            Manage and process user deposit and withdrawal requests
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 grid grid-cols-4 md:w-auto">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All Requests</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-0">
              {renderRequestsTable()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Review Request Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Request</DialogTitle>
            <DialogDescription>
              Review and process this wallet request.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">User:</span>
                <span>{selectedRequest.user?.username || `User #${selectedRequest.userId}`}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Request Type:</span>
                <span>{getRequestTypeBadge(selectedRequest.requestType)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Amount:</span>
                <span className="font-semibold">₹{formatAmount(selectedRequest.amount)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Payment Mode:</span>
                <span>{getPaymentModeDisplay(selectedRequest.paymentMode)}</span>
              </div>
              
              <Separator />
              
              <Form {...reviewForm}>
                <form onSubmit={reviewForm.handleSubmit(onReviewSubmit)} className="space-y-4">
                  <FormField
                    control={reviewForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Decision</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select decision" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={RequestStatus.APPROVED}>Approve</SelectItem>
                            <SelectItem value={RequestStatus.REJECTED}>Reject</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={reviewForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add optional notes for this decision"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          These notes may be visible to the user.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsReviewDialogOpen(false)}
                      type="button"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={reviewRequestMutation.isPending}>
                      {reviewRequestMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Confirm Decision
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Admin Transaction Dialog */}
      <Dialog open={isAdminTransactionDialogOpen} onOpenChange={setIsAdminTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Transaction</DialogTitle>
            <DialogDescription>
              Add funds or deduct from a user's account.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...adminTransactionForm}>
            <form onSubmit={adminTransactionForm.handleSubmit(onAdminTransactionSubmit)} className="space-y-4">
              <FormField
                control={adminTransactionForm.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user: any) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={adminTransactionForm.control}
                name="transactionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="deposit">Add Funds (Deposit)</SelectItem>
                        <SelectItem value="withdraw">Deduct Funds (Withdraw)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={adminTransactionForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Enter amount"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the amount in rupees.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={adminTransactionForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add notes for this transaction"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      These notes will be recorded with the transaction.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAdminTransactionDialogOpen(false)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={adminTransactionMutation.isPending}>
                  {adminTransactionMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Create Transaction
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Request Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRequest}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteRequestMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* View Details Dialog */}
      <Dialog open={isViewDetailsDialogOpen} onOpenChange={setIsViewDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              Detailed information about this request.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="rounded-md border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">User:</span>
                  <span className="font-medium">{selectedRequest.user?.username || `User #${selectedRequest.userId}`}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Request Type:</span>
                  <span>{getRequestTypeBadge(selectedRequest.requestType)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="font-semibold">₹{formatAmount(selectedRequest.amount)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment Mode:</span>
                  <span>{getPaymentModeDisplay(selectedRequest.paymentMode)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span>{getStatusBadge(selectedRequest.status)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created:</span>
                  <span>{formatDate(selectedRequest.createdAt)}</span>
                </div>
              </div>
              
              <Separator />
              
              {selectedRequest.paymentDetails && (
                <div>
                  <h3 className="font-medium mb-2">Payment Details</h3>
                  <div className="rounded-md border p-4 space-y-3">
                    {selectedRequest.paymentMode === PaymentMode.UPI && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">UPI ID:</span>
                          <span>{selectedRequest.paymentDetails.upiId || "—"}</span>
                        </div>
                      </>
                    )}
                    
                    {selectedRequest.paymentMode === PaymentMode.BANK && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Bank Name:</span>
                          <span>{selectedRequest.paymentDetails.bankName || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Account Number:</span>
                          <span>{selectedRequest.paymentDetails.accountNumber || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">IFSC Code:</span>
                          <span>{selectedRequest.paymentDetails.ifscCode || "—"}</span>
                        </div>
                      </>
                    )}
                    

                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Transaction/UTR ID:</span>
                      <span>
                        {selectedRequest.paymentDetails.utrNumber || 
                          selectedRequest.paymentDetails.transactionId || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedRequest.proofImageUrl && (
                <div>
                  <h3 className="font-medium mb-2">Proof of Payment</h3>
                  <div className="rounded-md border p-4">
                    <a 
                      href={selectedRequest.proofImageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Proof Image
                    </a>
                  </div>
                </div>
              )}
              
              {selectedRequest.notes && (
                <div>
                  <h3 className="font-medium mb-2">Notes</h3>
                  <div className="rounded-md border p-4">
                    <p className="text-sm">{selectedRequest.notes}</p>
                  </div>
                </div>
              )}
              
              {selectedRequest.reviewedBy && (
                <div>
                  <h3 className="font-medium mb-2">Reviewed By</h3>
                  <div className="rounded-md border p-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {selectedRequest.reviewer?.username || `Admin #${selectedRequest.reviewedBy}`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button 
                  onClick={() => setIsViewDetailsDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}