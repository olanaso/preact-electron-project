const isRequired = (errorMsg = "Campo obligatorio") => value => {
  if (!value) {
    return errorMsg;
  }
};

export default (list, cadastralForm) => {
  return {
    // IdTypeHolder
    // IdTypeDocumentIdentity: (value, formValue) => {
    //   if (formValue.IdTypeHolder && formValue.IdTypeHolder)
    // }
    Desconocido: (value, formValue) => {
      if (value == 1 && list.filter(el => el.Desconocido == 1).length > 0) {
        return 'Sólo puede haber un titular desconocido';
      }
      if (cadastralForm.Land.IdTypeLegalStatus == 7 && value == 1) {
        return 'No puede haber titulares desconocidos en las sociedades conyugales';
      }
    },
    DocumentNumber: (value, formValue) => {
      const { IdTypeDocumentIdentity, IdTypeHolder }  = formValue;
      if (IdTypeDocumentIdentity && IdTypeHolder == 1) {
        const reqRet = isRequired()(value, formValue);
        if (reqRet) return reqRet;
      }
      if (IdTypeDocumentIdentity == 1) {
        if (!/^\d{8}$/.test(value)) {
          return 'Debe contener exactamente 8 dígitos';
        }
      }
      return [];
    },
    [list && list.length]: {

    }
    // IdCivilStatus
    // Name
    // FirstName
    // LastName
    // IdTypeSex
    // IdLegalPerson
    // BusinessName
    // Address
    // IdLink
  };
}