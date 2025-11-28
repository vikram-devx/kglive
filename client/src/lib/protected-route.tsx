import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { UserRole } from "@/lib/types";

export function ProtectedRoute({
  path,
  component: Component,
  allowedRoles,
}: {
  path: string;
  component: () => React.JSX.Element;
  allowedRoles?: UserRole[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check role-based access if roles are specified
  if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
