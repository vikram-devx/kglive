import { useState, useEffect } from "react";
import ConfirmDialog from "@/components/confirm-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { UserRole } from "@shared/schema";
import DashboardLayout from "@/components/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";

// UI Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Icons
import {
  UserPlus,
  Ban,
  CheckCircle,
  Settings,
  Users,
  X,
  Percent,
  Save,
  Loader2,
  AlertCircle,
  Trash2,
  CreditCard,
  Unlock,
  Lock,
  ChevronLeft,
  ChevronRight,
  LogIn,
} from "lucide-react";

// Schema for creating a new subadmin
const createSubadminSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits").max(15, "Mobile number cannot exceed 15 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Commission schema for subadmin deposit
const commissionSchema = z.object({
  depositCommissionRate: z.coerce.number().min(0).max(100),
});

// Game Odds schema for subadmin
const gameOddsSchema = z.object({
  cricketToss: z.coerce.number().min(0),
  coinFlip: z.coerce.number().min(0),
  satamatkaJodi: z.coerce.number().min(0),
  satamatkaHarf: z.coerce.number().min(0),
  satamatkaOddEven: z.coerce.number().min(0),
  satamatkaCrossing: z.coerce.number().min(0),
});

// Schema for creating a new user (player)
const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits").max(15, "Mobile number cannot exceed 15 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
  rewardCommission: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type Commission = z.infer<typeof commissionSchema>;
type GameOdds = z.infer<typeof gameOddsSchema>;

