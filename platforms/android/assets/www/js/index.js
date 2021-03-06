var db = null;
document.addEventListener('deviceready', function() {
    $('#well').hide();
    db = window.sqlitePlugin.openDatabase({name: 'kud.db', location: 'default'});
    var mapDiv = document.getElementById("map_canvas");
    var map = plugin.google.maps.Map.getMap(mapDiv);
     PositionChanged = function (position){
      const MY_Location = new plugin.google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      if (sessionStorage.MapEnapbled != undefined) {
        map.remove();
        map = plugin.google.maps.Map.getMap(mapDiv, {
          'camera': {
            'latLng': MY_Location,
            'zoom': 15
          }
        });
      }
    //map.addEventListener(plugin.google.maps.event.MAP_READY, function() {
        sessionStorage.MapEnapbled = true;
        map.setCenter(MY_Location);
        map.setZoom(15);
        map.setClickable( true );
    
        db.transaction(function(tx) {
            tx.executeSql('SELECT * FROM myLocations4', [], function(tx, rs) {
            console.log(rs);
            for (var i = 0; i < rs.rows.length; i++) {
                var titl = rs.rows.item(i).title;
                var desc = rs.rows.item(i).description;
                var imgSrc = rs.rows.item(i).imageSrc;
                map.addMarker({
                  'position': new plugin.google.maps.LatLng(rs.rows.item(i).latitude, rs.rows.item(i).longitude),
                  'title': rs.rows.item(i).title,
                  'indexValue' : i,
                  'objectid' : rs.rows.item(i).id,
                  'infoClick': function(marker) {
                    objId = marker.get("objectid");
                    map.setClickable( false );
                    $('#well-title').text(rs.rows.item(marker.get("indexValue")).title);
                    $('#well-description').text(rs.rows.item(marker.get("indexValue")).description);
                    $('#well-img').attr('src', rs.rows.item(marker.get("indexValue")).imageSrc);
                    $('#well').attr('style', 'margin-top: -92vh;');
                    $('#object-id').val(objId);
         
                    //clear notes
                    $('#your-notes').html("");
                    db.transaction(function(tx1) {
                    tx1.executeSql("SELECT * FROM myNotes WHERE objectid ="+objId, [], function(tx2, result){
                        if(result.rows.length)
                        {
                            $('#your-notes').html("<h4>Tvoje beleske</h4>");
                        }
                        for (var j = 0; j < result.rows.length; j++) {
                            $('#your-notes').append("<p>Datum: "+result.rows.item(j).notesdate+" Vreme: "+result.rows.item(j).notestime+"</p>");
                            $('#your-notes').append("<p>"+result.rows.item(j).notestext+"</p>");
                        }
                    });
                    });
                    $('#well').show();
                    map.setClickable( false );
                  },
                  'icon': {
                    'url': rs.rows.item(i).smallImageSrc
                   },
                }, function(marker) {
                    marker.setIcon({
                      'url': rs.rows.item(marker.get("indexValue")).smallImageSrc,

                    });
                });
             }
            map.addMarker({
              'position': MY_Location,
              'title': 'Ti se nalazis ovde!',

            }, function(marker) {
              marker.showInfoWindow();
            });
                   
            }, function(tx, error) {
              console.log('SELECT error: ' + error.message);
            });
        });
    //}); //mapready function close
        $('.collapse').on('shown.bs.collapse', function(e) {          
                map.setClickable( false );
        });
        $('.collapse').on('hidden.bs.collapse', function(e) { 
            map.setClickable( true );
        });

        $('#map_canvas, #X-button').on('click', function(e) {
          if (e.target !== this)
            return;
          
          $('#well').hide();
          map.setClickable( true );
        });

        }//positionChangedCLose


        /*save notes in databaase*/
        $('#save-note').on('click', function(){
        db.transaction(function(tx) {
            var objectID = $('#object-id').val();
            var notesDate = $('#notes-date').val();
            var notesTime = $('#notes-time').val();
            var notesText = $('#notes-text').val();
            //alert(notesDate);
            tx.executeSql('CREATE TABLE IF NOT EXISTS myNotes \
                     (id INTEGER PRIMARY KEY   AUTOINCREMENT,\
                     objectid INTEGER,\
                     notesdate TEXT, \
                     notestime TEXT, \
                     notestext TEXT)');
                   tx.executeSql('INSERT INTO myNotes (objectid, notesdate, notestime, notestext) VALUES (?, ?, ?, ?)', [objectID, notesDate, notesTime, notesText]);
        }, function(error) {
           console.log('Transaction ERROR: ' + error.message);
         }, function() {
            $('#your-notes').append("<p>Datum: "+$('#notes-date').val()+" Vreme: "+$('#notes-time').val()+"</p>");
            $('#your-notes').append("<p>"+$('#notes-text').val()+"</p>");
            $('#notes-date').val("");
            $('#notes-time').val("");
            $('#notes-text').val("");
        });
        });
        ////////
        /*delete object function*/
        $('#delet-object-button').on('click', function(){
            db.transaction(function(tx) {
                var idForDel = $('#object-id').val();
                tx.executeSql("DELETE FROM myLocations4 WHERE id="+idForDel);
            }, function(error) {
               console.log('Transaction ERROR: ' + error.message);
             }, function() {
              alert("Uspesno obrisano");
            });
        });
        navigator.geolocation.getCurrentPosition(PositionChanged);
    });
    

document.addEventListener("deviceready", onDeviceReadyShare, false);
function onDeviceReadyShare() {
    $('#send-to-friend').on('click', function(){
        sendImageToFriend();
    });
}
function sendImageToFriend() {
   // this is the complete list of currently supported params you can pass to the plugin (all optional)
   var shareImgSrc = $('#well-img').attr('src');
   var shareObjectName = $('#well-title').text();
    var shareOptions = {
      message: shareObjectName, // not supported on some apps (Facebook, Instagram)
      subject: 'the subject', // fi. for email
      files: [shareImgSrc], // an array of filenames either locally or remotely
      /*url: 'https://www.website.com/foo/#bar?a=b',*/
      chooserTitle: 'Odaberite aplikaciju' // Android only, you can override the default share sheet title
    }

    var onShareSuccess = function(result) {
      console.log("Share completed? " + result.completed); // On Android apps mostly return false even while it's true
      console.log("Shared to app: " + result.app); // On Android result.app is currently empty. On iOS it's empty when sharing is cancelled (result.completed=false)
    }

    var onShareError = function(msg) {
      console.log("Sharing failed with message: " + msg);
    }

    window.plugins.socialsharing.shareWithOptions(shareOptions, onShareSuccess, onShareError);

}