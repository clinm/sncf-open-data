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

        var expected = {
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
            spy.yields(null, {statusCode: 200}, JSON.stringify(expected));
            countryStations.getResources({}, function(result){
                expect(spy.callCount).to.be.equal(1);
                expect(result).to.be.deep.equal(expected.stop_areas);
                done();
            });
        });

        it("should retrieve data from previous request", function(done){
            //noinspection JSCheckFunctionSignatures
            var res = require(countryStations.getPath());
            countryStations.getResources({}, function(result){
                expect(spy.callCount).to.be.equal(0);
                expect(result).to.be.deep.equal(res);
                done();
            });
        });

        it("should retrieve data from previous request and do filter", function(done){
            countryStations.getResources({name: "My impossible name"}, function(result){
                expect(spy.callCount).to.be.equal(0);
                expect(result.length).to.be.deep.equal(0);
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

        var dataUnfiltered = [
            {coord: {lat: "49.479714", "lon": "8.470079"}, name: "Station 1"},
            {coord: {lat: "49.479714", "lon": "8.470079"}, name: "Station 1"},
            {coord: {lat: "49.479714", "lon": "8.470079"}, name: "Station 2"},
            {coord: {lat: "49.479714", "lon": "8.470079"}, name: "Station 2"}
        ];

        it("should filter by station's name", function(){
            var res = countryStations.doFilter({name: "Station 2"}, dataUnfiltered);
            expect(res.length).to.be.equal(2);

            res = countryStations.doFilter({name: "Station 4"}, dataUnfiltered);
            expect(res.length).to.be.equal(0);
        });

        it("should filter using regex", function(){
            var res = countryStations.doFilter({name: "Station [0-9]"}, dataUnfiltered);
            expect(res.length).to.be.equal(dataUnfiltered.length);

        });
    });

    describe("cleanParams", function(){
        describe("stationsType", function(){
            it("should not put twice the same arguments", function(){
                var stationsType = countryStations.cleanParams({stationsType: ['a', 'b', 'a']}).stationsType;
                expect(stationsType).to.be.deep.equal(['a', 'b']);
            });

            it("should ignore unknown parameters", function(){
                var stationsType = countryStations.cleanParams({stationsType:['a', 'b', 'unknown', 45]}).stationsType;
                expect(stationsType).to.be.deep.equal(['a', 'b']);
            });

            it("should put parameters in alphabetical order", function(){
                var stationsType = countryStations.cleanParams({stationsType:['b', 'a']}).stationsType;
                expect(stationsType).to.be.deep.equal(['a', 'b']);
            });

        });

        describe("unknown filters", function(){
            it("should not take unknown filters", function(){
                var stationsType = countryStations.cleanParams({Something:['b', 'a']});
                expect(stationsType).to.be.deep.equal({stationsType:[]});
            });

            it("should handle empty parameter", function(){
                var stationsType = countryStations.cleanParams();
                expect(stationsType).to.be.deep.equal({stationsType:[]});
            });
        });

        describe("name", function(){
            it("should take name if exists", function(){
                var stationsType = countryStations.cleanParams({name: "Station name"});
                expect(stationsType).to.be.deep.equal({stationsType:[], name: "Station name"});
            });

            it("should not take name if it is something else than string", function(){
                var stationsType = countryStations.cleanParams({name: ["value"]});
                expect(stationsType).to.be.deep.equal({stationsType:[]});

                stationsType = countryStations.cleanParams({name: {}});
                expect(stationsType).to.be.deep.equal({stationsType:[]});

                stationsType = countryStations.cleanParams({name: function(){}});
                expect(stationsType).to.be.deep.equal({stationsType:[]});
            });
        });
    });
});
