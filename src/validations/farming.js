const isRequired = (errorMsg = "Campo obligatorio") => value => {
  if (value == null || value == '') {
    return [errorMsg];
  }
  return [];
};

export default (unitValue) => {
  if (unitValue == null) return {};
  const currentPercentage = unitValue.FarmingList.reduce((acc, el) => acc + +el.Percentage, 0);
  const remainPercentage = 100 - currentPercentage;
  return {
    IdType: isRequired(),
    Description: isRequired(),
    Percentage: (value, formValue) => {
      const errors = [];
      errors.push(...isRequired()(value, formValue));
      if (value <= 0 || value > remainPercentage) {
        errors.push(`Debe estar entre 0 y ${remainPercentage.toFixed(2)}`);
      }
      return errors;
    }
  };
};