'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

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
  author: StringReqTrimmed,
  author_id: StringReqTrimmed,
  // main body content of the tweet / post / item / w/e
  body: StringTrimmed,
  // Date object will also need some converting for Twitter timestamp & Instagram
  // use "expires" to automatically wipe feed items after 7 days what?
  date: {
    type: Date,
    default: Date.now,
    expires: '7d'
  },
  // img, either '' or URL for instagram source or twitter attached media or what
  img: StringTrimmed,
  // original ID as provided by whatever source
  origin_id: { type: String, required: true, trim: true, unique: true },
  // source like "Twitter" or "Instagram"
  source: {
    type: String,
    default: 'Twitter',
    // list all possible feed sources here for auto validation magic?
    enum : ['Twitter', 'Instagram', 'Facebook']
  },
  // like 'https://twitter.com/'+ twobj.user.screen_name +'/status/'+ twobj.id_str
  url: StringReqTrimmed
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
 * Virtuals ?
 */

 /**
 * Statics
 *
 * are like helper functions or something, nobody knows, maybe dragons
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
/**
 * Create a static getFeed method to return feed data from the db
 * with page and skip args so we can do async paginations or something
 */
FeedSchema.statics.getFeed = function(page, skip, callback) {
  var items = [],
      start = (page * 10) + (skip * 1);
  // Query the db, using skip and limit to achieve page chunks
  // Feed.find(... ?
  this.find({},'active author body date img source source_link',{skip: start, limit: 10}).sort({date: 'desc'}).exec(function(err,docs){
    // If everything is cool...
    if(!err) {
      items = docs;  // We got tweets
      items.forEach(function(tweet){
        items.active = true; // Set them to active
      });
    }
    // Pass them back to the specified callback
    callback(items);
  });
};
/**
 * save a new Tweet as a Feed in our DB ?rs
 */
FeedSchema.statics.saveNewTweet = function( twobj, callback ) {
  // should there be error checking here?
  var tw_url = 'https://twitter.com/'+ twobj.user.screen_name +'/status/'+ twobj.id_str;
  console.log( 'saving new tweet '+ tw_url );
  //console.log(twobj);
  /**
   * check if the tweet has associated media with it
   * and if it does, & if the first media is a "photo",
   * then store that img src https URL in our new feed item
   */
  var img = '';
  if ( twobj.entities.hasOwnProperty('media') ) {
    //console.log('-- media attached --');
    //console.log(twobj.entities.media);
    if ( twobj.entities.media.length > 0 ) {
      if ( twobj.entities.media[0].type === 'photo' ) {
        img = twobj.entities.media[0].media_url_https;
      }
    }
  }
  /**
   * only save screen_name, don't care about name = display_name = full_name
   */ 
  var newfeeditem = new this({
    author: twobj.user.screen_name,
    author_id: twobj.user.id_str,
    body: twobj.text,
    date: twobj.created_at,
    img: img,
    origin_id: twobj.id_str,
    source: 'Twitter',
    url: tw_url
  });
  // actually save to db?
  newfeeditem.save(function(err) {
    if ( err ) {
      var emsg = 'Feed.saveNewTweet > save err';
      if ( err.code === 11000 ) {
        // this is the DUPLICATE KEY insert error, so eh
        console.log(emsg +' > item with origin_id already exists : skip');
      } else {
        console.log(emsg);
        console.log(err);
      }
    }
    callback();
  });
};
/**
 * given an origin_id, find and remove that tweet?
 */
FeedSchema.statics.deleteItem = function( og_id, callback ) {
  this.remove({ origin_id: og_id }, function(err) {
    if ( err ) {
      console.log('Error in deleting Feed item with origin_id '+ og_id);
    } else {
      console.log('Feed item with origin_id '+ og_id +' has been deleted?');
    }
    callback();
  });
};
// and "compile" our model, or something
mongoose.model('Feed', FeedSchema);
