'use strict';

module.exports = {
  db: 'mongodb://beermap:R4e3w2q1!@ds051110.mongolab.com:51110/beermap',
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
    access_token: '2876250307-65zni4ISglmnnjd6t03apDavCPdXgogrLSfqdsd',
    access_token_secret: 'ztwKbIGmw02fQHg3MijVuO9HT2AzhEhpfteLRJLiaRtKc',
    clientID: 'e0rBKc4xCzxgWoKO2UkfmMwgh',
    clientSecret: 'PO6dV0gtkzGHKiZIekM5FjYsnIBvdjAm95Ws5u1Li2temNSgpd',
    callbackURL: 'http://localhost:3000/auth/twitter/callback'
  },
  instagram: {
    clientID: 'f67111e49d6043c3bf99622f6ae07e47',
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
