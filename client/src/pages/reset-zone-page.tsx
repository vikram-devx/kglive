import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  AlertTriangle, 
  Trash2, 
  RefreshCw,
  DatabaseBackup,
  Wallet,
  AlertCircle
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserRole } from "@/lib/types";

export default function ResetZonePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [confirmationCode, setConfirmationCode] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [resetType, setResetType] = useState<"all" | "games" | "transactions" | "balance">("all");
  const [isLoading, setIsLoading] = useState(false);
  
  // Ensure this page is only accessible by admins
  if (user?.role !== UserRole.ADMIN) {
    return (
      <DashboardLayout title="Access Denied">
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
          <p className="text-slate-400 mt-2">You do not have permission to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }
  
  const handleReset = async () => {
    if (confirmationCode !== "RESET_CONFIRM") {
      toast({
        title: "Invalid confirmation code",
        description: "Please type RESET_CONFIRM to proceed with system reset",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await apiRequest(
        "POST",
        "/api/admin/reset-system",
        {
          resetType,
          confirmationCode,
        }
      );
      
      const responseData = await response.json();
      
      toast({
        title: "Reset Successful",
        description: responseData.message,
      });
      
      // Clear confirmation code after successful reset
      setConfirmationCode("");
      setConfirmDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message || "An error occurred during the reset process",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const openConfirmDialog = (type: "all" | "games" | "transactions" | "balance") => {
    setResetType(type);
    setConfirmDialogOpen(true);
  };
  
  return (
    <DashboardLayout title="Reset Zone">
      <div className="mb-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Warning: Destructive Actions</AlertTitle>
          <AlertDescription>
            This area contains system reset options that will permanently delete data. These actions cannot be undone.
            Use with extreme caution and only when necessary.
          </AlertDescription>
        </Alert>
      </div>
      
      <Tabs defaultValue="reset">
        <TabsList className="mb-6">
          <TabsTrigger value="reset">Reset Options</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reset">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-red-800 bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center text-red-500">
                  <Trash2 className="mr-2 h-5 w-5" />
                  Reset Everything
                </CardTitle>
                <CardDescription>
                  Reset all system data including games, markets, matches, transactions, and user balances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400 mb-4">
                  This will delete all game data, transaction history, and reset all user balances to zero (except admin).
                  All records will be permanently removed from the system.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="destructive" 
                  onClick={() => openConfirmDialog("all")}
                >
                  Reset All Data
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border-amber-800 bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center text-amber-500">
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Reset Games Only
                </CardTitle>
                <CardDescription>
                  Reset only game data including markets and matches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400 mb-4">
                  This will delete all game data, including Satamatka markets and team matches,
                  while preserving user accounts, balances and transaction history.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="default"
                  className="bg-amber-800 hover:bg-amber-700 text-white"
                  onClick={() => openConfirmDialog("games")}
                >
                  Reset Games
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border-blue-800 bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-500">
                  <DatabaseBackup className="mr-2 h-5 w-5" />
                  Reset Transactions
                </CardTitle>
                <CardDescription>
                  Reset all transactions and set user balances to zero
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400 mb-4">
                  This will delete all transaction history and reset all user balances to zero (except admin).
                  Game data will be preserved.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="default"
                  className="bg-blue-800 hover:bg-blue-700 text-white"
                  onClick={() => openConfirmDialog("transactions")}
                >
                  Reset Transactions
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border-purple-800 bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center text-purple-500">
                  <Wallet className="mr-2 h-5 w-5" />
                  Reset Balances
                </CardTitle>
                <CardDescription>
                  Reset all user balances to zero (except admin)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400 mb-4">
                  This will reset all user balances to zero (except admin).
                  All game data and transaction history will be preserved.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="default" 
                  className="bg-purple-800 hover:bg-purple-700 text-white"
                  onClick={() => openConfirmDialog("balance")}
                >
                  Reset Balances
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="bg-slate-900 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Confirm System Reset
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              You are about to perform a {resetType === "all" ? "complete system reset" : `${resetType} reset`}.
              This action is irreversible and will permanently delete data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4">
            <p className="text-sm text-slate-300 mb-2">Type <span className="font-bold text-red-400">RESET_CONFIRM</span> to proceed:</p>
            <Input 
              type="text"
              placeholder="RESET_CONFIRM"
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReset}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Confirm Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}