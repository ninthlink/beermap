<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <title>Beer</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <style type="text/css">
  #bmap { height: 500px }
  </style>
<script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCUwl6lVEzZGsbFp8-QKu3FYwFcOEPgUo4"></script>
</head>

<body>
<div id="bmap"></div>
<h1>loading</h1>
<p><em>feeding data dynamically from <a href="https://docs.google.com/spreadsheets/d/18pJ3xrkGaOZR814lty1kfsKckUM3lzyx-8MvZ-FAMBM/edit?usp=sharing" target="_blank">https://docs.google.com/spreadsheets/d/18pJ3xrkGaOZR814lty1kfsKckUM3lzyx-8MvZ-FAMBM/edit?usp=sharing</a></em></p>
<p><a href="craftmap.php">View 4square API test Craft Map</a></p>
<script src="http://code.jquery.com/jquery.js"></script>
<script type="text/javascript">
var places = new Array(), bmap;
function bmap_init() {
var mapOpts = {
	center: new google.maps.LatLng(32.826141, -116.764516),
	zoom: 10
};
bmap = new google.maps.Map(document.getElementById('bmap'), mapOpts);
var h1 = $('h1');
h1.html('loading...');
$.getJSON( "https://spreadsheets.google.com/feeds/list/18pJ3xrkGaOZR814lty1kfsKckUM3lzyx-8MvZ-FAMBM/1/public/basic?alt=json-in-script&callback=?",
	function(data) {
	h1.html('breweries');
	var ol = $('<ol />').insertAfter(h1);
	var baddr = 0;
	$.each(data.feed.entry, function( key, value ) {
	var spot = {
		name: value.title["$t"],
		info: value.content["$t"]
	};
	// fullad
	if ( spot.info.substr(0,6) == 'fullad' ) {
	// something wrong here
	baddr++;
	} else {
	var lngat = spot.info.lastIndexOf(', lng:');
	var latat = spot.info.indexOf(', lat:');
	spot.lat = spot.info.substr( latat + 7, lngat - latat - 7 );
	spot.lng = spot.info.substr( lngat + 7 );
	var cityat = spot.info.indexOf(', city:');
	spot.addr = spot.info.substr( 15, cityat - 15 );
	var stateat = spot.info.indexOf(', state:');
	spot.city = spot.info.substr( cityat + 8, stateat - cityat - 8 );
	var zipat = spot.info.indexOf(', zip:');
	spot.zip = spot.info.substr( zipat + 7, 5 );
	var webat = spot.info.indexOf(', website:');
	var fullat = spot.info.indexOf(', fulladdress:');
	spot.www = spot.info.substr( webat + 11, fullat - webat - 11 );
	spot.full = spot.info.substr( fullat + 15, latat - fullat - 15 );
	var phoneat = spot.info.indexOf(', phone:');
	spot.phone = spot.info.substr( phoneat + 9, webat - phoneat - 9 );
	spot.qaddr = spot.addr.split(' ').join('+') +'+'+ spot.zip;
	var oot = '<li><strong title="'+ spot.lat +', '+ spot.lng +'">'+ spot.name +'</strong> <a href="https://www.google.com/maps?q='+ spot.qaddr +'" target="_blank">'+ spot.full +'</a>';
	if ( phoneat > 0 ) {
		oot += ' <a href="tel:'+ spot.phone +'">'+ spot.phone +'</a>';
	}
	oot += ' <a href="'+ spot.www +'" target="_blank">'+ spot.www +'</a><!-- '+ spot.info +' --></li>';
	ol.append(oot);
	spot.latlng = new google.maps.LatLng(spot.lat, spot.lng);
	spot.marker = new google.maps.Marker({
		position: spot.latlng,
		map: bmap
	});
	places.push(spot);
	}
	});
	if ( baddr > 0 ) {
	ol.after('<p>... and '+ baddr +' more with missing address info?</p>');
	}
	});
}
google.maps.event.addDomListener(window, 'load', bmap_init);
</script>
</body>
</html>
