import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { formatCurrency } from '@/lib/format-utils';
import { ChevronRight, RefreshCw } from "lucide-react";
import { GiCricketBat } from "react-icons/gi";
import { Badge } from '@/components/ui/badge';

// Type for CricketTossGame
type CricketTossGame = {
  id: number;
  userId: number;
  gameType: string;
  betAmount: number;
  prediction: string;
  result: string | null;
  payout: number;
  createdAt: string | null;
  gameData: {
    teamA: string;
    teamB: string;
    description: string;
    tossTime: string;
    oddTeamA: number;
    oddTeamB: number;
    imageUrl?: string;
    status: string;
    openTime?: string;
    closeTime?: string;
  };
};

type CricketTossGameProps = {
  match: CricketTossGame;
  onClose: () => void;
};

export default function CricketTossGame({ match, onClose }: CricketTossGameProps) {
  const [betAmount, setBetAmount] = useState<number>(100 * 100); // Default 100 rupees in paisa
  const [prediction, setPrediction] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth() || {};

  // Get the API endpoint
  const getApiEndpoint = () => {
    return `/api/cricket-toss-games/${match.id}/play`;
  };

  // Get the match time
  const getMatchTime = () => {
    return new Date(match.gameData.tossTime);
  };

  const placeBetMutation = useMutation({
    mutationFn: async () => {
      if (!prediction || betAmount <= 0) {
        throw new Error("Please select a team and enter a valid bet amount");
      }
      
      // Ensure betAmount is a number
      const amount = typeof betAmount === 'string' ? parseInt(betAmount, 10) : betAmount;
      
      console.log('Submitting bet:', {
        betOn: prediction,
        betAmount: amount,
      });
      
      return apiRequest(
        'POST',
        getApiEndpoint(),
        {
          betOn: prediction,
          betAmount: amount,
        }
      );
    },
    meta: {
      successMessage: "Bet placed successfully!"
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games/my-game-history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: "Bet placed successfully!",
        description: `You placed ₹${betAmount/100} on ${getPredictionLabel(prediction || '')}. Good luck!`,
        variant: "default",
      });
      
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to place bet. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Helper to get team names
  const getTeamA = () => {
    return match.gameData.teamA;
  };

  const getTeamB = () => {
    return match.gameData.teamB;
  };

  // Helper to get odds
  const getOddTeamA = () => {
    return match.gameData.oddTeamA;
  };

  const getOddTeamB = () => {
    return match.gameData.oddTeamB;
  };

  const getPredictionLabel = (pred: string) => {
    switch (pred) {
      case 'team_a':
        return getTeamA();
      case 'team_b':
        return getTeamB();
      default:
        return pred;
    }
  };

  const calculatePotentialWin = () => {
    if (!prediction || betAmount <= 0) return 0;
    
    let odds = 0;
    if (prediction === 'team_a') {
      odds = getOddTeamA() / 100;
    } else if (prediction === 'team_b') {
      odds = getOddTeamB() / 100;
    }
    
    return Math.floor(betAmount * odds);
  };

  const potentialWin = calculatePotentialWin();
  const matchTime = getMatchTime();
  
  const handleQuickAmount = (amount: number) => {
    setBetAmount(amount * 100);
  };

  return (
    <Card className="bg-gray-900 text-white border-gray-800 max-w-md mx-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <GiCricketBat className="h-5 w-5 mr-2 text-indigo-400" />
            <CardTitle>Cricket Toss</CardTitle>
          </div>
          <Badge className="bg-indigo-600">Toss Game</Badge>
        </div>
        <CardDescription className="text-gray-400">
          {getTeamA()} vs {getTeamB()} | {format(matchTime, 'MMM dd, h:mm a')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center mb-2">
          <h3 className="text-sm text-gray-400 mb-1">Select your team</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className={`relative cursor-pointer border ${
              prediction === 'team_a' 
              ? 'bg-indigo-900/40 border-indigo-500' 
              : 'bg-gray-800 border-gray-700 hover:border-gray-600'
            } overflow-hidden transition-all`}
            onClick={() => setPrediction('team_a')}
          >
            <div className="absolute top-0 right-0 bg-indigo-600 px-2 py-1 text-xs rounded-bl-md">
              {(getOddTeamA() / 100).toFixed(2)}x
            </div>
            <CardContent className="p-6 text-center">
              <div className="h-16 flex items-center justify-center">
                <h3 className="text-lg font-bold">{getTeamA()}</h3>
              </div>
              {prediction === 'team_a' && (
                <Badge className="bg-indigo-600 mt-2">Selected</Badge>
              )}
            </CardContent>
          </Card>
          
          <Card 
            className={`relative cursor-pointer border ${
              prediction === 'team_b' 
              ? 'bg-indigo-900/40 border-indigo-500' 
              : 'bg-gray-800 border-gray-700 hover:border-gray-600'
            } overflow-hidden transition-all`}
            onClick={() => setPrediction('team_b')}
          >
            <div className="absolute top-0 right-0 bg-indigo-600 px-2 py-1 text-xs rounded-bl-md">
              {(getOddTeamB() / 100).toFixed(2)}x
            </div>
            <CardContent className="p-6 text-center">
              <div className="h-16 flex items-center justify-center">
                <h3 className="text-lg font-bold">{getTeamB()}</h3>
              </div>
              {prediction === 'team_b' && (
                <Badge className="bg-indigo-600 mt-2">Selected</Badge>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-2 mt-4">
          <h3 className="text-sm text-gray-400">Bet Amount</h3>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className={`${betAmount === 10000 ? 'bg-indigo-900/50 border-indigo-500' : ''}`}
              onClick={() => handleQuickAmount(100)}
            >
              ₹100
            </Button>
            <Button
              variant="outline"
              className={`${betAmount === 50000 ? 'bg-indigo-900/50 border-indigo-500' : ''}`}
              onClick={() => handleQuickAmount(500)}
            >
              ₹500
            </Button>
            <Button
              variant="outline"
              className={`${betAmount === 100000 ? 'bg-indigo-900/50 border-indigo-500' : ''}`}
              onClick={() => handleQuickAmount(1000)}
            >
              ₹1,000
            </Button>
          </div>
          
          <Input
            type="number"
            value={betAmount / 100}
            onChange={(e) => setBetAmount(Math.max(0, Number(e.target.value) * 100))}
            className="bg-gray-800 border-gray-700 mt-2"
            min={10}
            max={10000}
          />
          <p className="text-xs text-gray-400">Min: ₹10, Max: ₹10,000</p>
        </div>
        
        <div className="bg-gray-800 p-3 rounded-md space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Potential win:</span>
            <span className="text-indigo-400 font-bold">₹{(potentialWin/100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Your balance:</span>
            <span>{user?.balance !== undefined ? `₹${(user.balance/100).toFixed(2)}` : '-'}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          className="bg-gray-800 hover:bg-gray-700 border-gray-700"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button 
          className="bg-indigo-600 hover:bg-indigo-700"
          disabled={!prediction || betAmount <= 0 || placeBetMutation.isPending}
          onClick={() => placeBetMutation.mutate()}
        >
          {placeBetMutation.isPending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Place Bet <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}