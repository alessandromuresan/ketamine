(function (factory) {
	
	if (typeof define === 'function' && define.amd) {
		define('ketamine/injector', [], factory.bind(this, this));
	} else {
		factory(this);
	}

})(function (global) {

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
				dependencies: [],
				interfaces: []
			};
		}

		return this;
	};

	Injector.prototype.setDependencies = function (moduleId, dependencies) {

		if (!(dependencies instanceof Array)) {
			throw new TypeError('Dependencies object must be an array');
		}

		if (!this._configuration[moduleId]) {
			this._configuration[moduleId] = {
				instantiate: false,
				interfaces: []
			};
		}

		dependencies = dependencies.map(function (dependency) {

			if (typeof dependency === 'string') {
				return {
					name: dependency,
					interfaces: [],
					instantiate: false
				};
			}

			return dependency;
		});

		this._configuration[moduleId].dependencies = dependencies;
	};

	Injector.prototype.addDependency = function (moduleId, dependency) {

		if (!this._configuration[moduleId]) {
			this._configuration[moduleId] = {
				instantiate: false,
				interfaces: [],
				dependencies: []
			};
		}

		if (typeof dependency === 'string') {
			dependency = {
				name: dependency,
				interfaces: [],
				instantiate: false
			};
		}

		this._configuration[moduleId].dependencies.push(dependency);
	};

	Injector.prototype.setInstantiationForDependency = function (moduleId, dependencyId, instantiate) {

		if (typeof dependencyId !== 'string') {
			throw new TypeError('Please specify a valid dependency module id, as a string');
		}

		if (typeof instantiate === 'undefined') {
			throw new TypeError('Please specify wether to instantiate dependency ' + dependencyId + ' or not');
		}

		if (!this._configuration[moduleId] || !this._configuration[moduleId].dependencies ||
			this._configuration[moduleId].dependencies.length === 0) {
			throw new Error('No dependency configuration registered for module ' + moduleId);
		}

		var dependencies = this._configuration[moduleId].dependencies,
			dependencyObject;

		for (var i in dependencies) {

			if (dependencies[i].name === dependencyId) {
				dependencies[i].instantiate = instantiate;
				break;
			}
		}
	};

	Injector.prototype.setInterfacesForDependency = function (moduleId, dependencyId, interfaces) {

		if (typeof dependencyId !== 'string') {
			throw new TypeError('Please specify a valid dependency module id, as a string');
		}

		if (!(interfaces instanceof Array)) {
			throw new TypeError('Please specify an array of interfaces that ' + dependencyId + ' should implement');
		}

		if (!this._configuration[moduleId] || !this._configuration[moduleId].dependencies ||
			this._configuration[moduleId].dependencies.length === 0) {
			throw new Error('No dependency configuration registered for module ' + moduleId);
		}

		var dependencies = this._configuration[moduleId].dependencies;

		for (var i in dependencies) {

			if (dependencies[i].name === dependencyId) {
				dependencies[i].interfaces = interfaces;
				break;
			}
		}
	};

	Injector.prototype.setNativeNodeModuleFlag = function (moduleId, isNativeModule) {

		if (!this._configuration[moduleId]) {
			throw new Error('Please specify wether ' + moduleId + ' is a native module or not');
		}

		if (!this._configuration[moduleId]) {
			this._configuration[moduleId] = {
				dependencies: [],
				interfaces: []
			};
		}	

		this._configuration[moduleId].isNativeModule = isNativeModule;
	};

	Injector.prototype.setInstantiation = function (moduleId, instantiate) {

		if (typeof instantiate === 'undefined') {
			throw new TypeError('Please specify wether to instantiate ' + moduleId + ' or not');
		}

		if (!this._configuration[moduleId]) {
			this._configuration[moduleId] = {
				dependencies: [],
				interfaces: []
			};
		}	

		this._configuration[moduleId].instantiate = instantiate;
	};

	Injector.prototype.setInterfaces = function (moduleId, interfaces) {

		if (!(interfaces instanceof Array)) {
			throw new TypeError('Please specify an array of interfaces that ' + moduleId + ' should implement');
		}

		if (!this._configuration[moduleId]) {
			this._configuration[moduleId] = {
				dependencies: [],
				instantiate: false
			};
		}		

		this._configuration[moduleId].interfaces = interfaces.slice();
	};

	Injector.prototype.getConfiguration = function (moduleId) {
		return this._configuration[moduleId];
	};

	Injector.prototype.moduleIsRegistered = function (moduleId) {
		return (typeof this._configuration[moduleId] === 'object')
				&& this._configuration[moduleId] !== null;
	}

	Injector.prototype.get = function (moduleId, instantiate) {

		if (!this._configuration[moduleId]) {
			return this._require(resolvePath(moduleId, this._basePath));
		}

		if (this._configuration[moduleId].isNativeModule) {
			return this._require(moduleId);
		}

		var options = this._configuration[moduleId],
			interfacesToImplement = options.interfaces,
			dependencies = options.dependencies;

		if (typeof instantiate === 'undefined') {
			instantiate = options.instantiate;
		}

		return resolveModule.call(this, moduleId, dependencies, instantiate, interfacesToImplement);
	};

	function resolveModule (moduleId, dependencies, instantiate, interfacesToImplement, parentModuleId) {

		if (!this._configuration[moduleId]) {
			return this._require(resolvePath(moduleId, this._basePath));
		}

		var module = this._configuration[moduleId].isNativeModule
				? this._require(moduleId)
				: this._require(resolvePath(moduleId, this._basePath)),
			argumentsToInject = [],
			boundModule;

		if (interfacesToImplement) {

			for (var i in interfacesToImplement) {
				testInterfaceImplementation.call(this, moduleId, module, interfacesToImplement[i]);
			}			
		}

		if (typeof module !== 'function') {
			return module;
		}
		
		var _this = this;

		if (dependencies instanceof Array) {
			argumentsToInject = dependencies.map(function (dependency) {

				if (typeof dependency === 'string') {
					return resolveModule.call(_this, dependency);
				}

				var dependencyOptions = _this._configuration[dependency.name],
					dependencyDependencies = dependencyOptions
						? dependencyOptions.dependencies
						: [];

				var resolvedDependency = resolveModule.call(_this, dependency.name, dependencyDependencies, dependency.instantiate, dependency.interfaces, moduleId);

				if (dependency.instantiate && typeof resolvedDependency === 'function') {
					return new resolvedDependency();
				}

				return resolvedDependency;
			});
		}

		if (argumentsToInject.length !== 0) {
			boundModule = bindArgumentsToConstructor(module, argumentsToInject);
		} else {
			boundModule = module;
		}

		if (instantiate) {
			return new boundModule();
		}

		return boundModule;
	}

	function bindArgumentsToConstructor (Constructor, argumentsToInject) {

		return Function.prototype.bind.apply(Constructor, [null].concat(argumentsToInject));
	}

	function resolvePath (path, basePath) {

		if (basePath) {
			return basePath + '/' + path;
		}

		return path;
	}

	function testInterfaceImplementation (moduleId, object, interfacePrototype) {

		if (typeof interfacePrototype === 'string') {
			interfacePrototype = this._require(resolvePath(moduleId, this._basePath));
		}

		if (typeof interfacePrototype === 'function') {
			interfacePrototype = interfacePrototype.prototype;
		}

		if (typeof object === 'function') {
			object = object.prototype;
		}

		for (var prop in interfacePrototype) {
			if (interfacePrototype.hasOwnProperty(prop)) {

				var propertyIsImplemented = typeof interfacePrototype[prop] === typeof object[prop];

				if (!propertyIsImplemented) {
					throw new TypeError('Module ' + moduleId + ' does not implement specified interface. Missing method/property ' + prop);
				}
			}
		}
	}

	if (typeof module !== 'undefined') {
		module.exports = Injector;
	}

	return Injector;
});