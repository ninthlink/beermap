'use strict';

// Places service to match places REST endpoint
angular.module('mean.articles').factory('PlacesFromSpreadsheet', ['$resource',
  function($resource) {
    return $resource('https://spreadsheets.google.com/feeds/list/18pJ3xrkGaOZR814lty1kfsKckUM3lzyx-8MvZ-FAMBM/od6/public/values?alt=json');
  }
]);
