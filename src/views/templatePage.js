
// PURE IMPORTS
import {
  html,
} from "https://npm.reversehttp.com/preact,preact/hooks,htm/preact,goober";

import { navigate } from '../helpers/routing.js';

import BasePage from '../views/_KnqPage.js';
import Popup from "../components/Popup.js";
import Icon from "../components/Icon.js";
import { cleanSavedDataAndRefresh, userLogout, getSynchronizingText } from "../functions.js";

// EXPORTS
export default class templatePage extends BasePage {
  static get properties() {
    // 
    return [
      'confirmDialogData'
    ];
  }
  static get contextName() {
    return 'templatePage';
  }

  // TEMPLATES

  _content(state) {
    const {
      navSelected,
      online,
      user,
      snackData,
      loading,
      errorMsgs,
      synchronizing,
      confirmDialogData,
      page,
    } = state;
    const isInMainPages = ['territorialUnits', 'cadastralUnits'].includes(page);
    return html`
	    <div class="ContentTemplate">
        <div class="Menu">
          <img class="Menu__logo" src="assets/logo.jpg" />
          <div class="Nav" selected=${navSelected == 'territorialUnits'}
            onclick=${() => navigate(`territorialUnits`)}
          >
            Unidades territoriales
          </div>
          <div class="Nav" selected=${navSelected == 'cadastralUnits'}
            onclick=${() => navigate(`cadastralUnits`)}>
            Unidades catastrales
          </div>
          <div class="Separador"></div>
          <button class="Btn Btn--third" style="margin: 0 12px 24px"
            disabled=${!online || !isInMainPages}
            onclick=${cleanSavedDataAndRefresh}
          >
            Restaurar datos
          </button>
          <div class="MenuBoxUser">
            ${online ? html`
              <div class="MenuBoxUser__boxState">
                <${Icon} class="IconBtn MenuBoxUser__icon" icon="wifiOn" />
                <div>Online</div>
              </div>
            ` : html`
              <div class="MenuBoxUser__boxState">
                <${Icon} class="IconBtn MenuBoxUser__icon" icon="wifiOff" />
                <div>Offline</div>
              </div>
            `}
            <div class="MenuBoxUser__boxUser">
              <div>${user.nombres} ${user.apePaterno}</div>
              <div class="Separador"></div>
              <button class="IconBtn" onclick=${userLogout} >
                <${Icon} icon="logout" />
              </button>
            </div>
          </div>
        </div>
        <div class="ContentRight">
          <div class="ContentRight__header">${this.headerContent(state)}</div>
          <div class="ContentRight__contentRest">${this.contentContent(state)}</div>
        </div>
      </div>
      <div class="${Object.entries({ 'Toast': true, 'Toast--opened': snackData.opened }).filter(([, val]) => val).map(([key]) => key).join(' ')}">
        ${snackData.msg}
      </div>


      ${loading ? html`
          <${Popup} class="PopupSymbol PopupSymbol--opened"
            default=${html`<div>Cargando listados</div>`}>
          </${Popup}>
      ` : html``}
      ${errorMsgs && html`
          <${Popup}
            class="PopupSymbol PopupSymbol--opened"
            default=${html`
              ${(errorMsgs || []).map((error) => {
                return html`<div class="ErrorMsgs">
                  <div class="ErrorMsgs__title">${error.cadastralCode}</div>
                  ${(error.cadastralMsgs || []).map((msg) => {
                      return html`<div class="ErrorMsgs__errorTxt">${msg}</div>`;
                    })}
                  </div>
                `;
              })}
              <button class="Btn Btn--third Btn--center" onclick=${() => context.set(`errorMsgs`, null)}>
                Cerrar
              </button>
            `}>
          </${Popup}>
      `}
      ${synchronizing && html`
        <${Popup}
          class="PopupSymbol PopupSymbol--opened"
          default=${html`
            ${getSynchronizingText()}
          `}>
        </${Popup}>
      `}
      ${confirmDialogData && html`
        <${Popup} class="PopupSymbol PopupSymbol--opened ConfirmDialog"
          default=${html`
            <h2>${confirmDialogData.title || '¿ESTÁS SEGURO?'}</h2>
            <p>${confirmDialogData.msg || 'Esta acción no se podrá deshacer.'}</p>
            <div class="ContentPage__row ContentPage__row--btns">
              ${confirmDialogData.actions.map(action => html`
                <button class="Btn ${action.cls || ''}" type="button"
                  onclick=${action.cb}
                >
                  ${action.label}
                </button>
              
              `)}
            </div>
          `}>
        </${Popup}>
      `}
    `;
  }

  headerContent() {
    return html``;
  }


  contentContent() {
    return html``;
  }
}
