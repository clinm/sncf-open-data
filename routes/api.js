/**
 * Created by Matthieu on 13/02/2016.
 */

exports.index = function(req, res){
    res.render('index', { title: 'API INDEX' });
};

exports.stop_areas = function(req, res){
    var countryStations = require('../bin/countryStations');

    countryStations.getResources(req.body, function(resource){
        console.log("length: " + resource.length);
        res.send(resource);
    });
};

