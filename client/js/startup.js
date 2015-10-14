// Set up login services? maybe this isnt the right spot..
Meteor.startup(function() {
    // Add Facebook configuration entry
    ServiceConfiguration.configurations.update(
      { "service": "facebook" },
      {
        $set: {
          "appId": "XXXXXXXXXXXXXXXXXXXX",
          "secret": "XXXXXXXXXXXXXXXXXXXX"
        }
      },
      { upsert: true }
    );
/*
    // Add GitHub configuration entry
    ServiceConfiguration.configurations.update(
      { "service": "github" },
      {
        $set: {
          "clientId": "XXXXXXXXXXXXXXXXXXXX",
          "secret": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        }
      },
      { upsert: true }
    );
    */
});