import { Composition } from 'remotion';
import { Intro } from './Intro';

export const RemotionRoot = () => (
  <Composition id="Intro" component={Intro} durationInFrames={180} fps={30} width={1920} height={1080} />
);
