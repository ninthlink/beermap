<?php

/**
 * Brewery Map - Google Maps API
 *
 * Author: Tim Spinks
 * Version: 0.1
 *
 * FourSquare API - staff@ninthlink.com
 *
 */

define('__ROOT__', dirname(__FILE__));

require_once(__ROOT__.'/class.foursquare.php');

function request_query_string( $var, $val = false ) {
	if ( isset($_GET[$var]) && !empty($_GET[$var]) )
		$val = $_GET[$var];
	if ( isset($_POST[$var]) && !empty($_POST[$var]) )
		$val = $_POST[$var];
	return urlencode($val);
}

function is_time_dif( $then, $now, $result = false, $dif = 172800 ) {
	$dif = $now - $then;
	if ( $result )
		return $dif;
	if ( $dif > $dif )
		return true;
	return false;
}



// FourSquare API stuff
$forceNewCall = request_query_string('force_new');

$then = 0;
$now = time();

$jsonFile = __ROOT__ . "/4square.txt";

if ( $json = file_get_contents($jsonFile) ) {
	
	$array = json_decode($json, true);

	if ( array_key_exists('lastUpdated', $array) ) {

		$then = $array['lastUpdated'];
	}
}
/*
if ( is_time_dif( $then, $now ) || $forceNewCall ) {

	$breweries = new four_square_call_api;

	$breweriesJson = json_encode($breweries);

	$json = $breweriesJson;
}
*/




?>
<!DOCTYPE html>
<html>

