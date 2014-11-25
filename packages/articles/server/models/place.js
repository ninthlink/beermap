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
var StringLowerTrimmed = { type: String, trim: true, lowercase: true };
var BoolFalse = { type: Boolean, default: false };
/**
 * Place Schema
 */
var PlaceSchema = new Schema({
  // name, like "Alpine"
  name: { type: String, required: true, trim: true },
  // suffix, like "Beer Company"
  suffix: StringTrimmed,
  // sublocation, like "Tasting Room"
  sublocation: StringTrimmed,
  // not sure if this could be defaulting to other values
  // like (name +' '+ sublocation).toLowerCase.replace(spaces with -)
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
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
    name: StringLowerTrimmed,
    user_id: StringTrimmed,
    img: StringTrimmed
  },
  insta: {
    name: StringLowerTrimmed,
    user_id: StringTrimmed,
    place_id: StringTrimmed
  },
  fb: {
    url: StringTrimmed,
    page_id: StringTrimmed,
    place_id: StringTrimmed
  },
  // and then?
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
 * see http://blog.mongodb.org/post/87892923503/6-rules-of-thumb-for-mongodb-schema-design-part-2
 * for storing array of max length and such
 */

/**
 * Validations?
 *
ArticleSchema.path('title').validate(function(title) {
  return !!title;
}, 'Title cannot be blank');

ArticleSchema.path('content').validate(function(content) {
  return !!content;
}, 'Content cannot be blank');

/**
 * Virtuals
 *
 * are like helpers for doing some shortcuts / combinings
 * the first couple are more specifically for specific naming conventions gmap requires
 */
// map place.coords = { latitude, longitude }
PlaceSchema.virtual( 'latitude' ).get(function() {
	return this.lat;
});
PlaceSchema.virtual( 'longitude' ).get(function() {
	return this.lng;
});
PlaceSchema.virtual( 'coords' ).get(function() {
	return {
		latitude: this.lat,
		longitude: this.lng
	};
});
// combine "City, State Zip"
PlaceSchema.virtual( 'CSZ' ).get(function() {
	return this.city +', '+ this.city +' '+ this.zip;
});
// get full address in 1 line, for kicks
PlaceSchema.virtual( 'fullAddr' ).get(function() {
	return this.addr +', '+ this.CSZ;
});
// fullName returns name ("Alpine") + suffix ("Beer Co")
PlaceSchema.virtual( 'fullName' ).get(function() {
	return this.name + ( this.suffix !== '' ? (' ' + this.suffix ) : '' );
});
/**
 * Statics
 *
 * are like helper functions or something, nobody knows, maybe dragons
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
// and "compile" our model, or something
mongoose.model('Place', PlaceSchema);
