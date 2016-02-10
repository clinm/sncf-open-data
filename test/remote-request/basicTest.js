var path = require("path");
var fs = require("fs");

var bin_directory = path.join(__dirname, "../../bin");
var SNCF_FILE = path.join(bin_directory, "remote-request", "sncf-request");
var CONF_FILE = path.join(bin_directory, "remote-request", "CONF.json");

var chai = require("chai");

var expect = chai.expect;

describe("Basic behaviour", function(){
    it("should load the configuration file", function(){
        fs.renameSync(CONF_FILE, CONF_FILE+".old");
        expect(function(){require(SNCF_FILE)}).to.throw("Cannot find module './CONF.json'");
        fs.renameSync(CONF_FILE+".old", CONF_FILE);
    })
});