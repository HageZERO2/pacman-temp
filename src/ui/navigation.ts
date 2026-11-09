export type ScreenId = 'menu' | 'levels' | 'difficulty' | 'skins' | 'themes' | 'settings' | 'game';

export interface Navigate {
  go: (screen: ScreenId) => void;
  play: (levelIndex: number) => void;
}
