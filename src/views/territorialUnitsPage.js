
// PURE IMPORTS
import {
  html,
} from "https://npm.reversehttp.com/preact,preact/hooks,htm/preact,goober";


import BasePage from '../views/templatePage.js';
import Icon from "../components/Icon.js";
import { downloadTerritorialUnit, calcNumberUCs } from "../functions.js";

// EXPORTS
export default class territorialUnitsPage extends BasePage {
  static get properties() {
    // 
    return [
      'filterUT',
      'filteredUT',
    ];
  }
  static get contextName() {
    return 'territorialUnitsPage';
  }

  async enter(params, query) {
    await super.enter(params, query);
    context.set('navSelected', 'territorialUnits');
    
    this._unsubscribe = context.subscribe(['territorialUnits', 'filterUT'], () => {
      const territorialUnits = context.get('territorialUnits');
      const filterUT = context.get('filterUT');
      const regExp = new RegExp(filterUT || '', 'i');
      const result = territorialUnits
        .filter(unitTerr => regExp.test(unitTerr.nombre)
          || regExp.test(unitTerr.codigoUnicoUT)
        );
      context.set('filteredUT', result);
    });
    context.set('filterUT', '');
  }
  async exit(params, query) {
    this._unsubscribe();
    super.exit(params, query);
  }

  // TEMPLATES

  headerContent(state) {

    return html`
	    <div>Unidades territoriales</div>
    `;
  }

  contentContent(state) {
    const filterUT = state.filterUT;
    const filteredUT = state.filteredUT || [];

    const filterUTByText = (e) => {
      context.set('filterUT', e.target.value);
    };

    return html`
      <div class="Filters">
        <div class="Field"  >
          <div>Búsqueda</div>
          <input class="Field__value"
            onchange=${(event) => filterUTByText(event)}
            value="${filterUT}" placeholder="Introduce texto para buscar"
            type="text" />
        </div>
      </div>
      <div class="ContentTable Scroller" slot="content"  >
        <table class="Table"   >
          <tr class="Table__rowHeader"   >
            <th class="Table__cellHeader Table__cellHeader--first"   >
              Código
            </th>
            <th class="Table__cellHeader"   >
              Nombre
            </th>
            <th class="Table__cellHeader Table__cellHeader--center"   >
              Nº ud. catastrales
            </th>
            <th class="Table__cellHeader Table__cellHeader--center"   >
              Opciones
            </th>
          </tr>
          ${filteredUT.map((terrUnit, terrUnitIndex) => {
            const downloadUT = () => {
              if (terrUnit.downloaded) return;
              downloadTerritorialUnit(terrUnit.idUnidadTerritorial)
            };
            return html`
              <tr class="TableRow"   >
                <td class="TableRow__cell TableRow__cell--first TableRow__cell--short"   >
                  ${terrUnit.codigoUnicoUT}
                </td>
                <td class="TableRow__cell"   >
                  ${terrUnit.nombre}
                </td>
                <td class="TableRow__cell TableRow__cell--center"   >
                  ${calcNumberUCs(terrUnit)}
                </td>
                <td class="TableRow__cell TableRow__cell--icon"   >
                  <button class="IconBtn2 ${terrUnit.downloaded ? 'IconBtn2--active' : ''}"
                    disabled=${!terrUnit.downloaded && !state.online}
                    onclick=${downloadUT}
                  >
                    <${Icon} icon=${terrUnit.downloaded ? 'work' : 'download'} />
                  </button>
                </td>
              </tr>
            `;
          })}
        </table>
      </div>
    `;
  }
};
