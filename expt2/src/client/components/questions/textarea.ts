import { div, MainDOMSource, textarea, VNode } from '@cycle/dom';
import { Reducer as R, StateSource } from '@cycle/state';
import { em, percent } from 'csx';
import { always, assoc } from 'ramda';
import { style } from 'typestyle';
import xs, { Stream as S } from 'xstream';
import { sError, sQuestionLabel } from '../../config';
import { strictR } from '../../utils';

interface Props {
  show: boolean;
}
export interface State {
  value: string;
  touched: boolean;
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

const sTextarea = style({
  width: percent(100),
  fontSize: 18,
  height: em(8),
  fontFamily: 'inherit'
});

export function makeTextArea(labelText: string) {
  return function TextArea(sources: Sources): Sinks {
    // intent
    const state$ = sources.state.stream;
    const props$ = sources.props;
    const selectedDOM$ = sources.DOM.select('.' + sTextarea);
    const input$ = selectedDOM$.events('input')
      .map(e => (e.target as HTMLTextAreaElement).value);
    const blur$ = selectedDOM$.events('blur')
      .map(e => (e.target as HTMLTextAreaElement).value);

    // model
    const initR$ = xs.of(always<State>({
      value: '',
      touched: false
    }));

    const valueR$ = input$.map(v => strictR<State>(assoc('value', v)));
    const touchedR$ = blur$.mapTo(strictR<State>(assoc('touched', true)));

    // view
    const dom$ = xs.combine(state$, props$).map(([s, p]) => {
      if (p.show) {
        return div([
          div({ props: { className: sQuestionLabel, innerHTML: labelText } }),
          textarea({ props: { className: sTextarea } }, s.value),
          s.touched && p.show && s.value === '' ? div({ props: { className: sError } }, 'Required') : null
        ]);
      } else {
        return null;
      }
    });
    const value$ = xs.combine(props$, state$)
      .map(([p, s]) => ({ error: p.show && s.value === '' }));

    return {
      DOM: dom$,
      state: xs.merge(initR$, valueR$, touchedR$),
      value: value$
    };
  };
}