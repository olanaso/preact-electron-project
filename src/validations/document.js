const isRequired = (errorMsg = "Campo obligatorio") => value => {
  if (!value) {
    return [errorMsg];
  }
  return [];
};

export default {
  IdTypeAccreditation: isRequired(),
  IdAccreditationDocument: isRequired(),
  IdPresentationForm: isRequired(),
  Name: isRequired(),
  UserCreation: isRequired(),
};