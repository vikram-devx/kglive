import SatamatkaGame from "@/components/satamatka-game";
import DashboardLayout from "@/components/dashboard-layout";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export default function SatamatkaGamePage() {
  const { id } = useParams<{ id: string }>();
  const marketId = parseInt(id || "0");
  
  // Get market name for the page title
  const { data: market } = useQuery({
    queryKey: ["/api/satamatka/markets", marketId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!marketId,
  });

  return (
    <DashboardLayout title={market?.name || "Market Game"}>
      <SatamatkaGame />
    </DashboardLayout>
  );
}