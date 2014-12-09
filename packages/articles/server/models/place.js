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
  // main location if there is one
  main_loc: {
    type: Schema.Types.ObjectId,
    ref: 'Place'
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
 * Virtuals are like quick helpers for doing some shortcuts / combinings
 */
// map place.coords = { latitude, longitude }
PlaceSchema.virtual( 'latitude' ).get(function() {
	return this.lat;
});
PlaceSchema.virtual( 'longitude' ).get(function() {
	return this.lng;
});
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
// phoneNumber = phone but just the number
PlaceSchema.virtual( 'phoneNumber' ).get(function() {
  return this.phone.replace('(', '').replace(')', '').replace(/ /i, '').replace(/-/i, '');
});
/**
 * Statics are like more permanent helper functions
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
PlaceSchema.statics.processTwitterUsersLookup = function( data, quiet ) {
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
    }, function(err, num, rawResponse) {
      //console.log('saved user id & img for '+ num +' @'+ p.screen_name);
      // also save the latest status in our Feeds?!
      if ( p.hasOwnProperty('status') ) {
        //console.log('saving new status for '+ p.screen_name +' ...');
        // add user object for later tweet save processing?
        p.status.user = {
          id_str: p.id_str,
          screen_name: p.screen_name
        };
        thisPlace.saveTweetIfMatch( p.status, thisPlace, quiet, function() {
          // and loop
          thisPlace.processTwitterUsersLookup( data, quiet );
        });
      } else {
        // no status, so skip and just go to saving next place?
        //console.log('no status to save for @'+ p.screen_name +' ...');
        // loop
        thisPlace.processTwitterUsersLookup( data, quiet );
      }
    });
  } else {
    console.log('<< Place.processTwitterUsersLookup loop complete >>');
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
            console.log('OOPS found more than 100 Places twitter names...');
            twitter_names = twitter_names.slice(0,100);
          }
          
          var lookup = {
            screen_name: twitter_names.join()
          };
          console.log( 'populate twitter infos for '+ twitter_names.length );
          
          // GET call to /users/lookup to populate any missing user_names & IDs
          Twit.get('users/lookup', lookup, function(err, data, response) {
            if ( err ) {
              console.log('twit search err?');
              console.log(err);
            } else {
              //console.log('*** TWIT SEARCH SUCCESS for '+ data.length );
              // loop to insert any new Feed items from results, quietly
              thisPlace.processTwitterUsersLookup( data, true );
            }
          });
        }
      }
    });
};
// only Save a Tweet if we have a Place with twit.name = tweet.user.screen_name
PlaceSchema.statics.saveTweetIfMatch = function( tweet, thisPlace, quiet, cb ) {
  if ( !quiet ) {
    var twurl = 'https://twitter.com/';
    twurl += tweet.user.screen_name +'/status/'+ tweet.id_str;
    console.log( 'TWEET : '+ twurl );
  }
  this.find({})
  .where('twit.name').equals( tweet.user.screen_name )
  .exec( function( err, matches ) {
    if ( err ) {
      console.log('err in finding matching twit.name?');
      console.log(err);
      if ( cb ) {
        // and then trigger cb anyways
        cb();
      }
    } else {
      if ( matches.length > 0 ) {
        // a match was found, so we're cool to save
        var pid = matches[0]._id;
        if ( !quiet ) {
          console.log('Place(s) match: '+ tweet.user.screen_name +' '+ pid );
        }
        //console.log(matches[0]);
        
        Feed.saveNewTweet( tweet, pid, function() {
          if ( !quiet ) {
            console.log('new Feed item saved to DB!');
            console.log('***');
          }
          // #todo : socket emit notify?!
          if ( cb ) {
            cb();
          }
        });
      } else {
        // no match found = no save
        if ( !quiet ) {
          console.log('no Place found matching @'+ tweet.user.screen_name );
          console.log('***');
        }
        // but if we stored Retweets #, probably inc here
        // and then trigger cb anyways
        if ( cb ) {
          cb();
        }
      }
    }
  });
};
// only Save an Instagram post if we have a Place matching user.username
PlaceSchema.statics.saveInstaPostsIfMatch = function( data, thisPlace, quiet, cb ) {
  // unlike twitter, instagram could send multiple posts for a single user here
  var c = data.length;
  if ( c > 0 ) {
    // first, find matching place based off first item
    var insta = data.pop();
    if ( !quiet ) {
      var iurl = insta.link;
      console.log( 'insta : '+ iurl );
    }
    this.find({})
    .where('insta.name').equals( insta.user.username )
    .exec( function( err, matches ) {
      if ( err ) {
        console.log('err in finding matching insta.name?');
        console.log(err);
        if ( cb ) {
          // and then trigger cb anyways
          cb();
        }
      } else {
        if ( matches.length > 0 ) {
          // a match was found, so we're cool to save
          var pid = matches[0]._id;
          if ( !quiet ) {
            console.log('Place(s) match: '+ insta.user.username +' '+ pid );
          }
          // push the first (last) item we were matching against, back to data
          data.push(insta);
          // recursive loop to save 1 new Feed item at a time..
          
          Feed.saveNewInstagrams( data, pid, function() {
            if ( !quiet ) {
              console.log('new Feed item(s) saved to DB!');
              console.log('***');
            }
            // #todo : socket emit notify?!
            if ( cb ) {
              cb();
            }
          });
        } else {
          // no match found = no save
          if ( !quiet ) {
            console.log('no Place found matching @'+ insta.user.screen_name );
            console.log('***');
          }
          // and then trigger cb anyways
          if ( cb ) {
            cb();
          }
        }
      }
    });
  }
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
        var lookup = {
          user_id: ids_str
        };
        console.log( 'refreshing info on '+ twitter_ids.length +' twitters');
        
        /**
         * GET call to /users/lookup
         * populate any missing user_names & IDs
         * & initial svaes the latest tweet from each
         */
        Twit.get('users/lookup', lookup, function(err, data, response) {
          if ( err ) {
            console.log('twit search err?');
            console.log(err);
          } else {
            //console.log('*** TWIT SEARCH SUCCESS for '+ data.length );
            // and process, quietly at first..
            var quiet = true;
            thisPlace.processTwitterUsersLookup( data, quiet );
          }
        });
        
        // and STREAM
        lookup = {
          follow: ids_str
        };
        var tstream = Twit.stream( 'statuses/filter', lookup );
        // yea, thats really it. then just have to add the event listeners...
        // https://github.com/ttezel/twit#event-tweet
        tstream.on( 'tweet', function( tweet ) {
          // this was broke until passing thisPlace as an arg..
          thisPlace.saveTweetIfMatch( tweet, thisPlace );
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
        tstream.on( 'delete', function( deleteMessage ) {
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
        
        /**
         * #todo : cycle through the twitter_ids
         * make sure they are FOLLOWED by sdbeermap
         * and in the list?
         */
      }
    }
  });
};
// recursive lookup Instagram user search 1 at a time : not sold on function name
PlaceSchema.statics.processInstagramUserSearch = function( Instagram, insta_names ) {
  var thisPlace = this;
  if ( insta_names.length > 0 ) {
    // Instagram limit is "5000 requests / hour", so should be ok w/o limit
    var user_name = insta_names.shift();
    //console.log( 'searching for Instagram user name '+ user_name );
    Instagram.users.search({
      q: user_name,
      complete: function(data) {
        //console.log( 'iii Instagram.user.search returned');
        //console.log( data );
        if ( data.length > 0 ) {
          // assume 1st result is best match?!
          var p = data[0];
          thisPlace.update({
            // find all Places where insta.name == instagram object username
            'insta.name': user_name
          }, {
            // update the user name just in case, like if the case changed
            'insta.name': p.username,
            // update insta.user_id appropriately
            'insta.user_id': p.id
          }, {
            multi: true
          }, function(err, num, rawResponse) {
            console.log('saved id '+ p.id +' for '+ num +' @'+ p.username);
            // loop
            thisPlace.processInstagramUserSearch( Instagram, insta_names );
          });
        } else {
          console.log( 'no Instagram results found for '+ user_name );
          // loop anyways
          thisPlace.processInstagramUserSearch( Instagram, insta_names );
        }
      }
    });
  }
};
// check list of Places for any with Instagram names but not user IDs
PlaceSchema.statics.populateMissingInstagramInfos = function( Instagram ) {
  console.log('<<< PlaceSchema > populateMissingInstagramInfos >>>');
  var thisPlace = this;
  thisPlace.find({})
    .where('insta.name').ne('')
    .where('insta.user_id').equals('')
    .distinct('insta.name', function(err, insta_names) {
      if ( err ) {
        console.log('populateMissingInstagramInfos name search err ?');
        console.log(err);
      } else {
        if ( insta_names.length > 0 ) {
          // pass all names in, and it will look up 1 at a time..
          thisPlace.processInstagramUserSearch( Instagram, insta_names );
        }
      }
    });
};

