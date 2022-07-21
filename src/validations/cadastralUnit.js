const isRequired = (errorMsg = "Campo obligatorio") => value => {
  if (!value) {
    return errorMsg;
  }
};

const hasMinimalHolders = (value, formValue) => {
  /**
   * propietario unico = 1
   * poseedor = 3
   * sucesion intestada = 6
   * sociedad conyugal = 7
   * cotitularidad = 8
   * litigio = 9
   * otros = 10
   */
  if (value == null || !Array.isArray(value) || value.length === 0) {
    return 'La lista de titulares no puede estar vacía';
  }
  const errors = [];
  const condicionTitular = formValue.Land.IdTypeLegalStatus;
  
  if ([6, 7, 8].includes(+condicionTitular) && value.length < 2) {
    errors.push('Debes añadir al menos dos titulares/poseedores');
  }

  if ([6].includes(+condicionTitular) && value.filter(item => item.Finado == 1).length < 1) {
    errors.push('Al menos un titular/poseedor tiene que estar identificado como finado');
  }
  if ([7].includes(+condicionTitular) && value.filter(item => item.IdCivilStatus == '2').length < 2) {
    errors.push('Al menos dos titulares/poseedores deben estar casados');
  }

  if ([8].includes(+condicionTitular) && !value.every(item => item.IdCivilStatus != '2' || value.find(h => h.HolderId == item.IdLink))) {
    errors.push('Todas las personas casadas tienen que estar enlazadas');
  }

  if ([9, 10].includes(+condicionTitular) && !value.every(item => item.IdCivilStatus != '2' || item.IdLink)) {
    errors.push('Todas las personas casadas tienen que estar enlazadas');
  }
  if ([9].includes(+condicionTitular) && value.length === 0) {
    errors.push('Debes añadir al menos un titular/poseedor');
  }

  return errors;
};
const hasMinimalLitigants = (value, formValue) => {
  const condicionTitular = formValue.Land.IdTypeLegalStatus;
  
  if (condicionTitular != 9 && value.length !== 0) {
    return 'La lista de litigantes no puede tener valores si la condición no es Litigio';
  }
  //LITIGIO
  if (condicionTitular == 9 && value.length === 0) {
    return 'Si la condición es Litigio, debe existir al menos un Litigante';
  }
};

const checkThresholds = (value, formValue) => {
  let total = value.reduce((acc, el) => acc + +el.Percentage, 0);
  if (total < 0 || total > 100) {
    return 'La suma de porcentajes tiene que estar entre 0 y 100';
  }
};

const isPastDate = (errorMsg) => (value, formValue) => {
  const date = new Date(value);
  const today = new Date();
  if (date >= today) {
    return errorMsg;
  }
};

const isOccupationDateRequired = (value, formValue) => {
  if ([1,2,3,4,5].includes(+formValue.Land.IdTypeLegalStatus)) {
    const reqRet = isRequired()(value);
    if (reqRet) return reqRet;
  }
};

const isRequiredIfTitularUnico = (errorMsg) => (value, formValue) => {
  if (formValue.Land.IdTypeLegalStatus == 1 && !value) {
    return errorMsg;
  }
};
const isRequiredIfIdDepartmentT = (errorMsg) => (value, formValue) => {
  if (formValue.Forks.IdDepartmentT && !value) {
    return errorMsg;
  }
};

