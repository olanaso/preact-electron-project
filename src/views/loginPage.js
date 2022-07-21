
// PURE IMPORTS
import {
  html,
} from "https://npm.reversehttp.com/preact,preact/hooks,htm/preact,goober";

import { userLogin } from "../functions.js";

import BasePage from '../views/_KnqPage.js';

// EXPORTS
export default class loginPage extends BasePage {

  static get properties() {
    // 
    return [
      'formData',
    ];
  }
  static get contextName() {
    return 'loginPage';
  }

  async enter(params, query) {
    await super.enter(params, query);
    context.set('formData', {});
  }

  // TEMPLATES
  async handleLogin() {
    const loading = context.get('loading');
    if (loading) return;

    context.set('loading', true);
    await userLogin();
  }

  _content(state) {
    const formData = this._context.get('formData');
    const snackData = this._context.get('snackData');
    const loading = context.get('loading');
    return html`
	    <div class="ContentLogin">
        <div class="ContentLogin__panelLeft">
          <img  class="ContentLogin__logo" src="assets/logo.jpg" />
          <div>Catastro de Perú</div>
        </div>
        <div class="ContentLogin__contentRight">
          <knq-form  class="ContentLogin__boxLogin"
            onknq-form-change=${(event) => context.set(`formData`, event.target.value)}
            onknq-form-submit=${(event) => this.handleLogin()}
          >
            <div class="ContentLogin__titleLogin">Login</div>
            <div class="Field Field--login">
              <div>Usuario</div>
              <input class="Field__value" 
                value="${formData.UserName}"
                placeholder="usuario"
                name="UserName" />
            </div>
            <div class="Field" style=${{ 'margin': `0px` }}>
              <div>Contraseña</div>
              <input class="Field__value" data-knq-form-submit="enter"
                value="${formData.Password}"
                placeholder="contraseña"
                type="password"
                name="Password" />
            </div>
            <div class="ContentLogin__rowCenter">
              <button class="Btn ContentLogin__btn Btn--primary"
                data-knq-form-submit="click">
                Entrar
              </button>
            </div>
          </knq-form>
        </div>
      </div>
      <div class="Toast ${snackData.opened ? 'Toast--opened' : ''}">
        ${snackData.msg}
      </div>
      <div class="PopupSymbol ${loading ? 'PopupSymbol--opened' : ''}">
        <div class="sp sp-wave"></div>
        <div class="LoadingMsg">Cargando</div>
      </div>
		`;
  }
};
