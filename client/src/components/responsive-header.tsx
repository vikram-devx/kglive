import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, X, Wallet, ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetClose 
} from "@/components/ui/sheet";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { UserRole } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ResponsiveHeader() {
  const [_, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isAdmin = user?.role === UserRole.ADMIN;
  const isSubadmin = user?.role === UserRole.SUBADMIN;

  if (!user) {
    // Public header for non-authenticated users
    return (
      <header className="w-full bg-card/50 border-b border-border py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setLocation("/")}>
            <img src="/images/royal-k-logo.svg" alt="Royal K Logo" className="w-7 h-7" />
            <span className="text-primary">King</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-primary">Games</span>
          </h1>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-slate-300 hover:text-white hover:bg-slate-800/50"
              onClick={() => setLocation("/results")}
            >
              Results
            </Button>
            <Button
              className="bg-gradient-to-r from-primary to-blue-400 hover:from-primary/90 hover:to-blue-600"
              onClick={() => setLocation("/auth")}
            >
              Login / Register
            </Button>
          </div>
        </div>
      </header>
    );
  }

  // Authenticated header
  return (
    <header className="w-full bg-card/50 border-b border-border py-3 sticky top-0 z-40">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold flex items-center gap-1">
            <img src="/images/royal-k-logo.svg" alt="Royal K Logo" className="w-7 h-7" />
            <span className="text-primary">King</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-primary">Games</span>
          </h1>
        </div>
        
        <div className="flex items-center">
          {/* Balance display - Always visible, even on mobile */}
          <div className="mr-4 flex items-center bg-muted/50 px-3 py-1.5 rounded-full">
            <Wallet className="h-4 w-4 mr-2 text-primary" />
            <span className="font-medium">₹{(user.balance / 100).toFixed(2)}</span>
          </div>
          
          {/* User dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full hover:bg-primary/10 border-primary/20">
                <Avatar className="h-9 w-9 bg-gradient-to-r from-primary to-blue-400">
                  <AvatarFallback className="text-white font-bold text-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center gap-3 p-3 border-b border-border">
                <Avatar className="h-12 w-12 bg-gradient-to-r from-primary to-blue-400">
                  <AvatarFallback className="text-white font-bold text-lg">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.username}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
              </div>
              <div className="p-2 border-b border-border">
                <div className="p-2 bg-muted/50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <Wallet className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm">Balance</span>
                  </div>
                  <span className="font-medium text-sm">₹{(user.balance / 100).toFixed(2)}</span>
                </div>
              </div>
              <DropdownMenuItem onClick={() => setLocation("/profile")} className="mt-1 flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Mobile menu trigger - only shown on very small screens */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden ml-2">
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-1">
                    <img src="/images/royal-k-logo.svg" alt="Royal K Logo" className="w-6 h-6" />
                    <span className="text-primary">King</span>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-primary">Games</span>
                  </h2>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon">
                      <X className="h-5 w-5" />
                    </Button>
                  </SheetClose>
                </div>
                
                <div className="flex items-center mb-6 p-3 bg-muted/50 rounded-lg">
                  <Avatar className="h-12 w-12 bg-gradient-to-r from-primary to-blue-400 mr-3">
                    <AvatarFallback className="text-white font-bold text-lg">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                  </div>
                </div>
                
                <div className="p-3 bg-muted/50 rounded-lg mb-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <Wallet className="h-5 w-5 mr-2 text-primary" />
                    <span className="font-medium">Balance</span>
                  </div>
                  <span className="font-bold">₹{(user.balance / 100).toFixed(2)}</span>
                </div>
                
                <div className="space-y-3 mt-4">
                  <SheetClose asChild>
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => setLocation("/profile")}
                    >
                      <UserIcon className="h-4 w-4" />
                      My Profile
                    </Button>
                  </SheetClose>
                  
                  <SheetClose asChild>
                    <Button 
                      variant="destructive" 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </SheetClose>
                </div>
                
                <div className="mt-auto"></div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}