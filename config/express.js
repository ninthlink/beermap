'use strict';

/**
 * Module dependencies.
 */
var mean = require('meanio'),
  compression = require('compression'),
  morgan = require('morgan'),
  consolidate = require('consolidate'),
  cookieParser = require('cookie-parser'),
  expressValidator = require('express-validator'),
  bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  assetmanager = require('assetmanager'),
  session = require('express-session'),
  mongoStore = require('connect-mongo')(session),
  helpers = require('view-helpers'),
  flash = require('connect-flash'),
  twit = require('twit'),
  express = require('express'),
  socketio = require('socket.io'),
  http = require('http'),
  io = socketio(http),
  config = mean.loadConfig();
  /*
  */
module.exports = function(app, passport, db) {

  app.set('showStackError', true);

  // Prettify HTML
  app.locals.pretty = true;

  // cache=memory or swig dies in NODE_ENV=production
  app.locals.cache = 'memory';

  // Should be placed before express.static
  // To ensure that all assets and data are compressed (utilize bandwidth)
  app.use(compression({
    // Levels are specified in a range of 0 to 9, where-as 0 is
    // no compression and 9 is best compression, but slowest
    level: 9
  }));

  // Only use logger for development environment
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  // assign the template engine to .html files
  app.engine('html', consolidate[config.templateEngine]);

  // set .html as the default extension
  app.set('view engine', 'html');

  // The cookieParser should be above session
  app.use(cookieParser());

  // Request body parsing middleware should be above methodOverride
  app.use(expressValidator());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(methodOverride());

  // Import the assets file and add to locals
  var assets = assetmanager.process({
    assets: require('./assets.json'),
    debug: process.env.NODE_ENV !== 'production',
    webroot: /public\/|packages\//g
  });

  // Add assets to local variables
  app.use(function(req, res, next) {
    res.locals.assets = assets;

    mean.aggregated('js', 'header', function(data) {
      res.locals.headerJs = data;
      next();
    });
  });

  // Express/Mongo session storage
  app.use(session({
    secret: config.sessionSecret,
    store: new mongoStore({
      db: db.connection.db,
      collection: config.sessionCollection
    }),
    cookie: config.sessionCookie,
    name: config.sessionName,
    resave: true,
    saveUninitialized: true
  }));

  // Dynamic helpers
  app.use(helpers(config.app.name));

  // Use passport session
  app.use(passport.initialize());
  app.use(passport.session());

  // MEAN middleware from modules before routes
  app.use(mean.chainware.before);

  // Connect flash for flash messages
  app.use(flash());
  
  
  // tweet stream setup?! NOT QUITE YET
  console.log('socket.io listening on port '+ config.http.port + ' (hopefully)');
  io.on('connection', function(socket) {
	console.log('new connection');
	socket.emit('welcome', { hello: 'world' });
	socket.on('welcome reply', function(data) {
		console.log('wwwwwwwelcome replyyyyyyyy');
		console.log(data);
		console.log('zzzzzz');
	});
  });
  
  var t = new twit({
	consumer_key: config.twitter.clientID,
	consumer_secret: config.twitter.clientSecret,
	access_token: config.twitter.access_token,
	access_token_secret: config.twitter.access_token_secret
  });
  /*
  // REST call to search all tweets with / from @BPBrewing
  t.get('search/tweets', { q: '@BPbrewing' }, function(err, data, response) {
	if ( err ) {
		console.log('twit search err');
		console.log(err);
	} else {
		console.log('TWIT SEARCH SUCCESS');
		console.log(data);
	}
  });
  */
  // example connecting to a twitter STREAM for every tweet mentioning craftbeer or #craftbeer
  var tstream = t.stream('statuses/filter', { track: 'craftbeer' });
  tstream.on('tweet', function(tweet) {
	console.log( 'tweet from @'+ tweet.user.screen_name +' id #'+ tweet.id_str );
	io.sockets.emit('tweet', { screen_name: tweet.user.screen_name, id: tweet.id_str });
  });
};
