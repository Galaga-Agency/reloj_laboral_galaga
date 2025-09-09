import { useSyncExternalStore } from "react";
import { deviceStore } from "@/utils/device";

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  windowDimensions: {
    width: number;
    height: number;
  };
}

export function useDeviceDetect(): DeviceInfo {
  const deviceInfo = useSyncExternalStore(
    deviceStore.subscribe,
    deviceStore.getSnapshot,
    deviceStore.getServerSnapshot
  );

  return deviceInfo;
}

export default useDeviceDetect;
