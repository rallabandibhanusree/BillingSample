/**
 * Created by hsingh008c on 3/13/17.
 */

'use strict';
var cloudmine = require('cloudmine');
var rest = require('restler');
var config = require('config');
var local_validate = require('./local_validator');
var search_local = require('./search');
var localCache = require("./cache");
var logger = require('./logger_module');
var domain = config.get('cch.domain');
var login = require('./login');
var serviceObject = require('./serviceObject');

// Comcast Connected Health
// 2016
//

module.exports = function(req, reply) {
    function returnResonse(message, return_code){
        var response = reply({"message": message, "status": return_code});
        response.statusCode = return_code;
        return response;
    }
    // After successful login call main function.
    var main = function (ws, access_token) {
        if (req.payload.request.method === 'POST') {
            ws.search('[service_order_id = "' + req.payload.request.body.service_order_id + '", __class__ = "service_order"]').on('success', function (searchData, response) {
                if (JSON.stringify(searchData) === '{}') {
                    console.log("Nothing found");
                    serviceObject.createServiceObject(ws, req).then(function (resultUserBehaviorObject) {
                        returnResonse(resultUserBehaviorObject.message,resultUserBehaviorObject.status);
                    }).catch(function (error) {
                        console.log(error);
                        returnResonse(error.message, error.status);
                    });
                }else{
                    logger.error("Service order already exist with this service_order_id");
                    returnResonse("Service order already exist",409);
                }
            }).on("error", function (error) {
                logger.error("Error searching service_order_id  " + error);
                returnResonse("Something went wrong in the system", 5);
            });
        } else if (req.payload.request.method === 'GET') {
            try {
                serviceObject.searchServiceObject(ws, req, access_token).then(function (profileData){
                    returnResonse(profileData.message,profileData.status);
                }).catch(function (error){
                    returnResonse(error.message,error.status);
                });
            } catch (err) {
                logger.error("Server Error" + err);
                returnResonse("Server Error",500);
            }
        } else if (req.payload.request.method === 'PUT') {
            ws.search('[service_order_id = "' + req.payload.request.body.service_order_id + '", __class__ = "service_order"]').on('success', function (searchData, response) {
                if (JSON.stringify(searchData) === '{}') {
                    console.log("PUT call Nothing found");
                    serviceObject.createServiceObject(ws, req).then(function (resultUserBehaviorObject) {
                        returnResonse(resultUserBehaviorObject.message, resultUserBehaviorObject.status);
                    }).catch(function (error) {
                        console.log(error);
                        returnResonse(error.message, error.status);
                    });
                }else{
                    serviceObject.updateServiceObject(ws, req, searchData).then(function (resultUserBehaviorObject) {
                        returnResonse(resultUserBehaviorObject.message, resultUserBehaviorObject.status);
                    }).catch(function (error) {
                        console.log(error);
                        returnResonse(error.message, error.status);
                    });
                }
            }).on("error", function (error) {
                logger.error("Error searching service_order_id  " + error);
                returnResonse("Something went wrong in the system", 5);
            });
        } else {
            logger.error("Method isn't supported");
            returnResonse("Not Implemented yet!",501);
        }
    };

    local_validate.validate_req(req)
        .then(function (result) {
            var access_token=req.payload.session['session_token'];
            var ws=localCache.get(access_token+"WS");
            if(ws !== undefined && ws !== "") {
                logger.info("No need to create WS object again");
                main(ws, access_token);
            }else{
                login.getWS(req).then(function (response_ws) {
                    main(response_ws, access_token);
                }).catch(function (error) {
                    returnResonse(error.message,error.status);
                });
            }
        }).catch(function (error) {
        logger.error(error);
        returnResonse(error,400);
    });
};
