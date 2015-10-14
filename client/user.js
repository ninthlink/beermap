Template.user.helpers({
  userImage: function() {
    //return Meteor.user().profile.first_name;
    if ( Meteor.user().services.facebook ) {
      return "http://graph.facebook.com/" + Meteor.user().services.facebook.id + "/picture/?type=large";
    }
    return '';
  }
});