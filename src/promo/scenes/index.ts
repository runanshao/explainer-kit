/** Promo scene registry: id (as in promo/promo.json) → component. Order and timing come from promo.json. */
import type React from 'react';
import {P1} from './p1';
import {P2} from './p2';
import {P3} from './p3';
import {P4} from './p4';
import {P5} from './p5';
import {P6} from './p6';
import {P7} from './p7';

export const PROMO_SCENES: Record<string, React.FC> = {p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7};
