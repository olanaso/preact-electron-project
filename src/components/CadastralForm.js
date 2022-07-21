import dlv from 'https://unpkg.com/dlv@1.1.3/dist/dlv.es.js?module';
import {
  html,
  useState,
  useEffect,
  useMemo,
  useCallback
} from "https://npm.reversehttp.com/preact,preact/hooks,htm/preact,goober";
import { useForm } from "../helpers/useForm.js";
import { redirect, navigate } from "../helpers/routing.js";

import validations from '../validations/cadastralUnit.js';
import { showSnack, formatDate } from '../functions.js';


import NewHolderPopup from './NewHolderPopup.js';
import NewLitigantPopup from "./NewLitigantPopup.js";
import NewFarmingPopup from "./NewFarmingPopup.js";
import NewLivestockBreedingPopup from "./NewLivestockBreedingPopup.js";
import NewIrrigationPopup from "./NewIrrigationPopup.js";
import NewConstructionPopup from "./NewConstructionPopup.js";
import NewDocumentPopup from "./NewDocumentPopup.js";
import Field from './Field.js';
import Icon from './Icon.js';

const tabs = [
  { label: 'Predio', name: 'dates' },
  { label: 'Poseedor/Propietario', name: 'owner' },
  { label: 'Explotación/otros', name: 'property' },
  { label: 'Documentos', name: 'documents' },
];