<head>

	<meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
	<link rel="stylesheet" type="text/css" href="craftmap.css">
	<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
	<script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=places"></script>
	<script type="text/javascript">

		// default place holder vars
		var map;
		var infoWindow;
		var userLocation;

		var sanDiego = new google.maps.LatLng(32.7150, -117.1625); // san diego

		// marker icon
		var breweryIcon = '//www.iconsdb.com/icons/preview/green/hops-s.png';

		// 4-square API results
		var breweries = <?php print $json; ?>;

		// boundry obj
		var bounds = new google.maps.LatLngBounds();

		// do google maps api
		function initialize() {

			// array of map styles
			var styles = [
			  {
			    "featureType": "water",
			    "stylers": [
			      { "color": "#000000" }
			    ]
			  },{
			    "featureType": "road.highway",
			    "elementType": "geometry",
			    "stylers": [
			      { "color": "#2c2c2c" },
			      { "visibility": "simplified" }
			    ]
			  },{
			    "featureType": "road.arterial",
			    "elementType": "geometry",
			    "stylers": [
			      { "color": "#555555" }
			    ]
			  },{
			    "featureType": "road.local",
			    "elementType": "geometry",
			    "stylers": [
			      { "color": "#777777" }
			    ]
			  },{
			    "featureType": "poi",
			    "stylers": [
			      { "visibility": "off" }
			    ]
			  },{
			    "featureType": "landscape.man_made",
			    "elementType": "geometry",
			    "stylers": [
			      { "color": "#111111" }
			    ]
			  },{
			    "featureType": "landscape.natural",
			    "stylers": [
			      { "color": "#111111" }
			    ]
			  },{
			    "featureType": "road.highway",
			    "elementType": "labels.text",
			    "stylers": [
			      { "visibility": "off" }
			    ]
			  },{
			    "featureType": "road",
			    "elementType": "labels.text.fill",
			    "stylers": [
			      { "color": "#ffffff" }
			    ]
			  },{
			    "featureType": "road.highway",
			    "elementType": "labels.text.fill",
			    "stylers": [
			      { "visibility": "on" },
			      { "color": "#aaaaaa" }
			    ]
			  },{
			    "featureType": "road.arterial",
			    "elementType": "labels.text.fill",
			    "stylers": [
			      { "color": "#aaaaaa" }
			    ]
			  },{
			    "featureType": "road.local",
			    "elementType": "labels.text.fill",
			    "stylers": [
			      { "color": "#aaaaaa" },
			      { "visibility": "on" }
			    ]
			  },{
			    "featureType": "road.arterial",
			    "elementType": "labels.text.stroke",
			    "stylers": [
			      { "visibility": "off" }
			    ]
			  },{
			    "featureType": "administrative",
			    "elementType": "labels",
			    "stylers": [
			      { "visibility": "off" }
			    ]
			  },{
			    "featureType": "road.arterial",
			    "elementType": "labels.text.stroke",
			    "stylers": [
			      { "visibility": "on" },
			      { "color": "#000000" }
			    ]
			  },{
			    "featureType": "road.local",
			    "elementType": "labels.text",
			    "stylers": [
			      { "color": "#000000" }
			    ]
			  },{
			    "featureType": "road.local",
			    "elementType": "labels.text.fill",
			    "stylers": [
			      { "color": "#aaaaaa" }
			    ]
			  },{
			    "featureType": "road.local",
			    "elementType": "geometry",
			    "stylers": [
			      { "color": "#000000" }
			    ]
			  },{
			    "featureType": "road.arterial",
			    "elementType": "geometry",
			    "stylers": [
			      { "color": "#000000" }
			    ]
			  },{
			    "featureType": "road.highway",
			    "elementType": "geometry",
			    "stylers": [
			      { "color": "#000000" }
			    ]
			  },{
			    "featureType": "road",
			    "elementType": "labels",
			    "stylers": [
			      { "visibility": "off" }
			    ]
			  },{
			    "featureType": "landscape",
			    "elementType": "geometry",
			    "stylers": [
			      { "color": "#333333" }
			    ]
			  },{
			    "featureType": "transit",
			    "elementType": "labels",
			    "stylers": [
			      { "visibility": "off" }
			    ]
			  },{
			    "featureType": "transit",
			    "elementType": "geometry",
			    "stylers": [
			      { "color": "#222222" }
			    ]
			  },{
			    "featureType": "administrative.country",
			    "elementType": "geometry",
			    "stylers": [
			      { "visibility": "on" },
			      { "color": "#444444" }
			    ]
			  },{
			    "featureType": "administrative",
			    "elementType": "geometry.fill",
			    "stylers": [
			      { "visibility": "simplified" },
			      { "color": "#333333" }
			    ]
			  },{
			  }
			];
			// Create a new StyledMapType object, passing it the array of styles,
			// as well as the name to be displayed on the map type control.
			var styledMap = new google.maps.StyledMapType(styles,
				{name: "San Diego Craft Beer Map"}
			);


			// map center
			var center = new google.maps.LatLng(32.924268, -117.126724); // mira mesa //new google.maps.LatLng(32.7150, -117.1625); // san diego

			// map options
			var mapOptions = {
				zoom: 11,
				center: center,
				disableDefaultUI: true,
				zoomControl: true,
				zoomControlOptions: {
					style: 'SMALL'
				},
				mapTypeControlOptions: {
					mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
				}
			};

			// create map object
			map = new google.maps.Map(document.getElementById('map-canvas'),
				mapOptions
			);

			// create pop-up window
			infowindow = new google.maps.InfoWindow();

			//Associate the styled map with the MapTypeId and set it to display.
			map.mapTypes.set('map_style', styledMap);
			map.setMapTypeId('map_style');

			console.log(breweries);

			for ( var key in breweries.venues ) {
				var breweryObj = breweries.venues[key];
				createBreweryMarker( breweryObj );
			};

			// GeoLocation - Sensor - Try W3C Geolocation (Preferred)
			if(navigator.geolocation) {
				browserSupportFlag = true;
				navigator.geolocation.getCurrentPosition(function(position) {
					userLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
					//map.setCenter(userLocation); // no need to center map, we are using bounds to start
					var userMarker = new google.maps.Marker({
						map: map,
						position: userLocation
					});
				}, function() {
					handleNoGeolocation(browserSupportFlag);
				});
			}
			// Browser doesn't support Geolocation
			else {
				browserSupportFlag = false;
				handleNoGeolocation(browserSupportFlag);
			}
			function handleNoGeolocation(errorFlag) {
				if (errorFlag == true) {
					userLocation = sanDiego;
				} else {
					userLocation = center;
				}
				//map.setCenter(userLocation); // no need to center map, we are using bounds to start
				var userMarker = new google.maps.Marker({
					map: map,
					position: userLocation
				});
			}

			// center and fit map to boundry
			map.fitBounds(bounds);
		}

		function createBreweryMarker(brewery) {
			// brewery location
			var breweryLatLng = new google.maps.LatLng( brewery.location.lat , brewery.location.lng );
			// set boundries
			bounds.extend(breweryLatLng);
			// marker options
			var marker = new google.maps.Marker({
				map: map,
				position: breweryLatLng,
				icon: breweryIcon
			});

			// on marker click...
			google.maps.event.addListener(marker, 'click', function() {
				// set infoWindow content
				infowindow.setContent(brewery.name);
				// open infoWindow
				//infowindow.open(map, this);
				var newBreweryDOM = '<h2>'+brewery.name+'</h2>'+
					'<address>'+brewery.location.address+'<br />'+brewery.location.city+', '+brewery.location.state+' '+brewery.location.postalCode+'</address>'+
					(brewery.url ? '<website><a href="'+brewery.url+'">'+brewery.url+'</a></website>' : '')+
					'<img src="'+brewery.photos.items[0].prefix+'original'+brewery.photos.items[0].suffix+'" style="width:100%;" />'+
					'<textarea cols="60" rows="10">'+JSON.stringify(brewery)+'</textarea>';

				jQuery('#brewery-data section#brewery-details').html(newBreweryDOM);
			});
		}


		google.maps.event.addDomListener(window, 'load', initialize);
	</script>

</head>

<body>

	<div id="map-canvas" ></div>

	<div id="brewery-data" >

		<section>
			<h1>Beer Map</h1>
		</section>

		<section id="brewery-details"></section>

	</div>

</body>
</html>