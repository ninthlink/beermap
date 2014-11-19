'use strict';

module.exports = {
  db: 'mongodb://localhost/mean-dev1',
	debug: 'true',
  mongoose: {
    debug: false
  },
  app: {
    name: 'Beer Maps',
  },
  facebook: {
    clientID: '589114317883747',
    clientSecret: '67b2d67004bbe725eb6b910c589bd88d',
    callbackURL: 'http://localhost:3000/auth/facebook/callback'
  },
  twitter: {
    clientID: 'e0rBKc4xCzxgWoKO2UkfmMwgh',
    clientSecret: 'PO6dV0gtkzGHKiZIekM5FjYsnIBvdjAm95Ws5u1Li2temNSgpd',
    callbackURL: 'http://localhost:3000/auth/twitter/callback'
  },
  github: {
    clientID: 'DEFAULT_APP_ID',
    clientSecret: 'APP_SECRET',
    callbackURL: 'http://localhost:3000/auth/github/callback'
  },
  google: {
    clientID: 'DEFAULT_APP_ID',
    clientSecret: 'APP_SECRET',
    callbackURL: 'http://localhost:3000/auth/google/callback'
  },
  linkedin: {
    clientID: 'DEFAULT_API_KEY',
    clientSecret: 'SECRET_KEY',
    callbackURL: 'http://localhost:3000/auth/linkedin/callback'
  },
  emailFrom: 'SENDER EMAIL ADDRESS', // sender address like ABC <abc@example.com>
  mailer: {
    service: 'SERVICE_PROVIDER', // Gmail, SMTP
    auth: {
      user: 'EMAIL_ID',
      pass: 'PASSWORD'
    }
  }
};
