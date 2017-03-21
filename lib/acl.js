/**
 * Created by hsingh008c on 1/20/17.
 */

/**
 * Created by hsingh008c on 1/19/17.
 */

'use strict';
var cloudmine = require('cloudmine');
var config = require('config');
var promise = require('promise');
var rest = require('restler');
var logger = require('./logger_module');
var search_local = require('./search');
var _ = require('underscore');
// var sleep = require('system-sleep');

//
// Comcast Connected Health
// 2017
//

module.exports = {
    updateAclForCareManager: function (ws, search_acl_by_id, id_to_add, role) {
        return new Promise(function (resolve, reject) {
                var acl_search_srting = '[partner_id = "' + search_acl_by_id + '", meta = "'+role+'"]';
                // search acl so we can update care manager ID
                ws.searchACLs(acl_search_srting).on("success", function (aclsearch_result) {
                    if (JSON.stringify(aclsearch_result) !== '{}') {
                        var aclsearch_result_id = Object.keys(aclsearch_result);
                        var search_string = '[profile.partner_id = "' + id_to_add + '"]';
                        // search care manager ID so we can add this to member list.
                        search_local.getUserProfileBasedOnSearchString(ws, search_string).then(function (userProfileData) {
                            var object_key = Object.keys(userProfileData);
                            var profile_id = object_key[0];
                            var acl_data;
                            for(var i=0; i<aclsearch_result_id.length; i++){
                                acl_data = aclsearch_result[aclsearch_result_id[i]];
                                acl_data["members"] = [userProfileData[profile_id]["profile"]["user_id"]];
                                // Update Acl in order to provide access to care manager
                                ws.updateACL(acl_data).on('success', function (updateacl_data, response) {
                                    logger.info("-----------------care manager ----------------")
                                    //logger.info(updateacl_data);
                                    logger.info("Acl updated to provide access to care manager");
                                    logger.info("-----------------care manager ----------------")
                                    resolve("Acl updated to provide access to care manager");
                                }).on('error', function (error) {
                                    logger.error("Can't Update ACL." + error);
                                    reject(error)
                                });
                                acl_data = "";
                            }
                        }).catch(function (error) {
                            logger.error(error);
                            reject("Please make sure Care manager exist in the system.")
                        });
                    }else{
                        reject("acl couldn't find");
                    }
                }).on("error", function (error) {
                    logger.error(error);
                    reject(error)
                });
        });
    },
    updateAclForCareGiver: function (ws, search_acl_by_id, id_to_add, role) {
        return new Promise(function (resolve, reject) {
            var acl_search_srting = '[partner_id = "' + search_acl_by_id + '", meta = "'+role+'"]';
            // search acl so we can update care manager ID
            ws.searchACLs(acl_search_srting).on("success", function (aclsearch_result) {
                if (JSON.stringify(aclsearch_result) !== '{}') {
                    var aclsearch_result_id = Object.keys(aclsearch_result);
                    var acl_data;
                    for(var i=0; i<aclsearch_result_id.length; i++) {
                        acl_data = aclsearch_result[aclsearch_result_id[i]];
                        acl_data["members"] = [id_to_add];
                        // Update Acl in order to provide access to care manager.
                        ws.updateACL(acl_data).on('success', function (updateacl_data, response) {
                            logger.info("-----------------care giver ----------------")
                            logger.info(updateacl_data);
                            logger.info("Acl updated to provide access to care giver");
                            logger.info("-----------------care giver ----------------")
                            resolve("Acl updated to provide access to care giver");
                        }).on('error', function (error) {
                            logger.error("Can't Update ACL." + error);
                            reject(error)
                        });
                        acl_data = "";
                    }
                }else{
                    logger.error("acl couldn't find");
                    reject("acl couldn't find");
                }
            }).on("error", function (error) {
                logger.error(error);
                reject(error)
            });
        });
    },
    addUpdateAclForServiceOrder: function (ws, partner_id, user_id) {
        return new Promise(function (resolve, reject) {
            var user_access_acl = {
                "members": ['' + user_id + ''],
                "__type__": "acl",
                "segments": {
                    "public": false,
                    "logged_in": false
                },
                "permissions": ["r", "u"],
                "partner_id": partner_id,
                "acl_name": "user_service_order",
                "meta": "user_access"
            };
            var admin_acl = {
                "members": [],
                "__type__": "acl",
                "segments": {
                    "public": false,
                    "logged_in": false
                },
                "permissions": ["r", "u", "c", "d"],
                "acl_name": "service_order",
                "meta": "admin"
            };
            var readonly_acl = {
                "members": [],
                "__type__": "acl",
                "segments": {
                    "public": false,
                    "logged_in": false
                },
                "permissions": ["r"],
                "acl_name": "service_order",
                "meta": "readonly"
            };
            var readwrite_acl = {
                "members": [],
                "__type__": "acl",
                "segments": {
                    "public": false,
                    "logged_in": false
                },
                "permissions": ["r", "u", "c"],
                "acl_name": "service_order",
                "meta": "readwrite"
            };
            // This would get all the caremanager profiles.
            // ws.search('[profile.role = "CAREMANAGER"]').on('success', function (searchData, response) {
            //     var searchData_id = Object.keys(searchData);
            //     for (var i = 0; i < searchData_id.length; i++) {
            //         sleep(5000);
            //         console.log(searchData[searchData_id[i]]["profile"]["user_id"]);
            //     }
            // }).on("error", function (error) {
            //     logger.error("Error searching partner_id");
            //     reject(error);
            // });

            var acl_search_string = '[acl_name = "service_order",__type__ = "acl"]';
            var id_list = [];
            ws.searchACLs(acl_search_string).on("success", function (aclsearch_result) {
                if (JSON.stringify(aclsearch_result) !== '{}') {
                    var user_acl_search_string = '[partner_id = "' + partner_id + '", acl_name = "user_service_order", __type__ = "acl"]';
                    ws.searchACLs(user_acl_search_string).on("success", function (user_aclsearch_result) {
                        if (JSON.stringify(user_aclsearch_result) !== '{}') {
                            var user_aclsearch_result_id = Object.keys(user_aclsearch_result);
                            for (var i = 0; i < user_aclsearch_result_id.length; i++) {
                                id_list.push(user_aclsearch_result_id[i]);
                            }
                            var acls = Object.keys(aclsearch_result);
                            for (var i = 0; i < acls.length; i++) {
                                id_list.push(acls[i]);
                            }
                            logger.info("service order ACL's returned");
                            resolve(id_list);
                        }else{
                            ws.updateACL(user_access_acl).on('success', function (user_access_acl_result, response) {
                                var user_access_acl_id = Object.keys(user_access_acl_result);
                                id_list.push(user_access_acl_id[0]);
                                var acls = Object.keys(aclsearch_result);
                                for (var i = 0; i < acls.length; i++) {
                                    id_list.push(acls[i]);
                                }
                                logger.info("ACL created for Service order to provide access to user");
                                resolve(id_list);
                            }).on('error', function (error) {
                                logger.error("Can't create User ACL" + error);
                                reject({"message": error, "status": 400});
                            });
                        }
                    }).on("error", function (error) {
                        logger.error(error);
                        reject(error)
                    });
                }else{
                    ws.updateACL(admin_acl).on('success', function (adminacl_data, response) {
                        var adminacl_id = Object.keys(adminacl_data);
                        ws.updateACL(readonly_acl).on('success', function (readonlyacl_data, response) {
                            var readonlyacl_id = Object.keys(readonlyacl_data);
                            ws.updateACL(readwrite_acl).on('success', function (readwriteacl_data, response) {
                                var readwriteacl_id = Object.keys(readwriteacl_data);
                                ws.updateACL(user_access_acl).on('success', function (user_access_acl_result, response) {
                                    var user_access_acl_id = Object.keys(user_access_acl_result);
                                    logger.info("ACL created for Service order");
                                    id_list.push(user_access_acl_id[0]);
                                    id_list.push(adminacl_id[0]);
                                    id_list.push(readonlyacl_id[0]);
                                    id_list.push(readwriteacl_id[0]);
                                    resolve(id_list);
                                }).on('error', function (error) {
                                    logger.error("Can't create User ACL" + error);
                                    reject({"message": error, "status": 400});
                                });
                            }).on('error', function (error) {
                                logger.error("Can't create readonly ACL" + error);
                                reject({"message": error, "status": 400});
                            });
                        }).on('error', function (error) {
                            logger.error("Can't create readonly ACL" + error);
                            reject({"message": error, "status": 400});
                        });
                    }).on('error', function (error) {
                        logger.error("Can't create admin ACL" + error);
                        reject({"message": error, "status": 400});
                    });
                }
            }).on("error", function (error) {
                logger.error(error);
                reject(error)
            });
        });
    }
};