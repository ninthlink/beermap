'use strict';

var articles = require('../controllers/articles');
/*
// Article authorization helpers
var hasAuthorization = function(req, res, next) {
  if (!req.user.isAdmin && req.article.user.id !== req.user.id) {
    return res.send(401, 'User is not authorized');
  }
  next();
};
*
/**
 * map our functions from the articles server controller to specific endpoints
 */
module.exports = function(Articles, app, auth) {
  // API to GET list of all Places
  app.get('/articles', articles.all);
  // API to GET details on a single Place
  app.get('/articles/:articleId', articles.placed);
  // API to Update info for a single Place, via PUT
  app.put('/articles/:id', articles.updatePlace);
  // API to GET the first chunk of most recent Feed items
  app.get('/feed', articles.loadFeed);
  app.get('/feed/:id', articles.loadFeed);
  app.get('/feed/:id/:page/:skip', articles.loadFeed);
  /*
  // other things we don't use right now but may want at some point..
  .post(auth.requiresLogin, articles.create);
  .delete(auth.requiresLogin, hasAuthorization, articles.destroy);
  */
  // Finish with setting up the articleId param
  app.param('articleId', articles.article);
};
