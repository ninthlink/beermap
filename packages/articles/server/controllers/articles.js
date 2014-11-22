'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  //Article = mongoose.model('Article'),
  Place = mongoose.model('Place'),
  _ = require('lodash');


/**
 * Find article by id
 *
 * heres the deal : dont know how to make a new api call just yet
 * so we're overloading article and changing based off if id is really an _id
 * or if its something else like a '(lat,lng),(lat,lng)' ...
 */
exports.article = function(req, res, next, id) {
	console.log('exports.article');
	if ( id.substr(0,1) === '(' ) {
		//console.log('overloaded :: looking for bounds');
		//console.log(id);
		var parsedok = false;
		var nelat, nelng, swlat, swlng;
		
		var commasplit = id.indexOf( '),(' );
		if ( commasplit > 0 ) {
			var comma = id.indexOf( ',' );
			if ( comma > 0 ) {
				nelat = parseFloat( id.substr( 1, comma - 1 ) ); // 33.1
				nelng = parseFloat( id.substr( comma + 2, ( commasplit - comma ) - 2 ) ); // -116
				comma = id.lastIndexOf( ',' );
				swlat = parseFloat( id.substr( commasplit + 3, ( comma - commasplit ) - 3 ) ); // 32.7
				swlng = parseFloat( id.substr( comma + 2, id.length - comma - 3 ) ); // -117
				//console.log('= |'+ nelat +'|'+ nelng +'|'+ swlat +'|'+ swlng);
				parsedok = true;
			} else {
				console.log('looking for bounds, but no inbetween comma found : '+ id);
			}
		} else {
			console.log('no commasplit to be found in '+ id);
		}
		// and return
		if ( parsedok ) {
			Place.find()
				.where('lat').lt(nelat)
				.where('lng').lt(nelng)
				.where('lat').gt(swlat)
				.where('lng').gt(swlng)
				.exec(function(err, places) {
				if (err) {
					return res.json(500, {
						error: 'Cannot list the places'
					});
				}
				res.json(places);
			});
		}
	} else {
		console.log('looking for article id '+ id);
		Place.load(id, function(err, place) {
			if (err) return next(err);
			if (!place) return next(new Error('Failed to load article place ' + id));
			// else : its ok?
			req.place = place;
			console.log(place);
			next();
		});
	}
};

/**
 * Create an article
 */
exports.create = function(req, res) {
  var place = new Place(req.body);
  //article.user = req.user;
	console.log('server : create a new Place :');
	console.log(place);
  place.save(function(err) {
    if (err) {
      return res.json(500, {
        error: 'Cannot save the place'
      });
    }
    res.json(place);

  });
};

/**
 * Update an article
 */
exports.update = function(req, res) {
  var article = req.article;

  article = _.extend(article, req.body);

  article.save(function(err) {
    if (err) {
      return res.json(500, {
        error: 'Cannot update the article'
      });
    }
    res.json(article);

  });
};

/**
 * Delete an article
 */
exports.destroy = function(req, res) {
  var article = req.article;

  article.remove(function(err) {
    if (err) {
      return res.json(500, {
        error: 'Cannot delete the article'
      });
    }
    res.json(article);

  });
};

/**
 * Show an article
 */
exports.show = function(req, res) {
	console.log('exports.show');
  res.json(req.article);
  console.log('---EXP---');
};

/**
 * List of Places
 */
exports.all = function(req, res) {
  Place.find().exec(function(err, places) {
    if (err) {
      return res.json(500, {
        error: 'Cannot list the places'
      });
    }
	//console.log('--- loaded all Places ---');
	//console.log(places);
	//console.log('----');
    res.json(places);
  });
};

/**
 * Show a Place
 */
exports.placed = function(req, res) {
  res.json(req.place);
};