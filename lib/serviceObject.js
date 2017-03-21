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
function createServiceOrderObjectInCLM(ws, update_obj){
    return new promise(function (resolve, reject) {
        ws.set(update_obj).on('success', function (Profiledata, response) {
            logger.info("Service Order created successfully");
            resolve({"message": update_obj, "status": 201});
        }).on('error', function (error) {
            logger.error("Error creating service order" + error);
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
                var partner_id = req.payload.request.body.partner_id;
                var search_string = '[profile.partner_id = "' + req.payload.request.body.partner_id + '"]';
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
                        console.log(params_keys[i]);
                    }
                    user_data_obj_update['__class__'] = "service_order";
                    user_data_obj_update['cch_id'] = user_profile[user_profile_keys[0]]["profile"]["cch_id"];

                    acl.addUpdateAclForServiceOrder(ws, partner_id, user_profile[user_profile_keys[0]]["profile"]["user_id"]).then(function(acl_result) {
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
                        reject({"message": "Could't create service order", "status": 400});
                    });
                }).catch(function (error) {
                    logger.error(error);
                    reject({"message": "Could't create service order", "status": 400});
                });
            }).catch(function (error) {
                logger.error(error);
                reject({"message": error, "status": 400});
            });
        });
    },
    updateServiceObject: function(ws, req) {
        return new promise(function (resolve, reject) {
            // Validate payload.
            local_validate.validate_val_service_order(req).then(function (validate_result) {
                var uuid = uuidV4();
                var update_obj = {};
                var partner_id = req.payload.request.body.partner_id;
                var search_string = '[profile.partner_id = "' + req.payload.request.body.partner_id + '"]';
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
                        console.log(params_keys[i]);
                    }
                    user_data_obj_update['__class__'] = "service_order";
                    user_data_obj_update['cch_id'] = user_profile[user_profile_keys[0]]["profile"]["cch_id"];

                    acl.addUpdateAclForServiceOrder(ws, partner_id, user_profile[user_profile_keys[0]]["profile"]["user_id"]).then(function(acl_result) {
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
                        reject({"message": "Could't create service order", "status": 400});
                    });
                }).catch(function (error) {
                    logger.error(error);
                    reject({"message": "Could't create service order", "status": 400});
                });
            }).catch(function (error) {
                logger.error(error);
                reject({"message": error, "status": 400});
            });
        });
    },
    searchServiceObject: function(ws, req) {
        return new promise(function (resolve, reject) {
            // ws.search('[profile.role = "CAREMANAGER"]').on('success', function (searchData, response) {
            //     console.log(searchData);
            //     resolve(searchData);
            // }).on("error", function (error) {
            //     logger.error("Error searching partner_id");
            //     reject(error);
            // });
        });
    },
    deleteServiceObject: function(ws, req) {
        return new promise(function (resolve, reject) {

        });
    }
};

