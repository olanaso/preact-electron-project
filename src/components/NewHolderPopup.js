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

import { isFieldInvalid, openDB, showSnack } from '../functions.js';
import validations from '../validations/holder.js';

import Icon from "./Icon.js";

export default function NewHolderPopup(props) {
  const {
    holder,
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
    errors,
    setValidations
  } = useForm({
    validations: validations(props.holders, unitValue),
    effects: {
      Desconocido: (Desconocido, formValue) => {
        formValue.Name = Desconocido == '1' ? 'NNN' : '';
      },
      IdTypeHolder: (IdTypeHolder, formValue) => {
        if (IdTypeHolder == 2) {
          formValue.IdTypeDocumentIdentity = 10;
        }
      },
      IdTypeDocumentIdentity: (value, formValue) => {
        formValue.DocumentNumber = '';
      }
    },
    onInput: {
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
        const length = lengthMap[formValue.IdTypeDocumentIdentity];
        if (length != null) {
          target.value = value.slice(0, length);
        }
        target.value = target.value.replace(/[^\d]/g, '');
      },
    },
    initialValue: holder,
    autosubmit: false
  });
  useEffect(() => {
    setFormValue(holder);
  }, [holder]);
  useEffect(() => {
    setValidations(validations(props.holders, unitValue));
  }, [props.holders, unitValue]);

  const submitCb = useCallback(handleSubmit(formValue => {
    console.log('NEW HOLDER POPUP', formValue);
    const fullName = [formValue.Name, formValue.FirstName, formValue.LastName]
      .filter(str => str).join(' ');
    formValue.FullName = fullName || formValue.DocumentNumber;
    formValue.HolderId = Math.floor(Math.random() * 2147483647);
    if (formValue._file) {
      const file = formValue._file;
      delete formValue._file;
      openDB('Idom_Files').then(async store => {
        const savedFile = await store.add({ file: file, name: file.name });
        formValue.FilePath = savedFile;
        listAPI.save(formValue);
      }).catch(err => {
        console.log(err);
      });
    } else {
      listAPI.save(formValue);
    }
  }), [handleSubmit, listAPI]);
  
  if (formValue == null) return html``;

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.size > 1024 * 1024 * 5) {
        return showSnack({ msg: 'El tamaño del fichero no puede ser superior a 5MB' });
      }
      setFormValue(value => ({
        ...value,
        FileName: file.name,
        _file: file
      }));
    }
  }

  console.log('NEW HOLDER POPUP');

  const { IdTypeHolder, IdTypeDocumentIdentity, Desconocido } = formValue;
  const onlyPersonWithDoc = IdTypeHolder == 1 && IdTypeDocumentIdentity;
  const docIsDNI = IdTypeDocumentIdentity == 1;
  const isUnknown = Desconocido == 1;

  const holdersToLink = props.holders.filter(h => h.DocumentNumber != formValue.DocumentNumber);

  return html`
    <${Popup} class="PopupSymbol PopupSymbol--opened"
      default=${html`
        <form class="PopupForm" ref=${register}>
          <div>Nuevo titular</div>
          <div class="ContentPage__row">
            <div class="Field">
              <div>Desconocido</div>
              <div>
                <knq-checkbox class="Checkbox"
                  ...${setupInput('Desconocido')}
                  checkedValue="1"
                  uncheckedValue="0"
                  disabled=${!!IdTypeDocumentIdentity}
                />
              </div>
              <div class="Value ${isFieldInvalid(errors.Desconocido) ? 'Value--error' : ''}"
                style="border:0;height:10px"
              >
                <div class="Value__popupError">
                  <div class="Value__arrowPopup"></div>
                  <div>${errors.Desconocido && errors.Desconocido.errors.join('. ')}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="ContentPage__row">
            <${Field} title="Tipo de titular" inputType="combo"
              items=${itemsListAssistant.tiposTitulares}
              disabled=${unitValue.Land.IdTypeLegalStatus != 10 || isUnknown}
              ...${setupInput('IdTypeHolder')}
            />
            <${Field} title="Tipo de documento" inputType="combo"
              items=${itemsListAssistant.tiposDocumentosIdentidad}
              ...${setupInput('IdTypeDocumentIdentity')}
              disabled=${IdTypeHolder != 1 || isUnknown}
            />
            <${Field} title="Número documento"
              ...${setupInput('DocumentNumber')}
              disabled=${!IdTypeHolder || !IdTypeDocumentIdentity || isUnknown}
            />
            <${Field} title="Estado civil" inputType="combo"
              items=${itemsListAssistant.tiposEstadosCiviles}
              ...${setupInput('IdCivilStatus')}
              disabled=${!onlyPersonWithDoc || isUnknown} 
            />
          </div>
          <div class="ContentPage__row">
            <${Field} title="Nombre"
              ...${setupInput('Name')}
              disabled=${!onlyPersonWithDoc || (docIsDNI && formValue.DocumentNumber) || isUnknown}
            />
            <${Field} title="Primer apellido"
              ...${setupInput('FirstName')}
              disabled=${!onlyPersonWithDoc || (docIsDNI && formValue.DocumentNumber) || isUnknown}
            />
            <${Field} title="Segundo apellido"
              ...${setupInput('LastName')}
              disabled=${!onlyPersonWithDoc || (docIsDNI && formValue.DocumentNumber) || isUnknown}
            />
            <${Field} title="Sexo" inputType="combo"
              items=${itemsListAssistant.tiposSexos}
              ...${setupInput('IdTypeSex')}
              disabled=${!onlyPersonWithDoc || isUnknown}
            />
          </div>
          <div class="ContentPage__row">
            <${Field} title="Persona jurídica" inputType="combo"
              items=${itemsListAssistant.tiposPersonasJuridicas}
              ...${setupInput('IdLegalPerson')}
              disabled=${IdTypeHolder != 2 || isUnknown} ></${Field}>
            <${Field} title="Razón social"
              ...${setupInput('BusinessName')}
              disabled=${IdTypeHolder != 2 || isUnknown} ></${Field}>
            <${Field} title="Dirección"
              ...${setupInput('Address')}
              disabled=${isUnknown}
            ></${Field}>
          </div>
          <div class="ContentPage__row">
            <${Field} title="Enlace"
              items=${holdersToLink} labelProp="FullName" valueProp="HolderId"
              ...${setupInput('IdLink')} inputType="combo"
              disabled=${formValue.IdCivilStatus != 2 || isUnknown}></${Field}>
            <div class="Field">
              <div>DNI</div>
              <div class="FileBtn Value ${isFieldInvalid(errors.FilePath) ? 'Value--error' : ''}"
                 disabled="${IdTypeHolder != 1 || !IdTypeDocumentIdentity || isUnknown}"
              >
                <${Icon} class="Value__iconError" icon="error1" />
                <input class="FileBtn__input" type="file" accept=".pdf,application/pdf"
                  disabled="${IdTypeHolder != 1 || !IdTypeDocumentIdentity || isUnknown}"
                  onchange=${handleFileChange}
                />
                <${Icon} class="FileBtn__icon" icon="publish" />
                <div>${formValue.FileName || 'Subir un fichero'}</div>
                <div class="Value__popupError">
                  <div class="Value__arrowPopup"></div>
                  <div>${errors.FilePath && errors.FilePath.errors.join('. ')}</div>
                </div>
              </div>
            </div>
            <div class="Field">
              <div>Finado</div>
              <div>
                <knq-checkbox class="Checkbox"
                  ...${setupInput('Defunct')}
                  checkedValue="1"
                  uncheckedValue="0"
                  disabled=${!onlyPersonWithDoc || isUnknown}
                />
              </div>
            </div>
          </div>
          <div class="ContentPage__row ContentPage__row--btns">
            <button class="Btn Btn--secondary" type="button"
              onclick=${listAPI.cancel}
            >
              Cancelar
            </button>
            <button class="Btn ContentPage__btnRight Btn--primary"
              type="button"
              onClick=${submitCb}>
              Agregar
            </button>
          </div>
        </form>
      `}>
    </${Popup}>
  `;
}