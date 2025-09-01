// Tier calculation utilities

export type UserTier = "bronze" | "silver" | "gold" | "platinum";
export type ItemTier = "basic" | "premium" | "luxury" | "exclusive";

// User tier thresholds based on lending activity
export const USER_TIER_THRESHOLDS = {
  bronze: 0,
  silver: 5,
  gold: 20,
  platinum: 50,
} as const;

// Item tier thresholds based on purchase price
export const ITEM_TIER_THRESHOLDS = {
  basic: 0,
  premium: 100,
  luxury: 500,
  exclusive: 2000,
} as const;

// Tier colors for UI
export const TIER_COLORS = {
  // User tiers
  bronze: "bg-amber-600 text-white",
  silver: "bg-gray-400 text-white",
  gold: "bg-yellow-500 text-white",
  platinum: "bg-purple-600 text-white",
  // Item tiers
  basic: "bg-blue-500 text-white",
  premium: "bg-green-600 text-white",
  luxury: "bg-red-600 text-white",
  exclusive: "bg-black text-white",
} as const;

// Tier benefits description
export const TIER_BENEFITS = {
  bronze: {
    name: "Bronze",
    description: "Starting tier for new users",
    benefits: ["Basic borrowing privileges", "Standard support"],
  },
  silver: {
    name: "Silver",
    description: "Achieved after 5 successful lendings",
    benefits: ["Priority in borrow requests", "Extended borrowing periods", "Email support"],
  },
  gold: {
    name: "Gold",
    description: "Achieved after 20 successful lendings",
    benefits: ["Access to premium items", "Reduced security deposits", "Phone support"],
  },
  platinum: {
    name: "Platinum",
    description: "Achieved after 50 successful lendings",
    benefits: ["Access to exclusive items", "No security deposits", "Priority support", "Special recognition"],
  },
} as const;

export const ITEM_TIER_INFO = {
  basic: {
    name: "Basic",
    description: "Items under $100",
    color: "blue",
  },
  premium: {
    name: "Premium",
    description: "Items $100 - $499",
    color: "green",
  },
  luxury: {
    name: "Luxury",
    description: "Items $500 - $1,999",
    color: "red",
  },
  exclusive: {
    name: "Exclusive",
    description: "Items $2,000+",
    color: "black",
  },
} as const;

/**
 * Calculate user tier based on lending activity
 */
export function calculateUserTier(itemsLent: number): UserTier {
  if (itemsLent >= USER_TIER_THRESHOLDS.platinum) return "platinum";
  if (itemsLent >= USER_TIER_THRESHOLDS.gold) return "gold";
  if (itemsLent >= USER_TIER_THRESHOLDS.silver) return "silver";
  return "bronze";
}

/**
 * Calculate item tier based on purchase price
 */
export function calculateItemTier(purchasePrice: number): ItemTier {
  if (purchasePrice >= ITEM_TIER_THRESHOLDS.exclusive) return "exclusive";
  if (purchasePrice >= ITEM_TIER_THRESHOLDS.luxury) return "luxury";
  if (purchasePrice >= ITEM_TIER_THRESHOLDS.premium) return "premium";
  return "basic";
}

/**
 * Get next tier and progress for user
 */
export function getUserTierProgress(itemsLent: number) {
  const currentTier = calculateUserTier(itemsLent);

  let nextTier: UserTier | null = null;
  let nextTierThreshold = 0;
  let progress = 0;

  switch (currentTier) {
    case "bronze":
      nextTier = "silver";
      nextTierThreshold = USER_TIER_THRESHOLDS.silver;
      progress = (itemsLent / nextTierThreshold) * 100;
      break;
    case "silver":
      nextTier = "gold";
      nextTierThreshold = USER_TIER_THRESHOLDS.gold;
      progress = ((itemsLent - USER_TIER_THRESHOLDS.silver) / (nextTierThreshold - USER_TIER_THRESHOLDS.silver)) * 100;
      break;
    case "gold":
      nextTier = "platinum";
      nextTierThreshold = USER_TIER_THRESHOLDS.platinum;
      progress = ((itemsLent - USER_TIER_THRESHOLDS.gold) / (nextTierThreshold - USER_TIER_THRESHOLDS.gold)) * 100;
      break;
    case "platinum":
      nextTier = null;
      progress = 100;
      break;
  }

  return {
    currentTier,
    nextTier,
    nextTierThreshold,
    progress: Math.min(progress, 100),
    itemsLent,
  };
}

/**
 * Check if user can borrow item based on tier restrictions
 */
export function canUserBorrowItem(userTier: UserTier, itemTier: ItemTier): boolean {
  const userTierLevel = Object.keys(USER_TIER_THRESHOLDS).indexOf(userTier);
  const itemTierLevel = Object.keys(ITEM_TIER_THRESHOLDS).indexOf(itemTier);

  // Basic items: all users can borrow
  if (itemTier === "basic") return true;

  // Premium items: silver and above
  if (itemTier === "premium") return userTierLevel >= 1;

  // Luxury items: gold and above
  if (itemTier === "luxury") return userTierLevel >= 2;

  // Exclusive items: platinum only
  if (itemTier === "exclusive") return userTierLevel >= 3;

  return false;
}
