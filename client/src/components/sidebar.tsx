import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@/lib/types";
import { 
  LayoutDashboard, 
  Users, 
  Play, 
  Clock, 
  LogOut, 
  Menu, 
  X,
  ShieldCheck,
  History,
  Target,
  Trophy,
  BarChart2,
  Calculator,
  Wallet,
  Settings,
  Sliders,
  BadgeDollarSign,
  Landmark,
  Gamepad2,
  User,
  Calendar,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { GiCricketBat } from "react-icons/gi";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab?: string;
}

export default function Sidebar({ activeTab }: SidebarProps = {}) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;
  const isSubadmin = user?.role === UserRole.SUBADMIN;
  const isRegularUser = user?.role === UserRole.PLAYER;
  const canManageUsers = isAdmin || isSubadmin;
  
  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5 mr-3" />,
      visible: true,
    },
    // Admin and Subadmin Only
    {
      name: "User Management",
      path: "/users",
      icon: <Users className="w-5 h-5 mr-3" />,
      visible: canManageUsers,
    },
    // Admin Only
    {
      name: "Subadmin Management",
      path: "/subadmins",
      icon: <ShieldCheck className="w-5 h-5 mr-3" />,
      visible: isAdmin,
    },
    // Jantri Management - Admin and Subadmin
    {
      name: "Jantri Management",
      path: "/risk-management",
      icon: <AlertTriangle className="w-5 h-5 mr-3" />,
      visible: canManageUsers,
    },
    // Market Game Management - Admin Only
    {
      name: "Manage Markets",
      path: "/manage-markets",
      icon: <Target className="w-5 h-5 mr-3" />,
      visible: isAdmin,
    },
    // Team Match Management removed - functionality no longer used
    // Cricket Toss Management - Admin Only
    {
      name: "Manage Cricket Toss",
      path: "/admin-cricket-toss",
      icon: <GiCricketBat className="w-5 h-5 mr-3" />,
      visible: isAdmin,
    },
    // Reset Zone - Admin Only
    {
      name: "Reset Zone",
      path: "/reset-zone",
      icon: <RefreshCw className="w-5 h-5 mr-3" />,
      visible: isAdmin,
    },
    // Regular Users Only (Game Related)
    {
      name: "All Games",
      path: "/games",
      icon: <Gamepad2 className="w-5 h-5 mr-3" />,
      visible: isRegularUser,
    },
    {
      name: "Coin Flip",
      path: "/coinflip",
      icon: <Play className="w-5 h-5 mr-3" />,
      visible: isRegularUser,
    },
    {
      name: "Markets",
      path: "/markets",
      icon: <Calendar className="w-5 h-5 mr-3" />,
      visible: isRegularUser,
    },
    // Sports Betting removed - team match functionality no longer used
    {
      name: "Cricket Toss",
      path: "/cricket-toss",
      icon: <GiCricketBat className="w-5 h-5 mr-3" />,
      visible: isRegularUser,
    },
    {
      name: "Game History",
      path: "/game-history",
      icon: <Clock className="w-5 h-5 mr-3" />,
      visible: isRegularUser,
    },
    {
      name: "Profile",
      path: "/profile",
      icon: <User className="w-5 h-5 mr-3" />,
      visible: true,
    },
    // Wallet - accessible by all users
    {
      name: "Wallet",
      path: "/wallet",
      icon: <Wallet className="w-5 h-5 mr-3" />,
      visible: true,
    },
    // Admin Management (Jantri and Risk Management removed)
    {
      name: "Fund Management",
      path: "/fund-management",
      icon: <Landmark className="w-5 h-5 mr-3" />,
      visible: isAdmin,
    },

    // Settings
    {
      name: "Settings",
      path: "/settings",
      icon: <Settings className="w-5 h-5 mr-3" />,
      visible: isAdmin,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: <Sliders className="w-5 h-5 mr-3" />,
      visible: isSubadmin,
    },
    {
      name: "Back to Home",
      path: "/",
      icon: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7m-7-7v14"></path>
            </svg>,
      visible: isRegularUser,
    },
  ];
  
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-full bg-slate-900 border-r border-slate-800">
        <div className="p-4 flex items-center justify-center border-b border-slate-800">
          <h1 className="text-2xl font-bold">
            <span className="text-primary">King</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-primary">Games</span>
          </h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-primary scrollbar-track-slate-800">
          <ul>
            {menuItems.filter(item => item.visible).map((item) => (
              <li key={item.path} className="mb-1">
                <Link href={item.path}
                  className={cn(
                    "flex items-center px-4 py-3 text-slate-200 hover:bg-slate-800 hover:text-white rounded-lg mx-2 transition-colors",
                    location === item.path && "bg-gradient-to-r from-primary to-purple-700 text-white"
                  )}>
                    {item.icon}
                    {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* User Info */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center text-white font-bold">
              <span>{user?.username?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-200">{user?.username}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </aside>
      
      {/* Mobile Nav */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          <span className="text-primary">King</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-primary">Games</span>
        </h1>
        <Button 
          variant="ghost" 
          size="icon"
          className="text-slate-300 hover:bg-slate-800 hover:text-slate-100"
          onClick={toggleMobileMenu}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>
      
      {/* Mobile Menu */}
      <div className={cn(
        "lg:hidden fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40",
        isMobileMenuOpen ? "block" : "hidden"
      )}>
        <div className="w-64 h-full bg-slate-900 pt-16 border-r border-slate-800">
          <nav className="p-4 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-slate-800">
            <ul className="space-y-2">
              {menuItems.filter(item => item.visible).map((item) => (
                <li key={item.path}>
                  <Link 
                    href={item.path}
                    className={cn(
                      "flex items-center px-4 py-3 text-slate-200 hover:bg-slate-800 hover:text-white rounded-lg transition-colors",
                      location === item.path && "bg-gradient-to-r from-primary to-purple-700 text-white"
                    )}
                    onClick={toggleMobileMenu}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
            
            <Separator className="my-4 bg-slate-800" />
            
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white" 
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </Button>
            
            <div className="mt-4 flex items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                <span>{user?.username?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="ml-2">
                <p className="text-sm font-medium text-slate-200">{user?.username}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}