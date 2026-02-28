import { useMemo } from 'react';

interface DeviceCapability {
  /** Number of logical CPU cores (0 if unavailable) */
  cores: number;
  /** Device memory in GB (0 if unavailable) */
  memoryGB: number;
  /** Whether this appears to be a low-end device */
  isLowEnd: boolean;
  /** Suggested performance tier: 'low' | 'mid' | 'high' */
  tier: 'low' | 'mid' | 'high';
}

/**
 * Detects device capability for adapting animation complexity.
 * Uses navigator.hardwareConcurrency and navigator.deviceMemory
 * where available (deviceMemory is Chrome-only).
 *
 * Low-end: <= 4 cores or <= 4 GB RAM
 * Mid:     5-7 cores and > 4 GB RAM
 * High:    8+ cores and > 4 GB RAM
 */
export function useDeviceCapability(): DeviceCapability {
  return useMemo(() => {
    const cores = navigator.hardwareConcurrency || 0;
    const memoryGB = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 0;

    // Determine tier
    const isLowCores = cores > 0 && cores <= 4;
    const isLowMemory = memoryGB > 0 && memoryGB <= 4;

    // If we have data and it indicates low-end
    const isLowEnd = isLowCores || isLowMemory;

    let tier: 'low' | 'mid' | 'high' = 'high';
    if (isLowEnd) {
      tier = 'low';
    } else if (cores > 0 && cores < 8) {
      tier = 'mid';
    }

    return { cores, memoryGB, isLowEnd, tier };
  }, []);
}
