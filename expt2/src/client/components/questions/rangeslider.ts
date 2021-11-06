import { div, MainDOMSource, VNode } from '@cycle/dom';
import { Reducer as R, StateSource } from '@cycle/state';
import { percent } from 'csx';
import { addIndex, always, map, max, min, unnest } from 'ramda';
import { style } from 'typestyle';
import xs, { Stream as S } from 'xstream';
import sc from 'xstream/extra/sampleCombine';
import { sQuestionLabel } from '../../config';
import { strictR } from '../../utils';

interface Props {
  show: boolean;
}
export interface State {
  value: number;
  touched: boolean;
  mouseOver: boolean;
  mouseDownHere: boolean;
  mouseDownElsewhere: boolean;
}
interface Value {
  error: boolean;
}
interface Sources {
  DOM: MainDOMSource;
  props: S<Props>;
  state: StateSource<State>;
}
interface Sinks {
  DOM: S<VNode | null>;
  state: S<R<State>>;
  value: S<Value>;
}

const dWidthRatio = .8;
const dTrackHeight = 16;
const dTrackBorderWidth = 2;
const dThumbHeight = 48;
const dThumbWidth = 32;
const dThumbBorderWidth = 4;
const dThumbRadius = dTrackHeight / 2;
const dTickHeight = 16;
const dTickSep = 8;

const sRangeContainer = style({
  position: 'relative',
  width: '100%',
  // border: '1px solid black',
  height: 90
});
const sRangeTrack = style({
  position: 'absolute',
  top: (dThumbHeight - dTrackHeight) / 2,
  left: `calc(${percent((1 - dWidthRatio) / 2 * 100)} - ${dTrackBorderWidth + dThumbWidth / 2}px)`,
  width: `calc(${percent(dWidthRatio * 100)} + ${dTrackBorderWidth * 2 + dThumbWidth}px)`,
  height: dTrackHeight,
  background: 'white',
  border: `${dTrackBorderWidth}px solid black`,
  borderRadius: 8
});
const sRangeThumb = style({
  position: 'absolute',
  transform: 'translateX(-50%)',
  width: dThumbWidth,
  height: dThumbHeight,
  // background: 'white',
  border: `${dThumbBorderWidth}px solid black`,
  borderRadius: dThumbRadius
});
const sRangeTick = style({
  position: 'absolute',
  top: (dThumbHeight + dTrackHeight) / 2 + dTickSep,
  transform: 'translateX(-50%)',
  width: 2,
  height: dTickHeight,
  background: '#7f7f7f'
});
const sRangeLabel = style({
  position: 'absolute',
  width: 'max-content',
  top: (dThumbHeight + dTrackHeight) / 2 + dTickSep + dTickHeight,
  transform: 'translateX(-50%)',
  fontSize: 18,
  cursor: 'default',
  userSelect: 'none'
});

function calcValue(minValue: number, maxValue: number, ev: MouseEvent, el: HTMLDivElement): number {
  const rect = el.getBoundingClientRect();
  const minX = rect.left + (1 - dWidthRatio) / 2 * rect.width;
  const maxX = rect.left + (1 + dWidthRatio) / 2 * rect.width;
  return min(max(Math.round(minValue + (ev.clientX - minX) / (maxX - minX) * (maxValue - minValue)), minValue), maxValue);
}

function mouseInElement(ev: MouseEvent, el: Element): boolean {
  const rect = el.getBoundingClientRect();
  return ev.clientX > rect.left && ev.clientX < rect.right && ev.clientY > rect.top && ev.clientY < rect.bottom;
}

export function makeRangeSlider(labelText: string, minValue: number, maxValue: number, tickLabels: string[]) {
  return function RangeSlider(sources: Sources): Sinks {
    // intent
    const state$ = sources.state.stream;
    const rangeContainer$ = sources.DOM.select(`.${sRangeContainer}`).element() as S<HTMLDivElement>;
    const rangeMousedown$ = sources.DOM.select(`.${sRangeContainer}`).events('mousedown', { preventDefault: true });
    const mousedown$ = sources.DOM.select('document').events('mousedown');
    const mousemove$ = sources.DOM.select('document').events('mousemove');
    const mouseup$ = sources.DOM.select('document').events('mouseup');

    // model
    const initR$ = xs.of(always<State>({
      value: 0,
      touched: false,
      mouseOver: false,
      mouseDownHere: false,
      mouseDownElsewhere: false
    }));
    const mousedownR$ = mousedown$
      .compose(sc(rangeContainer$))
      .map(([ev, el]) => strictR<State>(s => {
        if (mouseInElement(ev, el)) {
          const value = calcValue(minValue, maxValue, ev, el);
          return { ...s, mouseDownHere: true, value, touched: s.touched || value !== s.value };
        } else {
          return { ...s, mouseDownElsewhere: true };
        }
      }));
    const mousemoveR$ = mousemove$
      .compose(sc(rangeContainer$))
      .map(([ev, el]) => strictR<State>(s => {
        if (s.mouseDownHere) {
          const value = calcValue(minValue, maxValue, ev, el);
          return { ...s, value, touched: s.touched || value !== s.value };
        } else if (s.mouseDownElsewhere) {
          return s;
        } else {
          return { ...s, mouseOver: mouseInElement(ev, el) };
        }
      }));
    const mouseupR$ = mouseup$
      .compose(sc(rangeContainer$))
      .map(([ev, el]) => strictR<State>(s => {
        return {
          ...s,
          mouseDownHere: false,
          mouseDownElsewhere: false,
          mouseOver: mouseInElement(ev, el)
        };
      }));

    // view
    const dom$ = state$.map(s => div([
      div({ props: { className: sQuestionLabel, innerHTML: labelText } }),
      div({ props: { className: sRangeContainer } }, [
        div({ props: { className: sRangeTrack } }),
        ...unnest(addIndex<string, VNode[]>(map)((label, i) => [
          div({
            props: {
              className: sRangeTick
            },
            style: {
              left: percent((i / (tickLabels.length - 1) * dWidthRatio + (1 - dWidthRatio) / 2) * 100)
            }
          }),
          div({
            props: {
              className: sRangeLabel,
              innerHTML: label
            },
            style: {
              left: percent((i / (tickLabels.length - 1) * dWidthRatio + (1 - dWidthRatio) / 2) * 100)
            }
          })
        ], tickLabels)),
        div({
          props: {
            className: sRangeThumb
          },
          style: {
            left: percent(((s.value - minValue) / (maxValue - minValue) * dWidthRatio + (1 - dWidthRatio) / 2) * 100),
            background: s.mouseOver ? '#e0e0e0' : 'white'
          }
        })
      ])
    ]));

    const value$ = state$.map(s => ({ error: !s.touched }));

    return {
      DOM: dom$,
      state: xs.merge(initR$, mousedownR$, mousemoveR$, mouseupR$),
      value: value$
    };
  };
}