/**
 * Created by Matthieu on 17/02/2016.
 */
var path = require("path");
var fs = require("fs");
var bin_directory = path.join(__dirname, "../bin");
var CONF_FILE = path.join(bin_directory, 'remote-request', 'CONF.json');
var chai = require("chai");
chai.use(require('chai-string'));
var sinon = require("sinon");
var expect = chai.expect;
var request = require("request");

var countryStations;
var sandbox;
var spy;
var mochaResourcesTest = path.join(__dirname, "resources");
describe("CountryStationsTest", function(){

    before(function(){
        var mochaResources = path.join(__dirname, "mocha_resources");

        var wrench = require("wrench");

        var testFolder = 'test/resources';
        if(fs.existsSync(CONF_FILE)){
            // change configuration file
            var conf = require(CONF_FILE);

            // in case previous tests failed, avoid to override original conf file
            if(conf.BASE_RESOURCES !== testFolder){
                fs.renameSync(CONF_FILE, CONF_FILE+ 'tmp');
                conf.BASE_RESOURCES = 'test/resources';

                fs.writeFileSync(CONF_FILE, JSON.stringify(conf));
            }
        }
        // setup test directory
        wrench.copyDirSyncRecursive(mochaResources, mochaResourcesTest, { forceDelete: true});

        countryStations = require(path.join(bin_directory, 'countryStations'));
    });

    after(function(){

        fs.renameSync(CONF_FILE+ 'tmp', CONF_FILE);
    });


    beforeEach(function () {
        sandbox = sinon.sandbox.create();
        spy = sandbox.stub(request, 'get');
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe("getPath", function(){
        it("should return a path without parameters", function(){
            //noinspection JSCheckFunctionSignatures
            expect(countryStations.getPath({})).to.endsWith("stations.json");
            expect(countryStations.getPath({stationsType: []})).to.endsWith("stations.json");
        });

        it("should return the path with parameters", function(){
            expect(countryStations.getPath({stationsType: ['a', 'b']})).to.endsWith("stations_a_b.json");
        });

        it("should not put twice the same arguments", function(){
            expect(countryStations.getPath({stationsType: ['a', 'b', 'a']})).to.endsWith("stations_a_b.json");
        });

        it("should ignore unknown parameters", function(){
            expect(countryStations.getPath({stationsType: ['a', 'b', 'unknown', 45]})).to.endsWith("stations_a_b.json");
        });

        it("should put parameters in alphabetical order", function(){
            expect(countryStations.getPath({stationsType: ['b', 'a']})).to.endsWith("stations_a_b.json");
        });
    });

    describe("getResources", function(){
        it("should return path", function(done){
            countryStations.getResources({}, function(result){
                expect(result).to.endsWith("stations.json");

                countryStations.getResources({stationsType: ['a', 'b']}, function(result) {
                    expect(result).to.endsWith("stations_a_b.json");
                    done();
                });
            });
        });

        var res = {
            "disruptions": [],
            "pagination": {
                "start_page": 1,
                "items_on_page": 1,
                "items_per_page": 1,
                "total_result": 1
            },
            "stop_areas": [{"name": "station", coord: {lat: "1.0", lon: "5.0"}}],
            "links": [],
            "feed_publishers": []
        };

        it("should perform request and store results", function(done){
            spy.yields(null, {statusCode: 200}, JSON.stringify(res));

            countryStations.getResources({stationsType: ['c']}, function(result){
                expect(result).to.be.deep.equal(res.stop_areas);
                var testFile = path.join(mochaResourcesTest, 'stations', 'stations_c.json');
                //noinspection BadExpressionStatementJS
                expect(fs.existsSync(testFile)).to.be.true;
                var store = require(testFile);
                expect(store).to.be.deep.equal(res.stop_areas);
                done();
            });
        });
    });

    describe("doFilter", function(){
        it("should clean station without GPS parameters", function(){
            var dataUnfiltered = [
                {coord: {lat: "49.479714", "lon": "8.470079"}},
                {coord: {lat: "0.0", "lon": "0.0"}},
                {coord: {lat: "49.479714", "lon": "0.0"}},
                {coord: {lat: "0.0", "lon": "8.470079"}}
            ];

            var res = countryStations.doFilter({}, dataUnfiltered);
            expect(res.length).to.be.equal(3);
            expect(res[0]).to.be.deep.equal(dataUnfiltered[0]);
            expect(res[1]).to.be.deep.equal(dataUnfiltered[2]);
            expect(res[2]).to.be.deep.equal(dataUnfiltered[3]);
        });
    });

});
