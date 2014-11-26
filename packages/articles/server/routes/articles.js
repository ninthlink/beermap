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
  app.get('/articles', articles.all);
  //.post(auth.requiresLogin, articles.create);
  app.get('/articles/:articleId', articles.placed);
  app.put('/articles/:id', articles.updatePlace);
  //.delete(auth.requiresLogin, hasAuthorization, articles.destroy);

  // Finish with setting up the articleId param
  app.param('articleId', articles.article);
};
