import dlv from "https://unpkg.com/dlv@1.1.3/dist/dlv.es.js?module";
import dset from "https://unpkg.com/dset@2.0.1/dist/dset.es.js?module";

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback
} from "https://npm.reversehttp.com/preact,preact/hooks,htm/preact,goober";

const newFormFieldInfo = () => ({
  valid: true,
  invalid: false,
  errors: []
});

function useForm(options = {}) {
  const {
    initialValue,
    autosubmit = true,
    effects = {},
    onInput = {}
  } = options;

  const [validations, setValidations] = useState(options.validations);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [value, setValue] = useState(initialValue);
  const utilRef = useRef({
    inputMap: new Map(),
    value,
    errors,
  });
  useEffect(() => {
    utilRef.current.value = value;
    utilRef.current.errors = errors;
  }, [value, errors]);
  const normValidations = useMemo(() => {
    const result = {};

    const visitObj = (obj, keys = []) => {
      for (const [key, value] of Object.entries(obj)) {
        const newKeys = keys.concat(key);
        if (typeof value === 'object') {
          visitObj(value, newKeys);
        } else if (Array.isArray(value)) {
          // TODO: sacar a función
          result[newKeys.join('.')] = (...args) => {
            const errors = [];
            for (const validation of value) {
              let error = validation(args) || [];
              error = Array.isArray(error) ? error : [error];
              errors.push(...error);
            }
            return errors;
          };
        } else if (typeof value === 'function') {
          result[newKeys.join('.')] = value;
        } else if (value !== 'native') {
          // TODO: revisar
          result[newKeys.join('.')] = (value, formValue, input) => {
            const valid = input.checkValidity();
            return valid ? [] : [input.validationMessage];
          };
        } else {
          throw `Validations error: key ${key} does not have a valid value ${value}`;
        }
      }
    };
    visitObj(validations);
    return result;
  }, [validations]);

  const register = useCallback((dom) => {
    console.log('REGISTER', dom);
    // TODO: entender bien cuando pasa esto
    if (dom == null) return;

    const { inputMap } = utilRef.current;
    if (dom.tagName && dom.tagName === 'FORM') {
      setForm(dom);
      return;
    }
    inputMap.set(dom, {});
    console.log(inputMap);
  }, []);
  const setupInput = useCallback((path) => {
    return {
      // ref: register,
      name: path,
      value: dlv(value, path),
      fieldInfo: dlv(errors, path, {
        valid: true,
        invalid: false,
        errors: []
      })
    };
  }, [errors, value]);

  const handleSubmit = useCallback(cb => e => {
    e.preventDefault();
    const { value } = utilRef.current;
    const valid = validateForm(validations);
    if (!valid) return;

    cb(value);
  }, [utilRef, validations]);

  // TODO: memo
  const validateInput = (path, value, formValue) => {
    const validation = dlv(validations, path);
    if (validation) {
      let valErrors = validation(value, formValue) || [];
      const newErrors = {
        ...errors
      };
      let info = dlv(newErrors, path);
      if (info == null) {
        info = newFormFieldInfo();
        dset(newErrors, path, info);
      }
      info.errors = Array.isArray(valErrors) ? valErrors : [valErrors];
      info.valid = info.errors.length === 0;
      info.invalid = !info.valid;
      setErrors(newErrors);
      return info.valid;
    }
    return true;
  };

  const validateForm = () => {
    const errors = {};
    let valid = true;
    const formValue = utilRef.current.value;

    // TODO: actualizar el formulario recogiendo TODOS los valores?
    for (const [path, validation] of Object.entries(normValidations)) {
      // TODO: pasar input
      const value = dlv(formValue, path);
      let valErrors = validation(value, formValue, null) || [];
      valErrors = Array.isArray(valErrors) ? valErrors : [valErrors];

      let info = dlv(errors, path);
      if (info == null) {
        info = newFormFieldInfo();
        dset(errors, path, info);
      }
      info.errors.push(...valErrors);
      info.valid = info.errors.length === 0;
      info.invalid = !info.valid;
      valid = valid && info.valid;
    }

    setErrors(errors);
    return valid;
  };

  useEffect(() => {
    if (form == null) return;
    const submitHandler = e => {
      e.preventDefault();
      console.log('NATIVE SUBMIT');
      if (!autosubmit) {
        return;
      }
      // TODO ?
    };
    const changeHanlder = e => {
      console.log('CHANGE', e.target);
      if (!e.target.name) return;
      let newEventValue = e.target.value;
      setValue(value => {
        const newFormValue = { ...value };
        const oldValue = dlv(newFormValue, e.target.name);
        const effect = dlv(effects, e.target.name);
        if (effect && oldValue != e.target.value) {
          const effectValue = effect(e.target.value, newFormValue);
          if (effectValue != null) {
            newEventValue = effectValue;
          }
        }
        dset(newFormValue, e.target.name, newEventValue);

        validateInput(e.target.name, e.target.value, newFormValue);
        return newFormValue;
      });
    };
    const inputHandler = e => {
      if (!e.target.name) return;
      const handler = dlv(onInput, e.target.name);
      if (handler) {
        handler(e.target, e.target.value, value);
      }
    };

    form.addEventListener('submit', submitHandler);
    form.addEventListener('change', changeHanlder);
    form.addEventListener('input', inputHandler);
    form.addEventListener('focusin', e => {
      console.warn('TODO: add to dirtyInputs');
    });
    form.addEventListener('focusout', e => {
      console.warn('TODO: add to dirtyInputs');
    });
    return () => {
      form.removeEventListener('submit', submitHandler);
      form.removeEventListener('change', changeHanlder);
      form.removeEventListener('input', inputHandler);
    };
  }, [form, value, effects, validateInput, onInput]);


  return {
    value,
    setFormValue: setValue,
    setValidations,
    register,
    errors,
    setupInput,
    handleSubmit,
  };
}


export {
  useForm
};