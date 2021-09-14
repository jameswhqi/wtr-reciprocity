import { div, input, label, MainDOMSource, span, VNode } from '@cycle/dom';
import { Reducer as R, StateSource } from '@cycle/state';
import { em } from 'csx';
import { always, assoc } from 'ramda';
import { style } from 'typestyle';
import xs, { Stream as S } from 'xstream';
import { sQuestionLabel } from '../../config';

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

const sRadioLabel = style({ margin: em(.3), fontSize: 18 });

export function makeRadioGroup(name: string, labelText: string, values: Array<[string, string]>) {
  return function RadioGroup(sources: Sources): Sinks {
    // intent
    const state$ = sources.state.stream;
    const input$ = sources.DOM.select('.radio').events('input')
      .map(e => (e.target as HTMLInputElement).value);

    // model
    const initR$ = xs.of(always<State>({
      value: '',
      touched: false
    }));

    const valueR$ = input$.map(v => assoc('value', v));
    const touchedR$ = input$.mapTo(assoc('touched', true));

    // view
    const dom$ = state$.map(s => div([
      div({ props: { className: sQuestionLabel, innerHTML: labelText } }),
      ...values.map(v => div([label([
        input('.radio', { attrs: { type: 'radio', name, value: v[0] }, props: { checked: s.value === v[0] } }),
        span({ props: { className: sRadioLabel, innerHTML: v[1] } })
      ])]))
    ]));

    const value$ = state$.map(s => ({ error: s.value === '' }));

    return {
      DOM: dom$,
      state: xs.merge(initR$, valueR$, touchedR$),
      value: value$
    }
  };
}