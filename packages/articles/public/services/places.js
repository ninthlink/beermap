'use strict';

// Places service to match places REST endpoint
angular.module('mean.articles').factory('Places', ['$resource',
  function($resource) {
    return $resource('articles/:articleId', {
      articleId: '@_id'
    }/*, {
      update: {
        method: 'PUT'
      }
    }
	  */
	);
  }
]);
