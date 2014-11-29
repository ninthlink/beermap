/*jshint plusplus:true*/
'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  //Article = mongoose.model('Article'),
  Place = mongoose.model('Place'),
  Feed = mongoose.model('Feed'),
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
					return res.status(500).json({
						error: 'Cannot list the places'
					});
				}
				res.json(places);
			});
		}
	} else {
		if ( id === 'findbad' ) {
			Place.find()
				.exec(function(err, places) {
				if (err) {
					return res.status(500).json({
						error: 'Cannot list the places'
					});
				}
				res.json(places);
			});
		} else {
			//console.log('looking for article id '+ id +' ( length '+ id.length +' )');
			Place.load(id, function(err, place) {
				if (err) return next(err);
				if (!place) return next(new Error('Failed to load article place ' + id));
				// else : its ok?
				req.place = place;
				//console.log(place);
				next();
			});
		}
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
      return res.status(500).json({
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
      return res.status(500).json({
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
      return res.status(500).json({
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
      return res.status(500).json({
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
 * full Feed list from the db?!
 * right now this just loads the first chunk, and we have no pagination yet
 */
exports.loadFeed = function(req, res) {
  //console.log('GET /feed ( articles.getFeed )');
  //console.log(req.params);
  
  var id = '',
      p = 0,
      s = 0;
  
  if ( req.params.hasOwnProperty('id') ) {
    id = req.params.id;
    if ( id === 'all' ) {
      id = '';
    }
  }
  if ( req.params.hasOwnProperty('page') ) {
    p = parseInt( req.params.page, 10 );
  }
  if ( req.params.hasOwnProperty('skip') ) {
    s = parseInt( req.params.skip, 10 );
  }
  
  //console.log('fullFeed : getFeed /'+ id +'/'+ p +'/'+ s );
  Feed.getFeed(id, p, s, function(err) {
    return res.status(500).json({
      error: 'Cannot list Feed items'
    });
  }, function( items ) {
    if ( id !== '' ) {
      // in this case, we are returning items for a specific Place author already
      var c = items.length;
      while( c-- ) {
        // so we shouldn't need to pass the author sub document back with each..
        items[c].author = undefined;
      }
    }
    // and return
    res.json(items);
  });
};

/**
 * Show a single Place
 */
exports.placed = function(req, res) {
	console.log('GET /articles/:id ' );
	console.log(req.params);
	res.json(req.place);
};

/**
 * Update a Place
 */
exports.updatePlace = function(req, res) {
	var pid = req.params.id;
	console.log( 'check it : PUT /places/:id = updatePlace '+ pid );
	return Place.load( pid, function(err, place) {
		console.log( 'updatePlace > load finished, now save?' );
		if ( !place ) {
			res.statusCode = 404;
			return res.send({ error: 'Not found' });
		}
		// otherwise, should be ok to continue
		place = _.extend(place, req.body);
		/*
		console.log('updating to..');
		console.log(place);
		*/
		place.save(function(err) {
			if ( err ) {
				console.log( 'Internal error(%d): %s', res.statusCode, err.message);
				res.statusCode = 500;
				return res.send( { error: 'some kind of error' } );
			} else {
				console.log('place saved!');
				return res.send({ status: 'OK', place: place });
			}
		});
	});
};