(function (factory) {

	if (typeof define === 'function' && define.amd) {
		define('ketamine' , ['ketamine/injector'], factory.bind(this, this));
	} else {
		if (typeof require === 'function') {
			factory(this, require('./injector'));
		}
	}

})(function (global, Injector) {

	var Ketamine = function (require, basePath) {

		require = require || global.require;

		if (!basePath && global.process && typeof global.process.cwd === 'function') {
			basePath = global.process.cwd();
		} 

		this.injector = new Injector(require, basePath);
		this.basePath = basePath;
	};

	Ketamine.prototype.configure = function (config) {

		if (typeof config === 'function') {
			config();
		} else {
			this.injector.configure(config);
		}
	};

	Ketamine.prototype.register = function (moduleId, options) {
		this.injector.register(moduleId, options);
	}

	Ketamine.prototype.get = function (moduleId) {
		return this.injector.get(moduleId);
	};

	Ketamine.prototype.require = Ketamine.prototype.get;

	Ketamine.prototype.create = function (moduleId) {
		return this.injector.get(moduleId, true);
	};

	function createKetamine (require, basePath) {
		return new Ketamine(require, basePath);
	}

	if (typeof module !== 'undefined') {
		module.exports = createKetamine;
	}

	return createKetamine;
});