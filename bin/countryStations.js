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
                    // we store unfiltered data in order to be able to perform any filter
                    // in the future
                    fs.writeFileSync(pathToResources, JSON.stringify(message));

                    message = obj.doFilter(params, message);
                    callback(message);
                });
            }
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
                return true;
            });

            return resources;
        },
        cleanParams: function(params){
            var cleanedParams = {};
            var args = [];

            if(params){
                if(params.stationsType){
                    //clean params.stationsType
                    args = _.intersection(params.stationsType, ['a', 'b', 'c']);
                    args = _.unique(args).sort(function(a, b){
                        return (a <= b)? (a < b)? -1: 0: 1;
                    });

                }

                // name parameters

                if(params.name && typeof params.name === 'string'){
                    cleanedParams.name = params.name;
                }
            }
            cleanedParams.stationsType = args;

            return cleanedParams;
        }
    };

    return obj;
};


module.exports = countryStation();