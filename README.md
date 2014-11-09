# ketamine

*Addictive dependency injection for JavaScript*

![Logo](https://33.media.tumblr.com/7fe890cf834a58310b553ddec3df0334/tumblr_ne6kduouQm1rjc81oo1_250.jpg)

###Installation

```js
$ npm install ketamine
```

###Description

  Ketamine is a dependency injection framework which targets CommonJs environments (i.e NodeJs). It lets you define custom context-independent bindings and then uses a supplied *require* function to load individual modules, currying in their dependency trees at runtime.

```js
var k = require('ketamine')(require);
```

###Usage

  Suppose you're developing a layered application, and you would like to get rid of those nasty inter-module dependencies. Say your project's folder structure looks something like this:

```js
- node_modules
- services
  | - userService.js
  |_
- repositories
  | - userRepository.js
  | - profileRepository.js
  |_
- database
  | - dbContext.js
  |_
```
  Consider the following: the files in *services* and *repositories* folders are exporting constructor functions, and the *dbContext* file contains an object aggregating your database tables. Now, both *userRepository* and *profileRepository* rely on *dbContext* to get their data, and *userService* should rely on both repositories to perform more complex operations. The dependencies are now identified, so your components should look something like this:
  
```js
UserService = function (userRepo, profileRepo) { /* ... */ };
// ....
UserRepo = function (dbContext) { /* ... */ };
// ....
ProfileRepo = function (dbContext) { /* ... */ };
// ...
dbContext = { /* ... */ };
```

  Configuring your components' dependencies has never been easier! Take a look at the following example, which will supply the right modules to those constructors' parameters:
  
```js

var k = require('ketamine')(require);

k.configure(function (module) {

	module('services/userService')
		.requires('repositories/userRepository')
		  .asInstance()
		.requires('repositories/profileRepository')
		  .asInstance();

	module('repositories/userRepository')
		.requires('database/dbContext');

	module('repositories/profileRepository')
		.requires('database/dbContext');
});

// Now you can get the new bound user service constructor
var UserService = k.require('services/userService');

// Or you can just create a new UserService instance
var userService = k.create('services/userService');
```

Notice the presence of the ``` module('module').requires('dependency').asInstance() ``` method chains. These flags tell the injector that, for the given *module*, it should instantiate the component exported by *dependency* before injecting it, therefore recursively loading any other dependencies for *dependency* in the same manner. If ```asInstance()``` is not specified, the raw exported content is injected for the given dependency.

###Enforcing interfaces

Besides specifying instantiation policies for individual module dependencies, you may also apply filters on what you can inject into one module. For example, in a dependent module, you would use regularly use it's dependencies' methods, so you need to make sure that those dependencies *actually have* those methods.

```js

var UserService = function (userRepo /* and other deps... */) {
  this.userRepo = userRepo;
};

UserService.prototype.create = function (mail, password) {

  // use the repo to access the database
  this.userRepo.create(mail, password, function (user) {
  
    // then do some other stuff
    console.log('User created successfully!');
  });
};

```

To validate any candidate *userRepo*, when configuring *ketamine*, you could specify what interface the dependency should implement:

```js
k.configure(function (module) {

	module('services/userService')
		.requires('repositories/userRepository')
			.asInstance()
			.asImplementationOf([
			  {
			    create: function () {}
			  }
			]);
			
	// then specify your other bindings...
});

```

The ```asImplementationOf``` method accepts an array of interfaces that the dependency should implement. The array's items can be prototype-like objects, such as the one in the example, constructor functions or even strings representing paths to other modules.

### Use with RequireJS

Ketamine will soon expose a fluent syntactic sugar API to use with RequireJS. *Comming soon...*
