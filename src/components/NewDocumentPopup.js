import {
  html,
  useState,
  useEffect,
  useCallback
} from "https://npm.reversehttp.com/preact,preact/hooks,htm/preact,goober";
import { useForm } from "../helpers/useForm.js";

import { isFieldInvalid, openDB, showSnack} from '../functions.js';
import validations from '../validations/document.js';

import Popup from "./Popup.js";
import Field from "./Field.js";
import Icon from "./Icon.js";

export default function NewDocumentPopup(props) {
  const {
    value,
    itemsListAssistant,
    docsAPI
  } = props;

  const {
    value: formValue,
    setFormValue,
    setupInput,
    register,
    errors,
    handleSubmit,
  } = useForm({
    validations,
    initialValue: value,
    autosubmit: false
  });

  useEffect(() => {
    setFormValue(value);
  }, [value]);

  const submitCb = useCallback(handleSubmit(obj => {
    openDB('Idom_Files').then(async store => {
      if (obj._file) {
        const file = obj._file;
        delete obj._file;
        const savedFile = await store.add({ file, name: file.name });
        obj.Route = savedFile;
        docsAPI(obj._docType).save(obj);
      } else if (obj.Route == null) {
        console.error('No tiene fichero!');
      } else {
        docsAPI(obj._docType).save(obj);
      }
    }).catch(err => {
      console.log(err);
    });
  }), [handleSubmit, docsAPI]);

  const handleFileChange = e => {
    const files = e.target.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.size > 1024 * 1024 * 5) {
        return showSnack({ msg: 'El tamaño del fichero no puede ser superior a 5MB' });
      }
      setFormValue(value => ({
        ...value,
        Name: file.name,
        _file: file
      }));
    }
  };

  if (formValue == null) return html``;

  const acreditaciones = itemsListAssistant.acreditacionesDocumentos.filter(doc => doc.Type == formValue.IdTypeAccreditation);

  return html`
    <${Popup} class="PopupSymbol PopupSymbol--opened"
      default=${html`
        <form class="PopupForm" ref=${register} onSubmit=${submitCb}>
          <div>Nuevo documento</div>
          <div class="ContentPage__row">
            <${Field} title="Tipo de acreditación" inputType="combo"
              items=${itemsListAssistant.tiposAcreditacionDocumentos}
              ...${setupInput('IdTypeAccreditation')} disabled
            />
            <${Field} title="Documento acreditador" inputType="combo"
              items=${acreditaciones}
              ...${setupInput('IdAccreditationDocument')}
            />
          </div>
          <div class="ContentPage__row">
            <${Field} title="Forma de presentación" inputType="combo"
              items=${itemsListAssistant.tiposFormatosDocumentos}
              ...${setupInput('IdPresentationForm')} />
            <${Field} title="Usuario" value=${formValue._userName} disabled />
          </div>
          <div class="ContentPage__row">
            <${Field} style="flex:1" title="Observación"
              ...${setupInput('Observation')}
            />
            <div class="Field">
              <div>Fichero</div>
              <div class="FileBtn Value ${isFieldInvalid(errors.Name) ? 'Value--error' : ''}">
                <${Icon} class="Value__iconError" icon="error1" />
                <input class="FileBtn__input" type="file" accept=".pdf,application/pdf"
                  onchange=${handleFileChange}
                />
                <${Icon} class="FileBtn__icon" icon="publish" />
                <div>${formValue.Name || 'Subir un fichero'}</div>
                <div class="Value__popupError">
                  <div class="Value__arrowPopup"></div>
                  <div>${errors.Name && errors.Name.errors.join('. ')}</div>
                </div>
              </div>
            </div>
            <div class="Separador"></div>
          </div>

          <div class="ContentPage__row ContentPage__row--btns">
            <button class="Btn Btn--secondary" type="button"
              onclick=${() => docsAPI(value._docType).cancel()}
            >
              Cancelar
            </button>
            <button class="Btn ContentPage__btnRight Btn--primary">
              Agregar
            </button>
          </div>
        </form>
      `}>
    </${Popup}>
  `;
}