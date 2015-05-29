(function (factory) {

	if (typeof define === 'function' && define.amd) {
		define('ketamine' , ['ketamine/injector', 'ketamine/configurator'], factory.bind(this, this));
	} else {
		if (typeof require === 'function') {
			factory(this, require('./injector'), require('./configurator'));
		}
	}

})(function (global, Injector, Configurator) {

	var Ketamine = function (require, basePath, pathResolver) {

		require = require || global.require;

		if (!basePath && global.process && typeof global.process.cwd === 'function') {
			basePath = global.process.cwd();
		} 

		this.injector = new Injector(require, basePath, pathResolver);
		this.basePath = basePath;
	};

	Ketamine.prototype.configure = function (config) {

		if (typeof config === 'function') {
			
			var configurator = new Configurator(this.injector);

			config(configurator.configureForModule.bind(configurator));

		} else {
			this.injector.configure(config);
		}
	};

	Ketamine.prototype.register = function (moduleId, options) {
		this.injector.register(moduleId, options);
	};

	Ketamine.prototype.get = function (moduleId) {
		return this.injector.get(moduleId);
	};

	Ketamine.prototype.require = Ketamine.prototype.get;

	Ketamine.prototype.create = function (moduleId) {
		return this.injector.get(moduleId, true);
	};

	Ketamine.prototype.setDependencies = function (moduleId, dependencies) {
		return this.injector.setDependencies(moduleId, dependencies);
	};

	Ketamine.prototype.setInstantiation = function (moduleId, instantiate) {
		return this.injector.setInstantiation(moduleId, instantiate);
	};

	function createKetamine (require, basePath) {
		return new Ketamine(require, basePath);
	}

	if (typeof module !== 'undefined') {
		module.exports = createKetamine;
	}

	return createKetamine;
});