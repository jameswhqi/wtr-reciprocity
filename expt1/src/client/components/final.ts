import { button, div, h1, MainDOMSource, VNode } from '@cycle/dom';
import { style } from 'typestyle';
import xs, { Stream as S } from 'xstream';
import { sButton } from '../config';

interface EventOut {
  kind: 'endFinal';
}

interface Sources {
  DOM: MainDOMSource;
}
interface Sinks {
  DOM: S<VNode>;
  event: S<EventOut>;
}

const sFinal = style({ textAlign: 'center' });

export function Final(sources: Sources): Sinks {
  // view
  const dom$ = xs.of(
    div({ props: { className: sFinal } }, [
      h1('Thanks for your participation!'),
      div('(You have to click the Finish button to get credit!)'),
      div([
        button({ props: { className: sButton } }, 'Finish')
      ])
    ])
  );
  const event$ = sources.DOM.select(`.${sButton}`).events('click').mapTo({ kind: 'endFinal' as const });

  return {
    DOM: dom$,
    event: event$
  }
}