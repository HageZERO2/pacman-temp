import { Garland } from '../components/Garland';
import { Snowfall } from '../components/Snowfall';
import { WinterScene } from '../components/WinterScene';
import type { BackdropProps } from './types';

export default function ChristmasBackdrop({ dimmed, calm }: BackdropProps) {
  return (
    <>
      <div className="backdrop__sky" />
      <div className="backdrop__aurora" />
      <div className="backdrop__moon" />
      <WinterScene />
      <Snowfall density={calm ? 0.25 : dimmed ? 0.5 : 1} />
      {!dimmed && <Garland />}
    </>
  );
}