export default function CadastralForm(props) {
  const itemsListAssistant = context.get('itemsListAssistant');
  const cadastralUnit = context.get('cadastralUnit');
  const [edition, setEdition] = useState({});
  const user = context.get('user');

  const isAdmin = user.nomPerfil == 'ADMINISTRADOR GORE';

  const page = context.get("page");
  const formHook = useForm({
    validations,
    effects: {
      Records: {
        RecordNumber: value => value.slice(0, 6).padStart(6, 0),
        Declarant: {
          IdTypeDocumentIdentity: (value, formValue) => {
            formValue.Records.Declarant.DocumentNumber = '';
          }
        }
      },
      CadastralUnits: {
        CadastralUnit: value => value.padStart(6, 0),
      },
      Land: {
        IdTUse: (value, formValue) => {
          formValue.Land.IdTCUse = '';
        },
        IdTCUse: (value, formValue) => {
          formValue.Land.OtherClassification = '';
        },
        IdTypeLegalStatus: (value, formValue) => {
          formValue.Land.OtherCondition = '';
        },
        IdFormAward: (value, formValue) => {
          formValue.Land.OtherAcquisitionForm = '';
        },
        IdPropertyStatus: (value, formValue) => {
          formValue.Land.IdTypeRegistrationRecords = '';
          formValue.Land.RegistrationNumber = '';
          formValue.Land.RegistrationDate = '';
        },
        IdTypeBuilding: (value, formValue) => {
          formValue.Land.OtherTBuilding = '';
        },
      }
    },
    onInput: {
      Records: {
        RecordNumber: (target, value) => target.value = value.slice(0, 6),
        Declarant: {
          DocumentNumber: (target, value, formValue) => {
            if (formValue.Records.Declarant.IdTypeDocumentIdentity == 1) {
              target.value = value.slice(0, 8);
            } else if (formValue.Records.Declarant.IdTypeDocumentIdentity == 3) {
              target.value = value.slice(0, 12);
            }
            target.value = target.value.replace(/[^\d]/g, '');
          },
        },
        PrayerWitness: {
          DocumentNumber: (target, value, formValue) => {
            if (formValue.Records.Declarant.IdTypeDocumentIdentity == 1) {
              target.value = value.slice(0, 8);
            } else if (formValue.Records.Declarant.IdTypeDocumentIdentity == 3) {
              target.value = value.slice(0, 12);
            }
            target.value = target.value.replace(/[^\d]/g, '');
          },
        },
      },
      Land: {
        LandName: (target, value) => target.value = value.toUpperCase(),
        PhotographyNumber: (target, value) => target.value = value.slice(0, 10),
        OrthophotoNumber: (target, value) => target.value = value.slice(0, 10),
        SatelitalImage: (target, value) => target.value = value.slice(0, 10),
        RegistrationNumber: (target, value) => target.value = value.slice(0, 9),
        DeclaredArea: (target, value) => target.value = value.slice(0, 10),
      },
      CadastralUnits: {
        CadastralUnit: (target, value) => target.value = value.slice(0, 6),
        PreviousCadastralUnit: (target, value) => target.value = value.slice(0, 15),
      },
      Forks: {
        Annexed: (target, value) => target.value = value.slice(0, 25),
        StreetTrack: (target, value) => target.value = value.slice(0, 50),
        LotNumber: (target, value) => target.value = value.slice(0, 20),
      }
    },
    initialValue: cadastralUnit,
    autosubmit: false
  });
  const [tab, setTab] = useState(0);

  const {
    value:formValue,
    setFormValue,
    handleSubmit,
    errors
  } = formHook;


  useEffect(() => {
    console.log('FORM VALUE', formValue);
  }, [formValue]);
  useEffect(() => {
    console.log('ERRORS', errors);
  }, [errors]);

  // TODO: memo
  const createListAPI = (formKey, options = {}) => {
    return {
      get obj() { return edition[formKey]; },
      create(...args) {
        const obj = {};
        options.preCreate && options.preCreate(obj, ...args);
        setEdition({ [formKey]: obj });
      },
      edit(obj, index) {
        options.preEdit && options.preEdit(obj);
        setEdition({
          [formKey]: { ...obj },
          index
        });
      },
      save(obj) {
        setFormValue(formValue => {
          let items;
          options.preSave && options.preSave(obj);
          if (edition.index == null) {
            items = formValue[formKey].concat(obj);
          } else {
            items = [
              ...formValue[formKey].slice(0, edition.index),
              obj,
              ...formValue[formKey].slice(edition.index + 1)
            ];
          }
          return {
            ...formValue,
            [formKey]: items
          };
        });
        setEdition({});
      },
      delete(index) {
        setFormValue(value => ({
          ...value,
          [formKey]: [
            ...value[formKey].slice(0, index),
            ...value[formKey].slice(index + 1),
          ]
        }));
      },
      cancel() {
        setEdition({});
      }
    };
  }

  const HolderListAPI = createListAPI('HolderIdentifierList', {
    preCreate: obj => {
      const itemsListAssistant = context.get('itemsListAssistant');
      if ([1, 3, 6, 7, 8].includes(+formValue.Land.IdTypeLegalStatus)) {
        obj.IdTypeHolder = itemsListAssistant.tiposTitulares[0].id.toString();
      } else if ([9].includes(+formValue.Land.IdTypeLegalStatus)) {
        obj.IdTypeHolder = itemsListAssistant.tiposTitulares[1].id.toString();
        obj.IdTypeDocumentIdentity = '10';
      }
    }
  })
  const LitigantListAPI = createListAPI('LitigantsList', {
    preCreate: obj => {
      obj.Person = {};
      const itemsListAssistant = context.get('itemsListAssistant');
      if ([1, 3, 6, 7, 8].includes(+formValue.Land.IdTypeLegalStatus)) {
        obj.Person.PersonTypeId = itemsListAssistant.tiposTitulares[0].id.toString();
      } else if ([9].includes(+formValue.Land.IdTypeLegalStatus)) {
        obj.Person.PersonTypeId = itemsListAssistant.tiposTitulares[1].id.toString();
        obj.Person.IdTypeDocumentIdentity = '10';
      }
    }
  });
  
  const FarmingListAPI = createListAPI('FarmingList');
  const LivestockListAPI = createListAPI('LivestockBreedingList');
  const IrrigationListAPI = createListAPI('IrrigationList');
  const ConstructionListAPI = createListAPI('ConstructionFeaturesList');
  
  const DocumentsListAPI = (docKey) => createListAPI(docKey, {
    preCreate: (obj, docType, IdTypeAccreditation) => {
      const user = context.get('user');
      obj._docType = docType;
      obj.IdTypeAccreditation = IdTypeAccreditation;
      // obj.UserCreation = user.idUsuario;
      obj.UserCreation = user.UserName;
      // obj._userName = user.nombres;
      obj._userName = user.UserName;
    },
    preEdit: (obj) => {
      obj._docType = docKey;
    },
    preSave: (obj) => {
      delete obj._docType;
    }
  });

  const saveCadastralUnit = (value) => {
    const { Name = '', FirstName = '', LastName = '' } = value.Records.Declarant;
    value.Records.Declarant.FullName = `${Name} ${FirstName} ${LastName}`;

    if (value.__refId) {
      const downloads = context.get('download_CU');
      const refCadastralUnit = downloads.find(el => el.CadastralUnits.CadastralUnitId == value.__refId);
      refCadastralUnit.CadastralUnits.flagVisita = 0;
      context.set('download_CU', downloads);
    }


    const pendingSync_CU = context.get('pendingSync_CU');
    const idx = pendingSync_CU.findIndex(el => value.CadastralUnits.CadastralUnitId == el.CadastralUnits.CadastralUnitId);
    if (idx >= 0) {
      pendingSync_CU[idx] = value;
    } else {
      pendingSync_CU.push(value);
    }
    context.set('pendingSync_CU', pendingSync_CU);
  };

  // TODO: revisar si handleSubmit puede cambiar
  const saveWithValidation = useCallback(handleSubmit(value => {
    const user = context.get('user');
    value.Land.UserCreation = user.UserName;
    value.CadastralUnits.Finalize = 1;
    saveCadastralUnit(value);
    navigate('cadastralUnits');
  }), [handleSubmit]);
  const saveWithoutValidation = useCallback(e => {
    const user = context.get('user');
    formValue.Land.UserCreation = user.UserName;
    formValue.CadastralUnits.Finalize = 0;
    saveCadastralUnit(formValue);
    if (context.get('page') == 'newCadastral') {
      redirect('editCatastral', { id: formValue.CadastralUnits.CadastralUnitId });
    }
    showSnack({ msg: 'Guardado con éxito' });
  }, [formValue]);

  const hasTabGotErros = (index) => {
    const pathIsInvalid  = (path) => {
      const info = dlv(errors, path);
      return info != null && info.invalid;
    };
    let paths = [];
    if (index === 0) {
      paths = [
        'CadastralUnits.RegionalGovernmentId',
        'CadastralUnits.ZonalOfficeId',
        'CadastralUnits.IdDepartment',
        'CadastralUnits.IdProvince',
        'CadastralUnits.IdDistrict',
        'CadastralUnits.IdSector',
        'CadastralUnits.ZoneUtm',
        'CadastralUnits.CadastralUnit',
        'CadastralUnits.CadastralProjectId',
        'CadastralUnits.IdTerritorialUnit',
        'Records.IdPExecutor',
        'Records.RecordNumber',
        'Land.IdValle',
        'Land.IdTUse',
        'Land.IdTCUse',
        'Land.IdTypeLegalStatus',
        'Land.DeclaredArea',
        'Land.OccupationDate',
        'Land.RegistrationNumber',
        'Land.RegistrationDate',
        'Land.IdFormAward',
      ];
    } else if (index === 1) {
      paths = [
        'HolderIdentifierList',
        'Forks.LotNumber',
        'Forks.SiteName',
        'Forks.IdDepartmentT',
      ];
    } else if (index === 2) {
      paths = [
        'FarmingList',
        'LivestockBreedingList',
        'Records.Declarant.DocumentNumber',
        'Records.PrayerWitness.DocumentNumber',
        'Records.LiftingDate',
        'Records.Comment'
      ];
    } else if (index === 3) {
      paths = ['PropertyDocuments'];
    }
    return paths.some(pathIsInvalid);
  }

  return html`
    <div class="Tabs" slot="content">
      ${tabs.map((tabItem, tabIndex) => {
        return html`
          <button class="Tab"
            selected=${tabIndex === tab}
            error=${hasTabGotErros(tabIndex)}
            onclick=${() => setTab(tabIndex)}
          >
            ${tabItem.label}
          </button>
        `;
      })}
    </div>
    <form ref=${formHook.register} style=${{ display: `contents` }}>
      <${tab1} visible=${tab === 0} ...${formHook} isAdmin=${isAdmin} />
      <${tab2} visible=${tab === 1} ...${formHook} isAdmin=${isAdmin}
        holderAPI=${HolderListAPI}
        litigantAPI=${LitigantListAPI}
      />
      <${tab3} visible=${tab === 2} ...${formHook} isAdmin=${isAdmin}
        farmingAPI=${FarmingListAPI}
        livestockAPI=${LivestockListAPI}
        irrigationAPI=${IrrigationListAPI}
        constructionAPI=${ConstructionListAPI}
      />
      <${tab4} visible=${tab === 3} ...${formHook} isAdmin=${isAdmin}
        documentsAPI=${DocumentsListAPI}
      />

      ${page != "viewDownload" && html`
        <div class="ContentPage__section ContentPage__section--btnBottom">
          <button class="Btn Btn--secondary" type="button"
            onclick=${saveWithoutValidation}>
            Guardar para más tarde
          </button>
          <button class="Btn Btn--primary Btn--marginLeft" type="button"
            onClick=${saveWithValidation}>
            Guardar
          </button>
        </div>
      `}
    </form>
      
    <!-- TAB 2 POPUPS -->
    <${NewHolderPopup} key="NewHolderPopup"
      holder=${HolderListAPI.obj}
      unitValue=${formValue}
      holders=${formValue.HolderIdentifierList}
      itemsListAssistant=${itemsListAssistant}
      listAPI=${HolderListAPI}/>

    <${NewLitigantPopup} key="NewLitigantPopup"
      litigant=${LitigantListAPI.obj}
      unitValue=${formValue}
      itemsListAssistant=${itemsListAssistant}
      listAPI=${LitigantListAPI}/>

    <!-- TAB 3 POPUPS -->
    <${NewFarmingPopup} key="newFarmingPopup"
      farming=${FarmingListAPI.obj}
      unitValue=${formValue}
      itemsListAssistant=${itemsListAssistant}
      listAPI=${FarmingListAPI}
    />
    <${NewLivestockBreedingPopup} key="newLivestockBreedingPopup"
      value=${LivestockListAPI.obj}
      itemsListAssistant=${itemsListAssistant}
      listAPI=${LivestockListAPI}
    />
    <${NewIrrigationPopup} key="newIrrigationPopup"
      value=${IrrigationListAPI.obj}
      unitValue=${formValue}
      itemsListAssistant=${itemsListAssistant}
      listAPI=${IrrigationListAPI}
    />
    <${NewConstructionPopup} key="newConstructionPopup"
      value=${ConstructionListAPI.obj}
      itemsListAssistant=${itemsListAssistant}
      listAPI=${ConstructionListAPI}
    />
      
    <!-- TAB 4 POPUPS -->
    <${NewDocumentPopup} key="newDocumentPopup"
      value=${edition.PersonalDocuments ||
        edition.PropertyDocuments ||
        edition.PossessionProofDocuments ||
        edition.EvaluationDocuments}
      itemsListAssistant=${itemsListAssistant}
      docsAPI=${DocumentsListAPI}/>
  `;
}

