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
        var response = reply(message);
        response.statusCode = return_code;
        return response;
    }
    // After successful login call main function.
    var main = function (ws, access_token) {
        if (req.payload.request.method === 'POST') {
            //Search the record first then add, otherwise Update
            try {
                ws.search('[profile.partner_id = "' + req.payload.params.partner_id + '"]').on('success', function (searchData, response) {
                    if (JSON.stringify(searchData) === '{}') {
                        adminUtility.createUserAndProfile(ws, req, searchData, reply, access_token).then(function(createResult) {
                            returnResonse(createResult.message, createResult.status);
                        }).catch(function (createResultError) {
                            returnResonse(createResultError.message, createResultError.status);
                        });
                    } else {
                        //update(ws, req, searchData, reply, access_token);
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
                search_local.getUserProfileBasedOnReq(ws, req, reply, access_token).then(function (profileData){
                    returnResonse(profileData,200);
                }).catch(function (error){
                    returnResonse(error.message,error.status);
                });
            } catch (err) {
                logger.error("Server Error" + err);
                returnResonse("Server Error",500);
            }
        } else if (req.payload.request.method === 'PUT') {
            try {
                ws.search('[profile.partner_id = "' + req.payload.params.partner_id + '"]').on('success', function (searchData, response) {
                    if (JSON.stringify(searchData) === '{}') {
                        //logger.info(searchData)
                        // logger.debug("User profile does't exist");
                        adminUtility.createUserAndProfile(ws, req, searchData, reply, access_token).then(function(createResult) {
                            returnResonse(createResult.message, createResult.status);
                        }).catch(function (createResultError) {
                            returnResonse(createResultError.message, createResultError.status);
                        });
                    } else {
                        adminUtility.updateProfileAndLdap(ws, req, searchData, reply,access_token).then(function(updateResult) {
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
//TESTING to make sure user we added also have access to its own profile since data belongs to admin user.
//     var testws = new cloudmine.WebService({
//         appid: req.payload.session.app_id,
//         apikey: req.payload.session.api_key,
//         shared: true,
//         appname: "UserAccount"
//     });
//     // care_manager CM2
//     testws.login("68e60980-d1d3-4867-bf50-d4ac193f6a9a@cch.com", "68e60980-d1d3-4867-bf50-d4ac193f6a9a-cch")
//         .on('success', function (data, response) {
//             logger.info("Login successful");
//             logger.info(data['session_token']);
//             console.log(data['session_token']);
//             //localStorage.setItem('cm_session', response.session_token);
//             //localCache.set(req.payload.session['session_token'], data['session_token']);
//             main(testws, req, reply);
//         }).on('error', function (err) {
//         logger.error("login error" + err);
//         //reply(err);
//     });

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