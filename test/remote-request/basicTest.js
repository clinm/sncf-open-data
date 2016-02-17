var path = require("path");
var fs = require("fs");

var bin_directory = path.join(__dirname, "../../bin");
var SNCF_FILE = path.join(bin_directory, "remote-request", "sncf-request");

var chai = require("chai");
var sinon = require("sinon");
var expect = chai.expect;
var request = require("request");
var sandbox;

var sncf = require(SNCF_FILE);

describe("Basic behaviour", function(){
    var spy;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
        spy = sandbox.stub(request, 'get');
    });

    afterEach(function () {
        sandbox.restore();
    });


    describe("get function", function(){

        it("should call callback", function(done){
            spy.yields();
            sncf.get("stop_areas", {}, done);
        });

        it("should call request.get", function(done){
            var msg = {dummy: "dummyContent"};
            var expected = {message: "Well done"};
            spy.yields(null, null, JSON.stringify(expected));
            sncf.get("stop_areas", {dummy: "dummyContent"}, function(error, response, body){
                expect(body).equals(JSON.stringify(expected));
                expect(spy.getCall(0).args[0].formData.message).equals(msg.message);
                done();
            });
        });

        it("should handle '/' at the beginning", function(done){
            var expected = {message: "Well done"};
            spy.yields(null, null, JSON.stringify(expected));

            var args= ["stop_areas/", "stop_areas/", "/stop_areas"];
            // call with and without '/'
            sncf.get(args[0], {dummy: "dummyContent"}, function(){
                sncf.get(args[1], {dummy: "dummyContent"}, function(){
                    sncf.get(args[2], {dummy: "dummyContent"}, function(){
                       for(var i = 0; i < spy.callCount; i++){
                           var url = spy.getCall(i).args[0].url;
                           expect(url.indexOf(args[i])).to.be.equals(url.length - args[i].length);
                       }
                        done();
                    });
                });
            });
        });
    });

    describe("getAll function", function(){
        it("should not call a second time when everything has been received", function(done){
            var response = {pagination: {items_on_page: 30, total_result: 30}};
            spy.yields(null, {statusCode: 200}, JSON.stringify(response));

            sncf.getAll("dummy", {}, function(){
                //noinspection JSUnresolvedVariable,BadExpressionStatementJS
                expect(spy.calledOnce).to.be.true;
                done();
            });
        });

        it("should clean request", function(done){
            var expected = [{message: "Hello"}];
            var response = {pagination: {items_on_page: 30, total_result: 30}, content:expected};
            spy.yields(null, {statusCode: 200}, JSON.stringify(response));

            sncf.getAll("dummy", {}, function(error, response, body){
                expect(body).to.be.deep.equal(expected);
                done();
            });
        });

        it("should perform all requests needed (total = k*1000 + r)", function(done){
            // should have 1 request at the beginning and then 3 more
            // 1*1000 + (2*1000 + 1*15) = 3015
            var response = {pagination: {items_on_page: 1000, total_result: 3015}};
            spy.yields(null, {statusCode: 200}, JSON.stringify(response));

            sncf.getAll("dummy", {}, function(){
                expect(spy.callCount).equals(4);
                var startPages = [];
                for(var i = 1; i < spy.callCount; i++){
                    var elt = spy.getCall(i);
                    startPages[elt.args[0].formData.start_page] = true;
                }

                for(i = 1; i < 4; i++){
                    //noinspection BadExpressionStatementJS
                    expect(startPages[i]).to.be.true;
                }

                done();
            })

        });


        it("should perform all requests needed (total = k*1000)", function(done){
            // should have 1 request at the beginning and then 2 more
            // 1*1000 + (2*1000) = 3000
            var response = {pagination: {items_on_page: 1000, total_result: 3000}};
            spy.yields(null, {statusCode: 200}, JSON.stringify(response));

            sncf.getAll("dummy", {}, function(){
                expect(spy.callCount).equals(3);
                var startPages = [];
                for(var i = 1; i < spy.callCount; i++){
                    var elt = spy.getCall(i);
                    startPages[elt.args[0].formData.start_page] = true;
                }

                for(i = 1; i < 3; i++){
                    //noinspection BadExpressionStatementJS
                    expect(startPages[i]).to.be.true;
                }

                done();
            })

        });
    });

    describe("performAllRequest", function(){
        it("should do nothing when start > end", function(done){
            var response = {pagination: {items_on_page: 30, total_result: 30}};
            spy.yields(null, {statusCode: 200}, JSON.stringify(response));
            sncf.performsAllRequest("url", {}, 10, -100, 0, function(){
                expect(spy.callCount).to.be.equal(0);
            }, []);
            done();
        });

        it("should use [] as default seed", function(done){
            var response = {result: {message: "My message"}};
            spy.yields(null, {statusCode: 200}, JSON.stringify(response));
            //noinspection JSCheckFunctionSignatures
            sncf.performsAllRequest("url", {}, 1, 10, 3, function(error, response, body){
                expect(spy.callCount).to.be.equal(2);
                //noinspection BadExpressionStatementJS
                expect(body).to.be.exist;
                expect(body.length).to.be.equal(2);
            });
            done();
        });

        it("should return error", function(done){
            var expected = {result: {message: "My error message"}};
            spy.yields(null, {statusCode: 200}, JSON.stringify(expected));
            sncf.performsAllRequest("url", {}, 1, 10, 2, function(error, response, body){
                expect(spy.callCount).to.be.equal(1);
                //noinspection BadExpressionStatementJS
                expect(body).to.be.exist;
                expect(body).to.be.deep.equal([expected.result]);
                done();
            }, []);
        });
    });

    describe("cleanResponse", function(){
        it("should clean response", function(){
            var response = {
                "disruptions": [],
                "pagination": {},
                "links": [],
                "feed_publishers": []
            };

            var responseAsString = JSON.stringify(response);

            expect(sncf.cleanResponse(response)).to.deep.equal({});
            expect(sncf.cleanResponse(responseAsString)).to.deep.equal({});
        });
    });

});