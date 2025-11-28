import { ReactNode } from "react";
import Sidebar from "@/components/sidebar";
import MobileNav from "@/components/mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { Wallet, LogOut, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  activeTab?: string;
}

export default function DashboardLayout({ children, title, activeTab }: DashboardLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [_, setLocation] = useLocation();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  return (
    <div className="flex min-h-screen h-screen bg-slate-950 text-slate-200">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden lg:block h-screen">
        <Sidebar activeTab={activeTab} />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          {title && (
            <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm">
              <div className="px-4 py-3 flex justify-between items-center">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-500">
                  {title}
                </h1>
                {user && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-800/60 px-3 py-1.5 rounded-full">
                      <Wallet className="h-4 w-4 mr-2 text-primary" />
                      <span className="font-medium">₹{(user.balance / 100).toFixed(2)}</span>
                    </div>
                    
                    {/* User avatar dropdown - only for mobile */}
                    <div className="block lg:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="focus:outline-none">
                          <Avatar className="h-8 w-8 bg-gradient-to-r from-primary to-blue-400">
                            <AvatarFallback className="text-white font-bold text-xs">
                              {user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <div className="flex items-center gap-2 p-2 border-b border-slate-700">
                            <Avatar className="h-8 w-8 bg-gradient-to-r from-primary to-blue-400">
                              <AvatarFallback className="text-white font-bold text-xs">
                                {user.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{user.username}</p>
                              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                            </div>
                          </div>
                          <DropdownMenuItem onClick={() => setLocation("/profile")} className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            <span>Profile</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-300 flex items-center gap-2">
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="container mx-auto px-4 py-4">
            {children}
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileNav activeTab={activeTab} />
    </div>
  );
}