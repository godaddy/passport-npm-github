'use strict';
const hyperquest = require('hyperquest');
const concat = require('concat-stream');

exports.createPassportOptions = (options) => {
  options = options || Object.create(null);
  const serverURL = options.url || 'https://api.github.com';
  const headers = Object.create(null);
  if (options.headers) for (let k of Object.keys(options.headers)) {
    let key = k.toLowerCase();
    if (key === 'authorization') continue;
    headers[key] = options.headers[key];
  }
  if (!headers['user-agent']) {
    headers['user-agent'] = 'passport-npm-github';
  }

  const authenticate = (data, done) => {
    const name = data.name;
    const access_token = data.password;
    hyperquest({
      uri: `${serverURL}/user`,
      // only support token auth
      headers: Object.assign({
        authorization: `token ${access_token}`
      }, headers)
    }, (httpErr, res) => {
      if (httpErr) {
        httpErr.status = 500;
        return void done(httpErr);
      }
      if (res.statusCode !== 200) {
        const statusErr = Error(`unexpected status code ${res.statusCode}`);
        statusErr.status = res.statusCode;
        return void done(statusErr);
      }
      res.pipe(concat(onBody))
        .on('error', streamError => void done(streamError));
      function onBody(body) {
        try {
          const parsedBody = JSON.parse(`${body}`);
          if (parsedBody.login === name) {
            return void done(null, {
              name,
              access_token: access_token
            });
          }
        }
        catch (parseError) {
          parseError.status = 400;
          return void done(parseError);
        }
        const mismatchError = Error('unauthorized');
        mismatchError.status = 401;
        return void done(mismatchError);
      }
    })
  };

  return {
    authenticate,
    serializeNPMToken: (data, done) => {
      const name = data.name;
      const access_token = data.password;
      try {
        const token = JSON.stringify({
          name,
          access_token
        });
        done(null, token);
      }
      catch (stringifyError) {
        done(stringifyError, null);
      }
    },
    deserializeNPMToken: (data, done) => {
      try {
        const req = data.req;
        const tokenData = JSON.parse(data.token);
        const name = tokenData.name;
        const access_token = tokenData.access_token;
        authenticate({
          req,
          name,
          password: access_token
        }, done);
      }
      catch (deserializeError) {
        done(deserializeError, null);
      }
    }
  }
}
