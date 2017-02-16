/**
 * Created by hsingh008c on 2/9/17.
 */

'use strict';
var cloudmine = require('cloudmine');
var config = require('config');
var local_validate = require('./local_validator');

var localCache = require("./cache");
var logger = require('./logger_module');
var domain = config.get('cch.domain');
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
    local_validate.validate_req(req).then(function (result) {
        var access_token = req.payload.session['session_token'];
        var ws = localCache.get(access_token+"WS");
        if(ws !== undefined && ws !== "") {
            console.log("logout from WS");
            ws.logout().on('success', function() {
                localCache.del([access_token, access_token+"WS", access_token + "cch_id", access_token + "partner_id", access_token + "member_partner_id"], function( err, count ){
                    if( !err ){
                        logger.info("Logout successful");
                        returnResonse("Logout successful", 200);
                    }else{
                        logger.error("Failed to logout" + err);
                        returnResonse("Failed to logout", 400);
                    }
                });
            }).on('error', function (error){
                logger.info("Logout Error" + error);
                returnResonse("Failed to logout" + error, 400);
            });
        }else {
            console.log("There is no WS to logout");
            localCache.del([access_token, access_token + "WS", access_token + "cch_id", access_token + "partner_id", access_token + "member_partner_id"], function (err, count) {
                if (!err) {
                    logger.info("Logout successful");
                    returnResonse("Logout successful", 200);
                } else {
                    logger.error("Failed to logout" + err);
                    returnResonse("Failed to logout", 400);
                }
            });
        }
    }).catch(function (error) {
        logger.error(error);
        returnResonse(error, 400);
    });
};