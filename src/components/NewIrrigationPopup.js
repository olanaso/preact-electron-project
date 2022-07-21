import {
  html,
  useState,
  useEffect,
  useCallback
} from "https://npm.reversehttp.com/preact,preact/hooks,htm/preact,goober";
import { useForm } from "../helpers/useForm.js";

import Popup from "./Popup.js";
import Field from "./Field.js";

import validations from '../validations/irrigation.js';

export default function NewIrrigationPopup(props) {
  const {
    value,
    unitValue,
    itemsListAssistant,
    listAPI
  } = props;
  const {
    value:formValue,
    setFormValue,
    setValidations,
    setupInput,
    register,
    handleSubmit,
  } = useForm({
    validations: validations(unitValue),
    initialValue: value,
    autosubmit: false
  });

  useEffect(() => {
    setFormValue(value);
  }, [value]);
  useEffect(() => {
    setValidations(validations(unitValue));
  }, [unitValue]);

  const submitCb = useCallback(handleSubmit(listAPI.save),
    [handleSubmit, listAPI.save]);
  
  if (formValue == null) return html``;

  return html`
    <${Popup} class="PopupSymbol PopupSymbol--opened"
      default=${html`
        <form class="PopupForm" ref=${register} onSubmit=${submitCb}>
          <div>Nuevo elemento de Riego</div>
          <div class="ContentPage__row">
            <${Field} title="Tipo" inputType="combo"
              items=${itemsListAssistant.tiposRiegos}
              ...${setupInput('IdType')} ></${Field}>
            <${Field} title="Porcentaje %" inputType="number" step="0.01"
              ...${setupInput('Percentage')} ></${Field}>
          </div>
          
          <div class="ContentPage__row ContentPage__row--btns">
            <button  class="Btn Btn--secondary" type="button"
              onclick=${listAPI.cancel}
            >
              Cancelar
            </button>
            <button  class="Btn ContentPage__btnRight Btn--primary">
              Agregar
            </button>
          </div>
        </form>
      `}>
    </${Popup}>
  `;
}