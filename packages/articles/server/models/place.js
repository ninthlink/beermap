'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

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
  suffix: {
    type: String,
    trim: true
  },
  // sublocation, like "Tasting Room"
  sublocation: {
    type: String,
    trim: true
  },
  // not sure if this could be defaulting to other values
  // like (name +' '+ sublocation).toLowerCase.replace(spaces with -)
  slug: {
	type: String,
	required: true,
	trim: true
  },
  // some Booleans for checkboxes of amenities
  // growler fills
  growlers: {
	type: Boolean,
	default: false
  },
  // family friendly
  fams: {
	type: Boolean,
	default: false
  },
  // dog friendly
  dogs: {
	type: Boolean,
	default: false
  },
  // food trucks
  trucks: {
	type: Boolean,
	default: false
  },
  // food service
  foods: {
	type: Boolean,
	default: false
  },
  // addr = Address 1 & 2 if its there since who cares
  addr: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  zip: {
    type: String,
    trim: true
  },
  // does phone number need a set / validator to handle formatting?!
  phone: {
    type: String,
    trim: true
  },
  // does www need a set / validator to store
  // without any "http://www." at the front & / at the end?
  www: {
    type: String,
    trim: true
  },
  // latitude & longitude
  // get converted in 'coords" object Virtual
  lat: {
    type: Number,
    trim: true
  },
  lng: {
    type: Number,
    trim: true
  },
  // social media links & IDs & such...
  twitter_user_name: {
    type: String,
    trim: true
  },
  twitter_user_id: {
    type: String,
    trim: true
  },
  twitter_user_img: {
    type: String,
    trim: true
  },
  instagram_user_name: {
    type: String,
    trim: true
  },
  instagram_user_id: {
    type: String,
    trim: true
  },
  instagram_brewloc_id: {
    type: String,
    trim: true
  },
  facebook_url: {
    type: String,
    trim: true
  },
  facebook_page_id: {
    type: String,
    trim: true
  },
  facebook_brewloc_id: {
    type: String,
    trim: true
  },
  // and then?
});

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
 */
// for mapping place.coords = { latitude, longitude }
PlaceSchema.virtual( 'coords' ).get(function() {
	return {
		latitude: this.lat,
		longitude: this.lng
	};
});
// "City, State Zip"
PlaceSchema.virtual( 'CSZ' ).get(function() {
	return this.city +', '+ this.city +' '+ this.zip;
});
// get full address in 1 line
PlaceSchema.virtual( 'fullAddr' ).get(function() {
	return this.addr +', '+ this.CSZ;
});
// store a couple versions of fullName combined for easier things?
PlaceSchema.virtual( 'fullName' ).get(function() {
	return this.name + ( this.sublocation !== '' ? (' <small>' + this.sublocation + '</small>') : '' );
});
/**
 * Statics
 */
// findOne Place given an id & execute callback
PlaceSchema.statics.load = function(id, cb) {
  this.findOne({
    _id: id
  })
  //.populate('user', 'name username').exec(cb);
  .exec(cb);
};
// findOne Place given a slug & execute callback?
PlaceSchema.statics.findBySlug = function(slug, cb) {
  this.findOne({
    slug: slug //new RegExp( slug, 'i' )
  })
  //.populate('user', 'name username').exec(cb);
  .exec(cb);
};

// compile our model
mongoose.model('Place', PlaceSchema);
