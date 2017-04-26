/**
 * Created by bralla200 on 4/20/2017.
 */


'use strict';
var cloudmine = require('cloudmine');
var rest = require('restler');
var config = require('config');
var local_validate = require('./local_validator');
var localCache = require("./cache");
var logger = require('./logger_module');
var domain = config.get('cch.domain');
var promise = require('promise');
var responseTimer = require('./responseTimer');
var search_local = require('./search');
var adminUtility = require('./adminUtility');
var billingEventObject= require('./billingEventObject');

function returnResponse(reply, message, return_code){
    var response = reply({"message": message, "status": return_code});
    response.statusCode = return_code;
    return response;
}

var main = function (req, ws, access_token) {
    return new promise(function (resolve, reject) {
        if (req.payload.request.method === 'POST') {
            billingEventObject.createBillingObject(ws, req).then(function (resultUserBillingObject) {
                        resolve({"message": resultUserBillingObject.message, "status": resultUserBillingObject.status});
                    }).catch(function (error) {
                        reject({"message": error.message, "status": error.status});
                    });

        } else if (req.payload.request.method === 'GET') {
           var search_string='['+req.payload.params.search+']';
            console.log("line51",req.payload.params.search);
           search_local.getUserProfileBasedOnSearchString(ws, search_string).then(function (profileData) {
                resolve({"message": profileData, "status": 200});
            }).catch(function (error) {
                reject({"message": error.message, "status": error.status});
            });

        } else if (req.payload.request.method === 'PUT') {
           ws.search('[cch_id = "' + req.payload.request.body.cch_id + '", __class__ = "billing"]').on('success', function (searchData, response) {
                if (JSON.stringify(searchData) === '{}') {
                    console.log("PUT call Nothing found");
            billingEventObject.createBillingObject(ws, req).then(function (resultBIllingObject) {
                        resolve({"message": resultBIllingObject.message, "status": resultBIllingObject.status});
                    }).catch(function (error) {
                        console.log(error);
                        reject({"message": error.message, "status": error.status});
                    });
                } else {
            billingEventObject.updateBillingObject(ws, req, searchData).then(function (resultBIllingObject) {
                        resolve({"message": resultBIllingObject.message, "status": resultBIllingObject.status});
                    }).catch(function (error) {
                        console.log(error);
                        reject({"message": error.message, "status": error.status});
                    });
                }
            }).on("error", function (error) {
                logger.error("Error searching cch_id  " + error);
                reject({"message": "System Error - Something went wrong in the system", "status": 500});

            }).on('error', function (err) {
                logger.error(err);
                reject({"message": err, "status": 400});
            });
        }else {
            logger.error("Method Not Allowed");
            reject({"message": "Method Not Allowed", "status": 405});
        }
    });
};
module.exports= function(req, reply){
    var handler = function () {
        return new Promise(function (resolve, reject) {
            var trace = (req.payload.params && req.payload.params.trace);

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
                             //reject(error);
                             return returnResponse(reply, error.message,error.status);
                         });
                     }
                 }).catch(function (error) {
                 logger.error(error);
                 return returnResponse(reply, error,400);
             });
        }); //end of promise
    }; //end of delegate function

    var callback = function (durationTime, status) {
        logger.info(status + ' => ' + 'It took ' + durationTime + ' milliseconds for the ' + req.payload.request.method + ' call' + ' at this endpoint ' + req.path);
    };

    responseTimer.responseTimeLogger(handler, callback)();


};
