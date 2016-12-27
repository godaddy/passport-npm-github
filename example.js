#!/usr/bin/env node
'use strict';

const passport = require('passport');
const NPMStrategy = require('passport-npm').NPMStrategy;
const NPMStrategyErrorHandler = require('passport-npm').NPMStrategyErrorHandler;
const router = require('express')();

const passportNPMOptions = {router};
Object.assign(passportNPMOptions, require('./').createPassportOptions());

passport.use(new NPMStrategy(passportNPMOptions));

router.use(
  (req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next(null);
  },
  passport.initialize(),
  passport.authenticate('npm', {
    // npm client doesn't have compatible sessions with PassportJS
    // - does not use a cookie
    // - uses bearer tokens and basic auth via HTTP authorization header
    session: false,
    // npm client doesn't have compatible response parsing with PassportJS
    failWithError: true
  }),
  // print out our errors to the server console
  (err, req, res, next) => {
    if (err) console.log(err.status, err);
    next(err);
  },
  NPMStrategyErrorHandler,
  (req, res) => {
    console.log(`Authenticated as ${req.user.name}`);
    // send a generic reply
    res.end(`{}`);
  }
);

const server = require('http').createServer(router);
server.listen(process.env.PORT || 8080, (err) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('npm login proxy started on port', server.address().port);
});
