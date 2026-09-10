import { useMemo } from 'react';
import { Platform, StatusBar, useWindowDimensions } from 'react-native';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Safe-area insets that stay valid across iOS/Android, gesture nav, and
 * 3-button nav. Android 15+ edge-to-edge can briefly report huge or zero
 * insets when the system bar mode changes; we clamp so chrome never
 * collapses the screen to a blank view.
 */
export function useAppInsets() {
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();
  const window = useWindowDimensions();

  return useMemo(() => {
    const height = Math.max(frame.height, window.height, 1);
    const width = Math.max(frame.width, window.width, 1);
    const maxTop = Math.min(80, height * 0.18);
    const maxBottom = Math.min(64, height * 0.18);

    let top = Number.isFinite(insets.top) ? insets.top : 0;
    let bottom = Number.isFinite(insets.bottom) ? insets.bottom : 0;
    const left = Number.isFinite(insets.left) ? insets.left : 0;
    const right = Number.isFinite(insets.right) ? insets.right : 0;

    if (Platform.OS === 'android' && top <= 0) {
      top = StatusBar.currentHeight ?? 0;
    }

    return {
      top: clamp(top, 0, maxTop),
      bottom: clamp(bottom, 0, maxBottom),
      left: clamp(left, 0, 48),
      right: clamp(right, 0, 48),
      width,
      height,
    };
  }, [
    insets.top,
    insets.bottom,
    insets.left,
    insets.right,
    frame.height,
    frame.width,
    window.height,
    window.width,
  ]);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
