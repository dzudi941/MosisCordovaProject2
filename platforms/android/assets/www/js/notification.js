      document.addEventListener('deviceready', function() {
        var db = null;
      db = window.sqlitePlugin.openDatabase({name: 'kud.db', location: 'default'});

        //Make sure to get at least one GPS coordinate in the foreground before starting background services
      navigator.geolocation.getCurrentPosition(function() {
       console.log("Succesfully retreived our GPS position, we can now start our background tracker.");
      }, function(error) {
       console.error(error);
      });

      //Get plugin
      var bgLocationServices =  window.plugins.backgroundLocationServices;

      //Congfigure Plugin
      bgLocationServices.configure({
           //Both
           desiredAccuracy: 20, // Desired Accuracy of the location updates (lower means more accurate but more battery consumption)
           distanceFilter: 5, // (Meters) How far you must move from the last point to trigger a location update
           debug: false, // <-- Enable to show visual indications when you receive a background location update
           interval: 9000, // (Milliseconds) Requested Interval in between location updates.
           useActivityDetection: true, // Uses Activitiy detection to shut off gps when you are still (Greatly enhances Battery Life)
           
           //Android Only
           notificationTitle: 'BG Plugin', // customize the title of the notification
           notificationText: 'Tracking', //customize the text of the notification
           fastestInterval: 5000 // <-- (Milliseconds) Fastest interval your app / server can handle updates
           
      });

      //Register a callback for location updates, this is where location objects will be sent in the background
      localStorage.showedObjects = "[]";
      bgLocationServices.registerForLocationUpdates(function(location) {
           console.log("We got an BG Update" + JSON.stringify(location));

            if(localStorage.myCurrentLatitude == undefined || localStorage.myCurrentLongitude == undefined)
              {
                  localStorage.myCurrentLatitude = location.latitude;
                  localStorage.myCurrentLongitude = location.longitude;
              }
                db.transaction(function(tx) {
                tx.executeSql("SELECT * FROM myLocations4 ", [], function(tx, rs) {
                    //console.log(rs);
                    if(localStorage.myCurrentLatitude != location.latitude || localStorage.myCurrentLongitude != location.longitude)
                      {
                        var objects = "";
                        var objectsNum = 0;
                        ObjectNotShowed = false;
                        var Objects1 = JSON.parse(localStorage.showedObjects);
                        for (var i = 0; i < rs.rows.length; i++) {
                            //console.log("LL: "+ location.latitude + "LLon"+ location.longitude);
                            //console.log(location.latitude-rs.rows.item(i).latitude);
                            //console.log(location.longitude-rs.rows.item(i).longitude);
                            //console.log("BL: "+ rs.rows.item(i).latitude + "BLon: "+ rs.rows.item(i).longitude);
                            
                            /*if (location.latitude-rs.rows.item(i).latitude > -0.005 && location.latitude-rs.rows.item(i).latitude <0.005 && location.longitude-rs.rows.item(i).longitude > -0.005 && location.longitude-rs.rows.item(i).longitude <0.005 ) {*/
                                if(measure(location.latitude, location.longitude, rs.rows.item(i).latitude, rs.rows.item(i).longitude)<=500){
                                    objects += rs.rows.item(i).title+", ";
                                    objectsNum++;
                                    if(Objects1.indexOf(rs.rows.item(i).id) == -1)
                                    {
                                      ObjectNotShowed = true;
                                    }
                                }
                        }
                        // console.log("TESR");
                        if(objects != "")
                        {

                          if (ObjectNotShowed) {
                              cordova.plugins.notification.local.schedule({
                                  text: objectsNum+" objekta u blizini:\n"+objects,
                                  icon: {
                                    'url': "file:///android_asset/www/img/castles.png"
                                   },
                                  smallIcon: "file:///android_asset/www/img/castles.png",
                                  led: "FFFAAA"
                              });
                              var Objects = [];
                              for (var i = 0; i < rs.rows.length; i++) {
                                if (location.latitude-rs.rows.item(i).latitude > -0.005 && location.latitude-rs.rows.item(i).latitude <0.005 && location.longitude-rs.rows.item(i).longitude > -0.005 && location.longitude-rs.rows.item(i).longitude <0.005 ) {
                                    Objects.push(rs.rows.item(i).id);
                                }
                              }
                              localStorage.showedObjects = JSON.stringify(Objects);
                          }
                        }
                        
                        localStorage.myCurrentLatitude = location.latitude;
                        localStorage.myCurrentLongitude = location.longitude;
                      }
                    
                  });
              });

                //map.remove();
                navigator.geolocation.getCurrentPosition(PositionChanged); //refresh map

      }, function(err) {
           console.log("Error: Didnt get an update", err);
      });

      //Register for Activity Updates

      //Uses the Detected Activies / CoreMotion API to send back an array of activities and their confidence levels
      //See here for more information:
      //https://developers.google.com/android/reference/com/google/android/gms/location/DetectedActivity
      bgLocationServices.registerForActivityUpdates(function(activities) {
           console.log("We got an activity update" + activities);
      }, function(err) {
           console.log("Error: Something went wrong", err);
      });

      //Start the Background Tracker. When you enter the background tracking will start, and stop when you enter the foreground.
      bgLocationServices.start();


      ///later, to stop
      //bgLocationServices.stop();

      function measure(lat1, lon1, lat2, lon2){  // generally used geo measurement function
            var R = 6378.137; // Radius of earth in KM
            var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
            var dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
            var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            var d = R * c;
            return d * 1000; // meters
        }
      });