'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  moment = require('moment');

// shorten our moment output
moment.locale('en', {
  relativeTime : {
    future: 'in %s',
    past: '%s ago',
    s: '%ds',
    m: '1m',
    mm: '%dm',
    h: '1h',
    hh: '%dh',
    d: '1d',
    dd: '%dd',
    M: '1 month',
    MM: '%d months',
    y: '1 year',
    yy: '%d years'
  }
});
/**
 * helper objects
 * since lots of Schema pieces seem to want same options
 */
var StringTrimmed = { type: String, trim: true };
var StringReqTrimmed = { type: String, required: true, trim: true };
var BoolFalse = { type: Boolean, default: false };
/**
 * Feed Schema
 */
var FeedSchema = new Schema({
  // bool for whether the item is active (displayed vs queued? not sure..)
  active: BoolFalse,
  // author info for the feed item
  author: {
    type: Schema.Types.ObjectId,
    ref: 'Place'
  },
  // main body content of the tweet / post / item / w/e
  body: StringTrimmed,
  // Date property automatically handles both Twitter & Instagram time formats?
  date: {
    type: Date,
    default: Date.now,
    // here we say automatically wipe Feed items after some time, like 7 days
    expires: '7d'
  },
  // either URL for Instagram img src or Twitter attached photo src, or ''
  img: StringTrimmed,
  // original id as provided by whatever source
  origin_id: {
    type: String,
    required: true,
    trim: true,
    // setting unique makes sure we have just 1 Feed item for each origin_id
    unique: true
  },
  // all possibile sources are listed here...
  source: {
    type: String,
    default: 'Twitter',
    // list all possible feed sources here for auto validation magic?
    enum : ['Twitter', 'Instagram', 'Facebook']
  },
  // permalink like 'https://twitter.com/'+ screen_name +'/status/'+ id_str
  url: StringReqTrimmed
},
// set Schema "virtuals" = true so back & front end gets em too
{
	toObject: {
		virtuals: true
	},
	toJSON: {
		virtuals: true
	}
});
/**
 * Virtuals : not sure what Virtuals we might need?
 */
// use moment for more pretty time stamp
FeedSchema.virtual( 'moment' ).get(function() {
	return moment(this.date).fromNow(); //abbrev
});
/**
 * Statics are like helper functions or something, nobody knows, maybe dragons
 */
// findOne Feed item given an id, populate author info, & execute callback
FeedSchema.statics.load = function(id, callback) {
  this.findOne({
    _id: id
  })
  // could also add 2nd parameter like 'name _id' to return just specific fields
  .populate('author')
  // and send it back
  .exec(callback);
};
// returns chunk of Feed items from the db with page & skip args for paginations?
FeedSchema.statics.getFeed = function(author_id, page, skip, errorCallback, successCallback) {
  var items = [],
      perpage = 20,
      start = (page * perpage) + (skip * 1),
      feedFields = 'active author body date img origin_id source url';
  
  //console.log('getFeed /'+ id + '/'+ page + '/'+ skip +' = start '+ start);
  // query the db, using skip and limit for page chunking
  var query = this.find({},feedFields,{skip: start, limit: perpage})
    .sort({date: 'desc'});
  // either loading latest Feed for ALL authors, or just specific one(s)
  if ( author_id !== '' ) {
    // if id is provided, only match on author(s)
    if ( author_id.indexOf( ',' ) > 0 ) {
      // multiple IDs : EXPLODE!
      var author_ids = author_id.split( ',' );
      query = query.where('author').in(author_ids);
    } else {
      // just matching against 1 author
      query = query.where('author').equals(author_id);
    }
  } else {
    // populate the Feed item's "author", but only with fields we need
    var authorFields = 'name suffix sublocation slug lat lng fb insta twit';
    query = query.populate( 'author', authorFields );
  }
  // execute & callback
  query.exec(function(err,docs){
    // everything is alright?
    if(err) {
      errorCallback(err);
    } else {
      // we got Feeds
      items = docs;
      // pass them back to the specified callback
      successCallback(items);
    }
  });
};
// save a new Tweet as a Feed item in our DB
FeedSchema.statics.saveNewTweet = function( tw, author_id, callback ) {
  // should there be error checking here?
  var tw_url = 'twitter.com/'+ tw.user.screen_name +'/status/'+ tw.id_str;
  console.log( 'saving '+ tw_url );
  /**
   * check if the tweet has associated media with it
   * and if it does, & if the first media is a "photo",
   * then store that img src https URL in our new feed item
   */
  var img = '';
  if ( tw.entities.hasOwnProperty('media') ) {
    //console.log('-- media attached --');
    //console.log(tw.entities.media);
    if ( tw.entities.media.length > 0 ) {
      if ( tw.entities.media[0].type === 'photo' ) {
        img = tw.entities.media[0].media_url_https;
      }
    }
  }
  var newfeeditem = new this({
    author: author_id,
    body: tw.text,
    date: tw.created_at,
    img: img,
    origin_id: tw.id_str,
    source: 'Twitter',
    url: 'https://'+ tw_url
  });
  // actually save to db
  newfeeditem.save(function(err) {
    if ( err ) {
      var emsg = 'Feed.saveNewTweet > save err';
      if ( err.code === 11000 ) {
        // this is the DUPLICATE KEY insert error, so eh
        //console.log(emsg +' > item with origin_id already exists : skip');
      } else {
        console.log(emsg);
        console.log(err);
      }
    }
    callback();
  });
};
// save new Instagram post(s) as a Feed item(s) in our DB
FeedSchema.statics.saveNewInstagrams = function( posts, author_id, callback ) {
  var thisFeed = this;
  if ( posts.length > 0 ) {
    var insta = posts.pop();
    // should there be error checking here?
    var iurl = insta.link;
    console.log( 'saving '+ iurl );
    /**
     * check if the tweet has associated media with it
     * and if it does, & if the first media is a "photo",
     * then store that img src https URL in our new feed item
     */
    var img = '';
    if ( insta.hasOwnProperty('images') ) {
      // more checks here?
      img = insta.images.standard_resolution.url;
    }
    var txt = '';
    if ( insta.hasOwnProperty('caption') ) {
      // more checks here? sometimes Instagram posts don't have txt
      txt = insta.caption.text;
    }
    var newfeeditem = new this({
      author: author_id,
      body: txt,
      // convert timestamp to ms?
      date: insta.created_time * 1000,
      img: img,
      origin_id: insta.id,
      source: 'Instagram',
      url: iurl
    });
    // actually save to db
    newfeeditem.save(function(err) {
      if ( err ) {
        var emsg = 'Feed.saveNewInstagrams > save err';
        if ( err.code === 11000 ) {
          // this is the DUPLICATE KEY insert error, so eh
          //console.log(emsg +' > item with origin_id already exists : skip');
        } else {
          console.log(emsg);
          console.log(err);
        }
      }
      // otherwise, we're good : successful save, no error
      if ( posts.length > 0 ) {
        // if we were passed in multiple posts, recurse
        thisFeed.saveNewInstagrams( posts, author_id, callback );
      } else {
        // post(s) have saved, go for callback
        callback();
      }
    });
  }
};
// given an origin_id, actually find & remove that Feed item
FeedSchema.statics.deleteItem = function( id, callback ) {
  this.remove({ origin_id: id }, function(err) {
    if ( err ) {
      console.log('Error in deleting Feed item with origin_id '+ id);
    } else {
      console.log('Feed item with origin_id '+ id +' has been deleted?');
    }
    callback();
  });
};
// and "compile" our model, or something
mongoose.model('Feed', FeedSchema);
