import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DashboardStatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'red' | 'purple' | 'amber' | 'slate';
}

export default function DashboardStatsCard({ 
  title, 
  value, 
  icon, 
  trend = 'neutral',
  color = 'blue'
}: DashboardStatsCardProps) {
  
  // Color mappings for different elements
  const colorClasses = {
    blue: {
      bg: 'bg-blue-900/20',
      border: 'border-blue-900/50',
      text: 'text-blue-400',
      iconBg: 'bg-blue-900/30',
    },
    green: {
      bg: 'bg-green-900/20',
      border: 'border-green-900/50',
      text: 'text-emerald-400',
      iconBg: 'bg-green-900/30',
    },
    red: {
      bg: 'bg-red-900/20',
      border: 'border-red-900/50',
      text: 'text-red-400',
      iconBg: 'bg-red-900/30',
    },
    purple: {
      bg: 'bg-purple-900/20',
      border: 'border-purple-900/50',
      text: 'text-purple-400',
      iconBg: 'bg-purple-900/30',
    },
    amber: {
      bg: 'bg-amber-900/20',
      border: 'border-amber-900/50',
      text: 'text-amber-400',
      iconBg: 'bg-amber-900/30',
    },
    slate: {
      bg: 'bg-slate-800/70',
      border: 'border-slate-700',
      text: 'text-slate-300',
      iconBg: 'bg-slate-800',
    },
  };

  // Trend arrow display
  const trendIcon = {
    up: (
      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
      </svg>
    ),
    down: (
      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
      </svg>
    ),
    neutral: null,
  };

  return (
    <Card className={cn(
      "shadow-md border",
      colorClasses[color].bg,
      colorClasses[color].border
    )}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-400">{title}</p>
            <p className={cn("text-2xl font-bold mt-1", colorClasses[color].text)}>
              {value}
            </p>
          </div>
          
          <div className={cn(
            "p-2 rounded-full",
            colorClasses[color].iconBg
          )}>
            {icon}
          </div>
        </div>
        
        {trend !== 'neutral' && (
          <div className="flex items-center mt-3">
            {trendIcon[trend]}
            <span className={cn(
              "text-xs ml-1",
              trend === 'up' ? 'text-emerald-400' : 'text-red-400'
            )}>
              {trend === 'up' ? 'Increasing' : 'Decreasing'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}