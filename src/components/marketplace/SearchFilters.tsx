"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { useTranslations } from "@/contexts/TranslationContext";

interface SearchFiltersProps {
  onSearch: (query: string) => void;
  onCategoryFilter: (category: string | null) => void;
  onTierFilter: (tier: string | null) => void;
  onLocationFilter: (location: string) => void;
  onPriceRangeFilter: (min: number | null, max: number | null) => void;
  searchQuery: string;
  selectedCategory: string | null;
  selectedTier: string | null;
  locationFilter: string;
  priceRange: { min: number | null; max: number | null };
}

// Categories and tiers will be defined inside the component to use translations

export function SearchFilters({
  onSearch,
  onCategoryFilter,
  onTierFilter,
  onLocationFilter,
  onPriceRangeFilter,
  searchQuery,
  selectedCategory,
  selectedTier,
  locationFilter,
  priceRange,
}: SearchFiltersProps) {
  const { t } = useTranslations();
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [localLocation, setLocalLocation] = useState(locationFilter);
  const [minPrice, setMinPrice] = useState(priceRange.min?.toString() || "");
  const [maxPrice, setMaxPrice] = useState(priceRange.max?.toString() || "");

  const CATEGORIES = [
    { value: "Electronics", label: t('marketplace.categories.electronics') },
    { value: "Tools", label: t('marketplace.categories.tools') },
    { value: "Sports", label: t('marketplace.categories.sports') },
    { value: "Books", label: t('marketplace.categories.books') },
    { value: "Clothing", label: t('marketplace.categories.clothing') },
    { value: "Home & Garden", label: t('marketplace.categories.homeGarden') },
    { value: "Automotive", label: t('marketplace.categories.automotive') },
    { value: "Other", label: t('marketplace.categories.other') }
  ];

  const ITEM_TIER_VALUES = [
    { value: "Bronze", label: t('marketplace.basic') },
    { value: "Silver", label: t('marketplace.premium') },
    { value: "Gold", label: t('marketplace.luxury') },
    { value: "Platinum", label: t('marketplace.exclusive') }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearchQuery);
  };

  const handleLocationSearch = () => {
    onLocationFilter(localLocation);
  };

  const handlePriceFilter = () => {
    const min = minPrice ? parseFloat(minPrice) : null;
    const max = maxPrice ? parseFloat(maxPrice) : null;
    onPriceRangeFilter(min, max);
  };

  const clearFilters = () => {
    setLocalSearchQuery("");
    setLocalLocation("");
    setMinPrice("");
    setMaxPrice("");
    onSearch("");
    onCategoryFilter(null);
    onTierFilter(null);
    onLocationFilter("");
    onPriceRangeFilter(null, null);
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedTier || locationFilter || priceRange.min || priceRange.max;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder={t("marketplace.searchPlaceholder")}
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-10 h-11 text-base touch-manipulation"
          />
        </div>
        <Button type="submit" className="h-11 touch-manipulation">
          <Search className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{t("marketplace.search")}</span>
          <span className="sm:hidden">Go</span>
        </Button>
      </form>

      {/* Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Category Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("marketplace.category")}</label>
          <Select value={selectedCategory || ""} onValueChange={(value) => onCategoryFilter(value || null)}>
            <SelectTrigger className="h-11 touch-manipulation">
              <SelectValue placeholder={t("marketplace.allCategories")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("marketplace.allCategories")}</SelectItem>
              {CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tier Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("marketplace.itemTier")}</label>
          <Select value={selectedTier || ""} onValueChange={(value) => onTierFilter(value || null)}>
            <SelectTrigger className="h-11 touch-manipulation">
              <SelectValue placeholder={t("marketplace.allTiers")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("marketplace.allTiers")}</SelectItem>
              {ITEM_TIER_VALUES.map((tier) => (
                  <SelectItem key={tier.value} value={tier.value}>
                    {tier.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("marketplace.location")}</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="text"
              placeholder="Enter location..."
              value={localLocation}
              onChange={(e) => setLocalLocation(e.target.value)}
              className="h-11 text-base touch-manipulation flex-1"
            />
            <Button variant="outline" onClick={handleLocationSearch} className="h-11 touch-manipulation sm:w-auto">
              Apply
            </Button>
          </div>
        </div>

        {/* Price Range Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("marketplace.priceRange")}</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-1">
              <Input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="h-11 text-base touch-manipulation flex-1 min-w-0" />
              <span className="self-center text-sm">-</span>
              <Input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="h-11 text-base touch-manipulation flex-1 min-w-0" />
            </div>
            <Button variant="outline" onClick={handlePriceFilter} className="h-11 touch-manipulation sm:w-auto">
              Apply
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium">Active filters:</span>
          {searchQuery && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: {searchQuery}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onSearch("")} />
            </Badge>
          )}
          {selectedCategory && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {selectedCategory}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onCategoryFilter(null)} />
            </Badge>
          )}
          {selectedTier && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {selectedTier} tier
              <X className="h-3 w-3 cursor-pointer" onClick={() => onTierFilter(null)} />
            </Badge>
          )}
          {locationFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              📍 {locationFilter}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onLocationFilter("")} />
            </Badge>
          )}
          {(priceRange.min || priceRange.max) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              ${priceRange.min || 0} - ${priceRange.max || "∞"}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onPriceRangeFilter(null, null)} />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
