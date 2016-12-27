Github access token workflow for `npm`

## API

This module exposes a way to generate options intended to be passed to `passport-npm`.

```js
const githubWorkflow = require('passport-npm-github').createPassportOptions({
  // if you want a private github API endpoint
  // otherwise it default to 'https://api.github.com'
  // url: 'http://my.private.github'
  //
  // headers: {...}
});
// githubWorkflow => {
//   authenticate,
//   serializeNPMToken,
//   deserializeNPMToken
// }
```

You can pass the result of `createPassportOptions` to `passport-npm`

```js
const NPMStrategy = require('passport-npm').NPMStrategy;

// any options we want to pass to `passport-npm` that are not in
// the result of `passport-npm-github`
const passportNPMOptions = {
  router
};
// combine them before passing to `passport-npm`
Object.assign(passportNPMOptions, githubWorkflow);
passport.use(new NPMStrategy(passportNPMOptions));
```

## Login

Using `npm login` you can have your Github acess token saved properly to your `.npmrc` file:

```sh
> npm login --registry=$MY_HOST
user: # github username
password: # personal access token
email: # unused
```

## Server setup

In order to use `passport-npm-github` we need to setup a server and `passport-npm`. The following example

```js
'use strict';
// pull in passport and passport-npm
const passport = require('passport');
const NPMStrategy = require('passport-npm').NPMStrategy;
const NPMStrategyErrorHandler = require('passport-npm').NPMStrategyErrorHandler;

// setup our server
const router = require('express')();

// setup passport-npm using passport-npm-github
const passportNPMOptions = {
  router
};
const githubWorkflow = require('passport-npm-github').createPassportOptions({
  // if you want a private github API endpoint
  // url: 'https://api.github.com'
});
Object.assign(passportNPMOptions, githubWorkflow);
passport.use(new NPMStrategy(passportNPMOptions));

// setup a route to a package
router.get('/:package',
  passport.initialize(),
  passport.authenticate('npm', {
    session: false,
    failWithError: true
  }),
  NPMStrategyErrorHandler,
  (req, res, next) => {
    // return package info for "protected"
    res.end(JSON.stringify({
      name: req.params.package,
      versions: {},
      'dist-tags': {}
    }));
  }
);

router.listen(8080);
```