const isRequired = (errorMsg = "Campo obligatorio") => value => {
  if (!value) {
    return [errorMsg];
  }
  return;
};

export default {
  IdType: isRequired(),
  Quantity: (value, formValue) => {
    const ret = isRequired()(value, formValue);
    if (ret) return ret;

    if (+value < 1) {
      return 'La cantidad debe ser mayor que 0';
    }
  }
};