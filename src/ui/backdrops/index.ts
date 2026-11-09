import type { ComponentType } from 'react';
import type { ThemeId } from '../../themes/types';
import ChristmasBackdrop from './ChristmasBackdrop';
import CyberpunkBackdrop from './CyberpunkBackdrop';
import PixelBackdrop from './PixelBackdrop';
import VoxelBackdrop from './VoxelBackdrop';
import type { BackdropProps } from './types';

/** Animated full-screen scenery per theme (the React-side asset of a theme). */
export const BACKDROPS: Record<ThemeId, ComponentType<BackdropProps>> = {
  christmas: ChristmasBackdrop,
  cyberpunk: CyberpunkBackdrop,
  voxel: VoxelBackdrop,
  pixel: PixelBackdrop,
};
