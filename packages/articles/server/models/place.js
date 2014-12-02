'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  Feed = mongoose.model('Feed');

/**
 * helper objects
 * since lots of Schema pieces seem to want same options
 */
var StringTrimmed = { type: String, trim: true };
var StringLowerTrimmed = { type: String, trim: true, lowercase: true };
var BoolFalse = { type: Boolean, default: false };
/**
 * Place Schema
 */
var PlaceSchema = new Schema({
  // name, like "Alpine"
  name: {
    type: String,
    required: true,
    trim: true
  },
  // suffix, like "Beer Company"
  suffix: StringTrimmed,
  // sublocation, like "Tasting Room"
  sublocation: StringTrimmed,
  // not sure if this could be defaulting to other values
  // like (name +' '+ sublocation).toLowerCase.replace(spaces with -)
  slug: {
    type: String,
    required: true,
    trim: true,
    // auto convert any slug to lowercase
    lowercase: true,
    // make sure we cant have multiple Places with the same slug..
    unique: true
  },
  // some Booleans for checkboxes of amenities
  chk: {
	  // growler fills
	  growlers: BoolFalse,
	  // family friendly
	  fams: BoolFalse,
	  // dog friendly
	  dogs: BoolFalse,
	  // food trucks
	  trucks: BoolFalse,
	  // food service
	  foods: BoolFalse
  },
  // addr = Address 1 & 2 if its there since who cares
  addr: StringTrimmed,
  city: StringTrimmed,
  state: StringTrimmed,
  zip: StringTrimmed,
  // should phone number have a set / validator to handle formatting?!
  phone: StringTrimmed,
  // should url have a set / validator to store
  // without any "http://www." at the front & / at the end?
  url: StringTrimmed,
  // latitude & longitude, converted to 'coords" object via a Virtual below
  lat: Number,
  lng: Number,
  // social media links & IDs & such...
  twit: {
    img: StringTrimmed,
    user_id: StringTrimmed,
    // twitter screen_name
    name: StringLowerTrimmed
  },
  insta: {
    user_id: StringTrimmed,
    // instagram name
    name: StringLowerTrimmed,
    // instagram location id, different than the Place's (brand's) user acct
    place_id: StringTrimmed
  },
  fb: {
    page_id: StringTrimmed,
    // url should start with facebook.com/ ?! or just the part after that?!
    url: StringTrimmed,
    // Facebook Place id, different than the Place's (brand's) Page ID#
    place_id: StringTrimmed
  },
  // and then? maybe we add a "comment" string field for tracking some
  comment: StringTrimmed
},
// set Schema "virtuals" = true so the Angular front end gets em too
{
	toObject: {
		virtuals: true
	},
	toJSON: {
		virtuals: true
	}
});
/**
 * Virtuals are like helpers for doing some shortcuts / combinings
 * the first couple are more specifically for specific naming conventions gmap requires
 */
// map place.coords = { latitude, longitude }
PlaceSchema.virtual( 'latitude' ).get(function() {
	return this.lat;
});
PlaceSchema.virtual( 'longitude' ).get(function() {
	return this.lng;
});
/*
PlaceSchema.virtual( 'coords' ).get(function() {
	return {
		latitude: this.lat,
		longitude: this.lng
	};
});
*/
// combine "City, State Zip"
PlaceSchema.virtual( 'CSZ' ).get(function() {
  // only return something if the object actually has a city || state || zip
  var oot = '';
  if ( this.city ) {
    oot += this.city;
    if ( this.state || this.zip ) {
      oot += ', ';
    }
  }
  if ( this.state ) {
    oot += this.state;
    if ( this.zip ) {
      oot += ' ';
    }
  }
  if ( this.zip ) {
    oot += this.zip;
  }
  if ( oot !== '' ) {
    return oot;
  }
});
// get full address in 1 line, for kicks
PlaceSchema.virtual( 'fullAddr' ).get(function() {
  // only return something if address items are set..
  var oot = '';
  if ( this.addr ) {
    oot += this.addr;
    if ( this.CSZ ) {
      oot += ', ';
    }
  }
  if ( this.CSZ ) {
    oot += this.CSZ;
  }
  if ( oot !== '' ) {
    return oot;
  }
});
// fullName (deprecated) returns name ("Alpine") + suffix ("Beer Co")
PlaceSchema.virtual( 'fullName' ).get(function() {
	return this.name + ( this.suffix !== '' ? (' ' + this.suffix ) : '' );
});
// nameFull returns name ("Alpine") + suffix ("Beer Co")
PlaceSchema.virtual( 'nameFull' ).get(function() {
	return this.name + ( this.suffix !== '' ? (' ' + this.suffix ) : '' );
});
// nameLoc returns "Ballast Point" + "Little Italy"
PlaceSchema.virtual( 'nameLoc' ).get(function() {
  var loc = this.sublocation;
	return this.name + ( loc !== '' ? ( ' ' + loc ) : '' );
});
// nameLongest returns "Ballast Point" + "Brewing & Spirits" + "Little Italy"
PlaceSchema.virtual( 'nameLongest' ).get(function() {
  var oot = this.name;
  if ( this.suffix !== '' ) {
    oot += ' '+ this.suffix;
  }
  if ( this.sublocation !== '' ) {
    oot += ' '+ this.sublocation;
  }
	return oot;
});
/**
 * Statics are like helper functions or something, nobody knows, maybe dragons
 */
