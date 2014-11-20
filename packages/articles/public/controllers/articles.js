'use strict';

angular.module('mean.articles').controller('ArticlesController', ['$scope', '$stateParams', '$location', 'Global', 'Articles', 'Places', 'PlacesFromSpreadsheet',
  function($scope, $stateParams, $location, Global, Articles, Places, PlacesFromSpreadsheet, uiGmapGoogleMapApi) {
    $scope.global = Global;

    $scope.hasAuthorization = function(article) {
      if (!article || !article.user) return false;
      return $scope.global.isAdmin || article.user._id === $scope.global.user._id;
    };

    $scope.create = function(isValid) {
      if (isValid) {
        var article = new Articles({
          title: this.title,
          content: this.content
        });
        article.$save(function(response) {
          $location.path('articles/' + response._id);
        });

        this.title = '';
        this.content = '';
      } else {
        $scope.submitted = true;
      }
    };

    $scope.remove = function(article) {
      if (article) {
        article.$remove(function(response) {
          for (var i in $scope.articles) {
            if ($scope.articles[i] === article) {
              $scope.articles.splice(i, 1);
            }
          }
          $location.path('articles');
        });
      } else {
        $scope.article.$remove(function(response) {
          $location.path('articles');
        });
      }
    };

    $scope.update = function(isValid) {
      if (isValid) {
        var article = $scope.article;
        if (!article.updated) {
          article.updated = [];
        }
        article.updated.push(new Date().getTime());

        article.$update(function() {
          $location.path('articles/' + article._id);
        });
      } else {
        $scope.submitted = true;
      }
    };

    $scope.find = function() {
		$scope.map = { center: { latitude: 45, longitude: -73 }, zoom: 8 };
      Articles.query(function(articles) {
        $scope.articles = articles;
      });
    };
	
    $scope.mainmap = function() {
		$scope.map = {center: {latitude: 32.95, longitude: -117 }, zoom: 10, control: {}, markerControl: {} };
		$scope.options = {};//scrollwheel: false};
		$scope.coordsUpdates = 0;
		$scope.dynamicMoveCtr = 0;
		//	Map Styles : not sure how to inject otherwise..
		$scope.styles = [{'featureType':'water','elementType':'all','stylers':[{'hue':'#e9ebed'},{'saturation':-78},{'lightness':67},{'visibility':'simplified'}]},{'featureType':'landscape','elementType':'all','stylers':[{'hue':'#ffffff'},{'saturation':-100},{'lightness':100},{'visibility':'simplified'}]},{'featureType':'road','elementType':'geometry','stylers':[{'hue':'#bbc0c4'},{'saturation':-93},{'lightness':31},{'visibility':'simplified'}]},{'featureType':'poi','elementType':'all','stylers':[{'hue':'#ffffff'},{'saturation':-100},{'lightness':100},{'visibility':'off'}]},{'featureType':'road.local','elementType':'geometry','stylers':[{'hue':'#e9ebed'},{'saturation':-90},{'lightness':-8},{'visibility':'simplified'}]},{'featureType':'transit','elementType':'all','stylers':[{'hue':'#e9ebed'},{'saturation':10},{'lightness':69},{'visibility':'on'}]},{'featureType':'administrative.locality','elementType':'all','stylers':[{'hue':'#2c2e33'},{'saturation':7},{'lightness':19},{'visibility':'on'}]},{'featureType':'road','elementType':'labels','stylers':[{'hue':'#bbc0c4'},{'saturation':-93},{'lightness':31},{'visibility':'on'}]},{'featureType':'road.arterial','elementType':'labels','stylers':[{'hue':'#bbc0c4'},{'saturation':-93},{'lightness':-2},{'visibility':'simplified'}]}];
		
		$scope.markers = [];
		Places.query(function(places) {
			console.log('queried Places : got :');
			console.log(places);
			angular.forEach(places, function( marker, k ) {
				marker.coords = {
					latitude: marker.latitude,
					longitude: marker.longitude
				};
				marker.id = k;
				$scope.markers.push(marker);
			});
			console.log('-- markers : ');
			console.log($scope.markers);
		});
		/*
		// load places from google spreadsheet & translate to json array for mongo inserting?!
		PlacesFromSpreadsheet.get(function(placespreadsheet) {
			console.log('places loaded into front end?!');
			console.log(placespreadsheet);
			var docArray = [];
			angular.forEach( placespreadsheet.feed.entry, function( row ) {
				// map row data to new Places object fields?!
				var doc = new Places({
					addr: row['gsx$addr']['$t'],
					city: row['gsx$city']['$t'],
					dogs: row['gsx$dogs']['$t'],
					facebook_location_id: row['gsx$facebooklocationid']['$t'],
					facebook_page_id: row['gsx$facebookpageid']['$t'],
					facebook_url: row['gsx$facebookurl']['$t'],
					fams: row['gsx$fams']['$t'],
					foods: row['gsx$foods']['$t'],
					growlers: row['gsx$growlers']['$t'],
					instagram_location_id: row['gsx$instagramlocationid']['$t'],
					instagram_user_id: row['gsx$instagramuserid']['$t'],
					instagram_user_name: row['gsx$instagramusername']['$t'],
					latitude: row['gsx$latitude']['$t'],
					longitude: row['gsx$longitude']['$t'],
					name: row['gsx$name']['$t'],
					phone: row['gsx$phone']['$t'],
					slug: row['gsx$slug']['$t'],
					state: row['gsx$state']['$t'],
					sublocation: row['gsx$sublocation']['$t'],
					suffix: row['gsx$suffix']['$t'],
					trucks: row['gsx$trucks']['$t'],
					twitter_user_id: row['gsx$twitteruserid']['$t'],
					twitter_user_img: row['gsx$twitteruserimg']['$t'],
					twitter_user_name: row['gsx$twitterusername']['$t'],
					www: row['gsx$www']['$t'],
					zip: row['gsx$zip']['$t'],
				});
				docArray.push(doc);
			});
			$scope.docArray = docArray;
		});
		*/
    };
	
    $scope.findOne = function() {
      Articles.get({
        articleId: $stateParams.articleId
      }, function(article) {
        $scope.article = article;
      });
    };
  }
]);
