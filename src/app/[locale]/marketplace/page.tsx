"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations, useLocale } from "@/contexts/TranslationContext";
import { ItemCard } from "@/components/marketplace/ItemCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from "@/lib/supabase";
import { canUserBorrowItem } from "@/lib/tiers";
import Link from "next/link";

type Item = Database["public"]["Tables"]["items"]["Row"] & {
  users: Database["public"]["Tables"]["users"]["Row"];
};

export default function MarketplacePage() {
  const { user, profile } = useAuth();
  const t = useTranslations();
  const locale = useLocale();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");

  useEffect(() => {
    fetchItems();
  }, [searchTerm, categoryFilter, tierFilter, sortBy]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("items")
        .select(
          `
          *,
          users!items_owner_id_fkey(*)
        `
        )
        .eq("is_available", true);

      // Apply filters
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }

      if (tierFilter !== "all") {
        query = query.eq("tier", tierFilter);
      }

      // Apply sorting
      if (sortBy === "price_asc") {
        query = query.order("purchase_price", { ascending: true });
      } else if (sortBy === "price_desc") {
        query = query.order("purchase_price", { ascending: false });
      } else {
        query = query.order(sortBy, { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    t("common.categories.electronics"),
    t("common.categories.tools"),
    t("common.categories.sports"),
    t("common.categories.books"),
    t("common.categories.clothing"),
    t("common.categories.homeGarden"),
    t("common.categories.automotive"),
    t("common.categories.other"),
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t("common.welcomeTitle")}</h1>
          <p className="text-gray-600 mb-6">{t("common.welcomeSubtitle")}</p>
          <Button asChild>
            <Link href={`/${locale}/auth`}>{t("auth.signIn")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  console.log("test ->", t("marketplace.title"));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("marketplace.title")}</h1>
          <p className="text-gray-600 mt-2">{t("marketplace.subtitle")}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/my-items`}>{t("marketplace.listItem")}</Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input placeholder={t("marketplace.searchPlaceholder")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t("marketplace.category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("marketplace.allCategories")}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t("marketplace.itemTier")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("marketplace.allTiers")}</SelectItem>
              <SelectItem value="basic">{t("common.basic")}</SelectItem>
              <SelectItem value="premium">{t("common.premium")}</SelectItem>
              <SelectItem value="luxury">{t("common.luxury")}</SelectItem>
              <SelectItem value="exclusive">{t("common.exclusive")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t("marketplace.sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">{t("common.newestFirst")}</SelectItem>
              <SelectItem value="price_asc">{t("common.priceLowHigh")}</SelectItem>
              <SelectItem value="price_desc">{t("common.priceHighLow")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-80" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">{t("marketplace.noItemsFound")}</p>
          <Button asChild className="mt-4">
            <Link href={`/${locale}/my-items`}>{t("marketplace.beFirstToList")}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => {
            const canBorrow = profile ? canUserBorrowItem(profile.tier, item.tier) : false;
            return <ItemCard key={item.id} item={item} owner={item.users} canBorrow={canBorrow} currentUserId={user?.id} />;
          })}
        </div>
      )}
    </div>
  );
}
