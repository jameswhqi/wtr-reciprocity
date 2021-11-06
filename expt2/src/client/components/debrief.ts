import { button, div, h1, MainDOMSource, VNode } from "@cycle/dom";
import isolate from '@cycle/isolate';
import { Reducer as R, StateSource } from '@cycle/state';
import { always, any, flatten, identity, map, pick, pipe, prop } from 'ramda';
import { style } from 'typestyle';
import xs, { Stream as S } from 'xstream';
import delay from 'xstream/extra/delay';
import sampleCombine from 'xstream/extra/sampleCombine';
import { sButton, sQuestionLabel } from '../config';
import { propsClass } from '../utils';
import { makeRadioGroup, State as RadioGroupState } from './questions/radiogroup';
import { makeRangeSlider, State as RangeSliderState } from './questions/rangeslider';
import { makeTextArea, State as TextAreaState } from './questions/textarea';

type Field = typeof fields[number];
type DebriefValues = Record<Field, string | number>;
type QuestionState = TextAreaState | RadioGroupState | RangeSliderState;
export type State = {
  page: number;
  times: Array<{ page: number, time: number; }>;
} & Partial<Record<Field, QuestionState>>;
interface EventOut {
  kind: 'endDebrief';
}
interface Value {
  values: DebriefValues;
}

interface Sources {
  DOM: MainDOMSource;
  state: StateSource<State>;
}
interface Sinks {
  DOM: S<VNode>;
  state: S<R<State>>;
  event: S<EventOut>;
  value: S<Value>;
}

const fields = ['selfToOpp', 'oppToSelf', 'adjust', 'adjustHow', 'noAdjustWhy', 'purpose', 'confusing', 'confusingText', 'technical', 'technicalText'] as const;

const sDebrief = style({
  padding: '1em',
  margin: 'auto',
  minWidth: '800px',
  maxWidth: '1000px'
});
const sTitle = style({
  fontSize: '1.5em'
});

export function Debrief(sources: Sources): Sinks {
  // intent
  const state$ = sources.state.stream;

  const nextPage$ = sources.DOM.select(`.${sButton}`).events('click');

  // children
  const values$ = state$.map(pipe(pick(fields), map<Record<Field, QuestionState>, DebriefValues>(prop<'value', string | number>('value'))));

  const components = pages.map(page => page.map(e => {
    switch (e.kind) {
      case 'textArea': {
        const show = e.show;
        return {
          ...e,
          component: isolate(makeTextArea(e.label), e.name)({
            ...sources,
            props: show ? values$.map(v => ({ show: show(v) })) : xs.of({ show: true })
          })
        };
      }
      case 'radioGroup':
        return {
          ...e,
          component: isolate(makeRadioGroup(e.name, e.label, e.values), e.name)({
            ...sources,
            props: xs.of({ show: true })
          })
        };
      case 'rangeSlider':
        return {
          ...e,
          component: isolate(makeRangeSlider(e.label, e.minValue, e.maxValue, e.tickLabels), e.name)({
            ...sources,
            props: xs.of({ show: true })
          })
        };
      default:
        return e;
    }
  }));

  // model
  const initR$ = xs.of(always({ page: 0, times: [] }));

  const pagesR$ = xs.merge(...components.map(page => xs.merge(...page.map(e => {
    if (e.kind === 'vnode') {
      return xs.never();
    } else {
      return e.component.state;
    }
  })))) as S<R<State>>;

  const nextPageR$ = nextPage$.mapTo((s: State) => {
    const times = s.times.concat({ page: s.page, time: Date.now() });
    if (s.page === pages.length - 1) {
      return { ...s, times };
    } else {
      return { ...s, page: s.page + 1, times };
    }
  });

  // view
  const pagesDOM$ = xs.combine(...components.map(page => xs.combine(...page.map(e => {
    if (e.kind === 'vnode') {
      return xs.of(e.vnode);
    } else {
      return e.component.DOM;
    }
  }))));

  const pagesError$ = xs.combine(...components.map(page => xs.combine(...page.map(e => {
    if (e.kind === 'vnode') {
      return xs.of(false);
    } else {
      return e.component.value.map(prop('error'));
    }
  })).map(any(identity))));

  const dom$ = xs.combine(state$, pagesDOM$, pagesError$).map(([s, pd, pe]) => div(
    { props: { className: sDebrief } },
    flatten([
      h1(propsClass(sTitle), 'Post-experiment survey'),
      pd[s.page],
      div([
        button({ props: { className: sButton, disabled: pe[s.page] } }, 'Next')
      ])
    ])
  ));

  const event$ = nextPage$
    .compose(sampleCombine(state$))
    .filter(([_, s]) => s.page === pages.length - 1)
    .mapTo({ kind: 'endDebrief' as const })
    .compose(delay(1));

  return {
    DOM: dom$,
    state: xs.merge(initR$, pagesR$, nextPageR$),
    event: event$,
    value: values$.map(v => ({ values: v }))
  };
}

