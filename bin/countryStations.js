/**
 * Created by Matthieu on 17/02/2016.
 */

var countryStation = function(){

    var CONF = require('./remote-request/CONF.json');

    var COUNTRY_BASE = 'stations';

    var path = require("path");
    var _ = require("underscore");
    var sncf = require("./remote-request/sncf-request");
    var fs = require("fs");
    var SEP = '_';

    var obj = {
        /**
         *  Construct the path to the resources given parameters
         * @param {{stationsType: []}}params use stationsType to create the path
         * @returns {string}
         */
        getPath: function(params){
            var res = path.join(__dirname, '../', CONF.BASE_RESOURCES, COUNTRY_BASE, COUNTRY_BASE);
            if(params && params.stationsType && params.stationsType.length > 0){
                //clean params.stationsType
                var args = _.intersection(params.stationsType, ['a', 'b', 'c']);
                args = _.unique(args).sort(function(a, b){
                    return (a <= b)? (a < b)? -1: 0: 1;
                });

                var types = args.join(SEP);
                res = res + SEP + types;
            }
            return res + '.json';
        },
        /**
         *  Given parameters, check if the resources was previously load. If so, then returns the path. Otherwise
         *  make requests, store the results and return the resource. Result is sent to callback.
         * @param params
         * @param callback take one argument which will be the result (see @returns)
         * @returns {string | []} returns a strings if the resource is on disk
         *                        the resource itself if a request was performed
         */
        getResources: function(params, callback){
            var pathToResources = obj.getPath(params);
            if(fs.existsSync(pathToResources)){
                callback(pathToResources);
            }else{
                sncf.getAll('stop_areas', {}, function(error, response, message){
                    fs.writeFileSync(pathToResources, JSON.stringify(obj.doFilter(params, message)));
                    callback(message);
                });
            }
        },
        doFilter: function(params, resources){
            resources = _.filter(resources, function(elt){
                if(!elt.coord){
                    return false;
                }
                if(elt.coord && elt.coord.lat === '0.0' && elt.coord.lon === '0.0'){
                    return false;
                }
                return true;
            });

            return resources;
        }
    };

    return obj;
};


module.exports = countryStation();