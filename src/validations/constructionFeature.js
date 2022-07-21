const isRequired = (errorMsg = "Campo obligatorio") => value => {
  if (!value) {
    return errorMsg;
  }
};

export default {
  IdFloorNumber: isRequired(),
  ConstructionDate: (value) => {
    const reqRet = isRequired()(value);
    if (reqRet) return reqRet;

    const dateValue = new Date(value);
    if (isNaN(dateValue.getTime())) {
      return 'La fecha no es válida';
    }
  },
  IdPredominantMaterial: isRequired(),
  IdConservationStatus: isRequired(),
  IdConstructionStatus: isRequired(),
  BuiltArea: isRequired(),
};