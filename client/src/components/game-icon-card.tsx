import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { IconType } from "react-icons";
import { Badge } from "@/components/ui/badge";

interface GameIconCardProps {
  id: string;
  title: string;
  icon: LucideIcon | IconType;
  path: string;
  gradient: string;
  comingSoon?: boolean;
}

export default function GameIconCard({
  id,
  title,
  icon: Icon,
  path,
  gradient,
  comingSoon = false
}: GameIconCardProps) {
  const [_, setLocation] = useLocation();

  const handleClick = () => {
    if (!comingSoon) {
      setLocation(path);
    }
  };

  return (
    <Card 
      className={`overflow-hidden transition-all hover:scale-105 border-slate-700 shadow-sm ${!comingSoon ? 'cursor-pointer' : 'cursor-default'}`}
      onClick={handleClick}
    >
      <CardContent className="p-0 relative h-32">
        <div className={`flex flex-col items-center justify-center p-6 h-full min-h-[128px] ${gradient}`}>
          <Icon className="h-10 w-10 text-white mb-2" />
          <h3 className="font-medium text-white text-lg text-center">{title}</h3>
        </div>
        
        {comingSoon && (
          <Badge className="absolute top-2 right-2 bg-orange-900/80 text-orange-200 border-orange-500/40 text-xs px-2 py-1">
            Coming Soon
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}