export default function SubadminManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isCommissionDialogOpen, setIsCommissionDialogOpen] = useState(false);
  const [isGameOddsDialogOpen, setIsGameOddsDialogOpen] = useState(false);
  const [isViewPlayersDialogOpen, setIsViewPlayersDialogOpen] = useState(false);
  const [selectedSubadminId, setSelectedSubadminId] = useState<number | null>(null);
  const [selectedSubadminName, setSelectedSubadminName] = useState<string>("");
  const [activeTab, setActiveTab] = useState("subadmins");
  const [playersPage, setPlayersPage] = useState(1);
  const playersPerPage = 10;

  const form = useForm<z.infer<typeof createSubadminSchema>>({
    resolver: zodResolver(createSubadminSchema),
    defaultValues: {
      username: "",
      email: "",
      mobile: "",
      password: "",
    },
  });
  
  // Create user form
  const createUserForm = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      email: "",
      mobile: "",
      password: "",
      confirmPassword: "",
      rewardCommission: "0",
    },
  });

  // Fetch users that are subadmins
  const { data: subadmins = [], isLoading } = useQuery({
    queryKey: ["/api/users"],
    select: (data: any) => data.filter((user: any) => user.role === UserRole.SUBADMIN),
    enabled: !!user && user.role === UserRole.ADMIN,
  });

  // Fetch players assigned to selected subadmin for view players modal
  const { data: subadminPlayers = [], isLoading: isLoadingSubadminPlayers } = useQuery({
    queryKey: ["/api/users", "subadmin-players", selectedSubadminId],
    enabled: isViewPlayersDialogOpen && !!selectedSubadminId,
    select: (data: any) => {
      console.log("Raw API response for subadmin players modal:", data);
      console.log("Selected subadmin ID:", selectedSubadminId);
      
      if (!Array.isArray(data)) {
        console.log("Data is not an array:", typeof data);
        return [];
      }
      
      const filtered = data.filter((u: any) => {
        const isPlayer = u.role === UserRole.PLAYER;
        const isAssigned = u.assignedTo === selectedSubadminId;
        console.log(`User ${u.username}: role=${u.role}, assignedTo=${u.assignedTo}, isPlayer=${isPlayer}, isAssigned=${isAssigned}`);
        return isPlayer && isAssigned;
      });
      console.log("Filtered players for subadmin:", filtered);
      return filtered;
    },
  });



  // Create subadmin mutation
  const createSubadminMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createSubadminSchema>) => {
      // Create subadmin without commissions
      const res = await apiRequest("POST", "/api/register", {
        username: data.username,
        email: data.email,
        mobile: data.mobile,
        password: data.password,
        role: UserRole.SUBADMIN,
      });
      
      return await res.json();
    },
    onSuccess: (newSubadmin) => {
      // First, close the dialog and reset the form
      setIsCreateDialogOpen(false);
      form.reset();
      
      // Immediately update the cache with the new subadmin
      // This ensures the UI shows the new subadmin right away
      queryClient.setQueryData(["/api/users"], (oldData: any) => {
        // If there's no old data, create a new array with just this subadmin
        if (!oldData) return [newSubadmin];
        
        // Otherwise add the new subadmin to the existing data
        return [...oldData, newSubadmin];
      });
      
      // Also invalidate and refetch to ensure data is fresh
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      toast({
        title: "Subadmin created",
        description: "The subadmin account has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create subadmin",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Block subadmin mutation
  const blockSubadminMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/block`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Subadmin blocked",
        description: "The subadmin has been blocked successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to block subadmin",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unblock subadmin mutation
  const unblockSubadminMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/unblock`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Subadmin unblocked",
        description: "The subadmin has been unblocked successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to unblock subadmin",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete subadmin mutation
  const deleteSubadminMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest("DELETE", `/api/users/${userId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      // Force refetch to update the UI
      queryClient.refetchQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Subadmin Deleted",
        description: "Subadmin has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Deleting Subadmin",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete confirmation state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [subadminToDelete, setSubadminToDelete] = useState<number | null>(null);

  // Handle delete subadmin
  const handleDeleteSubadmin = (userId: number) => {
    setSubadminToDelete(userId);
    setIsDeleteConfirmOpen(true);
  };
  
  // Confirm delete subadmin
  const confirmDeleteSubadmin = () => {
    if (subadminToDelete) {
      deleteSubadminMutation.mutate(subadminToDelete);
      setSubadminToDelete(null);
    }
  };

  const onSubmit = (data: z.infer<typeof createSubadminSchema>) => {
    createSubadminMutation.mutate(data);
  };

  const handleBlockSubadmin = (userId: number) => {
    blockSubadminMutation.mutate(userId);
  };

  const handleUnblockSubadmin = (userId: number) => {
    unblockSubadminMutation.mutate(userId);
  };
  
  // Login as subadmin mutation
  const loginAsSubadminMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/admin/login-as/${userId}`, {});
      return await res.json();
    },
    onSuccess: (userData) => {
      toast({
        title: "Logged in as subadmin",
        description: `You are now logged in as ${userData.username}`,
      });
      
      // Update the current user in the cache
      queryClient.setQueryData(["/api/user"], userData);
      
      // Redirect to dashboard
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle login as subadmin
  const handleLoginAsSubadmin = (userId: number) => {
    loginAsSubadminMutation.mutate(userId);
  };

  const openViewPlayersDialog = (subadmin: any) => {
    setSelectedSubadminId(subadmin.id);
    setSelectedSubadminName(subadmin.username);
    setPlayersPage(1); // Reset to first page
    setIsViewPlayersDialogOpen(true);
  };
  
  // Fetch users that are players assigned to this subadmin
  const { data: assignedUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      console.log("API Users response:", response);
      return response;
    },
    enabled: !!user?.id && user?.role === UserRole.SUBADMIN,
    select: (data: any) => {
      console.log("Filtering users for subadmin:", user?.id);
      const filtered = data.filter((u: any) => {
        console.log("User:", u.username, "role:", u.role, "assignedTo:", u.assignedTo);
        return u.role === UserRole.PLAYER && u.assignedTo === user?.id;
      });
      console.log("Filtered users:", filtered);
      return filtered;
    },
  });
  

  
  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: Omit<z.infer<typeof createUserSchema>, "confirmPassword">) => {
      // Convert reward commission from percentage to basis points (e.g., 5% = 500)
      const rewardCommission = data.rewardCommission 
        ? Math.round(parseFloat(data.rewardCommission) * 100)
        : 0;
      
      return apiRequest("POST", "/api/register", {
        username: data.username,
        email: data.email,
        mobile: data.mobile,
        password: data.password,
        role: UserRole.PLAYER,
        assignedTo: user?.id, // Ensure created players are assigned to the current subadmin
        rewardCommission
      });
    },
    onSuccess: () => {
      toast({
        title: "User Created",
        description: "New user has been created and assigned to you successfully",
      });
      setIsCreateUserDialogOpen(false);
      createUserForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating User",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle create user form submission
  const handleCreateUser = (data: z.infer<typeof createUserSchema>) => {
    const { confirmPassword, ...userData } = data;
    createUserMutation.mutate(userData);
  };
  
  // Commission form setup
  const commissionForm = useForm<Commission>({
    resolver: zodResolver(commissionSchema),
    defaultValues: {
      depositCommissionRate: 0,
    }
  });
  
  // Get deposit commission settings for a selected subadmin
  const { data: depositCommission, isLoading: isLoadingCommissions, refetch: refetchCommissions } = useQuery({
    queryKey: [`/api/admin/deposit-commissions/${selectedSubadminId}`],
    enabled: !!selectedSubadminId && isCommissionDialogOpen,
    select: (data: any) => {
      // Convert commission rate from database format to percentage format for display
      if (data && typeof data.commissionRate === 'number') {
        return {
          ...data,
          // Using consistent 10000-based system: 1000 = 10%, 2000 = 20%
          // Divide by 100 to get percentage for display
          commissionRate: data.commissionRate / 100  // Convert: 2000 → 20 (for 20%), 1000 → 10 (for 10%)
        };
      }
      return data;
    }
  });
  
  // Update deposit commission mutation
  const updateCommissionMutation = useMutation({
    mutationFn: async (values: Commission) => {
      if (!selectedSubadminId) {
        throw new Error('No subadmin selected');
      }
      
      return apiRequest("POST", `/api/admin/deposit-commissions/${selectedSubadminId}`, {
        commissionRate: Math.round(values.depositCommissionRate * 100)  // Convert: 20% → 2000 for database
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/deposit-commissions/${selectedSubadminId}`] });
      toast({
        title: "Deposit commission updated",
        description: `Commission rate for ${selectedSubadminName} has been updated successfully.`,
        duration: 3000,
      });
      setIsCommissionDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update deposit commission",
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
  
  // Set form values when deposit commission data is loaded
  useEffect(() => {
    if (isCommissionDialogOpen) {
      if (depositCommission) {
        const formValues = {
          depositCommissionRate: depositCommission.commissionRate, // Already converted in the query
        };
        commissionForm.reset(formValues);
      } else {
        // Reset to 0 when opening dialog without commission data
        commissionForm.reset({
          depositCommissionRate: 0,
        });
      }
    }
  }, [depositCommission, commissionForm, isCommissionDialogOpen]);
  
  // Open commission dialog for a specific subadmin
  const openCommissionDialog = (subadmin: any) => {
    setSelectedSubadminId(subadmin.id);
    setSelectedSubadminName(subadmin.username);
    setIsCommissionDialogOpen(true);
    refetchCommissions();
  };
  
  // Game Odds form setup
  const gameOddsForm = useForm<GameOdds>({
    resolver: zodResolver(gameOddsSchema),
    defaultValues: {
      cricketToss: 0,
      coinFlip: 0,
      satamatkaJodi: 0,
      satamatkaHarf: 0,
      satamatkaOddEven: 0,
      satamatkaCrossing: 0,
    }
  });
  
  // Get game odds settings for a selected subadmin
  const { data: gameOdds, isLoading: isLoadingGameOdds, refetch: refetchGameOdds } = useQuery({
    queryKey: [`/api/game-odds/subadmin/${selectedSubadminId}`],
    enabled: !!selectedSubadminId && isGameOddsDialogOpen
  });
  
  // Update game odds mutation
  const updateGameOddsMutation = useMutation({
    mutationFn: async (values: GameOdds) => {
      if (!selectedSubadminId) {
        throw new Error('No subadmin selected');
      }
      
      return apiRequest("POST", `/api/game-odds/subadmin/${selectedSubadminId}`, {
        odds: [
          { gameType: 'cricket_toss', oddValue: Math.round(values.cricketToss * 10000) },
          { gameType: 'coin_flip', oddValue: Math.round(values.coinFlip * 10000) },
          { gameType: 'satamatka_jodi', oddValue: Math.round(values.satamatkaJodi * 10000) },
          { gameType: 'satamatka_harf', oddValue: Math.round(values.satamatkaHarf * 10000) },
          { gameType: 'satamatka_odd_even', oddValue: Math.round(values.satamatkaOddEven * 10000) },
          { gameType: 'satamatka_crossing', oddValue: Math.round(values.satamatkaCrossing * 10000) },
        ]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/game-odds/subadmin/${selectedSubadminId}`] });
      toast({
        title: "Game Odds updated",
        description: `Game odds for ${selectedSubadminName} have been updated successfully.`,
        duration: 3000,
      });
      setIsGameOddsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update game odds",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
    }
  });
  
  // Handle game odds form submission
  const onSubmitGameOdds = (values: GameOdds) => {
    updateGameOddsMutation.mutate(values);
  };
  
  // Set form values when game odds data is loaded
  useEffect(() => {
    if (gameOdds && Array.isArray(gameOdds) && gameOdds.length > 0) {
      const formValues: any = {
        cricketToss: 0,
        coinFlip: 0,
        satamatkaJodi: 0,
        satamatkaHarf: 0,
        satamatkaOddEven: 0,
        satamatkaCrossing: 0,
      };

      console.log("Game odds loaded from server:", gameOdds);
      
      gameOdds.forEach((odd: any) => {
        if (odd.gameType === 'cricket_toss') {
          formValues.cricketToss = parseFloat(odd.oddValue);
        } else if (odd.gameType === 'coin_flip') {
          formValues.coinFlip = parseFloat(odd.oddValue);
        } else if (odd.gameType === 'satamatka_jodi') {
          formValues.satamatkaJodi = parseFloat(odd.oddValue);
        } else if (odd.gameType === 'satamatka_harf') {
          formValues.satamatkaHarf = parseFloat(odd.oddValue);
        } else if (odd.gameType === 'satamatka_odd_even') {
          formValues.satamatkaOddEven = parseFloat(odd.oddValue);
        } else if (odd.gameType === 'satamatka_crossing') {
          formValues.satamatkaCrossing = parseFloat(odd.oddValue);
        }
      });

      gameOddsForm.reset(formValues);
    }
  }, [gameOdds, gameOddsForm]);
  
  // Open game odds dialog for a specific subadmin
  const openGameOddsDialog = (subadmin: any) => {
    setSelectedSubadminId(subadmin.id);
    setSelectedSubadminName(subadmin.username);
    
    // Reset form to default values first
    gameOddsForm.reset({
      cricketToss: 0,
      coinFlip: 0,
      satamatkaJodi: 0,
      satamatkaHarf: 0,
      satamatkaOddEven: 0,
      satamatkaCrossing: 0,
    });
    
    // Then open dialog and fetch current values
    setIsGameOddsDialogOpen(true);
    
    // Use a timeout to ensure state updates before refetching
    setTimeout(() => {
      refetchGameOdds();
    }, 100);
  };
  

  

    


  return (
    <DashboardLayout title="Management">
      {user?.role === UserRole.ADMIN && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Subadmin Management</CardTitle>
                <CardDescription>
                  Create and manage subadmin accounts
                </CardDescription>
              </div>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-primary to-blue-500"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create Subadmin
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subadmins.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4">
                          No subadmins found
                        </TableCell>
                      </TableRow>
                    ) : (
                      subadmins.map((subadmin: any) => (
                        <TableRow key={subadmin.id}>
                          <TableCell className="font-medium">
                            {subadmin.username}
                          </TableCell>
                          <TableCell>
                            {subadmin.isBlocked ? (
                              <Badge variant="destructive">Blocked</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openCommissionDialog(subadmin)}
                                className="text-blue-500 border-blue-500/20 hover:bg-blue-500/10"
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                Commission
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openGameOddsDialog(subadmin)}
                                className="text-orange-500 border-orange-500/20 hover:bg-orange-500/10"
                              >
                                <Percent className="h-4 w-4 mr-2" />
                                Game Odds
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openViewPlayersDialog(subadmin)}
                                className="text-purple-500 border-purple-500/20 hover:bg-purple-500/10"
                              >
                                <Users className="h-4 w-4 mr-2" />
                                View Players
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLoginAsSubadmin(subadmin.id)}
                                className="text-blue-600 border-blue-600/20 hover:bg-blue-600/10"
                              >
                                <LogIn className="h-4 w-4 mr-2" />
                                Login as
                              </Button>
                              
                              {subadmin.isBlocked ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnblockSubadmin(subadmin.id)}
                                  className="text-green-500 border-green-500/20 hover:bg-green-500/10"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Unblock
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleBlockSubadmin(subadmin.id)}
                                  className="text-red-500 border-red-500/20 hover:bg-red-500/10"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Block
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* User Management for Subadmins */}
      {user?.role === UserRole.SUBADMIN && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Add and manage your players
                </CardDescription>
              </div>
              <Button
                onClick={() => setIsCreateUserDialogOpen(true)}
                className="bg-gradient-to-r from-primary to-blue-500"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          No users assigned to you. Add a user using the "Add User" button.
                        </TableCell>
                      </TableRow>
                    ) : (
                      assignedUsers.map((player: any) => (
                        <TableRow key={player.id}>
                          <TableCell className="font-medium">
                            {player.username}
                          </TableCell>
                          <TableCell>
                            ₹{player.balance?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell>
                            {player.isBlocked ? (
                              <Badge variant="destructive">Blocked</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const url = `/subadmin-commission-management?userId=${player.id}`;
                                  // Use history.push for better SPA navigation without full page reload
                                  window.history.pushState({}, '', url);
                                  window.dispatchEvent(new PopStateEvent('popstate'));
                                }}
                                className="text-blue-500 border-blue-500/20 hover:bg-blue-500/10"
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                Discount
                              </Button>
                              
                              {player.isBlocked ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnblockSubadmin(player.id)}
                                  className="text-green-500 border-green-500/20 hover:bg-green-500/10"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Unblock
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleBlockSubadmin(player.id)}
                                  className="text-red-500 border-red-500/20 hover:bg-red-500/10"
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Block
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteSubadmin}
        title="Delete Subadmin"
        description="Are you sure you want to delete this subadmin? This will also remove all associated players and data. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
      
      {/* Create Subadmin Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Subadmin</DialogTitle>
            <DialogDescription>
              Create a new subadmin account with management permissions
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter mobile number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              

              
              <DialogFooter className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-blue-500"
                  disabled={createSubadminMutation.isPending}
                >
                  {createSubadminMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Subadmin...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Subadmin
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Create User Dialog (for subadmins) */}
      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>
              Create a new player account that will be assigned to you
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createUserForm}>
            <form onSubmit={createUserForm.handleSubmit(handleCreateUser)} className="space-y-4 py-2">
              <FormField
                control={createUserForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createUserForm.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter mobile number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createUserForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createUserForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createUserForm.control}
                name="rewardCommission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward Commission (%)</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          placeholder="e.g., 5.00" 
                          step="0.01"
                          min="0"
                          max="100"
                          {...field} 
                          data-testid="input-create-user-reward-commission"
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-blue-500"
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating User...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create User
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Deposit Commission Settings Dialog */}
      <Dialog open={isCommissionDialogOpen} onOpenChange={setIsCommissionDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-secondary">
          <DialogHeader>
            <DialogTitle>Deposit Commission Settings</DialogTitle>
            <DialogDescription>
              Configure deposit commission rate for {selectedSubadminName}
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingCommissions ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Alert className="my-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important information</AlertTitle>
                <AlertDescription>
                  <p className="text-sm">
                    This commission rate determines the percentage applied during fund transfers between
                    admin and subadmin. You can set any value from 0% to 100%:
                  </p>
                  <ul className="text-sm list-disc list-inside mt-2 space-y-1">
                    <li>When admin adds funds to subadmin: Full amount goes to subadmin but only commission percentage is deducted from admin.</li>
                    <li>When admin removes funds from subadmin: Full amount is removed from subadmin but only commission percentage is added to admin.</li>
                    <li>If no custom value is set here, the platform default commission rate will apply.</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <Form {...commissionForm}>
                <form onSubmit={commissionForm.handleSubmit(onSubmitCommission)} className="space-y-4 py-2">
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={commissionForm.control}
                      name="depositCommissionRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deposit Commission Rate</FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input type="number" min="0" max="100" step="0.1" {...field} />
                            </FormControl>
                            <span>%</span>
                          </div>
                          <FormDescription className="text-xs">
                            Set the commission rate between 0% and 100%.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-primary to-blue-500"
                      disabled={updateCommissionMutation.isPending}
                    >
                      {updateCommissionMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving changes...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Commission Settings
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Game Odds Dialog */}
      <Dialog open={isGameOddsDialogOpen} onOpenChange={setIsGameOddsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-secondary">
          <DialogHeader>
            <DialogTitle>Game Odds Settings</DialogTitle>
            <DialogDescription>
              Configure game odds for {selectedSubadminName}
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingGameOdds ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Alert className="my-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important information</AlertTitle>
                <AlertDescription>
                  Game odds determine the payout multiplier for each game type. Higher odds mean larger potential payouts to players.
                  These settings override platform defaults for this subadmin.
                </AlertDescription>
              </Alert>
              
              <Form {...gameOddsForm}>
                <form onSubmit={gameOddsForm.handleSubmit(onSubmitGameOdds)} className="space-y-4 py-2">
                  {/* Sports Games */}
                  <div className="space-y-3 col-span-2">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Sports Game Odds
                    </h3>
                    <Separator />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <FormField
                      control={gameOddsForm.control}
                      name="cricketToss"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cricket Toss Odds</FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input type="number" min="0" step="0.01" {...field} />
                            </FormControl>
                            <span>x</span>
                          </div>
                          <FormDescription className="text-xs">
                            Multiplier for cricket toss bets
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Royal Toss */}
                  <div className="space-y-3 col-span-2 mt-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Royal Toss Odds
                    </h3>
                    <Separator />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={gameOddsForm.control}
                      name="coinFlip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Royal Toss Odds</FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input type="number" min="0" step="0.01" {...field} />
                            </FormControl>
                            <span>x</span>
                          </div>
                          <FormDescription className="text-xs">
                            Multiplier for royal toss (coin flip) bets
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Satamatka Game Odds */}
                  <div className="space-y-3 col-span-2 mt-4">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Satamatka Game Odds
                    </h3>
                    <Separator />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={gameOddsForm.control}
                      name="satamatkaJodi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jodi Odds</FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input type="number" min="0" step="0.01" {...field} />
                            </FormControl>
                            <span>x</span>
                          </div>
                          <FormDescription className="text-xs">
                            Multiplier for Jodi (00-99) bets
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={gameOddsForm.control}
                      name="satamatkaHarf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Harf Odds</FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input type="number" min="0" step="0.01" {...field} />
                            </FormControl>
                            <span>x</span>
                          </div>
                          <FormDescription className="text-xs">
                            Multiplier for Harf bets
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={gameOddsForm.control}
                      name="satamatkaOddEven"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Odd-Even Odds</FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input type="number" min="0" step="0.01" {...field} />
                            </FormControl>
                            <span>x</span>
                          </div>
                          <FormDescription className="text-xs">
                            Multiplier for Odd-Even bets
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={gameOddsForm.control}
                      name="satamatkaCrossing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Crossing Odds</FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input type="number" min="0" step="0.01" {...field} />
                            </FormControl>
                            <span>x</span>
                          </div>
                          <FormDescription className="text-xs">
                            Multiplier for Crossing bets
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500"
                      disabled={updateGameOddsMutation.isPending}
                    >
                      {updateGameOddsMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating Game Odds...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Game Odds
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* View Players Modal */}
      <Dialog open={isViewPlayersDialogOpen} onOpenChange={setIsViewPlayersDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Players under {selectedSubadminName}</DialogTitle>
            <DialogDescription>
              View all players assigned to this subadmin with their betting details
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
            {isLoadingSubadminPlayers ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {subadminPlayers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No players assigned to this subadmin</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Username</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subadminPlayers
                          .slice((playersPage - 1) * playersPerPage, playersPage * playersPerPage)
                          .map((player: any) => (
                            <TableRow key={player.id}>
                              <TableCell className="font-medium">
                                {player.username}
                              </TableCell>
                              <TableCell>
                                ₹{(player.balance / 100)?.toFixed(2) || '0.00'}
                              </TableCell>
                              <TableCell>
                                {player.isBlocked ? (
                                  <Badge variant="destructive">Blocked</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                    Active
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination */}
                  {subadminPlayers.length > playersPerPage && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Showing {((playersPage - 1) * playersPerPage) + 1} to{' '}
                        {Math.min(playersPage * playersPerPage, subadminPlayers.length)} of{' '}
                        {subadminPlayers.length} players
                      </p>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPlayersPage(prev => Math.max(prev - 1, 1))}
                          disabled={playersPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <span className="text-sm">
                          Page {playersPage} of {Math.ceil(subadminPlayers.length / playersPerPage)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPlayersPage(prev => Math.min(prev + 1, Math.ceil(subadminPlayers.length / playersPerPage)))}
                          disabled={playersPage >= Math.ceil(subadminPlayers.length / playersPerPage)}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}