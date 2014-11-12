/**
 * layoutHelper
 *
 * provides methods and state of current (left) menu?
 */
(function() {
	angular
		.module('beerMap')
		.factory('layoutHelper', layoutHelper);
	
	layoutHelper.$inject = ['$rootScope', '$state'];
	
	function layoutHelper( $rootScope, $state ) {
		var menu = {
			items: [
				{
					slug: 'home',
					text: 'View Map',
					url: '#/home',
				},
				{
					slug: 'list',
					text: 'View List',
					url: '#/list',
				}
			],
			active: '',
			visible: false
		};
		
		var o = {};
		
		o.getMenu = function( setActive ) {
			// set new active menu item
			menu.active = setActive;
			// and reset open state?
			$rootScope.bodyClass = '';
			menu.visible = false;
			return menu;
		};
		
		o.toggleMenu = function() {
			//console.log('TOGGLE MENU');
			menu.visible = !menu.visible;
			$rootScope.bodyClass = menu.visible ? 'menu-open' : '';
		};
		
		menu.toggleMenu = o.toggleMenu; //?
		
		// set up the typeahead callback here so it stays for all Controllers
		o.searchFor = function( $item, $model, $label ) {
			var slugd = $item.slug;
			console.log('search for : $model = ' + $model + ' : $label = '+ $label +' : slug = '+ slugd + ' ::');
			console.log($item);
			
			// http://stackoverflow.com/a/17994624 said to do this..
			$rootScope.$item = $item;
			$rootScope.$model = $model;
			$rootScope.$label = $label;
			
			// and then redirect to details for that location item?!
			$state.go('location', {id: $item.id});
		};
		
		return o;
	}
})();