function tab1(props) {
  const {
    errors, setupInput, value: formValue, isAdmin,
    visible
  } = props;
  const itemsList = context.get('itemsList');
  const itemsListAssistant = context.get('itemsListAssistant');
  const territorialUnits = context.get('territorialUnits');
  // NOTE: ahora mismo sólo se cargan las oficinas zonales en función del user.idGRegional
  const offices = itemsList.oficinasZonales;

  const IdTUseMap = {
    1: (items) => items.filter(item => [1,2,3,4,5,6].includes(+item.id)),
    2: (items) => items.filter(item => [2,3,5,6].includes(+item.id)),
    3: (items) => items.filter(item => [1,2,6].includes(+item.id)),
    4: (items) => items.filter(item => [2,6].includes(+item.id)),
    5: (items) => items.filter(item => [5,6].includes(+item.id)),
    6: (items) => items.filter(item => [6].includes(+item.id)),
    7: (items) => items.filter(item => [2,3,5,6].includes(+item.id))
  }
  const clasUsoActualItems = IdTUseMap[formValue.Land.IdTUse || 1](itemsListAssistant.tiposClasificacionUso);

  const { RegionalGovernmentId, IdTerritorialUnit, IdProvince, IdDistrict, IdSector } = formValue.CadastralUnits;

  const getUbigeo = () => {
    const { IdProvince, IdDistrict, IdSector } = formValue.CadastralUnits;
    const distrito = (itemsList.distritos[IdProvince] || []).find(item => item.Id == IdDistrict)
    if (distrito) {
      return `${distrito.Type}${IdSector ? `-${IdSector}` : ''}`;
    }
    return '';
  };

  const UT = territorialUnits.find(ut => ut.idUnidadTerritorial == IdTerritorialUnit);
  const todayPlus1 = new Date();
  todayPlus1.setDate(todayPlus1.getDate() + 1);
  const formattedTodayPlus1 = formatDate(todayPlus1, '{YYYY}-{MM}-{DD}');
  const formattedToday = formatDate(new Date(), '{YYYY}-{MM}-{DD}');

  const vallesByZone = itemsList.valles[formValue.CadastralUnits.ZonalOfficeId] || [];

  return html`
    <div class="ContentPage Scroller ${visible ? 'ContentPage--visible' : '' }">
      <div class="ContentPage__section">
        <div>Información básica</div>
        <div class="ContentPage__row">
          <${Field} title="Gobierno Regional" inputType="combo"
            disabled=${true}
            items=${itemsList.gobiernosRegionales}
            ...${setupInput('CadastralUnits.RegionalGovernmentId')}></${Field}>
          <${Field} title="Sede" inputType="combo"
            disabled=${!isAdmin || offices.length === 1}
            items=${offices}
            ...${setupInput('CadastralUnits.ZonalOfficeId')}></${Field}>
          <${Field} title="Proyecto Ejecutor" inputType="combo"
            items=${itemsListAssistant.proyectos_Ejecutores}
            ...${setupInput('Records.IdPExecutor')}></${Field}>
          ${false ? html`
            <${Field} title="Entidad Ejecutora" value="PC" disabled></${Field}>
          ` : html`
            <div class="Field"></div>
          `}
        </div>
        <div class="ContentPage__row">
          <${Field} title="Código Único Catastral" disabled
            ...${setupInput('CadastralUnits.UniqueCadastralCode')}></${Field}>
          <${Field} title="Código Hoja Catastral" disabled
            ...${setupInput('CadastralUnits.CadastralSheetCode')}></${Field}>
          <${Field} title="Número de Ficha" inputType="number"
            ...${setupInput('Records.RecordNumber')}
          />
          <${Field} title="Norma Legal" inputType="combo" disabled
            items=${itemsListAssistant.normasLegales}
            ...${setupInput('CadastralUnits.IdLegalNorm')}></${Field}>
        </div>
      </div>
      
      <div class="ContentPage__section">
        <div class="ContentPage__row">
          Ubicación geográfica
          <div class="Ubigeo">${getUbigeo()}</div>
        </div>
        <div class="ContentPage__row">
          <${Field} title="Código de proyecto catastral" disabled
            value=${UT.nomProyCatastral || ''}
          ></${Field}>
          <${Field} title="Código de UT" disabled
            items=${territorialUnits.map(ut => ({
              label: `${ut.nombre} (${ut.codigoUnicoUT})`,
              value: ut.idUnidadTerritorial
            }))}
            ...${setupInput('CadastralUnits.IdTerritorialUnit')}
            labelProp="label" valueProp="value"
            inputType="combo"
          ></${Field}>
        </div>
        <div class="ContentPage__row">
          <${Field} title="Departamento" items=${itemsList.departamentos}
            ...${setupInput('CadastralUnits.IdDepartment')}
            inputType="combo" disabled ></${Field}>
          <${Field} title="Provincia"
            items=${itemsList.provincias[formValue.CadastralUnits.IdDepartment]
              .filter(el => UT.provincias.find(el2 => el2.Id == el.Id) != null) || []}
            ...${setupInput('CadastralUnits.IdProvince')}
            inputType="combo" ></${Field}>
          <${Field} title="Distrito"
            items=${(itemsList.distritos[formValue.CadastralUnits.IdProvince] || [])
                .filter(el => UT.distritos.find(el2 => el2.Id == el.Id) != null) || []}
            ...${setupInput('CadastralUnits.IdDistrict')}
            inputType="combo" disabled=${formValue.CadastralUnits.IdProvince == null} ></${Field}>
          <${Field} title="Sector" inputType="combo"
            items=${itemsList.sectores[formValue.CadastralUnits.IdTerritorialUnit] || []}
            ...${setupInput('CadastralUnits.IdSector')}
            disabled=${formValue.CadastralUnits.IdTerritorialUnit == null}></${Field}>
        </div>
        <div class="ContentPage__row">
          <${Field} title="Nombre del predio"
            ...${setupInput('Land.LandName')}></${Field}>
          <div class="RowFieldHalf">
            <${Field} title="Nombre del valle" inputType="combo"
              items=${vallesByZone.filter(el => el.Id == UT.idValle)}
              ...${setupInput('Land.IdValle')} ></${Field}>
            <${Field} title="Nombre del sector" items=${itemsList.sectores[IdTerritorialUnit] || []}
              value=${formValue.CadastralUnits.IdSector}
              inputType="combo" disabled ></${Field}>
          </div>
        </div>
        <div class="ContentPage__row">
          <${Field} title="Número de foto" disabled=${formValue._nomTipoLevantamiento != 'INDIRECTO'}
            ...${setupInput('Land.PhotographyNumber')}></${Field}>
          <${Field} title="Número de ortofoto" disabled=${formValue._nomTipoLevantamiento != 'INDIRECTO'}
            ...${setupInput('Land.OrthophotoNumber')}></${Field}>
          <${Field} title="Imagen satelital" disabled=${formValue._nomTipoLevantamiento != 'INDIRECTO'}
            ...${setupInput('Land.SatelitalImage')}></${Field}>
          <${Field} title="Unidad catastral anterior"
            ...${setupInput('CadastralUnits.PreviousCadastralUnit')}></${Field}>
        </div>
        <div class="ContentPage__row">
          <${Field} class="Field--middle" title="Código contribuyente rentas"
            ...${setupInput('CadastralUnits.TaxpayerIncomeCode')}
            disabled ></${Field}>
        </div>
      </div>

      <div class="ContentPage__section">
        <div>Código de referencia catastral</div>
        <div class="ContentPage__row">
          <${Field} title="Zona" items=${itemsList.zonas[RegionalGovernmentId] || []}
            ...${setupInput('CadastralUnits.ZoneUtm')}
            inputType="combo" ></${Field}>
          <${Field} title="Unidad orgánica catastral rural" disabled
            ...${setupInput('CadastralUnits.CadastralOrganicUnit')}></${Field}>
          <${Field} title="Unidad catastral" inputType="number"
            ...${setupInput('CadastralUnits.CadastralUnit')}></${Field}>
        </div>
      </div>

      <div class="ContentPage__section">
        <div>Descripción del predio</div>
        <div class="ContentPage__row">
          <${Field} title="Código de uso" items=${itemsListAssistant.tiposUsos}
            ...${setupInput('Land.IdTUse')} inputType="combo" ></${Field}>
          <${Field} title="Clasificación de uso actual" inputType="combo"
            items=${clasUsoActualItems}
            ...${setupInput('Land.IdTCUse')}></${Field}>
          <${Field} title="Otra clasificación"
            ...${setupInput('Land.OtherClassification')}
            disabled=${formValue.Land.IdTCUse != '6'} ></${Field}>
        </div>
      </div>

      <div class="ContentPage__section">
        <div>Condición del predio</div>
        <div class="ContentPage__row">
          <${Field} title="Tipo de predio" items=${itemsListAssistant.tiposPropiedades}
            ...${setupInput('Land.IdTProperty')} inputType="combo" ></${Field}>
          <${Field} title="Estado de propiedad" items=${itemsListAssistant.tiposEstadosPropiedades}
            ...${setupInput('Land.IdPropertyStatus')} inputType="combo" ></${Field}>
          <div class="Separador"></div>
        </div>
        <div class="ContentPage__row">
          <${Field} title="Condición de titular" items=${itemsListAssistant.tiposCondicionesJuridicas}
            ...${setupInput('Land.IdTypeLegalStatus')} inputType="combo" ></${Field}>
          <${Field} title="Otra condición de titular"
            ...${setupInput('Land.OtherCondition')}
            disabled=${formValue.Land.IdTypeLegalStatus != '10'} ></${Field}>
          <${Field} title="Fecha de ocupación"
            max="${formattedToday}"
            ...${setupInput('Land.OccupationDate')} inputType="date" ></${Field}>
        </div>
        <div class="ContentPage__row">
          <${Field} title="Inscripción en los RRPP" inputType="combo"
            disabled=${formValue.Land.IdPropertyStatus != 1}
            items=${itemsListAssistant.tiposInscripcionesRegistros}
            ...${setupInput('Land.IdTypeRegistrationRecords')}></${Field}>
          <${Field} title="Número de inscripción"
            disabled=${formValue.Land.IdPropertyStatus != 1}
            ...${setupInput('Land.RegistrationNumber')}></${Field}>
          <${Field} title="Fecha de inscripción"
            max="${formattedToday}"
            disabled=${formValue.Land.IdPropertyStatus != 1}
            ...${setupInput('Land.RegistrationDate')} inputType=${`date`} ></${Field}>
        </div>
        <div class="ContentPage__row">
          <${Field} title="Forma de adquisición" items=${itemsListAssistant.tiposFormasAdjudicaciones}
            ...${setupInput('Land.IdFormAward')} inputType="combo" ></${Field}>
          <${Field} title="Otra forma de adquisición"
            ...${setupInput('Land.OtherAcquisitionForm')}
            disabled=${formValue.Land.IdFormAward != '22'} ></${Field}>
          <div class="Separador"></div>
        </div>
      </div>


      <div class="ContentPage__section">
        <div>Características técnicas del predio</div>
        <div class="ContentPage__row">
          <${Field} title="Área del terreno (Ha)"
            ...${setupInput('Land.Area')}
            inputType="number" disabled ></${Field}>
          <${Field} title="Área declarada (Ha)" inputType="number"
            ...${setupInput('Land.DeclaredArea')}></${Field}>
          <${Field} title="Construcciones e instalaciones" items=${itemsListAssistant.tiposEdificaciones}
            ...${setupInput('Land.IdTypeBuilding')} inputType="combo" ></${Field}>
          <${Field} title="Otras construcciones e instalaciones"
            disabled=${formValue.Land.IdTypeBuilding != 8}
            ...${setupInput('Land.OtherTBuilding')} ></${Field}>
        </div>
      </div>
    </div>
  `;
}

