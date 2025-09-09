/**
 * Reliable device detection utilities based on screen size and user agent
 */

export const getWindowDimensions = (): { width: number; height: number } => {
  if (typeof window === "undefined") {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

export const isMobile = (): boolean => {
  if (typeof window === "undefined") return false;

  const width = window.innerWidth;
  const userAgent = navigator.userAgent.toLowerCase();

  // Check screen width first (most reliable)
  if (width < 768) return true;

  // Check user agent for mobile keywords
  const mobileKeywords = [
    "android",
    "iphone",
    "ipod",
    "blackberry",
    "windows phone",
    "mobile",
    "opera mini",
    "iemobile",
  ];

  return mobileKeywords.some((keyword) => userAgent.includes(keyword));
};

export const isTablet = (): boolean => {
  if (typeof window === "undefined") return false;

  const width = window.innerWidth;
  const userAgent = navigator.userAgent.toLowerCase();
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Check for tablet keywords in user agent
  const tabletKeywords = ["ipad", "tablet", "kindle", "playbook", "silk"];
  const hasTabletKeyword = tabletKeywords.some((keyword) =>
    userAgent.includes(keyword)
  );

  // Real iPad detection (not simulator)
  const isIPad =
    /ipad/.test(userAgent) ||
    (navigator.platform === "MacIntel" &&
      navigator.maxTouchPoints > 1 &&
      !userAgent.includes("chrome"));

  // Only consider Mac as tablet if it's actually an iPad masquerading as Mac
  // AND has touch AND is in typical tablet size range
  const isPossibleIPadPro =
    navigator.platform === "MacIntel" &&
    navigator.maxTouchPoints > 1 &&
    width >= 1024 &&
    width <= 1366 &&
    !userAgent.includes("chrome"); // Chrome on Mac will report touch but isn't iPad

  // Size-based detection for touch devices (but exclude large screens that are likely desktops)
  const isTabletSize = width >= 768 && width <= 1024 && isTouch;

  // Force tablet detection for explicit tablet resolutions with touch
  const commonTabletSizes = [768, 1024]; // Only common actual tablet sizes
  const isCommonTabletSize =
    isTouch && commonTabletSizes.some((size) => Math.abs(width - size) <= 50);

  return (
    hasTabletKeyword ||
    isIPad ||
    isPossibleIPadPro ||
    isTabletSize ||
    isCommonTabletSize
  );
};

export const isDesktop = (): boolean => {
  if (typeof window === "undefined") return true;

  const width = window.innerWidth;
  const userAgent = navigator.userAgent.toLowerCase();

  // Desktop if:
  // 1. Large screen (1440+) OR
  // 2. Screen >= 1025px AND not detected as mobile/tablet AND not touch device OR
  // 3. Explicit desktop indicators (Mac/Windows without touch)
  const hasDesktopUA =
    userAgent.includes("macintosh") || userAgent.includes("windows nt");
  const isLargeScreen = width >= 1440;
  const isMediumScreenNonTouch =
    width >= 1025 && !isTouchDevice() && !isMobile() && !isTablet();

  return (
    isLargeScreen ||
    isMediumScreenNonTouch ||
    (hasDesktopUA && width >= 1025 && !isTablet())
  );
};

export const isTouchDevice = (): boolean => {
  if (typeof window === "undefined") return false;

  const width = window.innerWidth;
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const userAgent = navigator.userAgent.toLowerCase();

  // Don't consider Mac desktops as touch devices unless they're actually iPads
  if (
    userAgent.includes("macintosh") &&
    width >= 1440 &&
    !userAgent.includes("ipad")
  ) {
    return false;
  }

  // Touch if has touch capability AND is in mobile/tablet size range
  return hasTouch && width < 1440;
};

// External store for instant updates
let listeners = new Set<() => void>();
let cachedSnapshot: any = null;

const SERVER_SNAPSHOT = {
  isMobile: true,
  isTablet: false,
  isDesktop: false,
  isTouchDevice: false,
  windowDimensions: { width: 0, height: 0 },
};

const deviceStore = {
  getSnapshot(): {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isTouchDevice: boolean;
    windowDimensions: { width: number; height: number };
  } {
    const newSnapshot = {
      isMobile: isMobile(),
      isTablet: isTablet(),
      isDesktop: isDesktop(),
      isTouchDevice: isTouchDevice(),
      windowDimensions: getWindowDimensions(),
    };

    // Only update cache if values actually changed
    if (
      !cachedSnapshot ||
      cachedSnapshot.isMobile !== newSnapshot.isMobile ||
      cachedSnapshot.isTablet !== newSnapshot.isTablet ||
      cachedSnapshot.isDesktop !== newSnapshot.isDesktop ||
      cachedSnapshot.isTouchDevice !== newSnapshot.isTouchDevice ||
      cachedSnapshot.windowDimensions.width !==
        newSnapshot.windowDimensions.width ||
      cachedSnapshot.windowDimensions.height !==
        newSnapshot.windowDimensions.height
    ) {
      cachedSnapshot = newSnapshot;
    }

    return cachedSnapshot;
  },

  getServerSnapshot() {
    return SERVER_SNAPSHOT;
  },

  subscribe(listener: () => void) {
    if (typeof window === "undefined") return () => {};

    listeners.add(listener);

    if (listeners.size === 1) {
      let timeoutId: NodeJS.Timeout;
      const debouncedUpdate = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          listeners.forEach((l) => l());
        }, 100);
      };

      window.addEventListener("resize", debouncedUpdate);

      (deviceStore as any)._cleanup = () => {
        window.removeEventListener("resize", debouncedUpdate);
        clearTimeout(timeoutId);
      };
    }

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && (deviceStore as any)._cleanup) {
        (deviceStore as any)._cleanup();
      }
    };
  },
};

export { deviceStore };
