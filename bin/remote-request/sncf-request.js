/**
 * Created by Matthieu on 10/02/2016.
 */
var sncfRequest = function(){
    var CONF= require("./../../conf/CONF.json");

    var request = require('request');
    var _ = require("underscore");
    var async = require('async');

    var is_array = function (value) {
        return value && typeof value === 'object'
            && typeof value.length === 'number'
            && typeof value.splice === 'function' &&
            !(value.propertyIsEnumerable('length'));
    };

    var sncf = {
        /**
         *  Clean all useless parameters from the response (links etc).
         *  Used by getAll in order to concat all requests
         * @param body  Response from a get method. Can be String or Object
         * @returns {*} The response cleaned from disruptions/pagination, links and feed_publishers
         */
        cleanResponse: function(body){
            if(typeof body === 'string'){
                body = JSON.parse(body);
            }

            delete body.disruptions;
            delete body.pagination;
            delete body.links;
            delete body.feed_publishers;

            return body;
        },
        /**
         *  Simply performs a get request to the remote API
         * @param {string} url       resources' path
         * @param {Object} params    parameters that will be passed as GET parameters
         * @param callback  same callback as {@link request.get}
         */
        get: function(url, params, callback){
            if(url.indexOf('/') > 0 || url.indexOf('/') == -1){
                url = '/' + url;
            }

            var request_url={
                url: 'https://'+CONF.KEY+'@' + CONF.BASE_URL + url,
                formData: params
            };

            request.get(request_url, callback);
        },
        /**
         *  Performs all request with start_page property from start to end.
         *  Concat all responses with seed. Two cases:
         *      - Everything went well: callback(null, null, concatenatedResult);
         *      - Something went wrong: callback(error, null, errorReceived);
         * @param {string} url
         * @param {Object} params
         * @param {!number} start               Beginning number for start_page
         * @param {!number} countPerRequest     Fill the count property of params
         * @param {!number} end                 End number for start
         * @param callback                      Called when all request has been made and the result concatenated
         * @param {[]} seed                     Seed for concatenation, if none is provided then [] will be used
         */
        performsAllRequest: function(url, params, start, countPerRequest, end, callback, seed){
            async.map(_.range(start, end), function(page, callbackMap){
                var local = {};
                Object.assign(local, params);
                local.start_page = page;
                local.count = countPerRequest;
                sncf.get(url, local, function(error, response, body){
                    if (!error && response.statusCode == 200) {
                        callbackMap(null, sncf.cleanResponse(body));
                    }else{
                        callbackMap(error, body);
                    }
                });

            }, function(error, result){
                if(!error){
                    if(!seed){
                        seed = [];
                    }
                    result = _.reduce(result, function(memo, elt){
                        elt = sncf.cleanResponse(elt);
                        return memo.concat(elt[Object.keys(elt)[0]]);
                    }, seed);
                }
                callback(error, null, result);
            });
        },
        /**
         * The remote API does not provide a way to retrieve all records for a given request. Thus,
         * this method allows to retrieve all record by making multiple request and join them at the end.
         * params.count parameter will be override if needed
         * @param url       resources' path
         * @param params    parameters that ill be passed as GET parameters
         * @param callback  same callback as {@link request.get}
         */
        getAll: function(url, params, callback){
            // count parameter for the request
            var count = 1000;
            params = params || {};
            params.count = count;

            var checkReceivedAll = function(error, response, body){
                if (!error && response.statusCode == 200) {
                    var data = JSON.parse(body);
                    var total = data.pagination.total_result;
                    if(data.pagination.items_on_page === total){
                        body = sncf.cleanResponse(body);
                        body = body[Object.keys(body)[0]];
                        callback(error, response, body);
                    }else{
                        // compute how many request have to be sent
                        var itemsOnPage = data.pagination.items_on_page;
                        var requestNumber = total/ itemsOnPage;

                        data = sncf.cleanResponse(data);
                        data = data[Object.keys(data)[0]];
                        if(!is_array(data)){
                            data = [data];
                        }
                        sncf.performsAllRequest(url, params, 1, count, requestNumber, callback, data);
                    }
                }else{
                    console.log("An error occurred while performing getAll");
                    callback(error, response, body);
                }
            };

            sncf.get(url, params, checkReceivedAll);
        }
    };

    return sncf;
};

module.exports = sncfRequest();
