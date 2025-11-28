import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ResponsiveHeader from "@/components/responsive-header";
import ProfessionalFooter from "@/components/professional-footer";
import { 
  CalendarIcon, 
  Clock, 
  Target, 
  Filter,
  TrendingUp,
  Search
} from "lucide-react";

interface MarketResult {
  id: number;
  name: string;
  type: string;
  openResult: string;
  closeResult?: string;
  status: string;
  openTime: string;
  closeTime: string;
  resultTime?: string;
  createdAt: string;
}

export default function ResultsPage() {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMarket, setSelectedMarket] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Build query parameters based on filters
  const queryParams = new URLSearchParams();
  if (selectedDate) {
    queryParams.append('date', selectedDate);
  }
  if (!selectedDate) {
    queryParams.append('limit', '50');
  }

  const { data: results = [], isLoading, error } = useQuery({
    queryKey: ['/api/public/market-results', queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/public/market-results?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      return response.json();
    },
  });

  // Get unique market names for filter dropdown
  const uniqueMarkets: string[] = results.length > 0 
    ? Array.from(new Set(results.map((result: MarketResult) => result.name))).sort()
    : [];

  // Filter results based on market name and search term
  const filteredResults = results.filter((result: MarketResult) => {
    const matchesMarket = selectedMarket === "all" || result.name === selectedMarket;
    const matchesSearch = !searchTerm || 
      result.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesMarket && matchesSearch;
  });

  const formatResult = (result?: string) => {
    if (!result) return "-";
    
    // For Dishawar and Gali markets, ensure two-digit format with leading zero if needed
    if (result.length === 1) {
      return `0${result}`;
    } else if (result.length === 2) {
      return result;
    } else {
      return result;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return <Badge variant="outline" className="bg-violet-900/30 text-violet-300 border-violet-500/30">Open</Badge>;
      case "closed":
        return <Badge variant="outline" className="bg-amber-900/30 text-amber-300 border-amber-500/30">Closed</Badge>;
      case "resulted":
        return <Badge variant="outline" className="bg-emerald-900/30 text-emerald-300 border-emerald-500/30">Resulted</Badge>;
      default:
        return <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <ResponsiveHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Game Results
          </h1>
          <p className="text-slate-400 text-lg">
            Browse all market results with advanced filtering options
          </p>
        </div>

        {/* Filters Section */}
        <Card className="bg-slate-900/70 border-slate-800 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-200">
              <Filter className="w-5 h-5 mr-2 text-primary" />
              Filter Results
            </CardTitle>
            <CardDescription>
              Filter results by date, market name, or search by market name
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  Select Date
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              {/* Market Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  <Target className="w-4 h-4 inline mr-1" />
                  Market
                </label>
                <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select market" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Markets</SelectItem>
                    {uniqueMarkets.map((market: string) => (
                      <SelectItem key={market} value={market}>
                        {market}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  <Search className="w-4 h-4 inline mr-1" />
                  Search Market
                </label>
                <Input
                  type="text"
                  placeholder="Search by market name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedDate("");
                  setSelectedMarket("all");
                  setSearchTerm("");
                }}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" />
              Results
              <span className="ml-2 text-slate-400 text-base font-normal">
                ({filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'})
              </span>
            </h2>
          </div>
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-slate-900/70 border-slate-800">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-32 mb-2 bg-slate-700" />
                  <Skeleton className="h-3 w-24 mb-4 bg-slate-700" />
                  <Skeleton className="h-16 w-16 mx-auto mb-4 bg-slate-700" />
                  <Skeleton className="h-3 w-20 mx-auto bg-slate-700" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="bg-slate-900/70 border-slate-800">
            <CardContent className="p-8 text-center">
              <Target className="h-12 w-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">
                Error Loading Results
              </h3>
              <p className="text-slate-500">
                Failed to load market results. Please try again later.
              </p>
            </CardContent>
          </Card>
        ) : filteredResults.length === 0 ? (
          <Card className="bg-slate-900/70 border-slate-800">
            <CardContent className="p-8 text-center">
              <Target className="h-12 w-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">
                No Results Found
              </h3>
              <p className="text-slate-500">
                No market results match your current filters. Try adjusting your search criteria.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResults.map((result: MarketResult) => {
              const timeAgo = formatDistanceToNow(new Date(result.resultTime || result.createdAt), { addSuffix: true });
              
              return (
                <Card key={result.id} className="bg-slate-900/70 border-slate-800 hover:border-slate-700 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-slate-200 text-lg">
                          {result.name}
                        </h3>
                        <div className="flex items-center text-xs text-slate-500 mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{timeAgo}</span>
                        </div>
                      </div>
                      {getStatusBadge(result.status)}
                    </div>
                    
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-2">Result</p>
                      <div className={`font-bold text-4xl ${result.name === "Dishawar" || result.name === "Gali" 
                        ? "text-gradient bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-primary"
                        : "text-pink-400"}`}>
                        {formatResult(result.openResult)}
                      </div>
                      
                      {result.closeResult && (
                        <div className="mt-2">
                          <p className="text-xs text-slate-500">Close Result</p>
                          <div className="font-semibold text-2xl text-blue-400">
                            {formatResult(result.closeResult)}
                          </div>
                        </div>
                      )}
                    </div>

                    {result.resultTime && (
                      <div className="mt-4 pt-3 border-t border-slate-700">
                        <p className="text-xs text-slate-500 text-center">
                          Result declared on {format(new Date(result.resultTime), 'PPp')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <ProfessionalFooter />
    </div>
  );
}