/**
 * Created by hsingh008c on 12/14/16.
 */

'use strict';
var cloudmine = require('cloudmine');
var rest = require('restler');
var config = require('config');
var local_validate = require('./local_validator');
var search_local = require('./search');
var adminUtility = require('./adminUtility');
var localCache = require("./cache");
var logger = require('./logger_module');
var domain = config.get('cch.domain');
var login = require('./login');
//

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
            //Search the record first then add, otherwise Update
            try {
                ws.search('[profile.partner_id = "' + req.payload.request.body.partner_id + '"]').on('success', function (searchData, response) {
                    if (JSON.stringify(searchData) === '{}') {
                        adminUtility.createUserAndProfile(ws, req, searchData, access_token).then(function(createResult) {
                            returnResonse(createResult.message, createResult.status);
                        }).catch(function (createResultError) {
                            returnResonse(createResultError.message, createResultError.status);
                        });
                    } else {
                        logger.error("User profile already exist");
                        returnResonse("User profile already exist",409);
                    }
                }).on("error", function (error) {
                    logger.error("Error searching partner_id" + error);
                    returnResonse("Error searching partner_id" + error,404);
                });
            }catch (error) {
                logger.error("Server Error" + error);
                returnResonse("Server Error",500);
            }
        } else if (req.payload.request.method === 'GET') {
            try {
                search_local.getUserProfileBasedOnReq(ws, req, access_token).then(function (profileData){
                    returnResonse(profileData,200);
                }).catch(function (error){
                    returnResonse(error.message,error.status);
                });
            } catch (err) {
                logger.error("Server Error" + err);
                returnResonse("Server Error",500);
            }
        } else if (req.payload.request.method === 'PUT') {
            var rejectIfNotExist = false;
            try {

                var params_keys = Object.keys(req.payload.request.body);
                if (params_keys.indexOf("request_type") > -1) {
                    if (req.payload.request.body["request_type"] == "status_update") {
                        rejectIfNotExist = true;
                    }
                }
                ws.search('[profile.partner_id = "' + req.payload.request.body.partner_id + '"]').on('success', function (searchData, response) {
                    if (JSON.stringify(searchData) === '{}') {
                        if(rejectIfNotExist){
                            logger.error("Profile doesn't exist which trying to update");
                            returnResonse("Profile doesn't exist.", 404);
                        }else {
                            adminUtility.createUserAndProfile(ws, req, searchData, access_token).then(function (createResult) {
                                returnResonse(createResult.message, createResult.status);
                            }).catch(function (createResultError) {
                                returnResonse(createResultError.message, createResultError.status);
                            });
                        }
                    } else {
                        adminUtility.updateProfileAndLdap(ws, req, searchData, access_token).then(function(updateResult) {
                            returnResonse(updateResult.message, updateResult.status);
                        }).catch(function (updateResultError) {
                            returnResonse(updateResultError.message, updateResultError.status);
                        });

                    }
                }).on('error', function (err) {
                    logger.error(err);
                    returnResonse(err,400);
                });
            }catch (error) {
                logger.error("Server Error" + error);
                returnResonse("Server Error",500);
            }
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