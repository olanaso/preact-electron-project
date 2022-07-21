
// PURE IMPORTS
import {
  html,
} from "https://npm.reversehttp.com/preact,preact/hooks,htm/preact,goober";

import { navigate } from '../helpers/routing.js';

import BasePage from './templatePage.js';
import Icon from "../components/Icon.js";
import { filterCadastralUnits, viewErrorsLog, doSync } from "../functions.js";

// EXPORTS
export default class syncPendingPage extends BasePage {

  static get properties() {
    // 
    return [
      'downloadedUTs',
      'filteredUnits'
    ];
  }
  static get contextName() {
    return 'syncPendingPage';
  }

  
  async enter(params, query) {
    await super.enter(params, query);
    context.set('downloadedUTs', []);
    context.set('navSelected', 'cadastralUnits');
    const territorialUnits = this._context.get('territorialUnits');
    const downloadedUTs = territorialUnits.filter(ut => ut.downloaded);
    context.set('downloadedUTs', downloadedUTs);
    let selTerrUnit = this._context.get('selTerrUnit');
    if (selTerrUnit == null && downloadedUTs.length > 0) {
      selTerrUnit = downloadedUTs[0].idUnidadTerritorial;
      context.set('selTerrUnit', selTerrUnit);
    }
    filterCadastralUnits({
      territorialUnit: selTerrUnit
    });
  }

  // TEMPLATES

  headerContent(state) {

    return html`
      <div>Unidades catastrales</div>
      <div class="Separador"></div>
      <button class="Btn Btn--third" disabled=${state.errorsLog[state.selTerrUnit] == null}
        onclick=${() => viewErrorsLog()}
      >
        Ver errores
      </button>
      <button class="Btn Btn--third Btn--marginLeft" onclick=${() => doSync()}
        disabled=${!navigator.onLine || state.pendingSync_CU.length === 0}
      >
        <${Icon} style="margin-right:12px" icon="sync" />
        Sincronizar
      </button>
      <button class="Btn Btn--marginLeft Btn--primary"
        disabled=${state.downloadedUTs.length === 0}
        onclick=${() => navigate('newCadastral', {}, { ut: state.selTerrUnit })}
      >
        Nueva ud. catastral
      </button>
    `;
  }

  contentContent(state) {
    const UTs = this._context.get('downloadedUTs');
    const filteredUnits = this._context.get('filteredUnits') || [];
    const handleFormChange = (e) => {
      context.set('selTerrUnit', e.target.value.territorialUnit);
      filterCadastralUnits(e.target.value);
    };

    return html`
      <knq-form class="Filters" onknq-form-change=${handleFormChange}>
        <div class="Field Field--filters">
          <div>Unidad Territorial</div>
          <select class="Field__value" name="territorialUnit" value=${state.selTerrUnit}>
            ${UTs.map(opt => html`
              <option value="${opt.idUnidadTerritorial}">
                ${opt.nombre}
              </option>
            `)}
          </select>
        </div>
        <div class="Field">
          <div>Búsqueda</div>
          <input  class="Field__value" type="text"
            name="query"
            placeholder="Código, Predio, Declarante, ..."
          />
        </div>
        <div class="Field" style="flex:0;align-items: center;">
          <div>Estado</div>
          <select class="Field__value" name="state">
            <option value="">Todas</option>
            <option value="download">Descargadas</option>
            <option value="pending">Pendientes</option>
          </select>
        </div>
      </knq-form>
      <div class="ContentTable Scroller" slot="content">
        <table class="Table">
          <tr class="Table__rowHeader">
            <th class="Table__cellHeader Table__cellHeader--first Table__cellHeader--code">
              Código
            </th>
            <th class="Table__cellHeader">
              Nombre del predio
            </th>
            <th class="Table__cellHeader">
              Nombre del Declarante
            </th>
            <th class="Table__cellHeader TableCell--center">
              Ud. Territorial
            </th>
            <th class="Table__cellHeader TableCell--center">
              Opciones
            </th>
          </tr>
          ${filteredUnits.length === 0 && html`
            <tr class="TableRow">
              <td class="TableRow__cell TableRow__cell--center" colspan="5">
                No hay unidades catastrales descargadas o pendientes
              </td>
            </tr>
          `}
          ${filteredUnits.map((cadastralUnit) => {
            const id = cadastralUnit.CadastralUnits.CadastralUnitId;
            return html`
              <tr class="TableRow">
                <td class="TableRow__cell TableRow__cell--first">
                  ${cadastralUnit.CadastralUnits.CadastralUnit}-${cadastralUnit.Records.RecordNumber}
                </td>
                <td class="TableRow__cell">
                  ${cadastralUnit.Land.LandName}
                </td>
                <td class="TableRow__cell">
                  ${cadastralUnit.Records.Declarant && cadastralUnit.Records.Declarant.FullName}
                </td>
                <td class="TableRow__cell TableCell--center">
                  ${cadastralUnit.CadastralUnits.IdTerritorialUnit}
                </td>
                <td class="TableRow__cell TableCell--center">
                  ${cadastralUnit._state === 'download' && cadastralUnit.CadastralUnits.flagVisita == 1 && html`
                    <button class="IconBtn2" title="Nueva visita"
                      onclick=${() => navigate('newCadastral', {}, { refId: id })}
                    >
                      <${Icon} icon="duplicate" />
                    </button>
                  `}
                  ${cadastralUnit._state !== 'download' && html`
                    <button class="IconBtn2" title="Editar" onclick=${() => navigate('editCatastral', { id })}>
                      <${Icon} icon="edit" />
                    </button>
                  `}
                  <button class="IconBtn2" title="Consultar" onclick=${() => navigate('viewDownload', { viewId: id })}>
                    <${Icon} icon="view" />
                  </button>
                </td>
              </tr>
            `;
          })}
        </table>
      </div>
    `;
  }
}
