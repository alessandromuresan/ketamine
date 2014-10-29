(function (factory) {

	if (typeof define === 'function' && define.amd) {
		define(factory);
	} else {
		factory(typeof require !== 'function');
	}

})(function (attachToGlobal) {

	'use strict';

	var Injector = function () {

		this._items = {};

		this._options = {};

		this._cache = {};
	};

	Injector.prototype.configure = function (options) {

		if (!options) {
			throw new Error('Configuration options are required');
		}

		if (typeof options === 'object') {
			this._options = options;
		}

	};

	Injector.prototype.get = function (className, asInstance) {

		var item = this._items[className],
			options = this._options[className];

		if (!item) {
			throw new Error('No class/object registered under the name ' + className);
		}

		if (typeof item !== 'function') {
			return item;
		}

		if (this._cache[className]) {
			return this._cache[className];
		}

		if (!options) {

			this._cache[className] = item;

			return item;
		}

		var dependencies = options.dependencies,
			argumentsToInject = [],
			boundFunction;

		if (dependencies instanceof Array) {

			argumentsToInject = dependencies.map((function (dependency) {

				var name = typeof dependency === 'string'
						? dependency
						: dependency.name,
					asInstance = dependency != null && (typeof dependency.asInstance === 'boolean')
						? dependency.asInstance
						: false;

				return this.get(name, asInstance);

			}).bind(this));

		}

		boundFunction = Function.prototype.bind.apply(item, [null].concat(argumentsToInject));

		if (typeof options.cache === 'boolean' && options.cache) {
			this._cache[className] = boundFunction;
		}

		if (asInstance) {
			return new boundFunction();
		} else {
			return boundFunction;
		}
	};

	Injector.prototype.create = function (className) {
		return this.get(className, true);
	};

	Injector.prototype.register = function (className, item) {

		this._items[className] = item;
	};

	if (typeof module !== 'undefined') {
		module.exports = Injector;
	} else {
		if (attachToGlobal && (typeof window !== 'undefined')) {
			window.Injector = Injector;
		}
	}

	return Injector;
});