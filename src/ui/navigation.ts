export type ScreenId = 'menu' | 'levels' | 'difficulty' | 'skins' | 'settings' | 'game';

export interface Navigate {
  go: (screen: ScreenId) => void;
  play: (levelIndex: number) => void;
}
