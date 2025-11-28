import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import DashboardLayout from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatDistance } from "date-fns";
import { ArrowDown, ArrowUp, Coins, Users, CreditCard, Search, Filter } from "lucide-react";

export default function ActionHistoryPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("transactions");
  const [searchTerm, setSearchTerm] = useState("");
  const [gameFilter, setGameFilter] = useState("all");
  const [transactionFilter, setTransactionFilter] = useState("all");
  const isAdmin = user?.role === UserRole.ADMIN;
  const isSubadmin = user?.role === UserRole.SUBADMIN;

  // Get transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions", isAdmin || isSubadmin ? "all" : `user-${user?.id}`],
    enabled: !!user,
  });

  // Get games
  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ["/api/games", isAdmin || isSubadmin ? "all" : `user-${user?.id}`],
    enabled: !!user,
  });

  // Filter transactions based on search and filter
  const filteredTransactions = (transactions as any[]).filter((transaction: any) => {
    const matchesSearch = searchTerm === "" || 
      transaction.userId.toString().includes(searchTerm) ||
      (transaction.user?.username && transaction.user.username.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (transactionFilter === "all") return matchesSearch;
    if (transactionFilter === "positive") return matchesSearch && transaction.amount > 0;
    if (transactionFilter === "negative") return matchesSearch && transaction.amount < 0;
    return matchesSearch;
  });

  // Filter games based on search and filter
  const filteredGames = (games as any[]).filter((game: any) => {
    const matchesSearch = searchTerm === "" || 
      game.userId.toString().includes(searchTerm) ||
      (game.user?.username && game.user.username.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (gameFilter === "all") return matchesSearch;
    if (gameFilter === "wins") return matchesSearch && game.payout > 0;
    if (gameFilter === "losses") return matchesSearch && game.payout === 0;
    return matchesSearch;
  });

  // Format amount based on type - transactions are in paisa (divide by 100)
  // but game amounts are already in rupees for display (don't divide)
  const formatAmount = (amount: number, type: 'transaction' | 'game' = 'transaction') => {
    if (type === 'transaction') {
      return (amount / 100).toFixed(2);
    } else {
      // For game amounts, check if they're in paisa or rupees format
      // For bet amounts < 10000, it's likely already in rupees
      // For bet amounts >= 10000, it could be in paisa (100 rupees = 10000 paisa)
      return (amount >= 10000 ? (amount / 100).toFixed(2) : amount.toFixed(2));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${formatDistance(date, new Date(), { addSuffix: true })} (${date.toLocaleDateString()})`;
  };

  const renderTransactionsTable = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {(isAdmin || isSubadmin) && <TableHead>User</TableHead>}
            <TableHead>Amount</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Performed By</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTransactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isAdmin || isSubadmin ? 5 : 4} className="text-center py-4">
                No transactions found
              </TableCell>
            </TableRow>
          ) : (
            filteredTransactions.map((transaction: any) => (
              <TableRow key={transaction.id}>
                {(isAdmin || isSubadmin) && (
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {transaction.user?.username || `User #${transaction.userId}`}
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <span className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                    <div className="flex items-center gap-1">
                      {transaction.amount > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                      ${formatAmount(Math.abs(transaction.amount))}
                    </div>
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={transaction.amount > 0 ? "outline" : "destructive"}>
                    {transaction.amount > 0 ? "Deposit" : "Withdrawal"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    {transaction.performer?.username || `Admin #${transaction.performedBy}`}
                  </div>
                </TableCell>
                <TableCell>{formatDate(transaction.createdAt)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderGamesTable = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {(isAdmin || isSubadmin) && <TableHead>User</TableHead>}
            <TableHead>Bet Amount</TableHead>
            <TableHead>Prediction</TableHead>
            <TableHead>Result</TableHead>
            <TableHead>Payout</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredGames.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isAdmin || isSubadmin ? 6 : 5} className="text-center py-4">
                No games found
              </TableCell>
            </TableRow>
          ) : (
            filteredGames.map((game: any) => (
              <TableRow key={game.id}>
                {(isAdmin || isSubadmin) && (
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {game.user?.username || `User #${game.userId}`}
                    </div>
                  </TableCell>
                )}
                <TableCell>${formatAmount(game.betAmount, 'game')}</TableCell>
                <TableCell className="capitalize">{game.prediction}</TableCell>
                <TableCell className="capitalize">{game.result}</TableCell>
                <TableCell>
                  <span className={game.payout > 0 ? "text-green-600" : "text-red-600"}>
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4" />
                      ${formatAmount(game.payout, 'game')}
                    </div>
                  </span>
                </TableCell>
                <TableCell>{formatDate(game.createdAt)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <DashboardLayout title="Action History">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Action History</CardTitle>
          <CardDescription>
            View transactions and game history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transactions" onValueChange={setTab} value={tab}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <TabsList className="mb-4 md:mb-0">
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="games">Games</TabsTrigger>
              </TabsList>
              
              <div className="flex flex-col md:flex-row gap-4 md:items-center">
                <div className="relative">
                  <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search user..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-8 w-full md:w-60"
                  />
                </div>
                
                {tab === "transactions" && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="transaction-filter" className="hidden md:inline">Filter:</Label>
                    <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                      <SelectTrigger id="transaction-filter" className="w-full md:w-40">
                        <SelectValue placeholder="Filter transactions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Transactions</SelectItem>
                        <SelectItem value="positive">Deposits Only</SelectItem>
                        <SelectItem value="negative">Withdrawals Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {tab === "games" && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="game-filter" className="hidden md:inline">Filter:</Label>
                    <Select value={gameFilter} onValueChange={setGameFilter}>
                      <SelectTrigger id="game-filter" className="w-full md:w-40">
                        <SelectValue placeholder="Filter games" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Games</SelectItem>
                        <SelectItem value="wins">Wins Only</SelectItem>
                        <SelectItem value="losses">Losses Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            
            <TabsContent value="transactions" className="mt-0">
              {transactionsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                renderTransactionsTable()
              )}
            </TabsContent>
            
            <TabsContent value="games" className="mt-0">
              {gamesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                renderGamesTable()
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}