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
  mongoose = require('mongoose'),
  Feed = mongoose.model('Feed'),
  Place = mongoose.model('Place'),
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
  
  /**
   * FROM HERE DOWN
   *
   * is for setting up Feeds streams and twitter things
   *
   * this code should be someplace else, but WHERE?!
   */
  // twit init
  var t = new twit({
    consumer_key: config.twitter.clientID,
    consumer_secret: config.twitter.clientSecret,
    access_token: config.twitter.access_token,
    access_token_secret: config.twitter.access_token_secret
  });
  
  // step through results and update 1 at a time?
  var updatePlaceTwitterStep = function(data) {
    if ( data.length > 0 ) {
      var firstplace = data.shift();
      //console.log(firstplace);
      Place.update({
        // find all Places where twit.name == twitter object screen_name
        'twit.name': firstplace.screen_name
      }, {
        // and update their twit.user_id & twit.img appropriately
        'twit.user_id': firstplace.id_str,
        'twit.img': firstplace.profile_image_url_https
      }, {
        multi: true
      }, function(err, numberAffected, rawResponse) {
        console.log('saved twitter user_id & user img for '+ numberAffected +' @'+ firstplace.screen_name);
        // also save the latest status in our Feeds?!
        if ( firstplace.hasOwnProperty('status') ) {
          console.log('saving new status for '+ firstplace.screen_name +' ...');
          // add user object for later tweet save processing?
          firstplace.status.user = {
            id_str: firstplace.id_str,
            name: firstplace.name,
            screen_name: firstplace.screen_name
          };
          Feed.saveNewTweet( firstplace.status, function() {
            // loop
            updatePlaceTwitterStep( data );
          });
        } else {
          // no status, so skip and just go to saving next place?
          console.log('no status to save for @'+ firstplace.screen_name +' ...');
          // loop
          updatePlaceTwitterStep( data );
        }
      });
    }
  };
  // check list of Places that have twitter Names but not twitter user IDs
  Place
    .where('twit.name').ne("")
    .where('twit.img').equals("")
    .distinct('twit.name', function(err, twitter_names) {
      if ( err ) {
        console.log('twit name search err');
        console.log(err);
      } else {
        if ( twitter_names.length > 0 ) {
          if ( twitter_names.length > 100 ) {
            console.log('more than 100 places twitter names found. first 100 :');
            twitter_names = twitter_names.slice(0,100);
          }
          
          var names_str = twitter_names.join();
          console.log(twitter_names.length +' lookup : '+ names_str + ' : ...');
          
          // GET call to /users/lookup to populate any missing user_names & IDs
          t.get('users/lookup', { screen_name: names_str }, function(err, data, response) {
            if ( err ) {
              console.log('twit search err');
              console.log(err);
            } else {
              console.log('*** TWIT SEARCH SUCCESS! data for '+ data.length +' Places\' twitters : and then?');
              // recursive call to see about inserting any new feed items for the results
              updatePlaceTwitterStep( data );
            }
          });
        }
      }
    });
  // query DB for Places with twit.user_id so we can set up our STREAM
  Place
    .find({})
    .where('twit.user_id').ne("")
    .distinct('twit.user_id', function(err, twitter_ids) {
      if ( err ) {
        console.log('twit user_id search err');
        console.log(err);
      } else {
        if ( twitter_ids.length > 0 ) {
          if ( twitter_ids.length > 100 ) {
            console.log('more than 100 places twitter names found. first 100 :');
            twitter_ids = twitter_ids.slice(0,100);
            // in this case, we'd really have to set up multiple streams...
          }
          
          var ids_str = twitter_ids.join();
          console.log(twitter_ids.length +' lookup : '+ ids_str + ' : ...');
          
          // GET call to /users/lookup to populate any missing user_names & IDs
          t.get('users/lookup', { user_id: ids_str }, function(err, data, response) {
            if ( err ) {
              console.log('twit search err');
              console.log(err);
            } else {
              console.log('*** TWIT SEARCH SUCCESS! data for '+ data.length +' places twitter users : and then?');
              // and process..
              updatePlaceTwitterStep( data );
            }
          });
          
          // STREAM
          var tstream = t.stream('statuses/filter', { follow: ids_str });
          // https://github.com/ttezel/twit#event-tweet
          tstream.on('tweet', function(twobj) {
            /**
             * checkit : tweet actually could be a Retweet or Reply from someone else
             * so first check if this tweet is from a right Place, and only save if so
             */
            console.log( 'TWEET : https://twitter.com/'+ twobj.user.screen_name +'/status/'+ twobj.id_str );
            Place
              .findOne({ "twit.name": twobj.user.screen_name })
              .exec(function(err, place) {
                if ( err ) {
                  console.log('err in finding matching twit.name ::');
                  console.log(err);
                } else {
                  // if a match was found, place is the place
                  // but if no match was found, place is null apparently
                  if ( place !== null ) {
                    console.log('twit.name Place matched : '+ place.name +' '+ place.sublocation +' @'+ place.twit.name  );
                    Feed.saveNewTweet( twobj, function() {
                      console.log('new Feed item saved to DB!');
                      console.log('***');
                      // YESSS : socket emit notify?!
                      //io.sockets.emit('tweet', { screen_name: twobj.user.screen_name, id: twobj.id_str });
                    });
                  } else {
                    console.log('no Place found matching @'+ twobj.user.screen_name + ' = no save.');
                  }
                }
              });
          });
          // https://github.com/ttezel/twit#event-delete
          tstream.on('delete', function(deleteMessage) {
            var tw_id = deleteMessage.delete.status.id_str;
            console.log('xxxx Twitter Stream delete '+ tw_id);
            //console.log(deleteMessage);
            Feed.deleteItem( tw_id, function() {
              console.log(' ... '+ tw_id +' deleted');
              // #todo : socket emit ?!
            });
            /*
            deleteMessage = {
              delete: {
                status: {
                  id: 537386102920081400,
                  id_str: '537386102920081409',
                  user_id: 465999585,
                  user_id_str: '465999585'
                },
                timestamp_ms: '1416958749728'
              }
            };
            */
          });
          // https://github.com/ttezel/twit#event-error
          tstream.on('error', function(error) {
            console.log('xxxx Twitter Stream error xxxx');
            console.log(error);
          });
          
          // #todo : cycle through the twitter_ids and make sure they are FOLLOWED and in the list?
        }
      }
    });
  /*
  // example REST call to search all tweets with / from @BPBrewing
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
};
