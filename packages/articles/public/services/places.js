'use strict';

// Places service to match places REST endpoint
angular.module('mean.articles').factory('Places', ['$resource',
  function($resource) {
	/**
	 * one function to rule them all
	 *
	 * returns a promise for all places if articleId is not supplied,
	 * or all places within a given bounds if articleId is actually the bounds
	 * or a single place if articleId is the id (or slug?! coming soon..)
	 */
    return $resource('articles/:articleId', {
      articleId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
]);
