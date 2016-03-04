/**
 * Created by Matthieu on 02/03/2016.
 */

/**
 *
 * @param mapId         HTML ID of the map
 * @param errorId       HTML ID to display error message when no stations match
 * @param loadingId     HTML ID for a loading GIF
 * @returns {{getData: display.getData, updateData: display.updateData}}
 */
var display = function(mapId, errorId, loadingId){
    // set up the map
    map = new L.map(mapId);

    // create the tile layer with correct attribution
    var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
    var osm = new L.TileLayer(osmUrl, {minZoom: 4, maxZoom: 15, attribution: osmAttrib});

    // roughly center of France
    map.setView(new L.LatLng(46.6, 2.75), 6);
    map.addLayer(osm);

    var markerClusters = L.markerClusterGroup();

    var stations;
    var errorMessage = errorId && document.getElementById(errorId);
    var loadingGif = loadingId && document.getElementById(loadingId);

    var display = {
        doFilter: function(params, resources){
            resources = _.filter(resources, function(elt){
                if(!elt.coord){
                    return false;
                }
                if(elt.coord && elt.coord.lat === '0.0' && elt.coord.lon === '0.0'){
                    return false;
                }

                // filter by name
                if(params.name && !elt.name.match(params.name)){
                    return false;
                }

                if(params.fields && Object.keys(params.fields).length != 0){
                    return Object.keys(params.fields).every(function(field){
                        return elt.fields[field] && elt.fields[field].match(params.fields[field]);
                    });
                }
                return true;
            });

            return resources;
        },
        getData: function (filters){
            var url = "resources/stations/stations.json";

            if(loadingGif){
                loadingGif.style.display = 'block';
            }

            if(stations) {
                var filtered = display.doFilter(filters, stations);
                display.updateOrError(filtered);
            }else{
                var xmlhttp = new XMLHttpRequest();

                xmlhttp.onreadystatechange = function() {
                    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                        stations = JSON.parse(xmlhttp.responseText);
                        var filtered = display.doFilter(filters, stations);
                        display.updateOrError(filtered);
                    }
                };
                xmlhttp.open("GET", url, true);
                xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                xmlhttp.send();
            }
        },
        updateOrError: function(stations){
            if(errorMessage){
                if(stations.length == 0){
                    errorMessage.style.display = 'block';
                }else{
                    errorMessage.style.display = 'none';
                }
            }
            display.updateData(stations);
            if(loadingGif){
                loadingGif.style.display = 'none';
            }
        },
        updateData: function(stations){
            markerClusters.clearLayers();
            stations.forEach(function(stopArea){
                var content = stopArea.name || "Undefined";
                var m = L.marker(stopArea.coord).bindPopup(content);
                markerClusters.addLayer(m);
            });

            map.addLayer(markerClusters);
        }
    };

    return display;
};