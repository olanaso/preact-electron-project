import page from "https://unpkg.com/page/page.mjs";

/**
 * Routing solutions based on pagejs
 * 
 */

let routes;

export {
  navigate,
  redirect,
  back,
  getUrl
};
export default start;

let basePath;

function start(newRoutes, options) {
  routes = newRoutes;
  // Utils
  basePath = new URL(document.baseURI).pathname;
  page.base(basePath);
  page('*', (ctx, next) => {
    const query = new URLSearchParams(ctx.querystring);
    ctx.query = {};
    for (const key of query.keys()) {
      ctx.query[key] = query.get(key);
    }
    next();
  });
  page('*', (ctx, next) => {
    if (options.beforeAllCb) {
      options.beforeAllCb(ctx);
    }
    next();
  });
  if (Object.values(routes).every(route => route.path != '/')) {
    page('/', options.redirectRoot);
  }
  Object.entries(routes).forEach(([key, value]) => {
    page(value.path, value.security, value.enter);
    
    if (value.exit) {
      page.exit(value.path, value.exit);
    }
  });
  page('*', options.show404);
  page.start({
    click: false,
    dispatch: options.dispatch || true,
  });
}
function navigate(newPage, params = {}, query = {}) {
  let path = getUrl(newPage, params, query);
  page(path);
}
function redirect(newPage, params = {}, query = {}) {
  let path = getUrl(newPage, params, query);
  page.redirect(path);
}
function back() {
  history.back();
}
function getUrl(newPage, params = {}, query = {}) {
  if (!routes[newPage]) {
    return '';
  }
  let path = routes[newPage].path;
  if (params) {
    Object.entries(params).forEach(([key, param]) => {
      path = path.replace(`:${key}`, param);
    });
  }
  if (query) {
    const queryStr = Object.entries(query).map(([key, param]) => `${key}=${param}`)
      .join('&');
    if (queryStr.length > 0) {
      path = path + '?' + queryStr;
    }
  }
  return basePath + path;
}