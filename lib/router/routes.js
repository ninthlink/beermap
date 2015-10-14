Router.configure({
    layoutTemplate: 'masterLayout',
    loadingTemplate: 'loading',
    notFoundTemplate: 'pageNotFound',
    yieldTemplates: {
        nav: {to: 'nav'},
        footer: {to: 'footer'},
    }
});

Router.map(function() {
    this.route('home', {
        path: '/',
        
        onBeforeAction: function (pause) {
          if (Meteor.isClient) {
            if ( !GoogleMaps.loaded() ) {
              GoogleMaps.load();
            }
          }
          this.next();
        }
    });

    //this.route('private');
});
/*
Router.plugin('ensureSignedIn', {
  only: ['private']
});
*/
//Routes
AccountsTemplates.configureRoute('changePwd');
AccountsTemplates.configureRoute('enrollAccount');
AccountsTemplates.configureRoute('forgotPwd');
AccountsTemplates.configureRoute('resetPwd');
AccountsTemplates.configureRoute('signIn');
AccountsTemplates.configureRoute('signUp');
AccountsTemplates.configureRoute('verifyEmail');
