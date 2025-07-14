// This file has been removed as part of the authentication refactor.
// All tools now require real authentication instead of soft limits.
// See AuthGuard component and ModernLogin page for the new authentication flow.

// Placeholder functions for backward compatibility during transition
export const useSoftLimit = () => ({
  state: { isChecking: false, shouldShow: false, usageInfo: null, error: null },
  checkLimit: async () => true,
  showModal: false,
  setShowModal: () => {},
  onAuthSuccess: () => {},
  resetLimit: () => {},
});

export const useRewardBanner = () => ({
  showBanner: false,
  conversionInfo: null,
  closeBanner: () => {},
});

export const useUsageTracking = () => ({
  trackToolUsage: () => {},
});
