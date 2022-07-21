
import config from './config.js';

const URL = config.BACKEND_URL;

export {
  login,
  renewToken,
  getTerritorialUnits,
  getMembersGroupsJobs,
  getItemsList,
  getItemsListAssistant,
  downloadCadastralUnits,
  uploadFiles,
  insertCadastralUnits,
  post,
}
async function login(data) {
  const endpoint = `${URL}/Security/getUserByLogin`;

  data.idsistema = 1;

  const body = JSON.stringify(data);
  const headers = { 'Content-Type': 'application/json' };
  const params = { body, headers, cors: true, json: true, method: 'POST' };

  const response = await fetch(endpoint, params);
  if (response.status != 200) {
    throw new Error('Invalid credentials');
  }
  const json = await response.json();
  if (!['ADMINISTRADOR GORE', 'DIGITADOR'].some(role => json.entidad.nomPerfil.includes(role))) {
    throw new Error('Not Authorized');
  }
  return processAuth(json);
}
async function renewToken() {
  const endpoint = `${URL}/Security/GETUSERBYLOGIN`;

  // data.idsistema = 1;

  // TODO: mejorar esto
  const AccessToken = context.get('credentials').AccessToken;
  const user = context.get('user');

  const body = JSON.stringify({
    AccessToken,
    UserName: user.UserName
  });
  const headers = { 'Content-Type': 'application/json' };
  const params = { body, headers, cors: true, json: true, method: 'POST' };

  const response = await fetch(endpoint, params);
  if (response.status != 200) {
    throw new Error('Not Authorized');
  }
  const json = await response.json();
  return processAuth(json);
}
function processAuth(res) {
  const { AccessToken, ...user } = res['entidad'];

  user.ExpirationToken = new Date(user.ExpirationToken);

  // TODO: tendría que estar en credentials, no user
  user._tokenDuration = user.ExpirationToken - new Date();
  const timeToRenew = new Date(user.ExpirationToken);
  timeToRenew.setTime(timeToRenew.getTime() - user._tokenDuration / 2);
  user._timeToRenew = timeToRenew;

  return {
    AccessToken,
    user
  };
}

function getTerritorialUnits() {
  const data = {
    'idGRegional': null,
    'idOZonal': null,
    'idPCatastral': null,
    'idUnidadTerritorial': 0,
    'firstPage': 1,
    'lastPage': 1000
  };
  return post('MassiveTitling/getAllUTDisconnect', data)
    .then(res => res.lista)
    .then(items => {
      const selTerrUnit = context.get('selTerrUnit');
      if (!selTerrUnit && items && items.length) {
        context.set('selTerrUnit', items[0].idUnidadTerritorial);
      }
      return items;
    });
}
function getMembersGroupsJobs(zona, cargo) {
  const data = {
    ZonalOfficeId: zona,
    IdCargoBrigade: cargo
  };
  return post('Common/GetMembersGroupsJobs', data)
    .then(res => res.MembersGroupsJobs)
    .then((itemsList) => {
      itemsList.forEach(el => {
        el.refId = zona || undefined;
      });
      return itemsList;
    });
}
function getItemsList(payload, refId) {
  return post('Common/GetItemsList', payload)
    .then(res => res.lista)
    .then((itemsList) => {
      itemsList.forEach(el => {
        el.id = el.Id;
        el.description = el.Description;
        el.refId = refId || undefined;
      });
      return itemsList;
    });
}
function getItemsListAssistant(payload) {
  return post('Common/GetItemsListAssistant', payload)
    .then(res => res.lista)
    .then((itemsList) => {
      itemsList.forEach(el => {
        el.id = el.Id;
        el.description = el.Description;
      });
      return itemsList;
    });
}
function downloadCadastralUnits(IdTerritorialUnit) {
  return post('MassiveTitling/GetCadastralUnitByIdUT', {
      IdTerritorialUnit
    })
    .then(res => res.Fichas);
}
function uploadFiles(formData) {
  return post('MassiveTitling/UploadFiles', formData)
    .then(res => res.fileData);
}
function insertCadastralUnits(CadastralUnits) {
  return post('MassiveTitling/InsertCadastralUnits', {
      CadastralUnits
    });
}

async function post(path, data) {
  const credentials = context.get('credentials');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (credentials && credentials.AccessToken) {
    headers.Authorization = `Bearer ${credentials.AccessToken}`;
  }
  const params = {
    headers,
    cors: true, json: true,
    method: 'POST'
  };
  if (data instanceof FormData) {
    params.body = data;
    delete headers['Content-Type'];
  } else {
    params.body = JSON.stringify(data);
  }
  const res = await fetch(`${URL}/${path}`, params);
  const json = await res.json();
  if (res.status < 200 || res.status >= 300) {
    throw json;
  }
  return json;
}