export default {
  CadastralUnits: {
    RegionalGovernmentId: isRequired(),
    ZonalOfficeId: isRequired(),

    IdDepartment: isRequired(),
    IdProvince: isRequired(),
    IdDistrict: isRequired(),
    IdSector: isRequired(),

    ZoneUtm: isRequired(),
    CadastralUnit: (value, formValue) => {
      const uts = context.get('territorialUnits');
      const utId = context.get('selTerrUnit');
      const UT = uts.find(ut => ut.idUnidadTerritorial == utId);
      if (!UT.rangosUT) {
        return 'La unidad territorial no tiene rangos disponibles'
      }
      if (!value || !UT.rangosUT.find(rango => +value >= rango.numInicial && +value <= rango.numFinal)) {
        const intervals = UT.rangosUT.map(rango => `[${rango.numInicial}, ${rango.numFinal}]`).join(' ');
        return `El número debe de estar en uno de estos intervalos: ${intervals}`;
      }
    },

    CadastralProjectId: isRequired(),
    IdTerritorialUnit: isRequired()
  },
  Records: {
    IdPExecutor: isRequired(),
    RecordNumber: isRequired(),

    LiftingDate: value => {
      const reqValue = isRequired()(value);
      if (reqValue) return reqValue;
      return isPastDate('La fecha de levantamiento no puede ser mayor al día de hoy')(value);
    },

    SupervisorId: isRequired(),
    DateSignatureSupervisor: (value, formValue) => {
      const reqValue = isRequired()(value);
      if (reqValue) return reqValue;

      const liftingDate = new Date(formValue.Records.LiftingDate);
      const dateValue = new Date(value);
      if (dateValue < liftingDate) {
        return 'La fecha de firma tiene que ser mayor o igual que la del levantamiento';
      }
      // return isPastDate('La fecha de firma no puede ser mayor al día de hoy')(value);
    },


    IdRegister: isRequired(),

    Comment: (value, formValue) => {
      if (formValue.Records.Declarant.flagValidaExplotacion == '1') {
        return isRequired()(value, formValue);
      }
    },

    Declarant: {
      IdTypeDocumentIdentity: isRequired(),
      DocumentNumber: (value, formValue) => {
        const { IdTypeDocumentIdentity } = formValue.Records.Declarant;
        const reqRet = isRequired()(value, formValue);
        if (reqRet) return reqRet;
        if (IdTypeDocumentIdentity == 1) {
          if (!/^\d{8}$/.test(value)) {
            return 'Debe contener exactamente 8 dígitos';
          }
        } else if (IdTypeDocumentIdentity == 3) {
          if (!/^\d{12}$/.test(value)) {
            return 'Debe contener exactamente 12 dígitos';
          }
        }
        return [];
      }
    },
    PrayerWitness: {
      DocumentNumber: (value, formValue) => {
        if (formValue.Records.HeadlineCanSign == '1') return;
        
        const { IdTypeDocumentIdentity } = formValue.Records.PrayerWitness;
        const reqRet = isRequired()(value, formValue);
        if (reqRet) return reqRet;
        if (IdTypeDocumentIdentity == 1) {
          if (!/^\d{8}$/.test(value)) {
            return 'Debe contener exactamente 8 dígitos';
          }
        }
        const Declarant = formValue.Records.Declarant;
        const PrayerWitness = formValue.Records.PrayerWitness;
        if (Declarant.IdTypeDocumentIdentity === PrayerWitness.IdTypeDocumentIdentity
          && Declarant.DocumentNumber === PrayerWitness.DocumentNumber) {
          return 'El declarante y el testigo de ruego no pueden ser la misma persona';
        }

        return [];
      }
    },
  },
  Land: {
    IdValle: isRequired(),
    IdTUse: isRequired(),
    IdTCUse: isRequired(),
    IdTypeLegalStatus: isRequired(),
    DeclaredArea: isRequired(),
    LandName: isRequired(),
    IdTypeRegistrationRecords: (value, formValue) => {
      if (formValue.Land.IdPropertyStatus == 1) {
        return isRequired()(value, formValue);
      }
    },

    OccupationDate: (value, formValue) => {
      // if ([1, 2, 3, 4, 5].includes(+formValue.Land.IdTypeLegalStatus)) {
      const today = new Date();
      if ([1, 3].includes(+formValue.Land.IdTypeLegalStatus)) {
        const reqRet = isRequired()(value);
        if (reqRet) return reqRet;

        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          return 'La fecha no es válida';
        }
        if (dateValue >= today) {
          return 'La fecha debe de ser menor al día actual';
        }
      } else if (value) {
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          return 'La fecha no es válida';
        }
        if (dateValue >= today) {
          return 'La fecha debe de ser menor al día actual';
        }
      }
    },

    RegistrationNumber: (value, formValue) => {
      if (formValue.Land.IdTypeRegistrationRecords) {
        if (!value) return 'Campo obligatorio';

        if (value.length > 9 || value.length < 8) {
          return 'El valor tiene que tener una longitud entre 8 y 9';
        }
      }
    },
    RegistrationDate: (value, formValue) => {
      const today = new Date();
      if (formValue.Land.IdTypeRegistrationRecords) {
        const reqRet = isRequired()(value);
        if (reqRet) return reqRet;

        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          return 'La fecha no es válida';
        }
        if (dateValue >= today) {
          return 'La fecha debe de ser menor al día actual';
        }
      } else if (value) {
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          return 'La fecha no es válida';
        }
        if (dateValue >= today) {
          return 'La fecha debe de ser menor al día actual';
        }
      }
    },

    // NOTE: revisar si cambia la condición y es distinta que la de fecha
    IdFormAward: isOccupationDateRequired,
  },
  Forks: {
    // IdDepartmentT: isRequiredIfTitularUnico('Campo obligatorio'),
    IdProvinceT: isRequiredIfIdDepartmentT('Campo obligatorio'),
    IdDistrictT: isRequiredIfIdDepartmentT('Campo obligatorio'),
    Annexed: isRequiredIfIdDepartmentT('Campo obligatorio'),
    StreetTrack: isRequiredIfIdDepartmentT('Campo obligatorio'),
    LotNumber: isRequiredIfIdDepartmentT('Campo obligatorio'),
    // SiteName: isRequiredIfIdDepartmentT('Campo obligatorio'),
  },
  FarmingList: checkThresholds,
  LivestockBreedingList: (value, formValue) => {
    if (formValue.FarmingList.some(el => el.IdType == '4') && (!value || value.length === 0)) {
      return 'Debes añadir al menos una opción de ganado';
    }
  },

  HolderIdentifierList: hasMinimalHolders,
  LitigantsList: hasMinimalLitigants,

  PropertyDocuments: (value, formValue) => {
    if ([1, 7, 8].includes(+formValue.Land.IdTypeLegalStatus) && value.length == 0) {
      return 'Es obligatorio adjuntar un documento de identidad para el titular';
    }
  }
  // LitigantsList: hasMinimalLitigants('cadastralUnit.LitigantsList', 'cadastralUnit.Land.IdTypeLegalStatus'),
};