interface MyVNode {
  kind: 'vnode';
  vnode: VNode;
}
interface TextArea {
  kind: 'textArea';
  name: Field;
  label: string;
  show?: (v: DebriefValues) => boolean;
}
interface RadioGroup {
  kind: 'radioGroup';
  name: Field;
  label: string;
  values: Array<[string, string]>;
}
interface RangeSlider {
  kind: 'rangeSlider';
  name: Field;
  label: string;
  minValue: number;
  maxValue: number;
  tickLabels: string[];
}

type DebriefElement = MyVNode | TextArea | RadioGroup | RangeSlider;
type Page = DebriefElement[];

const pages: Page[] = [
  [
    {
      kind: 'vnode',
      vnode: div({ props: { className: sQuestionLabel } }, 'Please answer a few questions about your experience in the experiment.')
    },
    {
      kind: 'vnode',
      vnode: div('(Click Next)')
    }
  ],
  [
    {
      kind: 'rangeSlider',
      name: 'selfToOpp',
      label: 'In general, how nice (or mean) were you towards the other participant? (Use the slider to answer)',
      minValue: -8,
      maxValue: 8,
      tickLabels: ['Extremely mean', 'Moderately mean', 'Neutral', 'Moderately nice', 'Extremely nice']
    }
  ],
  [
    {
      kind: 'rangeSlider',
      name: 'oppToSelf',
      label: 'In general, how nice (or mean) do you think was the other participant towards you? (Use the slider to answer)',
      minValue: -8,
      maxValue: 8,
      tickLabels: ['Extremely mean', 'Moderately mean', 'Neutral', 'Moderately nice', 'Extremely nice']
    }
  ],
  [
    {
      kind: 'radioGroup',
      name: 'adjust',
      label: 'Did you adjust your niceness (or meanness) towards the other participant according to how nice (or mean) they were towards you?',
      values: [['n', 'Not at all'], ['y', 'Yes, to some extent']]
    },
    {
      kind: 'textArea',
      name: 'adjustHow',
      label: 'How did you adjust?',
      show: v => v.adjust === 'y'
    },
    {
      kind: 'textArea',
      name: 'noAdjustWhy',
      label: 'Why not?',
      show: v => v.adjust === 'n'
    }
  ],
  [
    {
      kind: 'textArea',
      name: 'purpose',
      label: 'What do you think is the research question we are studying in this experiment?'
    }
  ],
  [
    {
      kind: 'radioGroup',
      name: 'confusing',
      label: 'Did you find any part of the experiment confusing?',
      values: [['y', 'Yes'], ['n', 'No']]
    },
    {
      kind: 'textArea',
      name: 'confusingText',
      label: 'Please describe:',
      show: v => v.confusing === 'y'
    }
  ],
  [
    {
      kind: 'radioGroup',
      name: 'technical',
      label: 'Did you encounter any technical problems?',
      values: [['y', 'Yes'], ['n', 'No']]
    },
    {
      kind: 'textArea',
      name: 'technicalText',
      label: 'Please describe:',
      show: (v: DebriefValues) => v.technical === 'y'
    }
  ]
];
