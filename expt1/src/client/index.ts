import { makeDOMDriver } from '@cycle/dom';
import { makeHTTPDriver } from '@cycle/http';
import { run } from '@cycle/run';
import { withState } from '@cycle/state';
import { cssRule } from 'typestyle';
import { App } from './components/app';
import { defaultFontFamily } from './config';
import { CanvasDriver } from './drivers/canvas';
import { ClientDriver } from './drivers/client';
import { StorageDriver } from './drivers/storage';

cssRule('html', {
  boxSizing: 'border-box'
});
cssRule('*, *:before, *:after', {
  boxSizing: 'inherit'
});
cssRule('body', {
  margin: 0,
  fontSize: '24px',
  fontFamily: defaultFontFamily
});

const drivers = {
  DOM: makeDOMDriver('#app'),
  canvas: CanvasDriver,
  client: ClientDriver,
  HTTP: makeHTTPDriver(),
  storage: StorageDriver
};

run(withState(App), drivers);
