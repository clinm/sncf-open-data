var express = require('express');

exports.index = function(req, res){
    res.render('stations/index', { title: '=)' , layout: false});
};
