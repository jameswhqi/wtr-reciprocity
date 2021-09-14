import { prop } from 'ramda';
import xs, { Stream as S } from 'xstream';
import { State } from '../components/app';
import { kindIs } from '../utils';

interface SaveOp {
  kind: 'save';
  state: State;
}

interface LoadOp {
  kind: 'load';
}

export type StorageOp = SaveOp | LoadOp;

export function StorageDriver(storageOp$: S<StorageOp>): S<State> {
  const save$ = storageOp$.filter(kindIs('save'))
    .map(prop('state'));
  const load$ = storageOp$.filter(kindIs('load'));

  save$.addListener({
    next(state: State): void {
      sessionStorage.setItem('state', JSON.stringify(state));
    }
  });

  return xs.create({
    start(listener) {
      load$.addListener({
        next(_): void {
          const state = sessionStorage.getItem('state');
          if (state) {
            listener.next(JSON.parse(state))
          }
        }
      })
    },
    stop() {}
  });
}