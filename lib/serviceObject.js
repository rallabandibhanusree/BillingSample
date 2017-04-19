/**
 * Created by hsingh008c on 3/13/17.
 */

'use strict';
var cloudmine = require('cloudmine');
var logger = require('./logger_module');
var config = require('config');
var local_cache = require("./cache");
var local_validate = require('./local_validator');
var acl = require('./acl');
var rest = require('restler');
var promise = require('promise');
var search_local = require('./search');
var uuidV4 = require('uuid/v4');
//
// Comcast Connected Health
// 2016
//
// Create service order.
function createServiceOrderObjectInCLM(ws, update_obj){
    return new promise(function (resolve, reject) {
        ws.set(update_obj).on('success', function (Profiledata, response) {
            logger.info("Service Order created successfully");
            resolve({"message": "Service Order created successfully", "status": 201});
        }).on('error', function (error) {
            logger.error("Error creating service order" + error);
            reject({"message": error, "status": 400});
        });
    });
}
// Update service order
function updateServiceOrderObjectInCLM(ws, update_obj){
    return new promise(function (resolve, reject) {
        ws.update(update_obj).on('success', function (Profiledata, response) {
            logger.info("Service Order updated successfully");
            resolve({"message": "Service Order updated successfully", "status": 200});
        }).on('error', function (error) {
            logger.error("Error updating service order" + error);
            reject({"message": error, "status": 400});
        });
    });
}
module.exports = {
    createServiceObject: function(ws, req) {
        return new promise(function (resolve, reject) {
            // Validate payload.
            local_validate.validate_val_service_order(req).then(function (validate_result) {
                var uuid = uuidV4();
                var update_obj = {};
                var timestamp = new Date().toISOString();
                var external_id = req.payload.request.body.external_id;
                var search_string = '[profile.external_id = "' + req.payload.request.body.external_id + '",  __class__ = "user"]';
                // Make sure user profile exist in the system before we add service order in the system.
                search_local.getUserProfileBasedOnSearchString(ws, search_string).then(function (user_profile) {
                    var user_profile_keys = Object.keys(user_profile);
                    var params_keys = Object.keys(req.payload.request.body);
                    var user_data_obj_update = {};
                    for (var i = 0; i < params_keys.length; i++) {
                        if (params_keys[i] === 'password' || params_keys[i] === 'access-token' || params_keys[i] === 'request_type') {
                            continue;
                        }
                        user_data_obj_update[params_keys[i]] = req.payload.request.body[params_keys[i]];
                    }
                    user_data_obj_update['__class__'] = "service_order";
                    user_data_obj_update['update_time'] = timestamp;
                    user_data_obj_update['cch_id'] = user_profile[user_profile_keys[0]]["profile"]["cch_id"];

                    acl.addUpdateAclForServiceOrder(ws, external_id, user_profile[user_profile_keys[0]]["profile"]["user_id"]).then(function(acl_result) {
                        // We need to make sure acl's are in the system before we create new object.
                        user_data_obj_update['__access__'] = acl_result;
                        update_obj[uuid] = user_data_obj_update;
                        createServiceOrderObjectInCLM(ws, update_obj).then(function (createServiceOrderResult) {
                            resolve({"message": createServiceOrderResult.message, "status": createServiceOrderResult.status});
                        }).catch(function (createServiceOrderError) {
                            logger.error(createServiceOrderError);
                            reject({"message": createServiceOrderError.message, "status": createServiceOrderError.status});
                        });
                    }).catch(function (aclError){
                        logger.error(aclError);
                        reject({"message": "Couldn't create service order", "status": 400});
                    });
                }).catch(function (error) {
                    logger.error(error);
                    reject({"message": "Couldn't create service order", "status": 400});
                });
            }).catch(function (error) {
                logger.error(error);
                reject({"message": error, "status": 400});
            });
        });
    },
    updateServiceObject: function(ws, req, searchData) {
        return new promise(function (resolve, reject) {
            // Validate payload.
            var timestamp = new Date().toISOString();
            var service_order_update_required = false;
            local_validate.validate_val_service_order(req).then(function (validate_result) {
                var service_order_id = Object.keys(searchData);
                var update_obj = {};
                var external_id = req.payload.request.body.external_id;
                var search_string = '[profile.external_id = "' + req.payload.request.body.external_id + '", __class__ = "user"]';
                // Make sure user profile exist in the system before we add service order in the system.
                search_local.getUserProfileBasedOnSearchString(ws, search_string).then(function (user_profile) {
                    var user_profile_keys = Object.keys(user_profile);
                    var params_keys = Object.keys(req.payload.request.body);
                    var user_data_obj_update = {};
                    for (var i = 0; i < params_keys.length; i++) {
                        if (params_keys[i] === 'password' || params_keys[i] === 'access-token' || params_keys[i] === 'request_type') {
                            continue;
                        }
                        if(searchData[service_order_id[0]][params_keys[i]] != req.payload.request.body[params_keys[i]]){
                            user_data_obj_update[params_keys[i]] = req.payload.request.body[params_keys[i]];
                            service_order_update_required = true;
                        }
                    }
                    if(service_order_update_required) {
                        user_data_obj_update['update_time'] = timestamp;
                        var user_id = "";
                        acl.addUpdateAclForServiceOrder(ws, external_id, user_profile[user_profile_keys[0]]["profile"]["user_id"]).then(function (acl_result) {
                            // We need to make sure acl's are in the system before we create new object.
                            user_data_obj_update['__access__'] = acl_result;
                            update_obj[service_order_id[0]] = user_data_obj_update;
                            updateServiceOrderObjectInCLM(ws, update_obj).then(function (createServiceOrderResult) {
                                resolve({
                                    "message": createServiceOrderResult.message,
                                    "status": createServiceOrderResult.status
                                });
                            }).catch(function (createServiceOrderError) {
                                logger.error(createServiceOrderError);
                                reject({
                                    "message": createServiceOrderError.message,
                                    "status": createServiceOrderError.status
                                });
                            });
                        }).catch(function (aclError) {
                            logger.error(aclError);
                            reject({"message": "Couldn't Update service order", "status": 400});
                        });
                    }else{
                        resolve({
                            "message": "Service order is already up to date, Nothing Changed",
                            "status": 200
                        });
                    }
                }).catch(function (error) {
                    logger.error(error);
                    reject({"message": "Couldn't create service order", "status": 400});
                });
            }).catch(function (error) {
                logger.error(error);
                reject({"message": error, "status": 400});
            });
        });
    },
    searchServiceObject: function(ws, req, access_token) {
        return new promise(function (resolve, reject) {
            // ws.search('[profile.role = "CAREMANAGER"]').on('success', function (searchData, response) {
            //     console.log(searchData);
            //     resolve(searchData);
            // }).on("error", function (error) {
            //     logger.error("Error searching external_id");
            //     reject(error);
            // });
            //var ws = local_cache.get(access_token + "WS");
            var search_string = "";
            var _cch_id = local_cache.get(access_token + "cch_id");
            var cch_id;

            try {
                if (req.payload.params !== null) {
                    search_string = '[cch_id = "' + _cch_id + '", __class__ = "service_order"]';
                    if (typeof req.payload.params.cch_id !== "undefined") {
                        if (req.payload.params.cch_id == "self" && _cch_id !== undefined && _cch_id !== "") {
                            cch_id = _cch_id
                        } else {
                            cch_id = req.payload.params.cch_id;
                        }
                        search_string = '[cch_id = "' + cch_id + '", __class__ = "service_order"]';
                    }else if (typeof req.payload.params.service_order_id !== "undefined"){
                        search_string = '[service_order_id = "' + req.payload.params.service_order_id + '", __class__ = "service_order"]';
                    } else {
                        if (typeof req.payload.params.search !== "undefined") {
                            // Make search case insensitive
                            var search="";
                            search = search.concat(req.payload.params.search.split(",").map(function (val){  return val.replace(/"([^"]+(?="))"/g, '/$1/i'); }));
                            search_string = '[' + search + ']';
                        }
                    }
                } else {
                    if (_cch_id !== undefined && _cch_id !== "") {
                        cch_id = _cch_id;
                    }
                    search_string = '[cch_id = "' + cch_id + '", __class__ = "service_order"]';
                }

            } catch (err) {
                logger.error("System Error" + err);
                reject({"message": "System Error", "status": 500});
            }
            ws.search(search_string).on('success', function (serviceObjectResult, response) {
                if (JSON.stringify(serviceObjectResult) !== '{}') {
                    resolve({
                        "message": serviceObjectResult,
                        "status": 200
                    });
                }else{
                    resolve({
                        "message": "Service order does not exist in the system",
                        "status": 404
                    });
                }
            }).on("error", function (error) {
                logger.error("Error searching service order  " + error);
                logger.error(error);
                reject({
                    "message": "System Error - something went wrong in the system",
                    "status": 500
                });
            });
        });
    },
    deleteServiceObject: function(ws, req) {
        return new promise(function (resolve, reject) {

        });
    }
};

