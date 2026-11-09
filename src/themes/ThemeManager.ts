import { audio } from '../core/audio';
import { progress } from '../core/progress';
import { getTheme } from './index';
import type { ThemeConfig, ThemeId } from './types';

/**
 * Owns the active theme: persists the choice through the progress store and
 * applies global side effects (document `data-theme` for CSS, audio profile).
 */
class ThemeManager {
  private applied: ThemeId | null = null;

  current(): ThemeConfig {
    return getTheme(progress.getState().theme);
  }

  select(id: ThemeId) {
    progress.setTheme(id);
    this.apply();
  }

  /** Idempotent; call on startup and whenever the saved theme may have changed. */
  apply() {
    const theme = this.current();
    if (this.applied === theme.id) return;
    this.applied = theme.id;
    document.documentElement.dataset.theme = theme.id;
    audio.setProfile(theme.sound);
  }
}

export const themeManager = new ThemeManager();
