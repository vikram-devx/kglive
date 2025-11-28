import { Link, useLocation } from "wouter";
import { Home, Play, History, User, Wallet, BarChart2, Gamepad2, LogOut, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { UserRole } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MobileNavProps {
  activeTab?: string;
}

export default function MobileNav({ activeTab }: MobileNavProps = {}) {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const isAdmin = user?.role === UserRole.ADMIN;
  const isSubadmin = user?.role === UserRole.SUBADMIN;
  const isPlayer = user?.role === UserRole.PLAYER;

  // Define the type for nav items
  type NavItem = {
    name: string;
    icon: React.ReactNode;
    path: string;
    visible: boolean;
    component?: React.ReactNode;
  };
  
  // Base menu items for all users
  const navItems: NavItem[] = [
    {
      name: "Home",
      icon: <Home className="w-5 h-5" />,
      path: "/dashboard",
      visible: true,
    },
    // All Games (Browse) for players
    {
      name: "Games",
      icon: <Gamepad2 className="w-5 h-5" />,
      path: "/games",
      visible: isPlayer,
    },
    // History only for players
    {
      name: "History",
      icon: <History className="w-5 h-5" />,
      path: "/game-history",
      visible: isPlayer,
    },
    // Risk Management removed for platform simplification
    // Wallet for all users
    {
      name: "Wallet",
      icon: <Wallet className="w-5 h-5" />,
      path: "/wallet",
      visible: true,
      component: (
        <div className="flex flex-col items-center justify-center">
          <Wallet className="w-5 h-5" />
          <span className="text-xs mt-1 text-blue-300 font-semibold">₹{(user.balance / 100).toFixed(2)}</span>
        </div>
      ),
    },
    // Profile for all users
    {
      name: "Profile",
      icon: <User className="w-5 h-5" />,
      path: "/profile",
      visible: true,
    },

  ].filter(item => item.visible);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50 lg:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full text-xs",
              location === item.path
                ? "text-blue-400"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            {item.component || (
              <>
                {item.icon}
                <span className="mt-1">{item.name}</span>
              </>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}