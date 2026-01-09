/**
 * Global trigger for auth banner
 * Used by axios interceptor (outside React tree)
 */
let authBannerTrigger: (() => void) | null = null;

export const setAuthBannerTrigger = (trigger: () => void) => {
  authBannerTrigger = trigger;
};

export const triggerAuthBanner = () => {
  if (authBannerTrigger) {
    authBannerTrigger();
  }
};
