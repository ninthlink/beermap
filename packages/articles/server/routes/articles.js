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
 * map functions from articles/server/controllers to specific endpoints
 */
module.exports = function(Articles, app, auth) {
  // GET list of all Places
  app.get('/articles', articles.all);
  // GET details on a single Place
  app.get('/articles/:articleId', articles.placed);
  // UPDATE info for a single Place, via PUT
  app.put('/articles/:id', articles.updatePlace);
  // GET chunk(s) of most recent Feed items
  app.get('/feed', articles.loadFeed);
  // passing ID returns items for that particular Place
  app.get('/feed/:id', articles.loadFeed);
  // Feed pagination?
  app.get('/feed/:id/:page/:skip', articles.loadFeed);
  // POST to send mail via nodemailer?
  app.post('/contact', articles.contact);
  /*
  // other things we don't use right now but may want at some point..
  .post(auth.requiresLogin, articles.create);
  .delete(auth.requiresLogin, hasAuthorization, articles.destroy);
  */
  // Finish with setting up the articleId param
  app.param('articleId', articles.article);
};
