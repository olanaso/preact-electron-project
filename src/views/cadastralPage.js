
// PURE IMPORTS
import {
  html,
} from "https://npm.reversehttp.com/preact,preact/hooks,htm/preact,goober";

import { enterOnCadastral } from '../functions.js';
import { navigate, redirect, back, getUrl } from '../helpers/routing.js';

import CadastralForm from "../components/CadastralForm.js";

import BasePage from './templatePage.js';

// EXPORTS
export default class cadastralPage extends BasePage {

  static get properties() {
    // 
    return [
      'cadastralUnit',
      'refId'
    ];
  }
  static get contextName() {
    return 'cadastralPage';
  }

  async enter(params, query) {
    await super.enter(params, query);
    context.set('refId', query.refId || '');
    return enterOnCadastral(params, query)
  }

  // TEMPLATES

  headerContent(state) {
    const page = state.page;
    const titleMap = {
      newCadastral: 'Nueva Unidad Catastral',
      viewDownload: 'Consulta Unidad Catastral',
      editCatastral: 'Edición Unidad Catastral'
    };
    const btnMap = {
      newCadastral: 'Salir sin guardar',
      viewDownload: 'Salir',
      editCatastral: 'Salir sin guardar'
    };
    let title = titleMap[page];
    if (state.refId) {
      title += ' (copia)';
    }
    return html`
	    <div class="Separador">${title}</div>
      <button class="Btn Btn--secondary" onclick=${back}>
        ${btnMap[page]}
      </button>
		`;
  }

  contentContent(state) {
    return html`
      <${CadastralForm} />
    `;
  }
}
