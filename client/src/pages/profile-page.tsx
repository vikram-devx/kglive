import { useState } from "react";
import { UserRole } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/dashboard-layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Shield, 
  Key, 
  Loader2, 
  Calendar,
  Wallet
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Define form schema for password change
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordChangeForm = z.infer<typeof passwordChangeSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Initialize form
  const form = useForm<PasswordChangeForm>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Password change mutation
  const passwordChangeMutation = useMutation({
    mutationFn: async (data: { currentPassword: string, newPassword: string }) => {
      return apiRequest("PATCH", "/api/user/password", data);
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    }
  });

  // Handle password change form submission
  const onSubmit = (data: PasswordChangeForm) => {
    passwordChangeMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  if (!user) {
    return (
      <DashboardLayout title="Profile">
        <div className="text-center py-8">
          <p>Loading user information...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Get badge color based on user role
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case UserRole.SUBADMIN:
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case UserRole.PLAYER:
        return "bg-green-500/10 text-green-500 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <DashboardLayout title="Profile">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Information Card */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              User Information
            </CardTitle>
            <CardDescription>
              Your account details and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-blue-400 flex items-center justify-center text-white font-bold text-3xl">
                {user.username.charAt(0).toUpperCase()}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-xs">Username</Label>
                <div className="font-medium text-lg">{user.username}</div>
              </div>
              
              {user.email && (
                <div>
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <div className="font-medium">{user.email}</div>
                </div>
              )}
              
              {user.mobile && (
                <div>
                  <Label className="text-muted-foreground text-xs">Mobile</Label>
                  <div className="font-medium">{user.mobile}</div>
                </div>
              )}
              
              <div>
                <Label className="text-muted-foreground text-xs">Role</Label>
                <div>
                  <Badge className={`mt-1 ${getRoleBadgeClass(user.role)}`}>
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {user.role}
                    </div>
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground text-xs">Wallet Balance</Label>
                <div className="font-medium text-lg flex items-center gap-1 text-green-500">
                  <Wallet className="h-4 w-4" />
                  ₹{(user.balance / 100).toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Change Password Card */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your account password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter current password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={passwordChangeMutation.isPending}
                >
                  {passwordChangeMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Password
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}