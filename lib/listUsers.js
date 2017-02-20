/**
 * Created by hsingh008c on 2/3/17.
 */
/**
 * Created by hsingh008c on 12/14/16.
 */

'use strict';
var cloudmine = require('cloudmine');
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
        if (req.payload.request.method === 'GET') {
            try {
                search_local.getAllUserProfileBasedOnReq(ws, req, access_token).then(function (profileData){
                    returnResonse(profileData,200);
                }).catch(function (error){
                    returnResonse(error.message, error.status);
                });
            } catch (err) {
                logger.error("Server Error" + err);
                returnResonse("Server Error", 500);
            }
        }else {
            logger.error("Method isn't supported");
            returnResonse("Method isn't supported", 501);
        }
    };

    local_validate.validate_req(req).then(function (result) {
        var access_token = req.payload.session['session_token'];
        var ws = localCache.get(access_token + "WS");
        if (ws !== undefined && ws !== "") {
            logger.info("No need to create WS object again");
            main(ws, access_token);
        } else {
            login.getWS(req).then(function (response_ws) {
                main(response_ws, access_token);
            }).catch(function (error) {
                returnResonse(error.message,error.status);
            });
        }
    }).catch(function (error) {
        logger.error(error);
        returnResonse(error, 400);
    });
};