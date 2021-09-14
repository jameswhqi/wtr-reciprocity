import { button, div, MainDOMSource, VNode } from '@cycle/dom';
import { HTTPSource, RequestInput, Response } from '@cycle/http';
import isolate from '@cycle/isolate';
import { Reducer as R, StateSource } from '@cycle/state';
import { always, concat, cond, equals, includes, pluck, T } from 'ramda';
import xs, { Stream as S } from 'xstream';
import delay from 'xstream/extra/delay';
import sc from 'xstream/extra/sampleCombine';
import { cOppBoardX, cSelfIconY, debug } from '../config';
import { CanvasData, CanvasMouseEvent } from '../drivers/canvas';
import { Action, Client } from '../drivers/client';
import { StorageOp } from '../drivers/storage';
import { nextStage, renameTargets, strictR } from '../utils';
import { Button, State as ButtonState, TargetName as ButtonTargetName } from './button';
import { Debrief, State as DebriefState } from './debrief';
import { Final } from './final';
import { Game, State as GameState } from './game';
import { EventIn as TutorialEventIn, State as TutorialState, Tutorial } from './tutorial';
import { Welcome } from './welcome';

export type Stage = typeof stages[number];

export interface State {
  tutorial?: TutorialState;
  game?: GameState;
  tutorialButton?: ButtonState;
  debrief?: DebriefState;
  stage: Stage;
  showTutorial: boolean;
  failCount: number;
}
interface Sources {
  DOM: MainDOMSource;
  state: StateSource<State>;
  canvas: S<CanvasMouseEvent>;
  HTTP: HTTPSource;
  client: S<Client>;
  storage: S<State>;
}
interface Sinks {
  DOM: S<VNode>;
  state: S<R<State>>;
  canvas: S<CanvasData>;
  HTTP: S<RequestInput>;
  client: S<Action>;
  storage: S<StorageOp>;
}

type SRS = S<R<State>>;
export type TargetName = typeof targets[number];

const stages = ['welcome', 'tutorial', 'game', 'debrief', 'final'] as const;
const targets = ['tutorialButton'] as const;

export function App(sources: Sources): Sinks {
  // intent 1
  const state$ = sources.state.stream;

  const response$ = sources.HTTP
    .select()
    .map((r$: S<Response | string>) =>
      r$.replaceError(() => xs.of('error'))
    )
    .flatten()
    .compose(sc(state$))
    .map(([r, s]) => r === 'error' && s.failCount < 1 ? 'error' : 'success');
  const error$ = response$.filter(equals('error'));
  const success$ = response$.filter(equals('success'));
  
  const client$ = sources.client;

  // children 1
  const welcome = isolate(Welcome, 'welcome')(sources);
  const tutorial = isolate(Tutorial, 'tutorial')({
    ...sources,
    canvas: sources.canvas
      .compose(sc(state$))
      .filter(([_, s]) => s.stage === 'tutorial' || s.showTutorial)
      .map(([e, _]) => e),
    props: state$.map(s => ({ appStage: s.stage })),
    event: xs.of<TutorialEventIn>({ kind: 'startTutorial' }).compose(delay(0))
  });
  const tutorialButton = isolate(Button, 'tutorialButton')({
    ...sources,
    props: state$.map(s => ({
      show: s.stage === 'game',
      x: cOppBoardX + 200,
      y: cSelfIconY,
      width: 100,
      height: 30,
      fontSize: 14,
      text: s.showTutorial ? 'Back to game' : 'Tutorial'
    }))
  });

  // intent 2
  const endWelcome$ = welcome.event;
  const endTutorial$ = tutorial.event;
  const targets$ = tutorialButton.value
    .map(v => renameTargets<ButtonTargetName, TargetName>({
      button: 'tutorialButton'
    }, v.targets));

  // children 2
  const game = isolate(Game, 'game')({
    ...sources,
    canvas: sources.canvas
      .compose(sc(state$))
      .filter(([_, s]) => s.stage === 'game' && !s.showTutorial)
      .map(([e, _]) => e),
    props: xs.combine(client$, targets$).map(([c, t]) => ({ targets: t, preview: c.kind === 'preview' })),
    event: endTutorial$.mapTo({ kind: 'startGame' })
  });
  const debrief = isolate(Debrief, 'debrief')(sources);
  const final = isolate(Final, 'final')(sources);

  // intent 3
  const endGame$ = game.event;
  const endDebrief$ = debrief.event;
  const endFinal$ = final.event;
  const nextStage$ = xs.merge(endWelcome$, endTutorial$, endGame$, success$);

  // model
  const initR$ = xs.of(always<State>({
    stage: 'welcome',
    showTutorial: false,
    failCount: 0
  }));
  const nextStageR$ = nextStage$.mapTo(strictR<State>(s => ({ ...s, stage: nextStage(stages, s.stage) })));
  const showTutorialR$ = tutorialButton.event
    .mapTo(strictR<State>(s => ({ ...s, showTutorial: !s.showTutorial })));
  const storageR$ = sources.storage.map<R<State>>(s => always(s));
  const errorR$ = error$
    .map(_ => {
      window.alert('Network error. Please check your connection or try again later.');
      return strictR<State>(s => ({ ...s, failCount: s.failCount + 1 }));
    });

  // view
  const canvas$ = xs.combine(
    state$,
    tutorial.canvas,
    game.canvas,
    tutorialButton.canvas
  )
    .map(([s, t, g, tb]) => ({
      config: { show: includes(s.stage, ['tutorial', 'game']) },
      elements: s.stage === 'tutorial' ? t : s.stage === 'game' ? concat(s.showTutorial ? t : g, tb) : []
    }));
  const dom$ = xs.combine(state$, welcome.DOM, debrief.DOM, final.DOM).map(([s, w, d, f]) => div(concat(
    debug ? [button('#savebutton', 'Save state'), button('#loadbutton', 'Load state')] : [],
    cond<Stage, VNode[]>([
      [equals('welcome'), always([w])],
      [equals('debrief'), always([d])],
      [equals('final'), always([f])],
      [T, always([])]
    ])(s.stage)
  )));
  const saveOp$ = sources.DOM.select('#savebutton').events('click')
    .compose(sc(state$))
    .map<StorageOp>(([_, s]) => ({
      kind: 'save',
      state: s
    }));
  const loadOp$ = sources.DOM.select('#loadbutton').events('click').mapTo<StorageOp>({ kind: 'load' });

  const request$ = endDebrief$
    .compose(sc(client$, state$, debrief.value))
    .map(([_, c, s, v]) => {
      const data = {
        client: c,
        trials: s.game!.history,
        debrief: v.values
      };
      console.log(data);
      return {
        url: 'submit.simple.php',
        method: 'POST',
        send: JSON.stringify(data)
      }
    });
  
  const stopPopup$ = success$.mapTo({ kind: 'stopPopup' as const });
  const submit$ = endFinal$
    .compose(sc(state$))
    .map(([_, s]) => ({ kind: 'submit' as const, approve: true, bonus: s.game!.bonus! }));
  
  return {
    DOM: dom$,
    state: xs.merge(initR$, nextStageR$, showTutorialR$, storageR$, errorR$, ...<SRS[]>pluck('state', [tutorial, game, tutorialButton, debrief])),
    canvas: canvas$,
    storage: xs.merge(saveOp$, loadOp$),
    HTTP: request$,
    client: xs.merge(stopPopup$, submit$)
  }
}