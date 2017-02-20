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
                            reject(error)
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
    }
};