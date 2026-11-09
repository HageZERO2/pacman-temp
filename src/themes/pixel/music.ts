import type { SoundProfile } from '../../core/audio';

// Original chiptunes: a bouncy C-major attract loop and a driving A-minor stage theme.
export const pixelSound: SoundProfile = {
  voice: 'chip',
  music: {
    menu: {
      bpm: 138,
      melody: [
        72, 76, 79, 84, 83, 79, 76, 79,
        81, null, 76, null, 72, 76, 81, null,
        77, 81, 84, 81, 77, null, 72, null,
        79, 83, 86, 83, 79, null, null, null,
        84, null, 79, 76, 79, 84, 88, null,
        86, 84, 81, null, 76, null, 81, null,
        77, 81, 86, 81, 77, 74, 77, 81,
        79, null, 74, null, 71, 74, 79, null,
      ],
      chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62], [60, 64, 67], [57, 60, 64], [50, 53, 57], [55, 59, 62]],
      bass: [48, 45, 41, 43, 48, 45, 50, 43],
      shaker: false,
    },
    game: {
      bpm: 168,
      melody: [
        69, 72, 76, 72, 81, 76, 72, 76,
        77, 72, 69, 72, 77, 81, 84, 81,
        79, 76, 72, 76, 84, 79, 76, 79,
        83, 79, 74, 79, 86, 83, 79, null,
        81, null, 81, 83, 84, null, 83, 81,
        77, null, 77, 79, 81, null, 79, 77,
        79, 81, 83, 84, 86, 84, 83, 79,
        80, null, 76, null, 80, 83, 88, null,
      ],
      chords: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 56, 59]],
      bass: [45, 41, 48, 43, 45, 41, 43, 40],
      shaker: true,
      kick: true,
    },
  },
};
