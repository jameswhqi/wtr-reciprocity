import { Reducer as R, StateSource } from '@cycle/state';
import { always, equals } from 'ramda';
import xs, { Stream as S } from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import sc from 'xstream/extra/sampleCombine';
import { black, grays, white } from '../colors';
import { CanvasElement, CanvasMouseEvent } from '../drivers/canvas';
import { elementsToTargets, mouseInRegion, strictR, Target } from '../utils';

export interface Props {
  show: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  text: string;
}
export interface State {
  mouseOver: boolean;
  mouseDownHere: boolean;
  mouseDownElsewhere: boolean;
}
export type TargetName = typeof targets[number];
interface Value {
  targets: Target<TargetName>[];
}
export interface EventOut {
  kind: 'clicked';
}
interface Sources {
  canvas: S<CanvasMouseEvent>;
  state: StateSource<State>;
  props: S<Props>;
}
export interface Sinks {
  canvas: S<CanvasElement[]>;
  state: S<R<State>>;
  event: S<EventOut>;
  value: S<Value>;
}

const targets = ['button'] as const;

const defaultState: State = {
  mouseOver: false,
  mouseDownHere: false,
  mouseDownElsewhere: false
};

export function Button(sources: Sources): Sinks {
  // intent
  const canvasMouseE$ = sources.canvas;
  const state$ = sources.state.stream;
  const props$ = sources.props;

  // model
  const initR$ = xs.of(always<State>(defaultState));
  const hideR$ = props$
    .compose(dropRepeats<Props>(equals))
    .map(p => strictR<State>(s => {
      if (p.show) {
        return s;
      } else {
        return defaultState;
      }
    }));
  const mouseR$ = canvasMouseE$
    .compose(sc(props$))
    .filter(([_, p]) => p.show)
    .map(([e, p]) => strictR<State>(s => {
      const mouseOver = mouseInRegion(e, p);
      switch (e.kind) {
        case 'mousemove':
          if (s.mouseDownHere || s.mouseDownElsewhere) {
            return s;
          } else {
            return { ...s, mouseOver };
          }
        case 'mousedown':
          return { ...s, mouseDownHere: mouseOver, mouseDownElsewhere: !mouseOver };
        case 'mouseup':
          return { mouseDownHere: false, mouseDownElsewhere: false, mouseOver: mouseOver && !s.mouseDownHere };
      }
    }));

  // view
  const canvas$ = xs.combine(props$, state$).map(([p, s]) => (p.show ? [{
    name: 'button',
    kind: 'rect' as const,
    layer: 20,
    ...p,
    stroke: black,
    strokeWidth: 2,
    fill: s.mouseDownHere ? grays[4] : (s.mouseOver ? grays[2] : white)
  }, {
    kind: 'text' as const,
    layer: 21,
    ...p,
    fontSize: p.fontSize || 24,
    textColor: black
  }] : []) as CanvasElement[]);

  const targets$ = canvas$.map(elementsToTargets(targets));

  const clickE$ = canvasMouseE$
    .compose(sc(state$, props$))
    .filter(([e, s, p]) => e.kind === 'mouseup' && p.show && mouseInRegion(e, p) && s.mouseDownHere)
    .mapTo({ kind: 'clicked' as const });

  return {
    canvas: canvas$,
    state: xs.merge(initR$, hideR$, mouseR$),
    event: clickE$,
    value: targets$.map(ts => ({ targets: ts }))
  };
}
