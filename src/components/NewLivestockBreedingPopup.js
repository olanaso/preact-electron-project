import {
  html,
  useState,
  useEffect,
  useCallback
} from "https://npm.reversehttp.com/preact,preact/hooks,htm/preact,goober";
import { useForm } from "../helpers/useForm.js";

import Popup from "./Popup.js";
import Field from "./Field.js";

import validations from '../validations/livestockBreeding.js';

export default function NewLivestockBreedingPopup(props) {
  const {
    value,
    itemsListAssistant,
    listAPI,
  } = props;
  const {
    value:formValue,
    setFormValue,
    setupInput,
    register,
    handleSubmit,
  } = useForm({
    validations,
    initialValue: value,
    autosubmit: false
  });
  useEffect(() => {
    setFormValue(value);
  }, [value]);

  const submitCb = useCallback(handleSubmit(listAPI.save),
    [handleSubmit, listAPI.save]);
  
  if (formValue == null) return html``;

  return html`
    <${Popup} class="PopupSymbol PopupSymbol--opened"
      default=${html`
        <form class="PopupForm" ref=${register} onSubmit=${submitCb}>
          <div>Nuevo elemento de Ganadería/Crianza</div>
          <div class="ContentPage__row">
            <${Field} title="Tipo" inputType="combo"
              items=${itemsListAssistant.tiposGanados}
              ...${setupInput('IdType')} ></${Field}>
            <${Field} title="Cantidad" inputType="number"
              ...${setupInput('Quantity')} ></${Field}>
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