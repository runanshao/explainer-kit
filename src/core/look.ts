/** A "look" is how the shell dresses a scene. Style packs export one; core never imports a pack. */
import type React from 'react';

export type ChapterProps = {
  /** scene-local frame */
  f: number;
  /** lead-in frames before narration (the card fades out at the end of it) */
  lead: number;
  /** text before " · " in the scene's chapter string */
  kicker: string;
  /** text after " · " */
  title: string;
};

export type SubtitleStyle = {
  /** px from the bottom edge */
  bottom: number;
  /** if set, subtitles are vertically centred in a band of this height (e.g. a letterbox bar) */
  height?: number;
  /** translucent pill behind the line */
  box?: boolean;
  /** dim characters until the narrator reaches them */
  karaoke?: boolean;
  size?: number;
  color?: string;
  /** lines read by an alternate voice (<<key|...>>) are set in serif, this colour, with 「」 */
  quoteColor?: string;
  /** background of the pill when `box` is set */
  boxColor?: string;
  /** opacity of not-yet-spoken characters in karaoke mode */
  dim?: number;
  /** don't subtitle alternate-voice lines (when the scene already shows the quote big on screen) */
  hideQuotes?: boolean;
};

export type Look = {
  /** under the scene */
  background?: React.FC;
  /** over the scene picture, fades out with it (grain, vignette) */
  overlay?: React.FC;
  /** always on top of picture and chapter card, under subtitles (letterbox bars) */
  frame?: React.FC;
  /** chapter card shown during the lead-in when lead > 30 frames; null = never */
  chapter?: React.FC<ChapterProps> | null;
  subtitles?: SubtitleStyle;
  /** canvas colour behind everything */
  base?: string;
};

export type SceneDef = {
  component: React.FC;
  look?: Look;
  /** per-scene tweaks merged over the look's subtitle style */
  subtitles?: Partial<SubtitleStyle>;
};
