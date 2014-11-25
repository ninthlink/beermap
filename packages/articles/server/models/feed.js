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
  // reference to the User/Place that posted whatever item
  author: {
    // save some source user info here in case we can't match the author field above too
    id: StringReqTrimmed,
    name: StringReqTrimmed,
    screen_name: StringReqTrimmed
  },
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
    from: {
      type: String,
      default: 'Twitter',
      // list all possible feed sources here for auto validation magic?
      enum : ['Twitter', 'Instagram', 'Facebook']
    },
    // like 'https://twitter.com/'+ twobj.user.screen_name +'/status/'+ twobj.id_str
    url: StringReqTrimmed
  }
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
FeedSchema.statics.load = function(id, cb) {
  this.findOne({
    _id: id
  })
  // could also add 2nd parameter like 'name _id' to return just specific fields
  .populate('author')
  // and send it back
  .exec(cb);
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
// and "compile" our model, or something
mongoose.model('Feed', FeedSchema);
