/**
 * Social Jukebox Pricing Configuration
 * 
 * Monetization tiers:
 * - Group size limits
 * - Music source access (Spotify/Apple Music)
 * - Persistent room hosting
 */

export const PLANS = {
  free: {
    name: "Free",
    maxGuests: 5,
    spotifyEnabled: false,
    appleMusicEnabled: false,
    persistentRooms: false,
    maxRoomDurationMinutes: 60,
    priceMonthly: 0,
    stripePriceId: null,
  },
  pro: {
    name: "Pro",
    maxGuests: 50,
    spotifyEnabled: true,
    appleMusicEnabled: true,
    persistentRooms: true,
    maxRoomDurationMinutes: 480, // 8 hours
    priceMonthly: 9.99,
    stripePriceId: "price_spindeck_pro",
  },
  host: {
    name: "Host",
    maxGuests: 200,
    spotifyEnabled: true,
    appleMusicEnabled: true,
    persistentRooms: true,
    maxRoomDurationMinutes: 0, // unlimited
    priceMonthly: 24.99,
    stripePriceId: "price_spindeck_host",
  },
};

export type Plan = keyof typeof PLANS;

// Feature flags for gradual rollout
export const FEATURES = {
  enableSpotify: true,
  enableAppleMusic: true,
  enablePersistentRooms: true,
  enableGroupSizePricing: true,
  enableStripeBilling: false,
};

/**
 * Check if user can add more guests
 */
export function canAddGuest(currentGuestCount, plan) {
  return currentGuestCount < PLANS[plan].maxGuests;
}

/**
 * Check if user can use Spotify
 */
export function canUseSpotify(plan) {
  return PLANS[plan].spotifyEnabled && FEATURES.enableSpotify;
}

/**
 * Check if user can use Apple Music
 */
export function canUseAppleMusic(plan) {
  return PLANS[plan].appleMusicEnabled && FEATURES.enableAppleMusic;
}

/**
 * Check if user can create persistent rooms
 */
export function canCreatePersistentRoom(plan) {
  return PLANS[plan].persistentRooms && FEATURES.enablePersistentRooms;
}

/**
 * Get upgrade recommendation
 */
export function getUpgradePlan(currentPlan, reason) {
  const planOrder = ["free", "pro", "host"];
  const currentIndex = planOrder.indexOf(currentPlan);
  
  switch (reason) {
    case "guest_limit":
      return currentPlan === "free" ? "pro" : currentPlan === "pro" ? "host" : null;
    case "spotify":
    case "apple_music":
    case "persistent_room":
      return currentPlan === "free" ? "pro" : null;
    default:
      return null;
  }
}