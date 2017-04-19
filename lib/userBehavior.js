/**
 * Created by hsingh008c on 2/10/17.
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
var updateObject = require('./updateObject');
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
            updateObject.updateUserBehaviorObject(ws, req).then(function (resultUserBehaviorObject) {
                resolve({"message": resultUserBehaviorObject, "status": 200});
            }).catch(function (error) {
                reject({"message": error, "status": 400});
            });
        } else if (req.payload.request.method === 'GET') {
            search_local.getUserBehaviorObjectBasedOnReq(ws, req, access_token).then(function (profileData) {
                resolve({"message": profileData, "status": 200});
            }).catch(function (error) {
                reject({"message": error.message, "status": error.status});
            });
        } else if (req.payload.request.method === 'PUT') {
            updateObject.putUpdateUserBehaviorObject(ws, req).then(function (resultUserBehaviorObject) {
                resolve({"message": resultUserBehaviorObject, "status": 200});
            }).catch(function (error) {
                reject({"message": error, "status": 400});
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
    local_validate.validate_req_user_behavior(req)
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
        return returnResponse(reply, error,400);
    });
        }); //end of promise
    }; //end of delegate function

    var callback = function (durationTime, status) {
        logger.info(status + ' => ' + 'It took ' + durationTime + ' milliseconds for the ' + req.payload.request.method + ' call' + ' at this endpoint ' + req.path);
    }

    responseTimer.responseTimeLogger(handler, callback)();
};