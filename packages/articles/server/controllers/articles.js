'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Article = mongoose.model('Article'),
  Place = mongoose.model('Place'),
  _ = require('lodash');


/**
 * Find article by id
 */
exports.article = function(req, res, next, id) {
	console.log('exports.article');
	
  Place.load(id, function(err, place) {
    if (err) return next(err);
    if (!place) return next(new Error('Failed to load article place ' + id));
	// else : its ok?
    req.place = place;
	console.log(place);
    next();
  });
};

/**
 * Create an article
 */
exports.create = function(req, res) {
  var article = new Article(req.body);
  article.user = req.user;

  article.save(function(err) {
    if (err) {
      return res.json(500, {
        error: 'Cannot save the article'
      });
    }
    res.json(article);

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
	console.log('--- loaded all Places ---');
	console.log(places);
	console.log('----');
    res.json(places);
  });
};

/**
 * Show a Place
 */
exports.placed = function(req, res) {
  res.json(req.place);
};