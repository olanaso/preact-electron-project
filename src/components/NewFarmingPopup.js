import {
  html,
  useState,
  useEffect,
  useCallback
} from "https://npm.reversehttp.com/preact,preact/hooks,htm/preact,goober";
import { useForm } from "../helpers/useForm.js";

import validations from '../validations/farming.js';

import Popup from "./Popup.js";
import Field from "./Field.js";

export default function NewFarmingPopup(props) {
  const {
    farming,
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
    effects: {
      IdType: (IdType, formValue) => {
        const products = itemsListAssistant.tiposGruposAgricolas
          .filter(item => item.Type == IdType);
        formValue._TODO_Product = products[0].Id;
        formValue.Description = formValue._TODO_Product;
      },
      _TODO_Product: (value, formValue) => {
        formValue.Description = value;
      }
    },
    initialValue: farming,
    autosubmit: false
  });

  useEffect(() => {
    setFormValue(farming);
  }, [farming]);
  useEffect(() => {
    setValidations(validations(unitValue));
  }, [unitValue]);

  const submitCb = useCallback(handleSubmit(listAPI.save),
    [handleSubmit, listAPI.save]);
  
  if (formValue == null) return html``;

  const products = itemsListAssistant.tiposGruposAgricolas
    .filter(item => item.Type == formValue.IdType);

  return html`
    <${Popup} class="PopupSymbol PopupSymbol--opened"
      default=${html`
        <form class="PopupForm" ref=${register}>
          <div>Nuevo elemento Agrícola</div>
          <div class="ContentPage__row">
            <${Field} title="Tipo" inputType="combo"
              items=${itemsListAssistant.tiposAgricolas}
              ...${setupInput('IdType')}></${Field}>
            <${Field} title="Porcentaje %" inputType="number" step="0.01"
              ...${setupInput('Percentage')} ></${Field}>
          </div>
          <div class="ContentPage__row">
            <${Field} title="Producto" inputType="combo"
              items=${products} disabled=${!formValue.IdType}
              ...${setupInput('_TODO_Product')}></${Field}>
            <${Field} title="Descripción" inputType="combo"
              items=${products} disabled
              ...${setupInput('Description')} ></${Field}>
          </div>
          <div class="ContentPage__row ContentPage__row--btns">
            <button  class="Btn Btn--secondary" type="button"
              onclick=${listAPI.cancel}
            >
              Cancelar
            </button>
            <button  class="Btn ContentPage__btnRight Btn--primary"
              onClick=${submitCb}
            >
              Agregar
            </button>
          </div>
        </form>
      `}>
    </${Popup}>
  `;
}