function tab2(props) {
  const {
    errors, setupInput, value: formValue, isAdmin,
    visible,
    holderAPI,
    litigantAPI
  } = props;
  const itemsList = context.get('itemsList');
  const cadastralUnit = context.get('cadastralUnit');
  const itemsListAssistant = context.get('itemsListAssistant');
  const page = context.get('page');
  return html`
    <div class="ContentPage Scroller ${visible ? 'ContentPage--visible' : '' }">
      <div class="ContentPage__section">
        <div>Identificación del titular / poseedor</div>
        <table  class="Table Table--predio" >
          <tr class="Table__rowHeader" >  
            <th class="Table__cellHeader" >
              Tipo de titular
            </th>
            <th class="Table__cellHeader" >
              Nombre
            </th>
            <th class="Table__cellHeader" >
              Tipo de documento
            </th>
            <th class="Table__cellHeader" >
              Número de documento
            </th>
            <th class="Table__cellHeader" >
              Estado civil
            </th>
            <th class="Table__cellHeader"></th>
          </tr>
          ${(formValue.HolderIdentifierList || []).map((holder, holderIndex) => {
            return html`
              <tr class="TableRow" key=${holder.HolderId || holderIndex}>
                <td class="TableRow__cell" >
                  <${Field} items=${itemsListAssistant.tiposTitulares} value=${holder.IdTypeHolder} inputType="combo" disabled ></${Field}>
                </td>
                <td class="TableRow__cell" >
                  <${Field} value=${holder.Name} disabled />
                </td>
                <td class="TableRow__cell" >
                  <${Field} items=${itemsListAssistant.tiposDocumentosIdentidad} value=${holder.IdTypeDocumentIdentity} inputType="combo" disabled ></${Field}>
                </td>
                <td class="TableRow__cell" >
                  <${Field} value=${holder.DocumentNumber} disabled ></${Field}>
                </td>
                <td class="TableRow__cell" >
                  <${Field} items=${itemsListAssistant.tiposEstadosCiviles} value=${holder.IdCivilStatus} inputType="combo" disabled ></${Field}>
                </td>
                <td class="TableRow__cell" >
                  ${page != 'viewDownload' && html`
                    <button class="IconBtn" type="button"
                      onclick=${() => holderAPI.edit(holder, holderIndex)} >
                      <${Icon} icon="edit" />
                    </button>
                    <button class="IconBtn" type="button"
                      onclick=${() => holderAPI.delete(holderIndex)} >
                      <${Icon} icon="close" />
                    </button>
                  `}
                </td>
              </tr>
            `;
          })}
        </table>
        <div class="ContentPage__row ContentPage__row--btns">
          ${page != 'viewDownload' && html`
            <button class="Btn ContentPage__btnRight Btn--secondary"
              type="button" disabled=${!formValue.Land.IdTypeLegalStatus}
              onClick=${holderAPI.create} >
              Agregar
            </button>
          `}
        </div>
        ${errors.HolderIdentifierList && errors.HolderIdentifierList.invalid && html`
          <div>
            ${errors.HolderIdentifierList.errors.map(err => html`
              <div class="InlineError">${err}</div>
            `)}
          </div>
        `}
      </div>
      <div class="ContentPage__section">
        <div>Domicilio del titular</div>
        <div class="ContentPage__row">
          <${Field} title="Departamento" inputType="combo"
            items=${itemsList.departamentos}
            ...${setupInput('Forks.IdDepartmentT')} ></${Field}>
          <${Field} title="Provincia" inputType="combo"
            items=${itemsList.provincias[formValue.Forks.IdDepartmentT] || []}
            ...${setupInput('Forks.IdProvinceT')}
            disabled=${formValue.Forks.IdDepartmentT == null} ></${Field}>
          <${Field} title="Distrito" inputType="combo"
            items=${itemsList.distritos[formValue.Forks.IdProvinceT] || []}
            ...${setupInput('Forks.IdDistrictT')}
            disabled=${formValue.Forks.IdProvinceT == null} ></${Field}>
          <${Field} title="Anexo / Zona / Sector / Caserío"
            ...${setupInput('Forks.Annexed')} ></${Field}>
        </div>
        <div class="ContentPage__row">
          <${Field} title="Calle / Vía"
            ...${setupInput('Forks.StreetTrack')}></${Field}>
          <${Field} title="Número / Lote"
            ...${setupInput('Forks.LotNumber')}></${Field}>
          <${Field} title="Nombre del predio"
            ...${setupInput('Forks.SiteName')}></${Field}>
        </div>
      </div>
      <div class="ContentPage__section">
        <div>Identificación de los litigantes</div>
        <table class="Table Table--predio" >
          <tr class="Table__rowHeader" >
            <th class="Table__cellHeader" >
              Tipo de titular
            </th>
            <th class="Table__cellHeader" >
              Tipo de documento
            </th>
            <th class="Table__cellHeader" >
              Número de documento
            </th>
            <th class="Table__cellHeader" >
              Estado civil
            </th>
            <th class="Table__cellHeader" ></th>
          </tr>
          ${(formValue.LitigantsList || []).map((Litigant, LitigantIndex) => {
            return html`
              <tr class="TableRow" key=${Litigant.LitigantId || LitigantIndex}>
                <td class="TableRow__cell" >
                  <${Field} items=${itemsListAssistant.tiposTitulares} value=${Litigant.Person.PersonTypeId} inputType="combo" disabled ></${Field}>
                </td>
                <td class="TableRow__cell" >
                  <${Field} items=${itemsListAssistant.tiposDocumentosIdentidad} value=${Litigant.Person.IdTypeDocumentIdentity} inputType="combo" disabled ></${Field}>
                </td>
                <td class="TableRow__cell" >    
                  <${Field} value=${Litigant.Person.DocumentNumber} disabled ></${Field}>
                </td>
                <td class="TableRow__cell" >
                  <${Field} items=${itemsListAssistant.tiposEstadosCiviles} value=${Litigant.Person.IdCivilStatus} inputType="combo" disabled ></${Field}>
                </td>
                <td class="TableRow__cell" >
                  ${page != 'viewDownload' && html`
                    <button class="IconBtn" type="button"
                      onclick=${e => litigantAPI.edit(Litigant, LitigantIndex)} >
                      <${Icon} icon="edit" />
                    </button>
                    <button class="IconBtn" type="button"
                      onclick=${e => litigantAPI.delete(LitigantIndex)} >
                      <${Icon} icon="close" />
                    </button>
                  `}
                </td>
              </tr>
            `;
          })}
        </table>
        <div class="ContentPage__row ContentPage__row--btns"
          hidden=${formValue.Land.IdTypeLegalStatus != 9 /* LITIGIO */}>
          ${page != 'viewDownload' && html`
            <button class="Btn ContentPage__btnRight Btn--secondary"
              type="button"
              onclick=${litigantAPI.create} >
              Agregar
            </button>
          `}
        </div>
        ${errors.LitigantsList && errors.LitigantsList.invalid && html`
        <div>
          ${errors.LitigantsList.errors.map(err => html`
          <div class="InlineError">${err}</div>
          `)}
        </div> `}
      </div>
    </div>
  `;
}


