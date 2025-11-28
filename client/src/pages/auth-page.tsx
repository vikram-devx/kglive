import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { UserRole } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits").max(15, "Mobile number cannot exceed 15 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const [_, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      mobile: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const onLogin = (data: z.infer<typeof loginSchema>) => {
    console.log("Login attempt with:", data);
    loginMutation.mutate(data, {
      onSuccess: (userData) => {
        console.log("Login success:", userData);
        setLocation("/dashboard");
      },
      onError: (error) => {
        console.error("Login error:", error);
      }
    });
  };

  const onRegister = (data: z.infer<typeof registerSchema>) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate({
      ...registerData,
      role: UserRole.PLAYER, // Default role for new registrations
      assignedTo: null
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      {/* Left side - Auth forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 bg-background">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setLocation("/")}>
              <img src="/images/royal-k-logo.svg" alt="Royal K Logo" className="w-8 h-8" />
              <span className="text-primary">King</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-primary">Games</span>
            </CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={loginForm.handleSubmit(onLogin)}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        {...loginForm.register("username")}
                      />
                      {loginForm.formState.errors.username && (
                        <p className="text-red-500 text-sm">{loginForm.formState.errors.username.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        {...loginForm.register("password")}
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-red-500 text-sm">{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary to-blue-400 hover:from-blue-600 hover:to-primary-focus"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={registerForm.handleSubmit(onRegister)}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Username</Label>
                      <Input
                        id="register-username"
                        type="text"
                        placeholder="Choose a username"
                        {...registerForm.register("username")}
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-red-500 text-sm">{registerForm.formState.errors.username.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="Enter your email address"
                        {...registerForm.register("email")}
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-red-500 text-sm">{registerForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-mobile">Mobile Number</Label>
                      <Input
                        id="register-mobile"
                        type="tel"
                        placeholder="Enter your mobile number"
                        {...registerForm.register("mobile")}
                      />
                      {registerForm.formState.errors.mobile && (
                        <p className="text-red-500 text-sm">{registerForm.formState.errors.mobile.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Choose a password"
                        {...registerForm.register("password")}
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-red-500 text-sm">{registerForm.formState.errors.password.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        {...registerForm.register("confirmPassword")}
                      />
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-red-500 text-sm">{registerForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary to-blue-400 hover:from-blue-600 hover:to-primary-focus"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              {activeTab === "login" ? (
                <>
                  Don't have an account?{" "}
                  <Button variant="link" onClick={() => setActiveTab("register")} className="px-0 text-primary">
                    Sign up
                  </Button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Button variant="link" onClick={() => setActiveTab("login")} className="px-0 text-primary">
                    Sign in
                  </Button>
                </>
              )}
            </p>
          </CardFooter>
        </Card>
      </div>
      
      {/* Right side - Hero */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-slate-900 to-primary/80 p-8 flex-col justify-center text-white">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-2">
            Welcome to 
            <span className="flex items-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setLocation("/")}>
              <img src="/images/royal-k-logo.svg" alt="Royal K Logo" className="w-10 h-10 mr-1" />
              <span className="text-white">King</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-amber-300">Games</span>
            </span>
          </h1>
          <h2 className="text-xl mb-6">The premier online gaming platform</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-2">
              <svg className="w-6 h-6 mt-0.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <p>Exciting Royal Toss game with real-time results</p>
            </div>
            
            <div className="flex items-start space-x-2">
              <svg className="w-6 h-6 mt-0.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <p>Track your stats and betting history</p>
            </div>
            
            <div className="flex items-start space-x-2">
              <svg className="w-6 h-6 mt-0.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <p>Multiple user roles with different permissions</p>
            </div>
            
            <div className="flex items-start space-x-2">
              <svg className="w-6 h-6 mt-0.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <p>Secure and fair gaming experience</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
