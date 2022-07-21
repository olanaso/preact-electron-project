
let currentPage;
let loadedPages = {};

export default {
	login: {
		name: 'login',
		path: 'login',
		security: (ctx, next) => next(),
		enter: async (ctx, next) => {
			if (loadedPages['login'] == null) {
				const importRes = await import('./views/loginPage.js');
				console.warn('TODO: pensar en hacerlo con las clases sin new');
				loadedPages['login'] = new importRes.default();
				loadedPages['login'].setup(ctx.appContext);
			}
			ctx.appContext.set('page', 'login');
			updatePage(loadedPages['login'], ctx);
		},
		exit: async (ctx, next) => {
			next();
		}
	},
	territorialUnits: {
		name: 'territorialUnits',
		path: 'territorialUnits',
		security: (ctx, next) => next(),
		enter: async (ctx, next) => {
			if (loadedPages['territorialUnits'] == null) {
				const importRes = await import('./views/territorialUnitsPage.js');
				console.warn('TODO: pensar en hacerlo con las clases sin new');
				loadedPages['territorialUnits'] = new importRes.default();
				loadedPages['territorialUnits'].setup(ctx.appContext);
			}
			ctx.appContext.set('page', 'territorialUnits');
			updatePage(loadedPages['territorialUnits'], ctx);
		},
		exit: async (ctx, next) => {
			next();
		}
	},
	cadastralUnits: {
		name: 'cadastralUnits',
		path: 'cadastralUnits',
		security: (ctx, next) => next(),
		enter: async (ctx, next) => {
			if (loadedPages['cadastralUnits'] == null) {
				const importRes = await import('./views/cadastralUnitsPage.js');
				console.warn('TODO: pensar en hacerlo con las clases sin new');
				loadedPages['cadastralUnits'] = new importRes.default();
				loadedPages['cadastralUnits'].setup(ctx.appContext);
			}
			ctx.appContext.set('page', 'cadastralUnits');
			updatePage(loadedPages['cadastralUnits'], ctx);
		},
		exit: async (ctx, next) => {
			next();
		}
	},

	newCadastral: {
		name: 'newCadastral',
		path: 'cadastral',
		security: (ctx, next) => next(),
		enter: async (ctx, next) => {
			if (loadedPages['newCadastral'] == null) {
				const importRes = await import('./views/cadastralPage.js');
				console.warn('TODO: pensar en hacerlo con las clases sin new');
				loadedPages['newCadastral'] = new importRes.default();
				loadedPages['newCadastral'].setup(ctx.appContext);
			}
			ctx.appContext.set('page', 'newCadastral');
			updatePage(loadedPages['newCadastral'], ctx);
		},
		exit: async (ctx, next) => {
			next();
		}
	},


	viewDownload: {
		name: 'viewDownload',
		path: 'download/view/:viewId',
		security: (ctx, next) => next(),
		enter: async (ctx, next) => {
			if (loadedPages['viewDownload'] == null) {
				const importRes = await import('./views/cadastralPage.js');
				console.warn('TODO: pensar en hacerlo con las clases sin new');
				loadedPages['viewDownload'] = new importRes.default();
				loadedPages['viewDownload'].setup(ctx.appContext);
			}
			ctx.appContext.set('page', 'viewDownload');
			updatePage(loadedPages['viewDownload'], ctx);
		},
		exit: async (ctx, next) => {
			next();
		}
	},


	editCatastral: {
		name: 'editCatastral',
		path: 'cadastral/:id',
		security: (ctx, next) => next(),
		enter: async (ctx, next) => {
			if (loadedPages['editCatastral'] == null) {
				const importRes = await import('./views/cadastralPage.js');
				console.warn('TODO: pensar en hacerlo con las clases sin new');
				loadedPages['editCatastral'] = new importRes.default();
				loadedPages['editCatastral'].setup(ctx.appContext);
			}
			ctx.appContext.set('page', 'editCatastral');
			updatePage(loadedPages['editCatastral'], ctx);
		},
		exit: async (ctx, next) => {
			next();
		}
	},
};

// AUX FUNCTIONS

function hasNoSession(context) {
	const user = context.get('user');
	return user == null;
}
function hasSession(context) {
	const user = context.get('user');
	return user != null;
}

function updatePage(newPage, ctx) {
	if (currentPage === newPage) {
		return newPage.update(ctx.params, ctx.query);
	}
	if (currentPage) {
		currentPage.exit(ctx.params, ctx.query);
	}
	currentPage = newPage;
	newPage.enter(ctx.params, ctx.query);
	requestAnimationFrame(() => {
		window.scroll(0, 0);
	});

	window.currentPage = currentPage;
}
