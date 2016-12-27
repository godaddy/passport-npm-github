#!/usr/bin/env Node
'use strict';

// NOTE: in order to run tests GITHUB_NAME and GITHUB_ACCESS_TOKEN
// environment variables must be set 

const credential_name = process.env.GITHUB_NAME;
process.env.GITHUB_NAME = '';
const credential_access_token = process.env.GITHUB_ACCESS_TOKEN;
process.env.GITHUB_ACCESS_TOKEN = '';
if (!credential_name || !credential_access_token) {
  console.error('GITHUB_NAME and GITHUB_ACCESS_TOKEN env variables are required to run tests');
  process.exit(1);
}

const tap = require('tap');
const githubWorkflow = require('./').createPassportOptions();

tap.test('unit tests', test => {
  const input = {
    name: credential_name,
    password: credential_access_token
  };
  const expected_user = {
    name: credential_name,
    access_token: credential_access_token
  };
  githubWorkflow.authenticate(input, onAuth);

  function onAuth(authenticateError, user) {
    if (authenticateError) return void test.fail(authenticateError);

    test.match(user, expected_user, 'should generate the right user');

    githubWorkflow.serializeNPMToken(input, onSerialize);
  }

  function onSerialize(serializeError, token) {
    if (serializeError) return void test.fail(serializeError);

    test.match(JSON.parse(token), expected_user, 'should generate the right token');

    githubWorkflow.deserializeNPMToken({token}, onDeserialize);
  }

  function onDeserialize(deserializeError, user) {
    if (deserializeError) return void test.fail(deserializeError);

    test.match(user, expected_user, 'should have token match user');

    test.end();
  }
});
