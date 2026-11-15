import { Composition } from 'remotion';
import { Intro } from './Intro';
import { Promo, PROMO_FRAMES } from './Promo';

export const RemotionRoot = () => (
  <>
    <Composition id="Intro" component={Intro} durationInFrames={180} fps={30} width={1920} height={1080} />
    <Composition id="Promo" component={Promo} durationInFrames={PROMO_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
