import {
  html,
  useState,
  useEffect,
  useMemo,
  useCallback
} from "https://npm.reversehttp.com/preact,preact/hooks,htm/preact,goober";
import { useForm } from "../helpers/useForm.js";

import Popup from "./Popup.js";
import Field from "./Field.js";

import validations from '../validations/holder.js';

export default function NewLitigantPopup(props) {
  const {
    litigant,
    itemsListAssistant,
    unitValue,
    listAPI
  } = props;
  const {
    value:formValue,
    setFormValue,
    setupInput,
    register,
    handleSubmit,
  } = useForm({
    validations: validations(props.litigant, unitValue),
    effects: {
      Desconocido: (Desconocido, formValue) => {
        formValue.Name = Desconocido == '1' ? 'NNN' : '';
      },
      Person: {
        PersonTypeId: (PersonTypeId, formValue) => {
          if (PersonTypeId == 2) {
            formValue.IdTypeDocumentIdentity = 10;
          }
        },
      }
    },
    onInput: {
      Person: {
        DocumentNumber: (target, value, formValue) => {
          const lengthMap = {
            1: 8,   // DNI
            2: 15,  // LIBRETA MILITAR
            3: 12,  // CARNÉ DE EXTRAJERÍA
            4: 12,  // PASAPORTE
            5: 15,  // POLICIA NACIONAL
            7: 15,  // FUERZAS ARMADAS
            8: 15,  // PARTIDA DE NACIMIENTO
            9: 15,  // PE
            10: 11, // RUC
          };
          const length = lengthMap[formValue.Person && formValue.Person.IdTypeDocumentIdentity];
          if (length != null) {
            target.value = value.slice(0, length);
          }
          target.value = target.value.replace(/[^\d]/g, '');
        },
      }
    },
    initialValue: litigant,
    autosubmit: false
  });
  useEffect(() => {
    setFormValue(litigant);
  }, [litigant]);

  const submitCb = useCallback(handleSubmit(formValue => {
    formValue.LitigantId = Math.floor(Math.random() * 2147483647);
    listAPI.save(formValue);
  }), [handleSubmit, listAPI]);
  
  if (formValue == null || formValue.Person == null) return html``;

  const { PersonTypeId, IdTypeDocumentIdentity, DocumentNumber, Desconocido } = (formValue && formValue.Person) || {};
  const onlyPersonWithDoc = PersonTypeId == 1 && IdTypeDocumentIdentity;
  const docIsDNI = IdTypeDocumentIdentity == 1;
  const isUnknown = Desconocido == 1;

  // <div class="ContentPage__row">
  //   <${Field} title="Observación"
  //             ...${setupInput('Person.Observation')}
  //           />
  //         </div>

  return html`
    <${Popup} class="PopupSymbol PopupSymbol--opened"
      default=${html`
        <form class="PopupForm" ref=${register}>
          <div>Nuevo litigante</div>
          <div class="ContentPage__row">
            <${Field} title="Tipo de titular" inputType="combo"
              items=${itemsListAssistant.tiposTitulares}
              disabled=${unitValue.Land.IdTypeLegalStatus != 10 || isUnknown}
              ...${setupInput('Person.PersonTypeId')}
            />
            <${Field} title="Tipo de documento" inputType="combo"
              items=${itemsListAssistant.tiposDocumentosIdentidad}
              ...${setupInput('Person.IdTypeDocumentIdentity')}
              disabled=${PersonTypeId != 1}
            />
            <${Field} title="Número de documento"
              ...${setupInput('Person.DocumentNumber')}
              disabled=${!PersonTypeId || !IdTypeDocumentIdentity || isUnknown}
            />
            <${Field} title="Estado civil" inputType="combo"
              items=${itemsListAssistant.tiposEstadosCiviles}
              ...${setupInput('Person.IdCivilStatus')}
              disabled=${!onlyPersonWithDoc}
            />
          </div>
          <div class="ContentPage__row">
            <${Field} title="Nombre"
              ...${setupInput('Person.Name')}
              disabled=${!onlyPersonWithDoc || (docIsDNI && DocumentNumber) || isUnknown}
            />
            <${Field} title="Primer apellido"
              ...${setupInput('Person.FirstName')}
              disabled=${!onlyPersonWithDoc || (docIsDNI && DocumentNumber) || isUnknown}
            />
            <${Field} title="Segundo apellido"
              ...${setupInput('Person.LastName')}
              disabled=${!onlyPersonWithDoc || (docIsDNI && DocumentNumber) || isUnknown}
            />
            <${Field} title="Sexo" inputType="combo"
              items=${itemsListAssistant.tiposSexos}
              ...${setupInput('Person.IdTypeSex')}
              disabled=${!onlyPersonWithDoc || isUnknown}
            />
          </div>
          <div class="ContentPage__row">
            <${Field} title="Persona jurídica" inputType="combo"
              items=${itemsListAssistant.tiposPersonasJuridicas}
              ...${setupInput('Person.IdLegalPerson')}
              disabled=${PersonTypeId != 2}
            />
            <${Field} title="Razón social"
              ...${setupInput('Person.BusinessName')}
              disabled=${PersonTypeId != 2}
            />
            <${Field} title="Dirección"
              ...${setupInput('Person.Address')} 
            />
          </div>
          <div class="ContentPage__row ContentPage__row--btns">
            <button  class="Btn Btn--secondary" type="button"
              onclick=${listAPI.cancel}
            >
              Cancelar
            </button>
            <button  class="Btn ContentPage__btnRight Btn--primary"
              type="button"
              onClick=${submitCb}>
              Agregar
            </button>
          </div>
        </form>
      `}></${Popup}>
  `;
}