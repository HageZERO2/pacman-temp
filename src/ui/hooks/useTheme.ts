import { getTheme } from '../../themes';
import type { ThemeConfig } from '../../themes/types';
import { useProgress } from './useProgress';

/** The active theme, re-rendering when the player switches it. */
export function useTheme(): ThemeConfig {
  return getTheme(useProgress().theme);
}