function tab3(props) {
  const {
    errors, setupInput, value: formValue, isAdmin,
    farmingAPI,
    livestockAPI,
    irrigationAPI,
    constructionAPI,
    visible,
  } = props;
  const itemsListAssistant = context.get('itemsListAssistant');
  const page = context.get('page');
  const supervisors = context.get('supervisors');
  const verificators = context.get('verificators');
  
  const declarant = formValue.Records.Declarant || {};
  const witness = formValue.Records.PrayerWitness || {};

  const todayMinus1 = new Date();
  todayMinus1.setDate(todayMinus1.getDate() - 1);
  const formattedTodayMinus1 = formatDate(todayMinus1, '{YYYY}-{MM}-{DD}');

  const formattedToday = formatDate(new Date(), '{YYYY}-{MM}-{DD}');

  return html`
    <div class="ContentPage Scroller ${visible ? 'ContentPage--visible' : '' }">
      <div class="ContentPage__section">
        <div>Explotación de predio</div>
        <div class="Tab3__tables">
          <div class="Tab3__table">
            <div class="ContentPage__subtitle">Agrícola</div>
            <table class="Table" >
              <tr class="Table__rowHeader" >
                <th class="Table__cellHeader" >
                  Tipo
                </th>
                <th class="Table__cellHeader" >
                  Descripción
                </th>
                <th class="Table__cellHeader" >
                  %
                </th>
                <th class="Table__cellHeader" ></th>
              </tr>
              ${(formValue.FarmingList || []).map((farming, farmingIndex) => {
                return html`
                  <tr class="TableRow" > 
                    <td class="TableRow__cell" >
                      <${Field} items=${itemsListAssistant.tiposAgricolas}
                        value=${farming.IdType} inputType="combo" disabled />
                    </td>
                    <td class="TableRow__cell" >
                      <${Field} inputType="combo"
                        items=${itemsListAssistant.tiposGruposAgricolas}
                        value=${farming.Description} disabled
                      />
                    </td>
                    <td class="TableRow__cell TableRow__cell--predioPercent" >
                      <${Field} value=${farming.Percentage} disabled />
                    </td>
                    <td class="TableRow__cell TableRow__cell--actions" >
                      ${page != 'viewDownload' && html`
                        <button class="IconBtn" type="button"
                          onclick=${(event) => farmingAPI.edit(farming, farmingIndex)}
                        >
                          <${Icon} icon="edit" />
                        </button>
                        <button class="IconBtn" type="button"
                          onclick=${(event) => farmingAPI.delete(farmingIndex)}
                        >
                          <${Icon} icon="close" />
                        </button>
                      `}
                    </td>
                  </tr>
                `;
              })}
            </table>
            <div class="ContentPage__row ContentPage__row--btns">
              ${page != 'viewDownload' && html`
                <button class="Btn ContentPage__btnRight Btn--secondary" type="button" 
                  onclick=${farmingAPI.create}
                >
                  Agregar
                </button>
              `}
            </div>
            ${errors.FarmingList && errors.FarmingList.invalid && html`
              <div>
                ${errors.FarmingList.errors.map(err => html`
                  <div class="InlineError">${err}</div>
                `)}
              </div>
            `}
          </div>
          <div class="Tab3__table">
            <div class="ContentPage__subtitle">Ganadería / Crianza</div>
            <table class="Table" >
              <tr class="Table__rowHeader" >
                <th class="Table__cellHeader" >
                  Tipo
                </th>
                <th class="Table__cellHeader" >
                  Cantidad
                </th>
                <th class="Table__cellHeader" ></th>
              </tr>
              ${(formValue.LivestockBreedingList || []).map((liveStockBreeding, liveStockBreedingIndex) => {
                return html`
                    <tr class="TableRow" >
                      <td class="TableRow__cell" >
                        <${Field} items=${itemsListAssistant.tiposGanados}
                          value=${liveStockBreeding.IdType} inputType="combo" disabled />
                      </td>
                      <td class="TableRow__cell" >
                        <${Field} value=${liveStockBreeding.Quantity} disabled />
                      </td>
                      <td class="TableRow__cell TableRow__cell--actions" >
                        ${page != 'viewDownload' && html`
                          <button class="IconBtn" type="button"
                            onclick=${(event) => livestockAPI.edit(liveStockBreeding, liveStockBreedingIndex)}
                          >
                            <${Icon} icon="edit" />
                          </button>
                          <button class="IconBtn" type="button"
                            onclick=${(event) => livestockAPI.delete(liveStockBreedingIndex)}
                          >
                            <${Icon} icon="close" />
                          </button>
                        `}
                      </td>
                    </tr>
                  `;
              })}
            </table>
            <div class="ContentPage__row ContentPage__row--btns">
              ${page != 'viewDownload' && html`
                <button class="Btn ContentPage__btnRight Btn--secondary" type="button"
                  onclick=${livestockAPI.create}
                >
                  Agregar
                </button>
              `}
            </div>
            ${errors.LivestockBreedingList && errors.LivestockBreedingList.invalid && html`
              <div>
                ${errors.LivestockBreedingList.errors.map(err => html`
                  <div class="InlineError">${err}</div>
                `)}
              </div>
            `}
          </div>
          <div class="Tab3__table">
            <div class="ContentPage__subtitle">
              Riego
            </div>
            <table class="Table" >
              <tr class="Table__rowHeader" >
                <th class="Table__cellHeader" >
                  Tipo
                </th>
                <th class="Table__cellHeader" >
                  %
                </th>
                <th class="Table__cellHeader" ></th>
              </tr>
              ${(formValue.IrrigationList || []).map((irrigation, irrigationIndex) => {
                return html`
                  <tr class="TableRow" >  
                    <td class="TableRow__cell" >
                      <${Field} items=${itemsListAssistant.tiposRiegos}
                        value=${irrigation.IdType} inputType="combo" disabled />
                    </td>
                    <td class="TableRow__cell TableRow__cell--predioPercent" >
                      <${Field} value=${irrigation.Percentage} disabled />
                    </td>
                    <td class="TableRow__cell TableRow__cell--actions" >
                      ${page != 'viewDownload' && html`
                        <button class="IconBtn" type="button"
                          onclick=${(event) => irrigationAPI.edit(irrigation, irrigationIndex)}
                        >
                          <${Icon} icon="edit" />
                        </button>
                        <button class="IconBtn" type="button"
                          onclick=${(event) => irrigationAPI.delete(irrigationIndex)}
                        >
                          <${Icon} icon="close" />
                        </button>
                      `}
                    </td>
                  </tr>
                `;
              })}
            </table>
            <div class="ContentPage__row ContentPage__row--btns">
              ${page != 'viewDownload' && html`
                <button class="Btn ContentPage__btnRight Btn--secondary" type="button"
                  onclick=${irrigationAPI.create}
                >
                  Agregar
                </button>
              `}
            </div>
          </div>
        </div>
      </div>

      <div class="ContentPage__section">
        <div>
          Características de construcción
        </div>
        <table class="Table Table--predio" >
          <tr class="Table__rowHeader" >
            <th class="Table__cellHeader" >
              Nº de piso
            </th>
            <th class="Table__cellHeader" >
              Fecha de construcción
            </th>
            <th class="Table__cellHeader" >
              Material predominante
            </th>
            <th class="Table__cellHeader" >
              Estado de conservación
            </th>
            <th class="Table__cellHeader" >
              Estado de construcción
            </th>
            <th class="Table__cellHeader" >
              Área construida (m2)
            </th>
            <th class="Table__cellHeader" ></th>
          </tr>
          ${(formValue.ConstructionFeaturesList || []).map((ConstructionFeature, ConstructionFeatureIndex) => {
              return html`
              <tr class="TableRow" >
                <td class="TableRow__cell TableRow__cell--small" >
                  <${Field} inputType="number" disabled 
                    items=${formValue.ConstructionFeaturesList}
                    value=${ConstructionFeature.IdFloorNumber}></${Field}>
                </td>
                <td class="TableRow__cell" style=${{ 'max-width': `180px` }}  >
                  <${Field} style=${{ 'padding-right': `10px` }} inputType="date" disabled
                    value=${ConstructionFeature.ConstructionDate} ></${Field}>
                </td>
                <td class="TableRow__cell" >
                  <${Field} inputType="combo" disabled
                    items=${itemsListAssistant.tiposMaterialesConstruccion}
                    value=${ConstructionFeature.IdPredominantMaterial} ></${Field}>
                </td>
                <td class="TableRow__cell" >
                  <${Field} inputType="combo" disabled
                    items=${itemsListAssistant.tiposEstadosConservacion}
                    value=${ConstructionFeature.IdConservationStatus} ></${Field}>
                </td>
                <td class="TableRow__cell" >
                  <${Field} inputType="combo" disabled
                    items=${itemsListAssistant.tiposEstadosConstruccion}
                    value=${ConstructionFeature.IdConstructionStatus} ></${Field}>
                </td>
                <td class="TableRow__cell" >
                  <${Field} inputType="number" disabled
                    value=${ConstructionFeature.BuiltArea}></${Field}>
                </td>
                <td class="TableRow__cell" >
                  ${page != 'viewDownload' && html`
                    <button class="IconBtn" onclick=${(event) => constructionAPI.edit(ConstructionFeature, ConstructionFeatureIndex)} >
                      <${Icon} icon="edit" />
                    </button>
                    <button class="IconBtn" onclick=${(event) => constructionAPI.delete(ConstructionFeatureIndex)} >
                      <${Icon} icon="close" />
                    </button>
                  `}
                </td>
              </tr>
            `;
            })}
        </table>
        <div class="ContentPage__row ContentPage__row--btns">
          ${page != 'viewDownload' ? html`
            <button class="Btn Btn--secondary ContentPage__btnRight" type="button"
              onclick=${constructionAPI.create}
            >
              Agregar
            </button>
          ` : html``}
        </div>
      </div>
      <div class="ContentPage__section">
        <${Field} class="Field--middle" title="Observaciones"
          ...${setupInput('Records.Comment')} 
        />
        <div class="ContentPage__row">
          <${Field} title="Fecha de levantamiento" inputType="date"
            max=${formattedTodayMinus1}
            ...${setupInput('Records.LiftingDate')}
          />
          <div class="Field">
            <div>Titular NO sabe firmar</div>
            <div>
              <knq-checkbox class="Checkbox"  
                ...${setupInput('Records.HeadlineCanSign')}
                checkedValue=${`0`}
                uncheckedValue=${`1`}
                disabled=${page == 'viewDownload'}></knq-checkbox>
            </div>
          </div>
          <div class="Field">
            <div>Valida explotación</div>
            <div>
              <knq-checkbox class="Checkbox"  
                ...${setupInput('Records.Declarant.flagValidaExplotacion')}
                checkedValue="1"
                uncheckedValue="0"
                disabled=${page == 'viewDownload' || formValue.Records.IdPExecutor != 4}></knq-checkbox>
            </div>
          </div>
          <${Field} title="Estado actual" disabled value=${formValue.CadastralUnits.Finalize == 1 ? 'COMPLETADA' : 'PENDIENTE'} />
        </div>
      </div>
      <div class="ContentPage__section">
        <div>Firma del declarante</div>
        <div class="ContentPage__row">
          <${Field} title="Tipo de documento" inputType="combo"
            items=${itemsListAssistant.tiposDocumentosIdentidad
              .filter(el => [1,3].includes(+el.Id))
            }
            ...${setupInput('Records.Declarant.IdTypeDocumentIdentity')}
          />
          <${Field} title="Número de documento"
            ...${setupInput('Records.Declarant.DocumentNumber')}
          />
          <${Field} title="Sexo" inputType="combo"
            items=${itemsListAssistant.tiposSexos}
            ...${setupInput('Records.Declarant.IdTypeSex')}
          />
          <${Field} title="Estado civil" inputType="combo"
            items=${itemsListAssistant.tiposEstadosCiviles}
            ...${setupInput('Records.Declarant.IdCivilStatus')}
          />
        </div>
        <div class="ContentPage__row">
          <${Field} title="Nombre"
            ...${setupInput('Records.Declarant.Name')}
            disabled=${(declarant.IdTypeDocumentIdentity == 1 && declarant.DocumentNumber)}
          />
          <${Field} title="Primer apellido"
            ...${setupInput('Records.Declarant.FirstName')}
            disabled=${(declarant.IdTypeDocumentIdentity == 1 && declarant.DocumentNumber)}
          />
          <${Field} title="Segundo apellido"
            ...${setupInput('Records.Declarant.LastName')}
            disabled=${(declarant.IdTypeDocumentIdentity == 1 && declarant.DocumentNumber)}
          />
        </div>
        <div class="ContentPage__row">
          <${Field} title="Dirección"
            ...${setupInput('Records.Declarant.Address')}
          />
          <${Field} title="Fecha de firma" inputType="date" disabled
            value=${formValue.Records.LiftingDate}
          />
          <div class="Separador"></div>
        </div>
      </div>
      
      ${formValue.Records.HeadlineCanSign != '1' && html`
        <div class="ContentPage__section">
          <div>Firma de testigo a ruego</div>
          <div class="ContentPage__row">
            <${Field} title="Tipo de documento" inputType="combo"
              items=${itemsListAssistant.tiposDocumentosIdentidad
                .filter(el => [1, 3].includes(+el.Id))}
              ...${setupInput('Records.PrayerWitness.IdTypeDocumentIdentity')}
            />
            <${Field} title="Número de documento"
              ...${setupInput('Records.PrayerWitness.DocumentNumber')} 
            />
            <${Field} title="Sexo" inputType="combo"
              items=${itemsListAssistant.tiposSexos}
              ...${setupInput('Records.PrayerWitness.IdTypeSex')}
            />
            <${Field} title="Estado civil" inputType="combo"
              items=${itemsListAssistant.tiposEstadosCiviles}
              ...${setupInput('Records.PrayerWitness.IdCivilStatus')}
            />
          </div>
          <div class="ContentPage__row">
            <${Field} title="Nombres"
              ...${setupInput('Records.PrayerWitness.Name')} 
              disabled=${(witness.IdTypeDocumentIdentity == 1 && witness.DocumentNumber)}
            />
            <${Field} title="Primer apellido"
              ...${setupInput('Records.PrayerWitness.FirstName')} 
              disabled=${(witness.IdTypeDocumentIdentity == 1 && witness.DocumentNumber)}
            />
            <${Field} title="Segundo apellido"
              ...${setupInput('Records.PrayerWitness.LastName')} 
              disabled=${(witness.IdTypeDocumentIdentity == 1 && witness.DocumentNumber)}
            />
          </div>
          <div class="ContentPage__row">
            <${Field} title="Dirección"
              ...${setupInput('Records.PrayerWitness.Address')} 
            />
            <${Field} title="Fecha de firma" inputType="date" disabled
              value=${formValue.Records.LiftingDate}
            />
            <div class="Separador"></div>
          </div>
        </div>
      `}

      <div class="ContentPage__section">
        <div>Firma de supervisor</div>
        <div class="ContentPage__row">
          <${Field} title="Nombre completo" inputType="combo"
            items=${supervisors[formValue.CadastralUnits.ZonalOfficeId] || []}
            labelProp="FullName" valueProp="IdMemberGroupJob"
            ...${setupInput('Records.SupervisorId')}
          />
          <${Field} title="Fecha de firma" inputType="date"
            min=${formatDate(formValue.Records.LiftingDate, '{YYYY}-{MM}-{DD}')}
            ...${setupInput('Records.DateSignatureSupervisor')}
          />
          <div class="Separador"></div>
        </div>
      </div>
      <div class="ContentPage__section">
        <div>Firma de verificador catastral</div>
        <div class="ContentPage__row">
          <${Field} title="Nombre completo" inputType="combo"
            items=${verificators[formValue.CadastralUnits.ZonalOfficeId] || []}
            labelProp="FullName" valueProp="IdMemberGroupJob"
            ...${setupInput('Records.IdRegister')}
          />
          <${Field} title="Fecha de firma" inputType="date" disabled
            value=${formValue.Records.LiftingDate}
          />
          <div class="Separador"></div>
        </div>
      </div>
    </div>
  `;
}

