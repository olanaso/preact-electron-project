import dlv from 'https://unpkg.com/dlv@1.1.3/dist/dlv.es.js?module';
import dset from 'https://unpkg.com/dset@2.0.1/dist/dset.es.js?module';

import { navigate, redirect, back, getUrl } from './helpers/routing.js';

import * as API from './api.js';

const onStartApp = () => {

  const updateOnline = () => {
    context.set('online', navigator.onLine);
  };
  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);
  updateOnline();

  // openDBLists();
  // openDBFiles();


  if (localStorage.IDOM_SESSION) {
    context.set('credentials', JSON.parse(localStorage.IDOM_SESSION));
    const user = JSON.parse(localStorage.IDOM_USER);
    if (user.ExpirationToken) {
      user.ExpirationToken = new Date(user.ExpirationToken);
    }
    if (user._timeToRenew) {
      user._timeToRenew = new Date(user._timeToRenew);
    }
    context.set('user', user);
    if (navigator.onLine) {
      setupTokenValidation();
    }
  }

  context.subscribe(['credentials'], () => {
    const credentials = context.get('credentials');
    if (credentials == null) {
      localStorage.removeItem('IDOM_SESSION');
    } else {
      localStorage.IDOM_SESSION = JSON.stringify(credentials);
    }
  });
  context.subscribe(['user'], () => {
    const user = context.get('user');
    if (user == null) {
      localStorage.removeItem('IDOM_USER');
    } else {
      localStorage.IDOM_USER = JSON.stringify(user);
    }
  });

  readListsFromDB();

  for (const key of ['territorialUnits', 'download_CU', 'pendingSync_CU', 'itemsList', 'itemsListAssistant', 'supervisors', 'verificators', 'errorsLog']) {
    context.subscribe([key], async () => {
      const user = context.get('user');
      const data = context.get(key);
      if (user == null) return;

      const store = await openDBLists();
      // TODO: esto se puede mejorar buscando por key y UserName
      const listsValues = await store.getAll();
      const dbValue = listsValues.find(v => v.key == key && v.UserName == user.UserName);
      const newValue = {
        key: key,
        value: data,
        UserName: user.UserName
      };
      if (dbValue) {
        newValue.id = dbValue.id;
      }
      if (data != null) {
        store.add(newValue);
      }
    });
  }
};

const readListsFromDB = () => {
  const keys = ['territorialUnits', 'download_CU', 'pendingSync_CU', 'itemsList', 'itemsListAssistant', 'supervisors', 'verificators', 'errorsLog'];
  const getDefaultValue = (key) => {
    if (['territorialUnits', 'download_CU', 'pendingSync_CU'].includes(key)) {
      return [];
    } else {
      return {};
    }
  };
  // NOTE: inicializamos los valores de las listas
  for (const key of keys) {
    context.set(key, getDefaultValue(key));
  }

  // NOTE: actualizamos su valor con lo de la base de datos si hay usuario y datos disponibles
  openDBLists().then(async store => {
    const listsValues = await store.getAll();
    const user = context.get('user');
    if (user == null) return;
    for (const key of keys) {
      const data = listsValues.find(v => v.key == key && v.UserName == user.UserName);
      // const values = await store.getById(key);
      if (data) {
        context.set(key, data.value);
      }
    }
  });
};

const setupTokenValidation = () => {
  let timeToWait = 5 * 1000;
  const handler = async () => {
    if (!navigator.onLine) {
      return setTimeout(handler, timeToWait);
    }
    const contextUser = context.get('user');
    if (!contextUser) return;

    const { _tokenDuration, _timeToRenew, ExpirationToken } = contextUser;

    const now = new Date();
    if (now > ExpirationToken) {
      showSnack({ msg: 'La sesión ha caducado. Por favor, vuelva a ingresar sus datos.' });
      return;
    }
    if (now > _timeToRenew) {
      const { AccessToken, user } = await API.renewToken();
      context.set('credentials', { AccessToken });
      context.set('user', user);
      timeToWait = user._tokenDuration / 10;
    }
    setTimeout(handler, timeToWait);
  };
  // setTimeout(handler, 10 * 60 * 1000);
  setTimeout(handler, timeToWait);
};

