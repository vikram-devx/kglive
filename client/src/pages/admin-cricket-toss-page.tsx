import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/dashboard-layout";
import {
  Check,
  X,
  MoreVertical,
  Calendar,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Filter,
} from "lucide-react";
import { format } from "date-fns";

// Define the schema for creating a cricket toss match
const createCricketTossSchema = z.object({
  teamA: z.string().min(1, "Team A is required"),
  teamB: z.string().min(1, "Team B is required"),
  description: z.string().optional(),
  matchDate: z.string().min(1, "Match date is required"),
  matchTime: z.string().min(1, "Match time is required"),
  coverImage: z.instanceof(File).optional(),
  // We'll use fixed odds: 2.00 for both teams
});

// Define the schema for editing a cricket toss match
const editCricketTossSchema = z.object({
  teamA: z.string().min(1, "Team A is required"),
  teamB: z.string().min(1, "Team B is required"),
  description: z.string().optional(),
  matchDate: z.string().min(1, "Match date is required"),
  matchTime: z.string().min(1, "Match time is required"),
  coverImage: z.instanceof(File).optional(),
});

// Type for a cricket toss match
interface CricketTossMatch {
  id: number;
  teamA: string;
  teamB: string;
  description?: string;
  matchTime: string;
  teamAImage?: string;
  teamBImage?: string;
  coverImage?: string;
  oddTeamA: number;
  oddTeamB: number;
  result: string;
  status: string;
  createdAt: string;
}

// Types for the betting data
interface BetData {
  id: number;
  userId: number;
  username: string;
  betAmount: number;
  prediction: string;
  potential: number;
  result: string | null;
  payout: number;
}

