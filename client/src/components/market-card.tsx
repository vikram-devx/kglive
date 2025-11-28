import { useLocation } from "wouter";
import { formatDistanceToNow, format } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Clock, Calendar, Target, Dice1, ArrowRightCircle, Award } from "lucide-react";
import { useEffect, useState } from "react";

interface MarketCardProps {
  id: number;
  name: string;
  type: string;
  openTime: string;
  closeTime: string;
  openResult?: string;
  closeResult?: string;
  status: string;
  showFullInfo?: boolean;
  coverImage?: string;
}

export default function MarketCard({
  id,
  name,
  type,
  openTime,
  closeTime,
  openResult,
  closeResult,
  status,
  showFullInfo = false,
  coverImage,
}: MarketCardProps) {
  const [_, setLocation] = useLocation();

  // Parse dates
  const openTimeDate = new Date(openTime);
  const closeTimeDate = new Date(closeTime);
  
  // Format times
  const openTimeFormatted = format(openTimeDate, "h:mm a");
  const closeTimeFormatted = format(closeTimeDate, "h:mm a");
  
  // Time remaining until close (if market is open)
  const timeRemainingText = status === "open" 
    ? formatDistanceToNow(closeTimeDate, { addSuffix: true })
    : "";
  
  // Get appropriate status badge color
  const getStatusBadge = () => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">Open</Badge>;
      case "closed":
        return <Badge variant="destructive">Waiting Results</Badge>;
      case "resulted":
        return <Badge variant="secondary">Resulted</Badge>;
      case "waiting":
        return <Badge className="bg-purple-500 hover:bg-purple-600 text-white">Upcoming</Badge>;
      case "waiting_result":
        return <Badge variant="destructive">Waiting Results</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get market icon based on type
  const getMarketIcon = () => {
    switch (type) {
      case "dishawar":
        return <Calendar className="h-14 w-14 text-primary" />;
      case "gali":
        return <Target className="h-14 w-14 text-primary" />;
      case "mumbai":
        return <Dice1 className="h-14 w-14 text-primary" />;
      case "kalyan":
        return <Clock className="h-14 w-14 text-primary" />;
      default:
        return <Calendar className="h-14 w-14 text-primary" />;
    }
  };
  
  // Get cover style based on market type or admin-provided cover image
  const getMarketCoverStyle = () => {
    const gradientOverlay = "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7))";
    
    // If admin provided a specific coverImage for this market, use it (highest priority)
    if (coverImage) {
      console.log(`Using market's own cover image: ${coverImage} for "${name}"`);
      return { 
        backgroundImage: `${gradientOverlay}, url("${coverImage}")`,
        className: "bg-slate-900 bg-cover bg-center"
      };
    }
    
    // Otherwise, use default gradient patterns based on market type (don't use generic market images)
    let backgroundImage;
    let bgColor;
    
    switch (type) {
      case "dishawar":
        bgColor = "bg-purple-900";
        backgroundImage = `${gradientOverlay}, url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath fill='%23a855f7' fill-opacity='0.2' d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z'%3E%3C/path%3E%3C/svg%3E")`;
        break;
      case "gali":
        bgColor = "bg-amber-900";
        backgroundImage = `${gradientOverlay}, url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23f59e0b' fill-opacity='0.2'%3E%3C/path%3E%3C/svg%3E")`;
        break;
      case "mumbai":
        bgColor = "bg-sky-900";
        backgroundImage = `${gradientOverlay}, url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%230ea5e9' fill-opacity='0.2'%3E%3C/path%3E%3C/svg%3E")`;
        break;
      case "kalyan":
        bgColor = "bg-emerald-900";
        backgroundImage = `${gradientOverlay}, url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%2310b981' fill-opacity='0.2'%3E%3C/path%3E%3C/svg%3E")`;
        break;
      default:
        bgColor = "bg-slate-900";
        backgroundImage = `${gradientOverlay}, url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%236366f1' fill-opacity='0.2'%3E%3C/path%3E%3C/svg%3E")`;
    }
    
    return { backgroundImage, className: bgColor };
  };

  // Get result display component
  const getResultDisplay = () => {
    if (status === "resulted" && (openResult || closeResult)) {
      // Use closeResult as primary, fallback to openResult if closeResult is not available
      const resultToShow = closeResult || openResult;
      
      if (resultToShow) {
        return (
          <div className="flex justify-center items-center py-2">
            <div className="text-center">
              <Badge variant="outline" className="text-xl font-bold px-3 py-1">
                {resultToShow}
              </Badge>
            </div>
          </div>
        );
      }
    }
    return null;
  };
  
  const { backgroundImage, className } = getMarketCoverStyle();

  return (
    <Card className="overflow-hidden h-full transition-all duration-200 hover:shadow-md">
      <div 
        className={`h-28 flex items-center justify-center p-4 text-white ${className}`}
        style={{ backgroundImage }}
      >
        <div className="text-center">
          <h3 className="text-2xl font-bold">{name}</h3>
        </div>
      </div>
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3">
        <div>
          <CardDescription className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>{openTimeFormatted} - {closeTimeFormatted}</span>
          </CardDescription>
          {status === "open" && (
            <div className="text-xs opacity-80 mt-1">
              Closes {timeRemainingText}
            </div>
          )}
        </div>
        <div>{getStatusBadge()}</div>
      </CardHeader>
      
      {(status === "resulted" || (openResult || closeResult)) && (
        <CardContent className="py-0 px-6">
          {status === "resulted" && (
            <div className="flex items-center justify-center mb-2">
              <Award className="h-5 w-5 text-amber-500 mr-2" />
              <span className="text-sm font-medium">Results Declared</span>
            </div>
          )}
          {getResultDisplay()}
        </CardContent>
      )}
      
      <CardFooter className="bg-muted/50 pt-2 pb-2 mt-auto">
        {/* For open markets, show Place Bet button */}
        {status === "open" && (
          <Button 
            className="w-full"
            onClick={() => setLocation(`/game/satamatka/${id}`)}
          >
            Place Bet <ArrowRightCircle className="ml-2 h-4 w-4" />
          </Button>
        )}
        
        {/* "View Market" button - Don't show for "waiting" or "closed" statuses */}
        {status !== "open" && status !== "waiting" && status !== "closed" && !showFullInfo && (
          <Button 
            className="w-full" 
            variant="outline"
            onClick={() => setLocation(`/game/satamatka/${id}`)}
          >
            View Market
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}