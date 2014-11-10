/**
 * layoutHelper
 *
 * provides methods and state of current (left) menu?
 */
(function() {
	angular
		.module('beerMap')
		.factory('layoutHelper', layoutHelper);
	
	layoutHelper.$inject = ['$rootScope'];
	
	function layoutHelper( $rootScope ) {
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
		
		return o;
	}
})();