const userLogin = async () => {
  const formData = context.get('formData');
  const data = { ...formData };
  data.Password = await generateHash(formData.Password);

  async function doOfflineLogin(data) {
    return openDB('Idom_Logins').then(async store => {
      const users = await store.getAll();
      const res = users.find(u => u.UserName == data.UserName && u.Password == data.Password);
      if (!res) throw new Error('Not valid offline login');
      
      return res;
    });
  }

  let req = navigator.onLine
    ? API.login(data).then(res => {
      const { AccessToken, user } = res;
      openDB('Idom_Logins').then(async store => {
        await store.add({ ...data, AccessToken, user });
      }).catch(err => {
        console.log(err);
      });
      return res;
    })
    : doOfflineLogin(data);

  return req.then(res => {
    const { AccessToken, user } = res;
    context.set('credentials', { AccessToken });
    context.set('user', user);
    context.set('loading', false);
    readListsFromDB();
    if (navigator.onLine) {
      getAllAPILists();
      setupTokenValidation();
    }
    navigate('territorialUnits');
  }).catch((err) => {
    console.log(err);
    // if (err.message == 'Invalid credentials') {
    //   showSnack({ msg: 'Usuario o contraseña no válidos' });
    // } else if (err.message == 'Not Authorized') {
    //   showSnack({ msg: 'Usuario sin permisos para usar la aplicación' });
    // } else if (err.message == 'Not valid offline login') {
    //   showSnack({ msg: 'Usuario, Contraseña o Acceso no válidos' });
    // } else {
    //   showSnack({ msg: 'Ha ocurrido un error' });
    // }
    showSnack({ msg: 'Ocurrió un error al ingresar al sistema' });
    context.set('loading', false);
    context.set('credentials', undefined);
  });
};
const userLogout = () => {
  context.set('credentials', null)
  context.set('user', null);
  navigate('login');
};

