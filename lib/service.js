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
var serviceObject = require('./serviceObject');
var promise = require('promise');
var responseTimer = require('./responseTimer');

// Comcast Connected Health
// 2016
//

function returnResponse(reply, message, return_code){
    var response = reply({"message": message, "status": return_code});
    response.statusCode = return_code;
    return response;
}

// After successful login call main function.
var main = function (req, ws, access_token) {
    return new promise(function (resolve, reject) {
        if (req.payload.request.method === 'POST') {
            ws.search('[service_order_id = "' + req.payload.request.body.service_order_id + '", __class__ = "service_order"]').on('success', function (searchData, response) {
                if (JSON.stringify(searchData) === '{}') {
                    console.log("Nothing found");
                    serviceObject.createServiceObject(ws, req).then(function (resultUserBehaviorObject) {
                        resolve({"message": resultUserBehaviorObject.message, "status": resultUserBehaviorObject.status});
                    }).catch(function (error) {
                        reject({"message": error.message, "status": error.status});
                    });
                } else {
                    logger.error("Service order already exist with this service_order_id");
                    reject({"message": "Service order already exist", "status": 409});
                }
            }).on("error", function (error) {
                logger.error("Error searching service_order_id  " + error);
                reject({"message": "Something went wrong in the system", "status": 500});
            });
        } else if (req.payload.request.method === 'GET') {
            console.log("GET call Nothing found");
            serviceObject.searchServiceObject(ws, req, access_token).then(function (profileData) {
                resolve({"message": profileData.message, "status": profileData.status});
            }).catch(function (error) {
                reject({"message": error.message, "status": error.status});
            });
        } else if (req.payload.request.method === 'PUT') {
            ws.search('[service_order_id = "' + req.payload.request.body.service_order_id + '", __class__ = "service_order"]').on('success', function (searchData, response) {
                if (JSON.stringify(searchData) === '{}') {
                    console.log("PUT call Nothing found");
                    serviceObject.createServiceObject(ws, req).then(function (resultUserBehaviorObject) {
                        resolve({"message": resultUserBehaviorObject.message, "status": resultUserBehaviorObject.status});
                    }).catch(function (error) {
                        console.log(error);
                        reject({"message": error.message, "status": error.status});
                    });
                } else {
                    serviceObject.updateServiceObject(ws, req, searchData).then(function (resultUserBehaviorObject) {
                        resolve({"message": resultUserBehaviorObject.message, "status": resultUserBehaviorObject.status});
                    }).catch(function (error) {
                        console.log(error);
                        reject({"message": error.message, "status": error.status});
                    });
                }
            }).on("error", function (error) {
                logger.error("Error searching service_order_id  " + error);
                reject({"message": "Something went wrong in the system", "status": 500});
            });
        } else {
            logger.error("Method isn't supported");
            reject({"message": "Not Implemented yet!", "status": 501});
        }
    });
};

module.exports = function(req, reply) {
    var handler = function () {
        return new Promise(function (resolve, reject) {
    local_validate.validate_req(req)
        .then(function (result) {
            var login = require('./login');
            var access_token=req.payload.session['session_token'];
            var ws=localCache.get(access_token+"WS");
            if(ws !== undefined && ws !== "") {
                logger.info("No need to create WS object again");
                main(req, ws, access_token).then(function(result){
                    resolve(result);
                    return returnResponse(reply, result.message, result.status);
                }).catch(function(error){
                    reject(error);
                    return returnResponse(reply, error.message, error.status);
                });
            }else{
                login.getWS(req).then(function (response_ws) {
                    main(req, response_ws, access_token).then(function(result){
                        resolve(result);
                        return returnResponse(reply, result.message, result.status);
                    }).catch(function(error){
                        reject(error);
                        return returnResponse(reply, error.message, error.status);
                    });
                }).catch(function (error) {
                    return returnResponse(reply, error.message,error.status);
                });
            }
        }).catch(function (error) {
        logger.error(error);
        return returnResponse(reply, error, 400);
    });
        }); //end of promise
    }; //end of delegate function

    var callback = function (durationTime, status) {
        logger.info(status + ' => ' + 'It took ' + durationTime + ' milliseconds for the ' + req.payload.request.method + ' call' + ' at this endpoint ' + req.path);
    }

    responseTimer.responseTimeLogger(handler, callback)();
};
