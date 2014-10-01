<?php

/*	FOURSQUARE API CALL (fourSquare.class.php)
 *
 *	Retrieves Brewery venues along with hours, menus, and photos
 *
 *	Author: Tim Spinks
 */
class four_square_call_api {

	private $fourSquareUrl = 'https://api.foursquare.com/v2/venues';

	private $clientId = 'GDHWSNSJDTPTKQ4AIW0STTIIT24SORPVVUJXM22VYVKIEYUB';
	private $clientSecret = 'BOXYRVT0J13Q3OKRXMZEWCOFF2AP1QA1CVIWZF3RATIKTDXD';
	private $clientV = '20130815';

	private $breweryCategory = '50327c8591d4c4b30a586d5d'; // default search category - Breweries
	private $breweryNear = 'San Diego, CA'; // default search near
	private $breweryRadius = '34000'; // default radius in meters

	public $lastUpdated = null;

	public $venues = array();

	/*	*	*	*	*	*
	 *	API URL Methods
	 *
	 *	Available methods: search, hours, menu, photos
	 *
	 */
	public function get_api_url( $method, $id = null ) {

		$url = $this->fourSquareUrl;

		switch( $method ) {
			case 'hours' :
				$url .= '/' . $id . '/hours';
				break;
			case 'menu' :
				$url .= '/' . $id . '/menu';
				break;
			case 'photos' :
				$url .= '/' . $id . '/photos';
				break;
			case 'search' :
			default :
				$url .= '/search';
				break;
		}

		$url .= '?client_id=' . $this->clientId . '&client_secret=' . $this->clientSecret . '&v=' . $this->clientV;

		return $url;
	}

	/*	*	*	*	*	*
	 *	Search Venues
	 *
	 */
	public function search_venues( $near, $radius, $category, $limit = 200, $as_array = true ) {		
		$url = $this->get_api_url( 'search' );
		$url .= '&near=' . urlencode($near) . '&radius=' . $radius . '&categoryId=' . $category . '&limit=' . $limit . '&intent=browse';
		if ( $json = file_get_contents( $url ) ) {
			$result_array = json_decode($json, true);
			if ( $result_array['meta']['code'] == '200' ) {	
				if ( $as_array )
					return $result_array['response']['venues'];
				else
					return json_encode($result_array['response']['venues']);
			}
			else {
				return $result_array;
			}
		}
		return false;
	}

	/*	*	*	*	*	*
	 *	Get Venue Aspect by Type and Venue ID
	 *
	 */
	public function get_aspect( $aspect, $id, $as_array = true ) {
		
		$url = $this->get_api_url( $aspect, $id );

		if ( $json = file_get_contents( $url ) ) {
			$result_array = json_decode($json, true);
			if ( $result_array['meta']['code'] == '200' ) {	
				if ( $as_array )
					return $result_array['response'];
				else
					return json_encode($result_array['response']);
			}
		}

		return false;
	}

	function __construct() {
		
		$breweries = $this->search_venues( $this->breweryNear, $this->breweryRadius, $this->breweryCategory );

		if ( $breweries ) {
			foreach ($breweries as $k => $v) {
				if ( isset($v['id']) ) {
					$id = $v['id'];
					$h = $this->get_aspect( 'hours', $id );
					$m = $this->get_aspect( 'menu', $id );
					$p = $this->get_aspect( 'photos', $id );
					$breweries[ $k ]['hours'] = $h['hours'];
					$breweries[ $k ]['popular'] = $h['popular'];
					$breweries[ $k ]['menu'] = $m['menu'];
					//$breweries[ $k ]['menu']['provider'] = $m['menu']['provider'];
					$breweries[ $k ]['photos'] = $p['photos'];
				}
			}
		}

		$this->venues = $breweries;
		$this->lastUpdated = time();

		$dir = dirname(__FILE__);
		$jsonFile = $dir . "/4square.txt";
		file_put_contents($jsonFile, json_encode($this));

	}

}

if ( isset($_GET['show']) && $_GET['show'] == 'true') {
	$breweries = new four_square_call_api;
	var_dump($breweries);
}