// findOne Place given an id & execute callback
PlaceSchema.statics.load = function(id, cb) {
  this.findOne({
    _id: id
  })
  /**
   * see http://mongoosejs.com/docs/populate.html
   * for more on populating, so we can populate latest couple feed items?
   */
  //.populate('user', 'name username').exec(cb);
  .exec(cb);
};
// findOne Place, given a slug instead of ID, & execute callback?
PlaceSchema.statics.findBySlug = function(slug, cb) {
  this.findOne({
    slug: slug //new RegExp( slug, 'i' )
  })
  //.populate('user', 'name username').exec(cb);
  .exec(cb);
};
// help recurse step through results & update 1 at a time?
PlaceSchema.statics.processTwitterUsersLookup = function(data) {
  var thisPlace = this;
  if ( data.length > 0 ) {
    var p = data.shift();
    //console.log(p);
    thisPlace.update({
      // find all Places where twit.name == twitter object screen_name
      'twit.name': p.screen_name
    }, {
      // and update their twit.user_id & twit.img appropriately
      'twit.user_id': p.id_str,
      'twit.img': p.profile_image_url_https
    }, {
      multi: true
    }, function(err, numberAffected, rawResponse) {
      //console.log('saved twitter user_id & user img for '+ numberAffected +' @'+ p.screen_name);
      // also save the latest status in our Feeds?!
      if ( p.hasOwnProperty('status') ) {
        //console.log('saving new status for '+ p.screen_name +' ...');
        // add user object for later tweet save processing?
        p.status.user = {
          id_str: p.id_str,
          screen_name: p.screen_name
        };
        thisPlace.saveTweetIfMatch( p.status, thisPlace, function() {
          // and loop
          thisPlace.processTwitterUsersLookup( data );
        });
      } else {
        // no status, so skip and just go to saving next place?
        //console.log('no status to save for @'+ p.screen_name +' ...');
        // loop
        thisPlace.processTwitterUsersLookup( data );
      }
    });
  }
};
// check list of Places for any with twitter Names but not twitter user IDs
PlaceSchema.statics.populateMissingTwitterInfos = function( Twit ) {
  var thisPlace = this;
  thisPlace.find({})
    .where('twit.name').ne('')
    .where('twit.img').equals('')
    .distinct('twit.name', function(err, twitter_names) {
      if ( err ) {
        console.log('populateMissingTwitterInfos twit name search err ?');
        console.log(err);
      } else {
        if ( twitter_names.length > 0 ) {
          if ( twitter_names.length > 100 ) {
            console.log('more than 100 places twitter names found. first 100 :');
            twitter_names = twitter_names.slice(0,100);
          }
          
          var names_str = twitter_names.join();
          console.log('populate twitter infos for '+ twitter_names.length +' Places ...');
          
          // GET call to /users/lookup to populate any missing user_names & IDs
          Twit.get('users/lookup', { screen_name: names_str }, function(err, data, response) {
            if ( err ) {
              console.log('twit search err?');
              console.log(err);
            } else {
              //console.log('*** TWIT SEARCH SUCCESS! data for '+ data.length +' Places\' twitters : and then?');
              // recursive call to see about inserting any new feed items for the results
              thisPlace.processTwitterUsersLookup( data );
            }
          });
        }
      }
    });
};
// only Save a Tweet if we have a Place with twit.name = tweet.user.screen_name
PlaceSchema.statics.saveTweetIfMatch = function( tweet, thisPlace, callback ) {
  // somehow this was bugging out til i added thisPlace arg..
  console.log( 'TWEET : https://twitter.com/'+ tweet.user.screen_name +'/status/'+ tweet.id_str );
  this.find({})
  .where('twit.name').equals( tweet.user.screen_name )
  .exec( function( err, matches ) {
    if ( err ) {
      console.log('err in finding matching twit.name?');
      console.log(err);
      if ( callback ) {
        // and then trigger callback anyways
        callback();
      }
    } else {
      if ( matches.length > 0 ) {
        // a match was found, so we're cool to save
        var placematch_id = matches[0]._id;
        console.log('Place(s) found matching : '+ tweet.user.screen_name +' : '+ placematch_id );
        //console.log(matches[0]);
        
        Feed.saveNewTweet( tweet, placematch_id, function() {
          console.log('new Feed item saved to DB!');
          console.log('***');
          // #todo : socket emit notify?!
          //io.sockets.emit('tweet', { screen_name: tweet.user.screen_name, id: tweet.id_str });
          if ( callback ) {
            callback();
          }
        });
      } else {
        // no match found...
        console.log('no Place found matching @'+ tweet.user.screen_name + ' = no save.');
        console.log('***');
        // note : if we wanted to store # of Retweets, this is probably when that # should be incremented somehow
        if ( callback ) {
          // and then trigger callback anyways
          callback();
        }
      }
    }
  });
};
// intialize Twitter stream for Places' twitters'
PlaceSchema.statics.initTwitterStream = function( Twit ) {
  console.log('<< Place.initTwitterStream >>');
  var thisPlace = this;
  // query DB for Places with twit.user_id != '' and then STREAM
  this.find({})
  .where('twit.user_id').ne('')
  .distinct('twit.user_id', function(err, twitter_ids) {
    if ( err ) {
      console.log('twit user_id search err?');
      console.log(err);
    } else {
      if ( twitter_ids.length > 0 ) {
        if ( twitter_ids.length > 100 ) {
          console.log('more than 100 places twitter names found. first 100 :');
          twitter_ids = twitter_ids.slice(0,100);
          // in this case, we'd really have to set up multiple streams...
        }
        
        var ids_str = twitter_ids.join();
        console.log( 'refreshing info on '+ twitter_ids.length +' Places\' Twitters ...');
        
        /**
         * GET call to /users/lookup
         * populate any missing user_names & IDs
         * & initial svaes the latest tweet from each
         */
        Twit.get('users/lookup', { user_id: ids_str }, function(err, data, response) {
          if ( err ) {
            console.log('twit search err?');
            console.log(err);
          } else {
            //console.log('*** TWIT SEARCH SUCCESS! data for '+ data.length +' places twitter users : and then?');
            // and process..
            thisPlace.processTwitterUsersLookup( data );
          }
        });
        
        // and STREAM
        var tstream = Twit.stream( 'statuses/filter', { follow: ids_str } );
        // yea, thats really it. then just have to add the event listeners...
        // https://github.com/ttezel/twit#event-tweet
        tstream.on( 'tweet', function( tweet ) {
          thisPlace.saveTweetIfMatch( tweet, thisPlace ); // what?!
        });
        // https://github.com/ttezel/twit#event-delete
        tstream.on( 'delete', function( deleteMessage ) {
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
          var tw_id = deleteMessage.delete.status.id_str;
          console.log('xxxx Twitter Stream delete '+ tw_id);
          //console.log(deleteMessage);
          Feed.deleteItem( tw_id, function() {
            console.log(' ... '+ tw_id +' deleted');
            // #todo : socket emit ?!
          });
        });
        // https://github.com/ttezel/twit#event-error
        tstream.on( 'error', function(error) {
          console.log('??? Twitter Stream error ???');
          console.log(error);
        });
        
        // #todo : cycle through the twitter_ids and make sure they are FOLLOWED and in the list?
      }
    }
  });
};
// and "compile" our model, or something
mongoose.model('Place', PlaceSchema);