function tab4(props) {
  const {
    errors, value: formValue, isAdmin,
    visible,
    documentsAPI
  } = props;
  const {
    tiposAcreditacionDocumentos,
    tiposFormatosDocumentos,
    acreditacionesDocumentos
  } = context.get('itemsListAssistant');
  const page = context.get('page');

  const getItem = (list, id) => {
    const item = list.find(item => item.Id == id);
    return item ? item.Description : '-';
  }

  const table = (documentType, documentId) => {
    const listAPI = documentsAPI(documentType);
    return html`
      <table class="Table Table--predio" >
        <tr class="Table__rowHeader" >
          <th class="Table__cellHeader" style="width:150px">
            Documento acreditador
          </th>
          <th class="Table__cellHeader" style="width:calc(100% - 430px)">
            Forma de presentación
          </th>
          <th class="Table__cellHeader" style="width:100px">
            Archivo
          </th>
          <th class="Table__cellHeader" style="width:100px">
            Usuario
          </th>
          <th class="Table__cellHeader" style="width:80px"></th>
        </tr>
        ${(formValue[documentType] || []).map((doc, docIndex) => html`
          <tr class="TableRow" key=${doc.Route}>
            <td class="TableRow__cell" style="width:150px">
              ${getItem(acreditacionesDocumentos, doc.IdAccreditationDocument)}
            </td>
            <td class="TableRow__cell" style="width:calc(100% - 430px)">
              ${getItem(tiposFormatosDocumentos, doc.IdPresentationForm)}
            </td>
            <td class="TableRow__cell" style="width:100px">  
              ${doc.Name}
            </td>
            <td class="TableRow__cell" style="width:100px">
              ${doc.UserCreation}
            </td>
            <td class="TableRow__cell" style="width:80px">
              ${page != 'viewDownload' && html`
                <button class="IconBtn"
                  onclick=${() => listAPI.edit(doc, docIndex)}
                >
                  <${Icon} icon="edit" />
                </button>
                <button class="IconBtn"
                  onclick=${() => listAPI.delete(docIndex)}
                >
                  <${Icon} icon="close" />
                </button>
              `}
            </td>
          </tr>
        `)}
      </table>
      <div class="ContentPage__row ContentPage__row--btns">
        ${page != 'viewDownload' && html`
          <button class="Btn ContentPage__btnRight Btn--secondary" type="button"
            onclick=${(event) => listAPI.create(documentType,  documentId)}
          >
            Agregar
          </button>
        `}
      </div>
    `;
  }

  return html`
    <div class="ContentPage Scroller ${visible ? 'ContentPage--visible' : '' }">
      <!-- <div class="ContentPage__section">
        <div>Personal</div>
        ${table('PersonalDocuments', 1)}
      </div> -->
      
      <div class="ContentPage__section">
        <div>Propiedad</div>
        ${table('PropertyDocuments', 1)}
        ${errors.PropertyDocuments && errors.PropertyDocuments.invalid && html`
          <div>
            ${errors.PropertyDocuments.errors.map(err => html`
            <div class="InlineError">${err}</div>
            `)}
          </div>
        `}
      </div>

      <div class="ContentPage__section">
        <div>Prueba de posesión</div>
        ${table('PossessionProofDocuments', 2)}
      </div>

      <div class="ContentPage__section">
        <div>Adicionales</div>
        ${table('EvaluationDocuments', 3)}
      </div>
    </div>
  `;
}