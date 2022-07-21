/**
 * TODO:
 * options: {
 *   frequency: 1000,
 *   policy: all | any
 *   deepCheck?
 * }
 */

// export default function createContext(initialContext) {
export default function createContext(initialContext = {}) {
  const context = {
    '_root_': {},
    ...initialContext
  };
  let callbacks = [];
  const definitions = {};
  let subcontexts = ['_root_'];

  return {
    subscribe,
    define,
    set,
    get,
    getByContext,
    getActiveContext,
    getAll,
    changeContext
  };

  function subscribe(dependencies, cb, options) {
    const newCb = createDependenciesGuard(new Set(dependencies), options, cb);
    callbacks.push(newCb);
    return () => {
      if (newCb.clearTimeout) {
        newCb.clearTimeout();
      }
      callbacks = callbacks.filter(cb => cb !== newCb);
    };
  }
  function define(contextKey, vars) {
    if (contextKey) {
      definitions[contextKey] = vars;
    } else {
      definitions['_root_'] = vars;
    }
  }
  function set(key, newValue) {
    for (const ctxKey of subcontexts) {
      if (definitions[ctxKey].includes(key)) {
        if (context[ctxKey][key] === newValue) {
          return;
        }
        context[ctxKey][key] = makeDeepCopy(newValue);
        callbacks.forEach((cb) => cb(key));
        return;
      }
    }
    throw new Error(`CONTEXT - ${key} is not define in current context`);
  }
  function get(key) {
    let ret = {};
    for (const ctxKey of [...subcontexts].reverse()) {
      ret = {
        ...ret,
        ...context[ctxKey]
      };
    }
    return ret[key] ? makeDeepCopy(ret[key]) : ret[key];
  }
  function getAll() {
    return makeDeepCopy(context);
  }
  function getActiveContext() {
    let ret = {};
    for (const ctxKey of [...subcontexts].reverse()) {
      ret = {
        ...ret,
        ...makeDeepCopy(context[ctxKey])
      };
    }
    return ret;
  }
  function getByContext(contextKey) {
    if (contextKey) {
      return makeDeepCopy(context[contextKey]);
    } else {
      return makeDeepCopy(context);
    }
  }
  function changeContext(contexts) {
    if (!contexts) {
      subcontexts = ['_root_'];
      return;
    }
    for (const ctxKey of contexts) {
      if (context[ctxKey] == null) {
        context[ctxKey] = {};
      }
    }
    subcontexts = [...contexts, '_root_'];
  }
};

// AUXILIAR
function createDependenciesGuard(dependencies, options = {}, cb) {
  let retCb = cb;
  retCb = createDependenciesCb(dependencies, options, retCb)
  if (options.frequency) {
    retCb = createDebounceCb(retCb, options.frequency);
  }
  return retCb;
}
function createDependenciesCb(dependencies, options, cb) {
  if (!dependencies || dependencies.size === 0) {
    return cb;
  } else if (options.policy === 'all') {
    const changes = new Set();
    return (type) => {
      if (dependencies.has(type)) {
        changes.add(type);
        if (changes.size === dependencies.size) {
          cb();
          changes.clear();
        }
      }
    };
  } else {
    return (type) => {
      if (dependencies.has(type)) {
        cb(type);
      }
    };
  }
}
function createDebounceCb(cb, frequency) {
  let timeout = null;
  const retCb = (type) => {
    if (timeout) {
      return;
    }
    timeout = setTimeout(() => {
      timeout = null;
      cb(type);
    }, frequency);
  };
  retCb.clearTimeout = () => {
    timeout && clearTimeout(timeout);
    timeout = null;
  };
  return retCb;
}

function makeDeepCopy(el) {
  if (el == null) {
    return el;
  } if (Array.isArray(el)) {
    // TODO: this is shallow copy NOT deep
    return [...el];
  } else if (typeof(el) === 'number') {
    return el;
  } else if (typeof(el) === 'string') {
    return el;
  } else if (typeof(el) === 'boolean') {
    return el;
  } else if (el instanceof Date) {
    return new Date(el);
  } else {
    // TODO: this is shallow copy NOT deep
    return { ...el }
  }
}