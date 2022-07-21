
// PURE IMPORTS
import {
  html,
  render
} from "https://npm.reversehttp.com/preact,preact/hooks,htm/preact,goober";

// EXPORTS
export default class KnqPage {

  static get properties() {
    return [
      "page",
      "credentials",
      "user",
      "navSelected",
      "itemsListAssistant",
      "itemsList",
      "territorialUnits",
      "download_CU",
      "pendingSync_CU",
      "loading",
      "selTerrUnit",
      "snackData",
      "supervisors",
      "verificators",
      "online",
      "errorMsgs",
      "synchronizing",
      "errorsLog",
    ];
  }
  static get contextName() {
    return "KnqPage";
  }

  constructor() {}
  setup(context) {
    this._context = context;
    let properties = [];
    let contexts = [];
    let base = this.constructor;
    while (base !== KnqPage) {
      if (base.hasOwnProperty("contextName")) {
        contexts.push(base.contextName);
        if (base.hasOwnProperty("properties")) {
          context.define(base.contextName, base.properties);
          properties.push(...base.properties);
        }
      }
      base = Object.getPrototypeOf(base);
    }
    contexts.push(base.contextName);
    context.define(base.contextName, base.properties);
    properties.push(...base.properties);
    this._contexts = contexts;
    this._properties = properties;
  }
  async enter(params, query) {
    this._context.changeContext(this._contexts);
    requestAnimationFrame(() => {
      this.render();
    });
    this._renderSub = this._context.subscribe(
      this._properties,
      () => this.render(),
      { frequency: 50 }
    );
    return Promise.resolve();
  }
  async update(params, query) {
    requestAnimationFrame(() => {
      this.render();
    });
    return Promise.resolve();
  }
  async exit(params, query) {
    this._renderSub();
    return Promise.resolve();
  }
  render() {
    const state = this._context.getActiveContext();
    
    try {
      render(this.__template(state), document.body);
    } catch (err) {
      console.error(err);
    }
  }
  __template(state) {
    return html`
      ${this._content(state)}
    `;
  }
  _content() {
    return html``;
  }
}
