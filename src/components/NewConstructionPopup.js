import {
  html,
  useState,
  useEffect,
  useCallback
} from "https://npm.reversehttp.com/preact,preact/hooks,htm/preact,goober";
import { useForm } from "../helpers/useForm.js";

import validations from '../validations/constructionFeature.js';
import Popup from "./Popup.js";
import Field from "./Field.js";

export default function NewConstructionPopup(props) {
  const {
    value,
    itemsListAssistant,
    listAPI
  } = props;
  const {
    value:formValue,
    setFormValue,
    setupInput,
    register,
    handleSubmit,
  } = useForm({
    validations,
    onInput: {
      BuiltArea: (target, value) => target.value = value.slice(0, 5),
    },
    initialValue: value,
    autosubmit: false
  });
  useEffect(() => {
    setFormValue(value);
  }, [value]);

  const submitCb = useCallback(handleSubmit(listAPI.save),
    [handleSubmit, listAPI.save]);
  
  if (formValue == null) return html``;

  const floorOptions = [
    { label: '1', value: 1 },
    { label: '2', value: 2 },
    { label: '3', value: 3 },
    { label: '4', value: 4 },
    { label: '5', value: 5 },
  ];

  return html`
    <${Popup} class="PopupSymbol PopupSymbol--opened"
      default=${html`
        <form class="PopupForm" ref=${register} onSubmit=${submitCb}>
          <div>Nueva construcción</div>
          <div class="ContentPage__row">
            <${Field} title="Nº de piso" inputType="combo"
              items=${floorOptions} labelProp="label" valueProp="value"
              ...${setupInput('IdFloorNumber')} ></${Field}>
            <${Field} title="Fecha de construcción" inputType="date"
              max="9999-12-31"
              ...${setupInput('ConstructionDate')} ></${Field}>
            <${Field} title="Material predominante" inputType="combo"
              items=${itemsListAssistant.tiposMaterialesConstruccion}
              ...${setupInput('IdPredominantMaterial')} ></${Field}>
          </div>
          <div class="ContentPage__row">
            <${Field} title="Estado de conservación" inputType="combo"
              items=${itemsListAssistant.tiposEstadosConservacion}
              ...${setupInput('IdConservationStatus')} ></${Field}>
            <${Field} title="Estado de construcción" inputType="combo"
              items=${itemsListAssistant.tiposEstadosConstruccion}
              ...${setupInput('IdConstructionStatus')} ></${Field}>
            <${Field} title="Área construida (m2)" inputType="number"
              ...${setupInput('BuiltArea')} ></${Field}>
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