export default function AdminCricketTossPage() {
  const [selectedMatch, setSelectedMatch] = useState<CricketTossMatch | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [declareOpen, setDeclareOpen] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [matchToClose, setMatchToClose] = useState<number | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMatch, setEditingMatch] = useState<CricketTossMatch | null>(
    null,
  );
  const [editOpen, setEditOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Today's date formatted for display
  const dateString = format(new Date(), "EEEE, MMMM d, yyyy");

  // Form setup for creating a new cricket toss match
  const form = useForm<z.infer<typeof createCricketTossSchema>>({
    resolver: zodResolver(createCricketTossSchema),
    defaultValues: {
      teamA: "",
      teamB: "",
      description: "",
      matchDate: new Date().toISOString().split("T")[0],
      matchTime: "12:00",
    },
  });

  // Form setup for editing a cricket toss match
  const editForm = useForm<z.infer<typeof editCricketTossSchema>>({
    resolver: zodResolver(editCricketTossSchema),
    defaultValues: {
      teamA: "",
      teamB: "",
      description: "",
      matchDate: new Date().toISOString().split("T")[0],
      matchTime: "12:00",
    },
  });

  // Query to fetch cricket toss matches
  const { data: cricketTossMatches = [], isLoading } = useQuery<
    CricketTossMatch[]
  >({
    queryKey: ["/api/cricket-toss/matches"],
    staleTime: 10000,
  });

  // Query to fetch cricket match betting stats
  const { data: cricketMatchStats = [], isLoading: isLoadingStats } = useQuery<
    any[]
  >({
    queryKey: ["/api/cricket-toss/match-stats"],
    staleTime: 5000,
  });

  // Filter matches based on status and search query
  const openMatches = cricketTossMatches.filter(
    (match) => match.status === "open",
  );
  const closedMatches = cricketTossMatches.filter(
    (match) => match.status === "closed",
  );
  const resultedMatches = cricketTossMatches.filter(
    (match) => match.status === "resulted",
  );

  // Filter based on active tab and search query
  const getFilteredMatches = () => {
    let matches = cricketTossMatches;

    // Filter by status based on active tab
    if (activeTab === "open") {
      matches = openMatches;
    } else if (activeTab === "closed") {
      matches = closedMatches;
    } else if (activeTab === "resulted") {
      matches = resultedMatches;
    }

    // Apply search filter if query exists
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      matches = matches.filter(
        (match) =>
          match.teamA.toLowerCase().includes(query) ||
          match.teamB.toLowerCase().includes(query) ||
          (match.description &&
            match.description.toLowerCase().includes(query)),
      );
    }

    return matches;
  };

  const filteredMatches = getFilteredMatches();

  // Helper function to get match stats
  const getMatchStats = (matchId: number) => {
    if (!Array.isArray(cricketMatchStats)) {
      return {
        teamA: { totalBets: 0, potentialWin: 0 },
        teamB: { totalBets: 0, potentialWin: 0 },
      };
    }
    return (
      cricketMatchStats.find((stat: any) => stat.matchId === matchId) || {
        teamA: { totalBets: 0, potentialWin: 0 },
        teamB: { totalBets: 0, potentialWin: 0 },
      }
    );
  };

  // Mutation to create a new cricket toss match
  const createCricketTossMutation = useMutation({
    mutationFn: async (values: z.infer<typeof createCricketTossSchema>) => {
      // Create form data to handle file uploads
      const formData = new FormData();
      formData.append("teamA", values.teamA);
      formData.append("teamB", values.teamB);

      // Combine date and time keeping local timezone like satamatka markets
      const combinedDateTime = `${values.matchDate}T${values.matchTime}:00`;
      formData.append("matchTime", combinedDateTime);

      if (values.description)
        formData.append("description", values.description);

      // Use fixed odds: 2.00 for both teams
      formData.append("oddTeamA", "200");
      formData.append("oddTeamB", "200");

      // Append cover image if provided
      if (values.coverImage) formData.append("coverImage", values.coverImage);

      // Use fetch directly for FormData
      const response = await fetch("/api/cricket-toss/matches", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to create cricket toss match",
        );
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cricket Toss Match Created",
        description: "The cricket toss match has been created successfully.",
      });
      form.reset();
      setOpen(false);
      setCoverImagePreview(null);
      queryClient.invalidateQueries({
        queryKey: ["/api/cricket-toss/matches"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create cricket toss match",
        variant: "destructive",
      });
    },
  });

  // Mutation to edit a cricket toss match
  const editCricketTossMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: number;
      values: z.infer<typeof editCricketTossSchema>;
    }) => {
      // Create form data to handle file uploads
      const formData = new FormData();
      formData.append("teamA", values.teamA);
      formData.append("teamB", values.teamB);

      // Combine date and time keeping local timezone like satamatka markets
      const combinedDateTime = `${values.matchDate}T${values.matchTime}:00`;
      formData.append("matchTime", combinedDateTime);

      if (values.description)
        formData.append("description", values.description);

      // Append cover image if provided
      if (values.coverImage) formData.append("coverImage", values.coverImage);

      // Use fetch directly for FormData
      const response = await fetch(`/api/cricket-toss/matches/${id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update cricket toss match",
        );
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cricket Toss Match Updated",
        description: "The cricket toss match has been updated successfully.",
      });
      editForm.reset();
      setEditOpen(false);
      setEditingMatch(null);
      setCoverImagePreview(null);
      queryClient.invalidateQueries({
        queryKey: ["/api/cricket-toss/matches"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update cricket toss match",
        variant: "destructive",
      });
    },
  });

  // Mutation to close betting for a match
  const closeBettingMutation = useMutation({
    mutationFn: async (matchId: number) => {
      // Use fetch directly to make sure we have more control over the request
      const response = await fetch(
        `/api/cricket-toss/matches/${matchId}/close`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to close betting" }));
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Betting Closed",
        description: "Betting has been closed for this match.",
      });
      setConfirmCloseOpen(false);
      setMatchToClose(null);
      queryClient.invalidateQueries({
        queryKey: ["/api/cricket-toss/matches"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to close betting",
        variant: "destructive",
      });
    },
  });

  // Mutation to declare result for a match
  const declareResultMutation = useMutation({
    mutationFn: async ({
      matchId,
      result,
    }: {
      matchId: number;
      result: string;
    }) => {
      // Using direct fetch like we did for closeBetting to have more control
      const response = await fetch(
        `/api/cricket-toss/matches/${matchId}/result`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ result }),
        },
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to declare result" }));
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Result Declared",
        description: "The result has been declared and payouts processed.",
      });
      setDeclareOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["/api/cricket-toss/matches"],
      });
      if (selectedMatch) {
        queryClient.invalidateQueries({
          queryKey: ["/api/cricket-toss/bets", selectedMatch.id],
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to declare result",
        variant: "destructive",
      });
    },
  });

  // Handle form submission for creating a new cricket toss match
  const onSubmit = (values: z.infer<typeof createCricketTossSchema>) => {
    createCricketTossMutation.mutate(values);
  };

  // Handle form submission for editing a cricket toss match
  const onEditSubmit = (values: z.infer<typeof editCricketTossSchema>) => {
    if (editingMatch) {
      editCricketTossMutation.mutate({ id: editingMatch.id, values });
    }
  };

  // Handle edit action
  const handleEditMatch = (match: CricketTossMatch) => {
    setEditingMatch(match);

    // Parse the match time to get date and time parts
    const matchDate = new Date(match.matchTime);
    const dateStr = matchDate.toISOString().split("T")[0];
    const timeStr = `${matchDate.getHours().toString().padStart(2, "0")}:${matchDate.getMinutes().toString().padStart(2, "0")}`;

    // Populate the edit form with existing data
    editForm.reset({
      teamA: match.teamA,
      teamB: match.teamB,
      description: match.description || "",
      matchDate: dateStr,
      matchTime: timeStr,
    });

    setEditOpen(true);
  };

  // Function to handle opening the close betting confirmation dialog
  const handleCloseBetting = (matchId: number) => {
    setMatchToClose(matchId);
    setConfirmCloseOpen(true);
  };

  // Function to confirm and execute the close betting action
  const confirmCloseBetting = () => {
    if (matchToClose) {
      closeBettingMutation.mutate(matchToClose);
      // We'll set these in the onSuccess handler to avoid UI race conditions
    }
  };

  // Function to handle declaring result for a match
  const handleDeclareResult = (result: string) => {
    if (!selectedMatch) return;

    declareResultMutation.mutate({
      matchId: selectedMatch.id,
      result,
    });
  };

  // Function to format odds for display (converts from integer to decimal representation)
  const formatOdds = (odds: number) => {
    return (odds / 100).toFixed(2);
  };

  // Function to get the status badge for a match
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-500">Open</Badge>;
      case "closed":
        return <Badge className="bg-yellow-500">Closed</Badge>;
      case "resulted":
        return <Badge className="bg-blue-500">Resulted</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Format the team name based on the prediction value
  const formatPrediction = (prediction: string, match: CricketTossMatch) => {
    if (prediction === "team_a") return match.teamA;
    if (prediction === "team_b") return match.teamB;
    return prediction;
  };

  return (
    <DashboardLayout title="Cricket Toss Management">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-5 w-5 mr-2" />
            <span>{dateString}</span>
          </div>

          <Button
            onClick={() => setOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Match
          </Button>
        </div>
        <p className="text-muted-foreground">
          Manage cricket toss matches, declare results, and create new matches
        </p>
      </div>

      {/* Search and filter bar */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="relative flex items-center flex-1 min-w-[200px]">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search matches..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tab navigation */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center justify-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>All ({cricketTossMatches.length})</span>
          </TabsTrigger>
          <TabsTrigger
            value="open"
            className="flex items-center justify-center"
          >
            <Clock className="h-4 w-4 mr-2" />
            <span>Open ({openMatches.length})</span>
          </TabsTrigger>
          <TabsTrigger
            value="closed"
            className="flex items-center justify-center"
          >
            <X className="h-4 w-4 mr-2" />
            <span>Closed ({closedMatches.length})</span>
          </TabsTrigger>
          <TabsTrigger
            value="resulted"
            className="flex items-center justify-center"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            <span>Resulted ({resultedMatches.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* All tabs content */}
        <TabsContent value={activeTab} className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center p-8">
              Loading cricket toss matches...
            </div>
          ) : filteredMatches.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Match</TableHead>
                  <TableHead>Match Time</TableHead>
                  <TableHead>Team A Bets</TableHead>
                  <TableHead>Team B Bets</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatches.map((match: CricketTossMatch) => {
                  const matchStats = getMatchStats(match.id);
                  return (
                    <TableRow key={match.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">
                              {match.teamA} vs {match.teamB}
                            </span>
                          </div>
                          {match.description && (
                            <div className="text-xs text-gray-500 mt-1">
                              {match.description}
                            </div>
                          )}
                          {match.coverImage && (
                            <div className="w-full mt-2">
                              <img
                                src={match.coverImage}
                                alt={`${match.teamA} vs ${match.teamB}`}
                                className="w-full h-12 object-cover rounded-md"
                              />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const timeString = match.matchTime
                            .replace("T", " ")
                            .replace(".000Z", "")
                            .replace("Z", "");
                          const localDate = new Date(timeString);
                          return localDate.toLocaleString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          });
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <div className="text-sm font-medium">
                            {match.teamA}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {matchStats.teamA.totalBets} bets • ₹
                            {(matchStats.teamA.potentialWin / 100)?.toFixed(
                              2,
                            ) || "0.00"}{" "}
                            potential
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <div className="text-sm font-medium">
                            {match.teamB}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {matchStats.teamB.totalBets} bets • ₹
                            {(matchStats.teamB.potentialWin / 100)?.toFixed(
                              2,
                            ) || "0.00"}{" "}
                            potential
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {match.result === "pending" ? (
                          "Pending"
                        ) : match.result === "team_a" ? (
                          <span className="font-medium text-green-600">
                            {match.teamA}
                          </span>
                        ) : match.result === "team_b" ? (
                          <span className="font-medium text-green-600">
                            {match.teamB}
                          </span>
                        ) : (
                          match.result
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(match.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>

                            <DropdownMenuSeparator />

                            {/* Edit option - only available for non-resulted matches */}
                            {match.status !== "resulted" && (
                              <DropdownMenuItem
                                onClick={() => handleEditMatch(match)}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                Edit Match
                              </DropdownMenuItem>
                            )}

                            {match.status === "open" && (
                              <DropdownMenuItem
                                onClick={() => handleCloseBetting(match.id)}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Close Betting
                              </DropdownMenuItem>
                            )}

                            {match.status === "closed" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedMatch(match);
                                  setDeclareOpen(true);
                                }}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Declare Result
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">
                No cricket toss matches found for this filter.
              </p>
              <p className="text-sm text-gray-400">
                Try another filter or create a new match.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog for creating new match */}
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setCoverImagePreview(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Cricket Toss Match</DialogTitle>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary scrollbar-track-transparent">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* Two column layout for team names */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="teamA"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team A</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter team A name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="teamB"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team B</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter team B name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter match description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Two column layout for date and time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="matchDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Match Date</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            min={new Date().toISOString().split("T")[0]}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="matchTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Match Time</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="">Select time</option>
                            {Array.from({ length: 24 })
                              .map((_, hour) =>
                                Array.from({ length: 4 }).map((_, minute) => {
                                  const h = hour;
                                  const m = minute * 15;
                                  const timeValue = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
                                  const displayHour =
                                    h % 12 === 0 ? 12 : h % 12;
                                  const ampm = h < 12 ? "AM" : "PM";
                                  const displayTime = `${displayHour}:${m.toString().padStart(2, "0")} ${ampm}`;
                                  return (
                                    <option key={timeValue} value={timeValue}>
                                      {displayTime}
                                    </option>
                                  );
                                }),
                              )
                              .flat()}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="coverImage"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Cover Banner Image (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onChange(file);
                              // Create a preview URL for the selected image
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                setCoverImagePreview(
                                  e.target?.result as string,
                                );
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </FormControl>
                      {coverImagePreview && (
                        <div className="mt-2">
                          <img
                            src={coverImagePreview}
                            alt="Cover Image Preview"
                            className="w-full h-32 object-cover rounded-md border border-gray-200"
                          />
                        </div>
                      )}
                      <FormDescription>
                        Upload a banner image for this match
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCricketTossMutation.isPending}
                  >
                    {createCricketTossMutation.isPending
                      ? "Creating..."
                      : "Create Match"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for editing a cricket toss match */}
      <Dialog open={editOpen && !!editingMatch} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Cricket Toss Match</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent py-4">
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(onEditSubmit)}
                className="space-y-6"
              >
                {/* Team Names */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="teamA"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team A</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter team A name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="teamB"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team B</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter team B name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter match description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Two column layout for date and time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="matchDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Match Date</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            min={new Date().toISOString().split("T")[0]}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="matchTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Match Time</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="">Select time</option>
                            {Array.from({ length: 24 })
                              .map((_, hour) =>
                                Array.from({ length: 4 }).map((_, minute) => {
                                  const h = hour;
                                  const m = minute * 15;
                                  const timeValue = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
                                  const displayHour =
                                    h % 12 === 0 ? 12 : h % 12;
                                  const ampm = h < 12 ? "AM" : "PM";
                                  const displayTime = `${displayHour}:${m.toString().padStart(2, "0")} ${ampm}`;
                                  return (
                                    <option key={timeValue} value={timeValue}>
                                      {displayTime}
                                    </option>
                                  );
                                }),
                              )
                              .flat()}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="coverImage"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Cover Banner Image (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            onChange(file);

                            // Preview the image
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                setCoverImagePreview(
                                  e.target?.result as string,
                                );
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </FormControl>
                      {coverImagePreview && (
                        <div className="mt-2">
                          <img
                            src={coverImagePreview}
                            alt="Cover Image Preview"
                            className="w-full h-32 object-cover rounded-md border border-gray-200"
                          />
                        </div>
                      )}
                      <FormDescription>
                        Upload a new banner image for this match (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditOpen(false);
                      setEditingMatch(null);
                      setCoverImagePreview(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={editCricketTossMutation.isPending}
                  >
                    {editCricketTossMutation.isPending
                      ? "Updating..."
                      : "Update Match"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for declaring result */}
      <Dialog
        open={declareOpen && !!selectedMatch}
        onOpenChange={setDeclareOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Declare Cricket Toss Result</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              Select the winner for {selectedMatch?.teamA} vs{" "}
              {selectedMatch?.teamB}:
            </p>
            {selectedMatch?.coverImage && (
              <div className="mb-4">
                <img
                  src={selectedMatch.coverImage}
                  alt={`${selectedMatch.teamA} vs ${selectedMatch.teamB}`}
                  className="w-full h-32 object-cover rounded-md"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleDeclareResult("team_a")}
                className="h-16 flex flex-col items-center justify-center gap-2"
              >
                <span>{selectedMatch?.teamA} Wins</span>
              </Button>
              <Button
                onClick={() => handleDeclareResult("team_b")}
                className="h-16 flex flex-col items-center justify-center gap-2"
              >
                <span>{selectedMatch?.teamB} Wins</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for closing betting */}
      <Dialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Betting</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to close betting for this match?</p>
            <p className="text-sm text-muted-foreground mt-2">
              This will prevent players from placing new bets on this match.
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmCloseOpen(false);
                setMatchToClose(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={confirmCloseBetting}
              disabled={closeBettingMutation.isPending}
            >
              {closeBettingMutation.isPending ? "Closing..." : "Close Betting"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
