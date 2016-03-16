/**
 * Created by Matthieu on 17/02/2016.
 */
var path = require("path");
var fs = require("fs");
var bin_directory = path.join(__dirname, "../bin");
var CONF_FILE = path.join(__dirname, '../conf', 'CONF.json');
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
            expect(countryStations.getPath()).to.endsWith("stations.json");
            expect(countryStations.getPath({stationsType: []})).to.endsWith("stations.json");
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
            var associate = sandbox.stub(countryStations, 'associate', function(e){return e;});
            var filter = sandbox.stub(countryStations, 'doFilter', function(params, values){return values;});
            countryStations.getResources({}, function(result){
                expect(associate.callCount).to.be.equal(1);
                expect(filter.callCount).to.be.equal(1);
                expect(spy.callCount).to.be.equal(1);
                expect(result).to.be.deep.equal(expected.stop_areas);
                done();
            });
        });

        it("should retrieve data from previous request", function(done){
            //noinspection JSCheckFunctionSignatures
            var res = require(countryStations.getPath());
            var filter = sandbox.stub(countryStations, 'doFilter', function(params, values){return values;});
            countryStations.getResources({}, function(result){
                expect(spy.callCount).to.be.equal(0);
                expect(filter.callCount).to.be.equal(1);
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

        var stationInfo = {
            "datasetid": "referentiel-gares-voyageurs",
            "recordid": "012455250769df86afca0a59cb19c80d923df1ac",
            "fields": {
                "departement": "Moselle",
                "commune": "Metz",
                "uic": "0087192039",
                "segment_drg": "a",
                "region": "Lorraine",
                "nombre_plateformes": "1",
                "niveau_de_service": "3",
                "intitule_gare": "Metz Ville",
                "code_postal": "57000"
            }
        };

        var resource = [{
            "name": "gare de Metz-Ville",
            "links": [],
            "coord": {
                "lat": "49.109759",
                "lon": "6.177198"
            },
            "label": "gare de Metz-Ville (Metz)",
            "administrative_regions": [
                {
                    "insee": "57463",
                    "name": "Metz",
                    "level": 8,
                    "coord": {
                        "lat": "49.119698",
                        "lon": "6.176355"
                    },
                    "label": "Metz (57000-57070)",
                    "id": "admin:450381extern",
                    "zip_code": "57000;57070"
                }
            ],
            "timezone": "Europe/Paris",
            "id": "stop_area:OCE:SA:87192039",
            "fields": {
                "departement": "Moselle",
                "commune": "Metz",
                "uic": "0087192039",
                "segment_drg": "a",
                "region": "Lorraine",
                "nombre_plateformes": "1",
                "niveau_de_service": "3",
                "intitule_gare": "Metz Ville",
                "code_postal": "57000"
            }

        }];

        it("should filter using fields and keep", function(){
            Object.keys(stationInfo.fields).forEach(function(elt){
                var res = countryStations.doFilter({fields: {elt: stationInfo.fields[elt]}}, resource);
                expect(res).to.be.deep.equal(res);
            });
        });

        it("should filter using fields and not keep", function(){
            var stationInfo = {
                "fields": {
                    "departement": "Incorrect",
                    "commune": "Incorrect",
                    "uic": "Incorrect",
                    "segment_drg": "Incorrect",
                    "region": "Incorrect",
                    "nombre_plateformes": "Incorrect",
                    "niveau_de_service": "Incorrect",
                    "intitule_gare": "Incorrect",
                    "code_postal": "Incorrect"
                }
            };
            Object.keys(stationInfo.fields).forEach(function(elt){
                var params = {fields: {}};
                params.fields[elt] = stationInfo.fields[elt];
                var res = countryStations.doFilter(params, resource);
                expect(res).to.be.deep.equal([]);
            });
        });
    });

    describe("cleanParams", function(){
        var defaultRes  = {fields: {}};

        describe("unknown filters", function(){
            it("should not take unknown filters", function(){
                var params = countryStations.cleanParams({Something:['b', 'a']});
                expect(params).to.be.deep.equal(defaultRes);
            });

            it("should handle empty parameter", function(){
                var params = countryStations.cleanParams();
                expect(params).to.be.deep.equal(defaultRes);
            });
        });

        describe("name", function(){
            it("should take name if exists", function(){
                var expected = {};
                Object.assign(expected, defaultRes);
                expected.name = "Station name";

                var params = countryStations.cleanParams({name: "Station name"});
                expect(params).to.be.deep.equal(expected);
            });

            it("should not take name if it is something else than string", function(){
                var params = countryStations.cleanParams({name: ["value"]});
                expect(params).to.be.deep.equal(defaultRes);

                params = countryStations.cleanParams({name: {}});
                expect(params).to.be.deep.equal(defaultRes);

                params = countryStations.cleanParams({name: function(){}});
                expect(params).to.be.deep.equal(defaultRes);
            });

        });

        describe("fields", function(){
            it("should add fields filters", function(){
                var fields = [{"departement": ""}, {"commune": ""},
                                {"uic": ""}, {"segment_drg": ""},
                                {"region": ""},{"nombre_plateformes": ""},
                                {"niveau_de_service": ""}, {"intitule_gare": ""},
                                {"code_postal": ""}];

                fields.forEach(function(elt){
                    var expected = {};
                    Object.assign(expected, defaultRes);
                    expected.fields = elt;

                    var params = countryStations.cleanParams({fields: elt});
                    expect(params).to.be.deep.equal(expected);
                });

            });

            it("should filter fields when unauthorized", function(){
                var fields = [{departement: "my value"}, {segment_drg: "c"}];
                var errors = [{dummy: "dummy"}, {yolo: "yolo"}];

                fields.forEach(function(elt, index){
                    var expected = {};
                    Object.assign(expected, defaultRes);
                    expected.fields = elt;

                    var fieldsWithErrors = {};
                    Object.assign(fieldsWithErrors, expected, errors[index]);
                    var params = countryStations.cleanParams(fieldsWithErrors);
                    expect(params).to.be.deep.equal(expected);
                });

            });

            it("should not take incorrect regex for fields", function(){
                var params = countryStations.cleanParams({fields: {departement: "#{\^[@"}});
                expect(params.fields).to.be.deep.equal({});
            });

            it("should not take incorrect regex for name", function(){
                var params = countryStations.cleanParams({name: "#{\^[@"});
                expect(params).to.be.deep.equal({fields:{}});
            })
        });
    });
});
