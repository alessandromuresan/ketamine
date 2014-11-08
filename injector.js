(function (factory) {
	
	if (typeof define === 'function' && define.amd) {
		define('ketamine/injector', [], factory);
	} else {
		factory();
	}

})(function () {

	var Injector = function (require, basePath) {

		this._configuration = {};
		this._require = require;
		this._basePath = basePath;
	};

	Injector.prototype.configure = function (configuration) {
		this._configuration = configuration;
	};

	Injector.prototype.register = function (moduleId, options) {

		if (!moduleId) {
			throw new Error('Please supply a value for the module id');
		}

		if (typeof options === 'object') {
			this._configuration[moduleId] = options;
		} else {
			this._configuration[moduleId] = {
				instantiate: false,
				dependencies: []
			};
		}

		return this;
	};

	Injector.prototype.get = function (moduleId, instantiate) {

		if (!this._configuration[moduleId]) {
			return this._require(resolvePath(moduleId, this._basePath));
		}

		var options = this._configuration[moduleId],
			dependencies = options.dependencies;

		if (typeof instantiate === 'undefined') {
			instantiate = options.instantiate;
		}

		return resolveModule.call(this, moduleId, dependencies, instantiate);
	};

	function resolveModule (moduleId, dependencies, instantiate) {

		if (!this._configuration[moduleId]) {
			return this._require(resolvePath(moduleId, this._basePath));
		}

		var module = this._require(resolvePath(moduleId, this._basePath)),
			argumentsToInject = [],
			boundModule;

		if (typeof module !== 'function') {
			return module;
		}

		if (dependencies instanceof Array) {
			argumentsToInject = dependencies.map((function (dependency) {

				if (typeof dependency === 'string') {
					return resolveModule.call(this, dependency);
				}

				var dependencyOptions = this._configuration[dependency.name];

				return resolveModule.call(this, dependency.name, dependencyOptions.dependencies, dependency.instantiate);

			}).bind(this));
		}

		if (argumentsToInject.length !== 0) {
			boundModule = Function.prototype.bind.apply(module, [null].concat(argumentsToInject));
		} else {
			boundModule = module;
		}

		if (instantiate) {
			return new boundModule();
		}

		return boundModule;
	}

	function resolvePath (path, basePath) {

		if (basePath) {
			return basePath + '/' + path;
		}

		return path;
	}

	if (typeof module !== 'undefined') {
		module.exports = Injector;
	}

	return Injector;
});