const enterOnCadastral = (params, query) => {
  context.set('navSelected', 'cadastralUnits');
  let cadastralUnit = {
    Land: {},
    CadastralUnits: {
      
    },
    Records: {
      PrayerWitness: {},
      Declarant: {}
    },
    FarmingList: [],
    LivestockBreedingList: [],
    IrrigationList: [],
    ConstructionFeaturesList: [],
    PersonalDocuments: [],
    PropertyDocuments: [],
    PossessionProofDocuments: [],
    EvaluationDocuments: [],
    Forks: {},
    HolderIdentifierList: [],
    LitigantsList: [],
    _nomTipoLevantamiento: ''
  };
  
  if (query.refId) { // NOTE: crear con una como base
    const downloads = context.get('download_CU');
    const refCadastralUnit = downloads.find(el => el.CadastralUnits.CadastralUnitId == query.refId);
    const preCadastralUnit = JSON.parse(JSON.stringify(refCadastralUnit));
    // preCadastralUnit.CadastralUnits.PreviousCadastralUnit = query.refId;
    for (const key of Object.keys(preCadastralUnit)) {
      if (preCadastralUnit[key] == null) {
        delete preCadastralUnit[key];
      }
    }
    cadastralUnit = {
      ...cadastralUnit,
      ...preCadastralUnit,
      __refId: query.refId
    };
    if (cadastralUnit.Records.PrayerWitness == null) {
      cadastralUnit.Records.PrayerWitness = {};
    }
    let IdTerritorialUnit = context.get('selTerrUnit');
    if (IdTerritorialUnit == null) {
      IdTerritorialUnit = cadastralUnit.CadastralUnits.IdTerritorialUnit;
      context.set('selTerrUnit', IdTerritorialUnit);
    }
    preCadastralUnit.CadastralUnits.CadastralUnitId = Math.floor(Math.random() * 2147483647);
  } else if (params.id) { // NOTE: edición
    const pendingSync_CU = context.get('pendingSync_CU');
    const pendingCU = pendingSync_CU.find(el => el.CadastralUnits.CadastralUnitId == params.id);
    let IdTerritorialUnit = context.get('selTerrUnit');
    if (IdTerritorialUnit == null) {
      IdTerritorialUnit = pendingCU.CadastralUnits.IdTerritorialUnit;
      context.set('selTerrUnit', IdTerritorialUnit);
    }
    cadastralUnit = {
      ...cadastralUnit,
      ...pendingCU
    };
  } else if (params.viewId) { // NOTE: vista
    let IdTerritorialUnit = context.get('selTerrUnit');

    const downloads = context.get('download_CU');
    let viewUnit = downloads.find(el => el.CadastralUnits.CadastralUnitId == params.viewId);
    if (viewUnit == null) {
      const pendingSync_CU = context.get('pendingSync_CU');
      viewUnit = pendingSync_CU.find(el => el.CadastralUnits.CadastralUnitId == params.viewId);
    }
    if (IdTerritorialUnit == null) {
      IdTerritorialUnit = viewUnit.CadastralUnits.IdTerritorialUnit;
      context.set('selTerrUnit', IdTerritorialUnit);
    }
    for (const key of Object.keys(viewUnit)) {
      if (viewUnit[key] == null) {
        delete viewUnit[key];
      }
    }
    cadastralUnit = {
      ...cadastralUnit,
      ...viewUnit
    };
    cadastralUnit.Records.Declarant = cadastralUnit.Records.Declarant || {};
    cadastralUnit.Records.PrayerWitness = cadastralUnit.Records.PrayerWitness || {};
    // TODO: revisar por qué estaba esto así
    // cadastralUnit.CadastralUnits.PreviousCadastralUnit = params.viewId;
  } else { // NOTE: new
    let IdTerritorialUnit = context.get('selTerrUnit');
    if (IdTerritorialUnit == null) {
      IdTerritorialUnit = query.ut;
      context.set('selTerrUnit', IdTerritorialUnit);
    }
    const UT = context.get('territorialUnits')
      .find(ut => ut.idUnidadTerritorial == IdTerritorialUnit);

    const user = context.get('user');
    cadastralUnit = {
      Land: {},
      CadastralUnits: {
        CadastralUnitId: Math.floor(Math.random() * 2147483647),
        RegionalGovernmentId: user.idGRegional,
        ZonalOfficeId: user.idOZonal,
        IdDepartment: user.idDepartamento,
        IdTerritorialUnit,
        IdLegalNorm: 7,
        CadastralProjectId: UT ? UT.idPCatastral : ''
      },
      Records: {
        Declarant: {},
        PrayerWitness: {},
        HeadlineCanSign: '1',
        IdPExecutor: UT.nomProyEjecutor || 4
      },
      FarmingList: [],
      LivestockBreedingList: [],
      IrrigationList: [],
      ConstructionFeaturesList: [],
      PersonalDocuments: [],
      PropertyDocuments: [],
      PossessionProofDocuments: [],
      EvaluationDocuments: [],
      Forks: {},
      HolderIdentifierList: [],
      LitigantsList: [],
      _nomTipoLevantamiento: UT ? UT.nomTipoLevantamiento : ''
    };
  }
  const fixDate = (obj, path) => {
    const date = dlv(obj, path);
    if (/Date\(/.test(date)) {
      const newDate = new Date(+date.substring(6).slice(0, -2));
      dset(obj, path, formatDate(newDate, '{YYYY}-{MM}-{DD}'));
    } else if (new Date(date) != 'Invalid Date') {
      dset(obj, path, formatDate(new Date(date), '{YYYY}-{MM}-{DD}'));
    }
  }
  fixDate(cadastralUnit, 'Land.OccupationDate');
  fixDate(cadastralUnit, 'Land.RegistrationDate');
  fixDate(cadastralUnit, 'Records.DateSignatureSupervisor');
  fixDate(cadastralUnit, 'Records.LiftingDate');
  fixDate(cadastralUnit, 'Records.Declarant.BirthDate');
  fixDate(cadastralUnit, 'Records.PrayerWitness.BirthDate');
  cadastralUnit.ConstructionFeaturesList.forEach(el => {
    fixDate(el, 'ConstructionDate');
    // fixDate(el, 'CreationDate');
    // fixDate(el, 'ModificationDate');
  });
  cadastralUnit.PersonalDocuments.forEach(el => {
    fixDate(el, 'PresentationDate');
  });
  cadastralUnit.PossessionProofDocuments.forEach(el => {
    fixDate(el, 'PresentationDate');
  });
  cadastralUnit.PropertyDocuments.forEach(el => {
    fixDate(el, 'PresentationDate');
  });
  context.set('cadastralUnit', cadastralUnit);
};



const getAllItemsListAssistant = async () => {
  // TODO: descomentar si queremos cachearlo
  // const itemsListAssistant = context.get('itemsListAssistant');
  // if (itemsListAssistant && itemsListAssistant.tiposAcreditacionDocumentos) return;

  const newListAssistant = {};
  const getAndSet = (Type, key) => 
    API.getItemsListAssistant({ Type })
      .then(res => newListAssistant[key] = res);
  const promises = [
    getAndSet('TIPOSACREDITACIONDOCUMENTOS', 'tiposAcreditacionDocumentos'),
    getAndSet('TIPOSFORMATOSDOCUMENTOS', 'tiposFormatosDocumentos'),
    getAndSet('PROYECTOS_EJECUTORES', 'proyectos_Ejecutores'),
    getAndSet('NORMASLEGALES', 'normasLegales'),
    getAndSet('TIPOSUSOS', 'tiposUsos'),
    getAndSet('TIPOSCLASIFICACIONUSO', 'tiposClasificacionUso'),
    getAndSet('TIPOSPROPIEDADES', 'tiposPropiedades'),
    getAndSet('TIPOSESTADOSPROPIEDADES', 'tiposEstadosPropiedades'),
    getAndSet('TIPOSCONDICIONESJURIDICAS', 'tiposCondicionesJuridicas'),
    getAndSet('TIPOSINSCRIPCIONESREGISTROS', 'tiposInscripcionesRegistros'),
    getAndSet('TIPOSEDIFICACIONES', 'tiposEdificaciones'),
    getAndSet('TIPOSDOCUMENTOSIDENTIDAD', 'tiposDocumentosIdentidad'),
    getAndSet('TIPOSTITULARES', 'tiposTitulares'),
    getAndSet('TIPOSFORMASADJUDICACIONES', 'tiposFormasAdjudicaciones'),
    getAndSet('TIPOSESTADOSCIVILES', 'tiposEstadosCiviles'),
    getAndSet('TIPOSSEXOS', 'tiposSexos'),
    getAndSet('TIPOSPERSONASJURIDICAS', 'tiposPersonasJuridicas'),
    getAndSet('TIPOSAGRICOLAS', 'tiposAgricolas'),
    getAndSet('TIPOSGANADOS', 'tiposGanados'),
    getAndSet('TIPOSRIEGOS', 'tiposRiegos'),
    getAndSet('TIPOSMATERIALESCONSTRUCCION', 'tiposMaterialesConstruccion'),
    getAndSet('TIPOSESTADOSCONSERVACION', 'tiposEstadosConservacion'),
    getAndSet('TIPOSESTADOSCONSTRUCCION', 'tiposEstadosConstruccion'),
  ];
  await Promise.all(promises);
  let reqs = newListAssistant.tiposAgricolas.map(tipo => {
    return API.getItemsListAssistant({ Type: 'TIPOSGRUPOSAGRICOLAS', Id: tipo.Id });
  });
  const tiposGruposAgricolas = await Promise.all(reqs);
  newListAssistant.tiposGruposAgricolas = tiposGruposAgricolas.flat();
  
  getAndSet('ACREDITACIONESDOCUMENTOS', 'acreditacionesDocumentos'),
  reqs = newListAssistant.tiposAcreditacionDocumentos.map(tipo => {
    return API.getItemsListAssistant({ Type: 'ACREDITACIONESDOCUMENTOS', Id: tipo.Id });
  });
  const acreditacionesDocumentos = await Promise.all(reqs);
  newListAssistant.acreditacionesDocumentos = acreditacionesDocumentos.flat();
  return newListAssistant;
};

const downloadTerritorialUnit = (idUT) => {
  const user = context.get('user');
  if (!navigator.onLine) {
    showSnack({ msg: 'Esta acción no está disponible sin conexión' });
  } else if (user.ExpirationToken < Date.now()) {
    showSnack({ msg: 'La sesión ha caducado. Antes de poder descargar información debe loguearse de nuevo.' });
  } else {
    showSnack({ msg: 'Descargando...', time: 0 });
    return API.downloadCadastralUnits(idUT)
      .then((cuList) => {
        showSnack({ msg: 'Unidades descargadas con éxito' });
        const territorialUnits = context.get('territorialUnits');
        const filteredUT = context.get('filteredUT');
        //TODO - Marcar cual se acaba de descargar rellenando downloaded = true
        const territorialUnit = territorialUnits.find(el => el.idUnidadTerritorial == idUT);
        const territorialUnit2 = filteredUT.find(el => el.idUnidadTerritorial == idUT);
        territorialUnit.downloaded = true;
        territorialUnit2.downloaded = true;
        context.set('selTerrUnit', idUT);
        context.set('territorialUnits', territorialUnits);
        context.set('filteredUT', filteredUT);
        const download_CU = context.get('download_CU');
        context.set('download_CU', [
          ...download_CU,
          ...(cuList || [])
        ]);
      })
      .catch(err => {
        showSnack({ msg: 'Ha ocurrido un error en el servidor' });
      });
  }
};

let snackTimeout = null;
const showSnack = (data) => {
  context.set('snackData', { ...data, opened: true });

  if (data.time === 0) return;

  clearTimeout(snackTimeout);
  snackTimeout = setTimeout(() => {
    context.set('snackData', { ...data, opened: false });
  }, data.time || 3000);
};

const getAllAPILists = async () => {
  try {
    if (!context.get('online')) return;
    const user = context.get('user');

    context.set('loading', true);
    const [
      allUTs, assistants, gobiernosRegionales, oficinasZonales, departamentos
    ] = await Promise.all([
      API.getTerritorialUnits(),
      getAllItemsListAssistant(),
      API.getItemsList({ Type: 'GORE' }, null),
      API.getItemsList({ Type: 'OZON', 'Id': user.idGRegional }, user.idGRegional),
      API.getItemsList({ Type: 'DEP' }, null),
    ]);
    const UTs = allUTs.filter(ut => user.idGRegional == ut.idGRegional
      && (!user.idOZonal || user.idOZonal == ut.idOZonal)
    );
    // NOTE: actualizar el estado de downloaded
    const oldUTs = context.get('territorialUnits') || [];
    UTs.forEach(newUT => {
      const oldUT = oldUTs.find(oldUT => oldUT.idUnidadTerritorial == newUT.idUnidadTerritorial);
      newUT.downloaded = oldUT && oldUT.downloaded;
    });
    context.set('territorialUnits', UTs);
    context.set('itemsListAssistant', assistants);
    const itemsList = {
      gobiernosRegionales,
      oficinasZonales,
      departamentos
    };
    console.log(itemsList);
    const [
      sectores,
      zonas,
      valles,
      supervisors,
      verificators,
      provincias
    ] = await Promise.all([
      Promise.all(UTs.map(ut => API.getItemsList({
        Type: 'SECT',
        Id: ut.idUnidadTerritorial
      }, ut.idUnidadTerritorial))),
      Promise.all(gobiernosRegionales.map(gob => API.getItemsList({
        Type: 'ZONEGORE',
        Id: gob.Id
      }, gob.Id))),
      Promise.all(oficinasZonales.map(zona => API.getItemsList({
        Type: 'VALL',
        Id: zona.Id
      }, zona.Id))),
      Promise.all(oficinasZonales.map(zona => API.getMembersGroupsJobs(zona.Id, 5))),
      Promise.all(oficinasZonales.map(zona => API.getMembersGroupsJobs(zona.Id, 6))),
      Promise.all(departamentos.map(dep => API.getItemsList({
        Type: 'PRO',
        Id: dep.Id
      }, dep.Id))),
    ]);
    const reduceAsRefMap = (acc, el) => {
      if (el.length === 0) return acc;
      acc[el[0].refId] = el;
      return acc;
    };
    itemsList.sectores = sectores.reduce(reduceAsRefMap, {});
    itemsList.zonas = zonas.reduce(reduceAsRefMap, {});
    itemsList.valles = valles.reduce(reduceAsRefMap, {});
    itemsList.provincias = provincias.reduce(reduceAsRefMap, {});
    const distritos = await Promise.all(provincias.flat().map(pro => API.getItemsList({
      Type: 'DIS',
      Id: pro.Id
    }, pro.Id)));
    itemsList.distritos = distritos.reduce(reduceAsRefMap, {});

    context.set('supervisors', supervisors.reduce(reduceAsRefMap, {}));
    context.set('verificators', verificators.reduce(reduceAsRefMap, {}));
    context.set('itemsList', itemsList);
    console.log(itemsList);
    context.set('loading', false);
  } catch (err) {
    context.set('loading', false);
    return showSnack({ msg: 'Ha ocurrido un error inesperado.' });
  }
};

const openDB = (storeName) => {
  const DB_NAME = 'IDOM_PERU_CADASTRAL';
  const DB_VERSION = 1; // Use a long long for this value (don't use a float)
  if (window.IDOM_DB == null) {
    window.IDOM_DB = {};
  }
  if (window.IDOM_DB[storeName]) return Promise.resolve(window.IDOM_DB[storeName]);
  //const DB_VERSION = Object.keys(window.IDOM_DB).length + 1;

  return new Promise((resolve, reject) => {
    console.log("openDb ...");
    var req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = function (evt) {
      window.IDOM_DB[storeName] = createDBObject(evt.target.result, storeName);
      resolve(window.IDOM_DB[storeName]);
      console.log("openDb DONE");
    };
    req.onerror = function (evt) {
      console.error("openDb:", evt.target.errorCode);
      reject(evt.target.errorCode);
    };

    req.onupgradeneeded = function (evt) {
      console.log("openDb.onupgradeneeded");
      const db = evt.target.result;
      const store = db.createObjectStore('Idom_Lists', {
        keyPath: 'id',
        autoIncrement: true
      });
      store.createIndex('name', 'name', { unique: false });
      
      const store3 = db.createObjectStore('Idom_Logins', {
        keyPath: 'id',
        autoIncrement: true
      });
      store3.createIndex('email', 'email', { unique: false });

      const store2 = db.createObjectStore('Idom_Files', {
        keyPath: 'id',
        autoIncrement: true
      });

      store2.createIndex('name', 'name', { unique: false });
      store2.createIndex('encryptedName', 'encryptedName', { unique: false });
      store2.createIndex('temporaryFolderName', 'temporaryFolderName', { unique: false });
      store2.createIndex('uploaded', 'uploaded', { unique: false });
      // store.createIndex('title', 'title', { unique: false });
    };
    req.onblocked = function () {
      // Give the other clients time to save data asynchronously.
      setTimeout(function () {
        console.log("Upgrade blocked - Please close other tabs displaying this site.");
      }, 1000);
    };
  });

  function createDBObject(db, storeName) {
    function storeAuxFunction(mode, cb) {
      return new Promise((resolve, reject) => {
        const store = db.transaction(storeName, mode).objectStore(storeName);
        const req = cb(store);
        req.onsuccess = function (evt) {
          resolve(evt.target.result);
        };
      });
    }

    return {
      db,
      storeName,
      getById: id => storeAuxFunction('readonly', store => store.get(id)),
      getAll: () => storeAuxFunction('readonly', store => store.getAll()),
      add: obj => storeAuxFunction('readwrite', store => store.put(obj)),
      delete: id => storeAuxFunction('readwrite', store => store.delete(id)),
      clear: () => storeAuxFunction('readwrite', store => store.clear()),
    }
  }
};

const openDBFiles = () => {
  return openDB('Idom_Files');
};
const openDBLists = () => {
  return openDB('Idom_Lists');
};
const generateHash = (str) => {
  function hash(algo, str) {
    return crypto.subtle.digest(algo, new TextEncoder().encode(str));
  }
  function encode64(buff) {
    return btoa(new Uint8Array(buff).reduce((s, b) => s + String.fromCharCode(b), ''));
  }
  return hash('SHA-256', str).then(hashed => encode64(hashed));
};

// TODO: getAllAPIList?
const cleanSavedDataAndRefresh = () => {
  context.set('confirmDialogData', {
    msg: 'Se borraran todas las unidades catastrales no sincronizadas y todos los datos guardados. Está acción no se podrá deshacer',
    actions: [
      { label: 'Cancelar', cls: 'Btn--secondary', cb: () => context.set('confirmDialogData', null) },
      {
        label: 'Restaurar de fábrica', cls: 'Btn--warning',
        cb: () => {
          context.set('confirmDialogData', null);
          setTimeout(clearDatabasesAndRefresh, 10);
        }
      },
      {
        label: 'Aceptar', cls: 'Btn--primary',
        cb: () => {
          context.set('confirmDialogData', null)
          context.set('download_CU', []);
          context.set('pendingSync_CU', []);
          context.set('territorialUnits', []);
          context.set('errorsLog', {});
          setTimeout(async () => {
            await getAllAPILists();
            if (context.get('page') == 'territorialUnits') {
              context.set('filterUT', '');
            }
          }, 100);
        }
      },
    ] 
  });
};
const clearDatabasesAndRefresh = () => {
  context.set('confirmDialogData', {
    title: '¡CUIDADO!',
    msg: 'Se borraran TODOS los datos de TODOS los usuarios. Está acción no se podrá deshacer',
    actions: [
      { label: 'Cancelar', cls: 'Btn--secondary', cb: () => context.set('confirmDialogData', null) },
      {
        label: 'Aceptar', cls: 'Btn--warning',
        cb: async () => {
          context.set('confirmDialogData', null)
          let store = await openDB('Idom_Lists');
          await store.clear();
          store = await openDB('Idom_Logins');
          await store.clear();
          store = await openDB('Idom_Files');
          await store.clear();
          context.set('download_CU', []);
          context.set('pendingSync_CU', []);
          context.set('territorialUnits', []);
          context.set('errorsLog', {});
          setTimeout(async () => {
            await getAllAPILists();
            if (context.get('page') == 'territorialUnits') {
              context.set('filterUT', '');
            }
          }, 100);
        }
      },
    ]
  });
};

const filterByTerritorialUnit = (contextKey) => {
  const arrayItems = context.get(contextKey);
  let territorialUnit = context.get('selTerrUnit');
  if (!territorialUnit) {
    const territorialUnits = context.get('territorialUnits');
    territorialUnit = territorialUnits[0].idUnidadTerritorial;
    context.set('selTerrUnit', territorialUnit);
  }
  const result = arrayItems.filter(cu => (cu.CadastralUnits.IdTerritorialUnit == territorialUnit) || !cu.CadastralUnits.IdTerritorialUnit);
  return result;
};
const filterCadastralUnits = (filter = {}) => {
  const { territorialUnit, query = '', state = '' } = filter;
  const pendings = context.get('pendingSync_CU');
  pendings.forEach(el => el._state = 'pending');
  const downloads = context.get('download_CU');
  downloads.forEach(el => el._state = 'download');
  let units = [...pendings, ...downloads];

  const queryReg = new RegExp(query, 'i');
  const filterByUT = cu => (!territorialUnit || !cu.CadastralUnits.IdTerritorialUnit || cu.CadastralUnits.IdTerritorialUnit == territorialUnit);
  const filterByQuery = cu => 
    (cu.Land.LandName && queryReg.test(cu.Land.LandName))
    || (cu.Records.Declarant && cu.Records.Declarant.FullName && queryReg.test(cu.Records.Declarant.FullName))
    || (cu.CadastralUnits.CadastralUnit && queryReg.test(cu.CadastralUnits.CadastralUnit))
    || (cu.Records.RecordNumber && queryReg.test(cu.Records.RecordNumber));
  const filterByState = cu => !state || cu._state === state;
  const filtered = units.filter(cu => filterByUT(cu) && filterByQuery(cu) && filterByState(cu));
  context.set('filteredUnits', filtered);
};

const syncPendingCadastralUnits = () => {
  function syncCadastralUnits() {
    return new Promise((resolve, reject) => {
      const CadastralUnits = filterByTerritorialUnit('pendingSync_CU')
        .filter(unit => unit.CadastralUnits.Finalize == 1);
      openDBFiles().then(store => {
        const promises = [];
        CadastralUnits.forEach(cUnit => {
          // cUnit.PersonalDocuments.forEach(doc => {
          //   if (doc.Route && doc.Route[0] != '/') {
          //     promises.push(new Promise((resolve, reject) => {
          //       store.getById(doc.Route).then(storedFile => {
          //         doc.Route = `${storedFile.temporaryFolderName}/${storedFile.encryptedName}`;
          //         resolve();
          //       });
          //     }));
          //   }
          // });
          cUnit.PropertyDocuments.forEach(doc => {
            if (doc.Route && doc.Route[0] != '/') {
              promises.push(store.getById(doc.Route)
                .then(storedFile => {
                  doc.Route = `${storedFile.temporaryFolderName}/${storedFile.encryptedName}`;
                })
              );
            }
          });
          cUnit.PossessionProofDocuments.forEach(doc => {
            if (doc.Route && doc.Route[0] != '/') {
              promises.push(store.getById(doc.Route)
                .then(storedFile => {
                  doc.Route = `${storedFile.temporaryFolderName}/${storedFile.encryptedName}`;
                })
              );
            }
          });
          cUnit.EvaluationDocuments.forEach(doc => {
            if (doc.Route && doc.Route[0] != '/') {
              promises.push(store.getById(doc.Route)
                .then(storedFile => {
                  doc.Route = `${storedFile.temporaryFolderName}/${storedFile.encryptedName}`;
                })
              );
            }
          });
          cUnit.HolderIdentifierList.forEach(holder => {
            if (holder.FilePath && holder.FilePath[0] != '/') {
              promises.push(store.getById(holder.FilePath)
                .then(storedFile => {
                  holder.FilePath = `${storedFile.temporaryFolderName}/${storedFile.encryptedName}`;
                })
              );
            }
            if (holder.IdTypeDocumentIdentity == '1') {
              // delete holder.FullName;
              // delete holder.IdTypeSex;
              // delete holder.IdCivilStatus;
              // delete holder.Address;
            }
          });
        });
        Promise.all(promises).then(() => {
          API.insertCadastralUnits(CadastralUnits)
            .then(response => {
              console.log(response);
              resolve(CadastralUnits.map(el => el.CadastralUnits.CadastralUnitId));
            }).catch(error => {
              console.log(error);
              reject(error);
            });
        });
      });
    });
  }
  return syncCadastralUnits()
    .then(CadastralUnitsUploaded => {
      const pendingSync_CU = context.get('pendingSync_CU');
      let download_CU = context.get('download_CU');
      context.set('pendingSync_CU', pendingSync_CU.filter(el => !CadastralUnitsUploaded.includes(el.CadastralUnits.CadastralUnitId)));
      download_CU = [...download_CU, ...pendingSync_CU.filter(el => CadastralUnitsUploaded.includes(el.CadastralUnits.CadastralUnitId))];
      context.set('download_CU', download_CU);
      return CadastralUnitsUploaded;
    })
    .catch(errs => {
      const errArray = [];
      if (Object.keys(errs) == 0) {
        throw { code: 'SERVER_ERROR' };
      }
      for (const key of Object.keys(errs)) {
        errArray.push({
          cadastralMsgs: errs[key],
          cadastralCode: key
        });
      }
      throw errArray;
    });

};
const syncDocsPendingCadastralUnits = async () => {
  const store = await openDBFiles();
  const formData = new FormData();
  const storedFiles = await store.getAll();
  storedFiles.forEach(sFile => {
    if (!sFile.uploaded) {
      formData.append('files', new File([sFile.file], `${sFile.id}_${sFile.name}`, { type: sFile.file.type }));
    }
  });
  const uploadedFiles = await API.uploadFiles(formData);
  
  for (const uFile of uploadedFiles) {
    const idFile = +uFile.identifier;
    const storedFile = await store.getById(idFile);
    if (!storedFile) {
      return;
    }
    await store.delete(idFile);
    await store.add({
      id: idFile,
      name: uFile.realName,
      uploaded: true,
      encryptedName: uFile.encryptedName,
      temporaryFolderName: uFile.temporaryFolderName,
      file: storedFile.file
    });
  }
  return uploadedFiles;
};
const doSync = async () => {
  const user = context.get('user');
  if (user.ExpirationToken < Date.now()) {
    return showSnack({ msg: 'La sesión ha caducado. Antes de poder sincronizar información debe loguearse de nuevo.' });
  }
  context.set('synchronizing', true);
  try {
    await syncDocsPendingCadastralUnits();
    await syncPendingCadastralUnits()
      .then(values => {
        if (values.length === 0) {
          showSnack({ msg: 'No hay nada que sincronizar' });
        } else {
          showSnack({ msg: 'Sincronización realizada con éxito' });
        }
        // TODO: debería hacerse en otro lado?
        filterCadastralUnits({
          territorialUnit: context.get('selTerrUnit')
        });
        context.set('synchronizing', false);
      })
      .catch(err => {
        if (err.code === 'SERVER_ERROR') {
          showSnack({ msg: 'Error en el servidor.' });
          context.set('synchronizing', false);
          return;
        }
        const errorsLog = context.get('errorsLog');
        errorsLog[context.get('selTerrUnit')] = err;
        context.set('errorsLog', errorsLog);
        context.set('errorMsgs', err);
        context.set('synchronizing', false);
      });
  } catch (err) {
      showSnack({ msg: 'Error al sincronizar los documentos asociados.' });
      context.set('synchronizing', false);
  }
};

const getSynchronizingText = () => {
  const selTerrUnit = context.get('selTerrUnit');
  const territorialUnits = context.get('territorialUnits');
  const territorialUnit = territorialUnits.find(el => el.idUnidadTerritorial == selTerrUnit);
  return `Sincronizando la UT - ${territorialUnit.nombre}`;
};
const viewErrorsLog = () => {
  const errorsLog = context.get('errorsLog');
  let errorMsgs = errorsLog[context.get('selTerrUnit')];
  if (!errorMsgs || !errorMsgs.length) {
    errorMsgs = [{ cadastralMsgs: [], cadastralCode: 'No hay errores guardados para esta UT' }];
  }
  context.set('errorMsgs', errorMsgs);
};

const calcNumberUCs = (terrUnit) => {
  const download_CU = context.get('download_CU');
  const result = download_CU.filter(cu => cu.CadastralUnits.IdTerritorialUnit == terrUnit.idUnidadTerritorial);
  return result.length;
};

const isFieldInvalid = (fieldInfo) => {
  return fieldInfo ? fieldInfo.invalid : false;
};

const formatDate = (date, pattern) => {
  // https://github.com/lukeed/tinydate
  date = new Date(date);
  const RGX = /([^{]*?)\w(?=\})/g;
  const pad = str => `0${str}`.slice(-2);
  const dict = {
    YYYY: d => d.getFullYear(),
    YY: d => d.getYear(),
    M: d => d.getMonth() + 1,
    MM: d => pad(d.getMonth() + 1),
    MMM: d => d.toLocaleString('default', { month: 'short' }),
    MMMM: d => d.toLocaleString('default', { month: 'long' }),
    D: d => d.getDate(),
    DD: d => pad(d.getDate()),
    DDD: d => d.toLocaleString('default', { weekday: 'short' }),
    DDDD: d => d.toLocaleString('default', { weekday: 'long' }),
    h: d => d.getHours(),
    m: d => d.getMinutes(),
    s: d => d.getSeconds(),
    hh: d => pad(d.getHours()),
    mm: d => pad(d.getMinutes()),
    ss: d => pad(d.getSeconds()),
    fff: d => d.getMillisecond(),
  };
  // TODO: cachear por pattern
  var parts = [], offset = 0;
  pattern.replace(RGX, function (key, _, idx) {
    // save preceding string
    parts.push(pattern.substring(offset, idx - 1));
    offset = idx += key.length + 1;
    // save function
    parts.push(d => dict[key](d));
  });

  if (offset !== pattern.length) {
    parts.push(pattern.substring(offset));
  }

  return ((d = new Date()) => {
    let out = '', i = 0;
    for (; i < parts.length; i++) {
      out += (typeof parts[i] === 'string') ? parts[i] : parts[i](d);
    }
    return out;
  })(date);
};

export {
  userLogin,
  userLogout,
  onStartApp,
  enterOnCadastral,
  
  cleanSavedDataAndRefresh,

  downloadTerritorialUnit,
  openDB,
  
  doSync,
  filterByTerritorialUnit,
  filterCadastralUnits,
  generateHash,
  viewErrorsLog,
  getSynchronizingText,
  calcNumberUCs,
  isFieldInvalid,

  showSnack,
  formatDate
};
