import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@/lib/types";
import AdminSettingsPage from "./admin-settings-page";
import SubadminSettingsPage from "./subadmin-settings-page";
import { Redirect } from "wouter";

export default function SettingsRouter() {
  const { user } = useAuth();

  if (user?.role === UserRole.ADMIN) {
    return <AdminSettingsPage />;
  } else if (user?.role === UserRole.SUBADMIN) {
    return <SubadminSettingsPage />;
  } else {
    // Access denied or redirect to home
    return <Redirect to="/" />;
  }
}