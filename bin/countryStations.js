/**
 * Created by Matthieu on 17/02/2016.
 */

var countryStation = function(){

    var CONF = require('./../conf/CONF.json');

    var COUNTRY_BASE = 'stations';

    var path = require("path");
    var _ = require("underscore");
    var sncf = require("./remote-request/sncf-request");
    var fs = require("fs");
    var SEP = '_';

    var obj = {
        /**
         *  Construct the path to the resources given parameters
         * @param {{stationsType: []} | {}}params use stationsType to create the path
         * @returns {string}
         */
        getPath: function(params){
            var res = path.join(__dirname, '../', CONF.BASE_RESOURCES, COUNTRY_BASE, COUNTRY_BASE);
            params = obj.cleanParams(params);
            if(params.stationsType.length > 0){

                var types = params.stationsType.join(SEP);
                res = res + SEP + types;
            }
            return res + '.json';
        },
        /**
         *  Given parameters, check if the resources was previously load. If so, then returns the path. Otherwise
         *  make requests, store the results and return the resource. Result is sent to callback.
         * @param params
         * @param callback take one argument which will be the result (see @returns)
         * @returns {[]}    Returns the requested resources (which was filtered with params)
         */
        getResources: function(params, callback){
            params = obj.cleanParams(params);

            var pathToResources = obj.getPath({});
            if(fs.existsSync(pathToResources)){
                var resource = require(pathToResources);
                callback(obj.doFilter(params, resource));
            }else{
                sncf.getAll('stop_areas', {}, function(error, response, message){
                    // we store stations that we were able to linked to its information
                    var stations = obj.associate(message);
                    fs.writeFileSync(pathToResources, JSON.stringify(stations));

                    stations = obj.doFilter(params, stations);
                    callback(stations);
                });
            }
        },
        /**
         *  This method is using a file
         *  (https://ressources.data.sncf.com/explore/dataset/referentiel-gares-voyageurs/information/?disjunctive.nombre_plateformes)
         *  To associated the stations received by the remote api to the station in this file. Then more information are
         *  available in order to filter the stations. This method is saving rejected stations in rejected_stations.json
         * @param resources
         * @returns {Array}     All station that was successfully associated with its information
         */
        associate: function(resources){
            var stationsInformation = require(path.join(__dirname, '../', CONF.STATIONS_INFORMATION));
            var res = [];
            var used = [];
            for(var i = 0; i < stationsInformation.length; i++){
                var info = stationsInformation[i];
                var id1 = info.fields.uic;
                for(var j = 0; j < resources.length; j++) {
                    var station = resources[j];
                    var id2 = station.id.substring(station.id.lastIndexOf(':')+1);
                    if(id1.indexOf(id2) > -1){

                        //clean stations outside France mostly and the ones without any gps data
                        if((station.administrative_regions !== undefined) &&
                            !(station.coord.lat === '0.0' && station.coord.lon === '0.0')){

                            station.fields = info.fields;
                            res.push(station);
                            used[j] = true;
                            break;
                        }

                    }
                }
            }

            // For now, I find it interesting to store stations that I was not able to linked to a
            // station information.
            var thrownAway = [];
            for(var t = 0; t < used.length ; t++){
                if(used[t] !== true){
                    thrownAway.push(resources[t]);
                }
            }

            var rejected_path = path.join(__dirname, '../', CONF.BASE_RESOURCES, 'stations', 'rejected_station.json');
            fs.writeFileSync(rejected_path, JSON.stringify(thrownAway));

            return res;
        },
        doFilter: function(params, resources){
            params = obj.cleanParams(params);
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
                        return elt.fields[field].match(params.fields[field]);
                    });
                }
                return true;
            });

            return resources;
        },
        cleanParams: function(params){
            var cleanedParams = {stationsType: [], fields: {}};

            if(params){
                if(params.stationsType){
                    //clean params.stationsType
                    var args = _.intersection(params.stationsType, ['a', 'b', 'c']);

                    args = _.unique(args).sort(function(a, b){
                        return (a <= b)? (a < b)? -1: 0: 1;
                    });
                    cleanedParams.stationsType = args;
                }

                // name parameters
                if(params.name && typeof params.name === 'string'){
                    cleanedParams.name = params.name;
                }

                if(params.fields){
                    var fields = {};
                    //fields that are strings
                    var fieldsAllowedString = ["departement", "commune", "uic", "segment_drg", "region",
                        "nombre_plateformes", "niveau_de_service", "intitule_gare", "code_postal"];

                    fieldsAllowedString.forEach(function(elt){
                        if(typeof params.fields[elt] === 'string'){
                            fields[elt] = params.fields[elt];
                        }
                    });

                    cleanedParams.fields = fields;
                }

            }

            return cleanedParams;
        }
    };

    return obj;
};


module.exports = countryStation();