// recursive GET user recent media & set up stream (eventually?)
PlaceSchema.statics.processInstagramUsers = function( Instagram, user_ids, quiet ) {
  var thisPlace = this;
  if ( user_ids.length > 0 ) {
    // Instagram limit is "5000 requests / hour", so should be ok w/o limit
    var user_id = user_ids.shift();
    // for GET users.recent, want media from 7 days, in seconds not ms
    var min_timestamp = Math.floor( Date.now() / 1000 ) - 604800;
    if ( !quiet ) {
      console.log( 'searching for Instagram user '+ user_id );
    }
    // GET users.recent for the user
    Instagram.users.recent({
      user_id: user_id,
      min_timestamp : min_timestamp,
      complete: function(data) {
        if ( !quiet ) {
          console.log( 'iii Instagram.user.recent returned');
          console.log( data );
        }
        // see about saving the recent Posts, and looping
        if ( data.length > 0 ) {
          thisPlace.saveInstaPostsIfMatch( data, thisPlace, quiet, function() {
            // and THEN loop
            thisPlace.processInstagramUsers( Instagram, user_ids, quiet );
          });
        } else {
          // no recent posts, still loop to the next
          thisPlace.processInstagramUsers( Instagram, user_ids, quiet );
        }
      }
    });
  } else {
    if ( !quiet ) {
      console.log('<<< PlaceSchema > processInstagramUsers loop DONE >>>');
    }
  }
};
// gather all Places Instagram user IDs & start recent lookups & fake "stream"
PlaceSchema.statics.initInstagramLookup = function( Instagram ) {
  var thisPlace = this;
  var quiet = true;
  if ( !quiet ) {
    console.log('<<< PlaceSchema > initInstagramLookup >>>');
  }
  thisPlace.find({})
  .where('insta.user_id').ne('')
  .distinct('insta.user_id', function(err, user_ids) {
    if ( err ) {
      console.log('initInstagramLookup user_id search err ?');
      console.log(err);
    } else {
      if ( user_ids.length > 0 ) {
        // pass all names in, and it will look up 1 at a time..
        thisPlace.processInstagramUsers( Instagram, user_ids, quiet );
      }
    }
  });
  // can't actually stream select users with Instagram API, so repeat in a bit
  setTimeout( function() {
    thisPlace.initInstagramLookup( Instagram );
  }, 240000 );
};
// and "compile" our model, or something
mongoose.model('Place', PlaceSchema);
