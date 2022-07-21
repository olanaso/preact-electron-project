
// NON PURE IMPORTS
import 'https://prod.kinequo.com/cdn/knq-form.js';
import 'https://prod.kinequo.com/cdn/knq-checkbox.js';

// PURE IMPORTS
import page from "https://unpkg.com/page/page.mjs";

import startRouting, { navigate, redirect } from './helpers/routing.js';
import createContext from './helpers/context.js';
import routes from './routes.js';
import { onStartApp } from './functions.js';


// GLOBAL CONTEXT
const context = createContext({});
context.define(null, [
  "page",
  "credentials",
  "user",
  "navSelected",
  "itemsListAssistant",
  "itemsList",
  "territorialUnits",
  "download_CU",
  "pendingSync_CU",
  "loading",
  "selTerrUnit",
  "snackData",
  "supervisors",
  "verificators",
  "online",
  "errorMsgs",
  "synchronizing",
  "errorsLog"
]);
context.set('loading', false);
// TODO TODO TODO TODO!!!!
context.set('snackData', { opened: false });


startRouting(routes, {
  //  baseURL: config.FRONT_BASE_URL,
  beforeAllCb: (ctx) => ctx.appContext = context,
  show404: () => redirect('login'),
  redirectRoot: () => redirect('login')
});

handleClickListeners();
// NOTE: lo tenemos así para usarlo más fácilmente en los diferentes sitios
window.context = context;
onStartApp();



function handleClickListeners() {
  /**
  @license
  Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
  This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
  The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
  The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
  Code distributed by Google as part of the polymer project is also
  subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
  */
  document.body.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 ||
      e.metaKey || e.ctrlKey || e.shiftKey) return;

    const anchor = e.composedPath().filter(
      n => n.tagName === 'A'
    )[0];
    if (!anchor || anchor.target ||
      anchor.hasAttribute('download') ||
      anchor.getAttribute('rel') === 'external') return;

    const href = anchor.href;
    if (!href || href.indexOf('mailto:') !== -1) return;

    const location = window.location;
    const origin = location.origin || location.protocol + '//' + location.host;
    if (href.indexOf(origin) !== 0) return;

    e.preventDefault();
    if (href !== location.href) {
      page(href.replace(document.baseURI, ''));
    }
  });
}