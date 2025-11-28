import React from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// This is a placeholder component as jantri management has been removed
export default function JantriManagementPage() {
  return (
    <DashboardLayout title="Feature Removed">
      <Card>
        <CardHeader>
          <CardTitle>Jantri Management Feature Removed</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This feature has been removed to simplify the platform.</p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}