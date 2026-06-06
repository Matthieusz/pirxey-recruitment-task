import { useSyncExternalStore } from "react";

type PlatformListener = () => void;

let platformSnapshot: boolean | null = null;
const platformListeners = new Set<PlatformListener>();

const computePlatform = (): boolean => {
  if (typeof navigator === "undefined") {
    return false;
  }
  return navigator.userAgent.toLowerCase().includes("mac");
};

const notifyPlatformListeners = (): void => {
  for (const listener of platformListeners) {
    listener();
  }
};

const subscribeToPlatform = (listener: PlatformListener) => {
  platformListeners.add(listener);
  if (platformSnapshot === null) {
    platformSnapshot = computePlatform();
    queueMicrotask(notifyPlatformListeners);
  }
  return () => {
    platformListeners.delete(listener);
  };
};

const getPlatformSnapshot = (): boolean => platformSnapshot ?? false;

const getServerPlatformSnapshot = (): boolean => false;

export const useIsMac = (): boolean =>
  useSyncExternalStore(
    subscribeToPlatform,
    getPlatformSnapshot,
    getServerPlatformSnapshot
  );
