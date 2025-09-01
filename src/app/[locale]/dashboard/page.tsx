"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "@/contexts/TranslationContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserTierCard } from "@/components/tiers/UserTierCard";
import { ItemTierBadge } from "@/components/tiers/ItemTierBadge";
import { TIER_COLORS } from "@/lib/tiers";
import { format } from "date-fns";
import { Database } from "@/lib/supabase";
import { TrendingUp, Package, Users, Clock } from "lucide-react";

type BorrowRequest = Database["public"]["Tables"]["borrow_requests"]["Row"];
type Item = Database["public"]["Tables"]["items"]["Row"];
type User = Database["public"]["Tables"]["users"]["Row"];

interface RequestWithDetails extends BorrowRequest {
  items: Item;
  borrower: User;
}

interface DashboardStats {
  totalItems: number;
  activeRequests: number;
  completedLends: number;
  totalEarned: number;
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const t = useTranslations();
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    activeRequests: 0,
    completedLends: 0,
    totalEarned: 0,
  });
  const [recentRequests, setRecentRequests] = useState<RequestWithDetails[]>([]);
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch user's items
      const { data: items, error: itemsError } = await supabase.from("items").select("*").eq("owner_id", user.id);

      if (itemsError) throw itemsError;

      // Fetch recent requests for user's items
      const { data: requests, error: requestsError } = await supabase
        .from("borrow_requests")
        .select(
          `
          *,
          items (*),
          borrower:users!borrow_requests_borrower_id_fkey (*)
        `
        )
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (requestsError) throw requestsError;

      // Calculate stats
      const activeRequests = requests?.filter((r) => r.status === "pending" || r.status === "approved").length || 0;
      const completedLends = requests?.filter((r) => r.status === "completed").length || 0;

      setStats({
        totalItems: items?.length || 0,
        activeRequests,
        completedLends,
        totalEarned: completedLends * 10, // Placeholder calculation
      });

      setRecentRequests((requests as RequestWithDetails[]) || []);
      setMyItems(items || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t("dashboard.pleaseSignIn")}</h1>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>{t("dashboard.loadingDashboard")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("dashboard.title")}</h1>
        <p className="text-gray-600">
          {t("dashboard.welcomeBack")}, {profile?.full_name || user.email}!
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.totalItems")}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">{t("dashboard.itemsAvailable")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.activeRequests")}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeRequests}</div>
            <p className="text-xs text-muted-foreground">{t("dashboard.pendingApproved")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.completedLends")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedLends}</div>
            <p className="text-xs text-muted-foreground">{t("dashboard.successfullyCompleted")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.tierProgress")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge className={TIER_COLORS[profile?.tier || "bronze"]}>{profile?.tier || "Bronze"}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{t("dashboard.currentTierStatus")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Tier Card */}
        <div className="lg:col-span-1">{profile && <UserTierCard profile={profile} />}</div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="requests" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="requests">Recent Requests</TabsTrigger>
                  <TabsTrigger value="items">My Items</TabsTrigger>
                </TabsList>

                <TabsContent value="requests" className="mt-4">
                  <div className="space-y-4">
                    {recentRequests.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No requests yet</p>
                    ) : (
                      recentRequests.map((request) => (
                        <div key={request.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={request.borrower.avatar_url || ""} />
                            <AvatarFallback>{request.borrower.full_name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium truncate">{request.borrower.full_name}</p>
                              <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 truncate">wants to borrow "{request.items.title}"</p>
                            <p className="text-xs text-gray-500">{format(new Date(request.created_at), "MMM d, yyyy")}</p>
                          </div>

                          <ItemTierBadge tier={request.items.tier} />
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="items" className="mt-4">
                  <div className="space-y-4">
                    {myItems.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No items added yet</p>
                    ) : (
                      myItems.slice(0, 5).map((item) => (
                        <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-lg">📦</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium truncate">{item.title}</p>
                              <ItemTierBadge tier={item.tier} />
                            </div>
                            <p className="text-sm text-gray-600 truncate">{item.category}</p>
                            <p className="text-xs text-gray-500">📍 {item.location}</p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-medium">${item.purchase_price}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
