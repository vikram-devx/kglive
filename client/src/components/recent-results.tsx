import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { BarChart2, Clock, Calendar, Target, ArrowRight } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@shared/schema";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface MarketResult {
  id: number;
  name: string;
  type: string;
  openTime: string;
  closeTime: string;
  openResult?: string;
  closeResult?: string | null;
  status: string;
  createdAt: string;
}

interface RecentResultsProps {
  results: MarketResult[];
  showTabs?: boolean; // Optional prop to control tabs visibility
}

export default function RecentResults({ results, showTabs = false }: RecentResultsProps) {
  const [_, setLocation] = useLocation();
  const [tab, setTab] = useState("today");
  const { user } = useAuth();
  const isPlayer = user?.role === UserRole.PLAYER;
  
  // Filter today's results
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayResults = results.filter(result => {
    const resultDate = new Date(result.createdAt);
    return resultDate >= today;
  });
  
  // Display results - for players, always show only today's results
  const displayResults = isPlayer ? todayResults : 
    (tab === "today" ? todayResults : results);
  
  // Empty state
  if ((isPlayer && todayResults.length === 0) || (!isPlayer && results.length === 0)) {
    return (
      <Card className="bg-slate-900/70 border-slate-800">
        <CardHeader>
          <CardTitle className="text-xl flex items-center text-slate-200">
            <BarChart2 className="w-5 h-5 text-blue-400 mr-2" />
            {isPlayer ? "Today's Results" : "Recent Results"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <Target className="h-12 w-12 text-slate-700 mb-2" />
            <p className="text-slate-500 text-sm">
              {isPlayer ? "No results available for today" : "No recent results available"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/70 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center text-slate-200">
          <BarChart2 className="w-5 h-5 text-blue-400 mr-2" />
          {isPlayer ? "Today's Results" : "Recent Results"}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-1">
        {/* Show tabs only for admins/subadmins and when showTabs is true */}
        {!isPlayer && showTabs ? (
          <Tabs defaultValue={tab} onValueChange={setTab} className="px-6">
            <TabsList className="mb-4 bg-slate-800/60">
              <TabsTrigger 
                value="today" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-700 data-[state=active]:text-white"
              >
                Today
              </TabsTrigger>
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-700 data-[state=active]:text-white"
              >
                All Results
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="today" className="mt-0">
              <div className="space-y-3">
                {todayResults.slice(0, 5).map((result) => (
                  <ResultItem key={result.id} result={result} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="all" className="mt-0">
              <div className="space-y-3">
                {results.slice(0, 8).map((result) => (
                  <ResultItem key={result.id} result={result} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          // For players or when tabs are disabled
          <div className="space-y-3 px-6">
            {(isPlayer ? todayResults : displayResults).slice(0, 5).map((result) => (
              <ResultItem key={result.id} result={result} />
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-1">
        <Button 
          variant="ghost" 
          className="w-full text-primary hover:text-purple-400 hover:bg-slate-800/60 flex items-center justify-center"
          onClick={() => setLocation("/results")}
        >
          View All Results
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}

function ResultItem({ result }: { result: MarketResult }) {
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

  const timeAgo = formatDistanceToNow(new Date(result.createdAt), { addSuffix: true });
  
  return (
    <div className="p-3 rounded-lg border border-slate-800 bg-slate-800/50">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium text-sm text-slate-200">{result.name}</h4>
          <div className="flex items-center text-xs text-slate-500 mt-0.5">
            <Clock className="h-3 w-3 mr-1" />
            <span>{timeAgo}</span>
          </div>
        </div>
        {getStatusBadge(result.status)}
      </div>
      
      <div className="flex justify-center mt-3 text-sm">
        <div className="text-center">
          <p className="text-xs text-slate-500">Result</p>
          <p className={`font-medium text-3xl ${result.name === "Dishawar" || result.name === "Gali" 
            ? "text-gradient bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-primary"
            : "text-pink-400"}`}>
            {formatResult(result.openResult || result.closeResult)}
          </p>
        </div>
      </div>
    </div>
  );
}