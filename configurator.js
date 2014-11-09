(function (factory) {

	if (typeof define === 'function' &&  define.amd) {
		define('ketamine/configurator', [], factory.bind(this, this));
	} else {
		factory(this);
	}

})(function (global) {

	var Configurator = function (injector) {

		this.injector = injector;
	};

	Configurator.prototype.configureForModule = function (moduleId) {

		var injector = this.injector;

		if (!injector.moduleIsRegistered(moduleId)) {
			injector.register(moduleId);
		}

		var moduleConfiguration = injector.getConfiguration(moduleId);

		var configurationPrototype = {

			requires: function (dependencyId) {

				injector.addDependency(moduleId, dependencyId);

				var requiresPrototype = {

					asInstance: function (instantiate) {

						if (typeof instantiate === 'undefined') {
							instantiate = true;
						}

						injector.setInstantiationForDependency(moduleId, dependencyId, instantiate)

						return {
							requires: configurationPrototype.requires,
							asInstance: requiresPrototype.asInstance,
							asImplementationOf: requiresPrototype.asImplementationOf
						};
					},
					asImplementationOf: function (interfaces) {

						if (!interfaces) {
							throw new Error('Please specify an array of interfaces');
						}

						injector.setInterfacesForDependency(moduleId, dependencyId, interfaces)

						return {
							requires: configurationPrototype.requires,
							asInstance: requiresPrototype.asInstance,
							asImplementationOf: requiresPrototype.asImplementationOf
						};
					},
					requires: configurationPrototype.requires
				};

				return requiresPrototype;
			}
		};

		return configurationPrototype;
	};

	if (typeof module !== 'undefined') {
		module.exports = Configurator;
	}

	return Configurator;

});
