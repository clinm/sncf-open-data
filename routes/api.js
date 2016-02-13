/**
 * Created by Matthieu on 13/02/2016.
 */

exports.index = function(req, res){
    res.render('index', { title: 'API INDEX' });
};

exports.stop_areas = function(req, res){
    var sncf = require('../bin/remote-request/sncf-request');

    sncf.getAll("/stop_areas", {}, function(error, response, message){
        res.json(message);
    });
};

