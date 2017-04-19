/**
 * Created by hsingh008c on 1/19/17.
 */
'use strict';
var cloudmine = require('cloudmine');
var _ = require('underscore');
var uuidV4 = require('uuid/v4');
var logger = require('./logger_module');
var local_validate = require('./local_validator');
var scim_ldap = require('./scim_ldap');
var search_local = require('./search');
var config = require('config');
var custom_acl_module = require('./acl');
var g_rand = require("random-key");
var domain = config.get('cch.domain');
var local_cache = require("./cache");

// Deep check in array to make sure is equal
function check_equal(a1,a2){
    var found = false;
    if(a1.length != a2.length){
        return false;
    }
    for(var i=0; i<a1.length; i++){
        for(var j=0; j<a2.length; j++){
            if(a1[i] == a2[j]){
                found=true;
                break;
            }else{
                found = false
            }
        }
        if(found == false) return false
    }

    for(var i=0; i<a2.length; i++){
        for(var j=0; j<a1.length; j++){
            if(a2[i] == a1[j]){
                found=true;
                break;
            }else{
                found = false
            }
        }
        if(found == false) return false
    }
    return true;
}
function updateProfileObjectInCLM(ws, update_obj){
    return new Promise(function (resolve, reject) {
        ws.update(update_obj).on('success', function (userdata, response) {
            logger.info("User profile updated in CM");
            resolve({"message": "User Profile Updated", "status": 200});
        }).on('error', function (err, response) {
            logger.error("Can't update profile." + err);
            reject({"message": "Can't update profile." + err, "status": 400});
        }).on('complete', function (data, response) {
            logger.info('Request to update profile completed successfully');
        });
    });
}

function createProfileObjectInCLM(ws, update_obj){
    return new Promise(function (resolve, reject) {
        ws.set(update_obj).on('success', function (Profiledata, response) {
            logger.info("User profile created successfully");
            resolve({"message": "User Profile created successfully", "status": 201});
        }).on('error', function (err) {
            logger.error("Error creating user profile, need to revert the transaction." + err);
            reject({"message": err, "status": 400});
        });
    });
}

function rollBackTransaction(ws, id, password, access_token, option) {
    if(option == "user" || option == "all") {
        ws.deleteUser({
            email: id + "@" + domain,
            password: password
        }).on('success', function (data, response) {
            logger.info("Cloudmine User account removed since unable to create ACL's");
        });
    }
    if(option == "ldap_user" || option == "all") {
        scim_ldap.deleteLdap(id, access_token).then(function (data) {
            logger.info("Removed Ldap account since unable to create ACL's In Cloudmine.");
        }).catch(function (error) {
            logger.error(error);
        });
    }
}

module.exports = {
    createUserAndProfile: function(ws,req,searchData,access_token) {
        return new Promise(function (resolve, reject) {
            //var uuid = uuidV4();
            var secret_key = g_rand.generate();
            var timestamp = new Date().toISOString();

            local_validate.validate_values(req, "create").then(function (result) {
                // Payload for ldap
                var payload = {};
                payload["schemas"] = config.get('ping.scim_schemas');
                // Added for testing from arno
                //payload["access_token_manager_id"] = "cloudmine";
                payload["emails"] = [{"value": req.payload.request.body.email}];
                if(req.payload.request.body.username !== null && req.payload.request.body.username !== undefined && req.payload.request.body.username !== "") {
                    payload["username"] = req.payload.request.body.username;
                }else{
                    payload["username"] = req.payload.request.body.email;
                }
                if(req.payload.request.body.password !== null && req.payload.request.body.password !== undefined && req.payload.request.body.password !== "") {
                    payload["password"] = req.payload.request.body.password;
                }else{
                    payload["password"] = "";
                }
                if(req.payload.request.body.role !== null && req.payload.request.body.role !== undefined && req.payload.request.body.role !== "") {
                    payload["role"] = [req.payload.request.body.role];
                }
                //payload["cch_id"] = uuid;
                payload["secret"] = secret_key;
                payload["status"] = req.payload.request.body.status;
                payload["tenant_id"] = req.payload.request.body.tenant_id;
                payload["external_id"] = req.payload.request.body.external_id;
                scim_ldap.createLdap(payload, access_token).then(function (ldap_result) {
                    // convert string to json object
                    var ldapResult = JSON.parse(ldap_result);
                    var password = ldapResult.id + secret_key;
                    // User ldap ID as CCH_ID as well as unique object id
                    var uuid = ldapResult.id;
                    //var password = ldapResult.id + "-cch";
                    ws.createUser({
                        email: ldapResult.id + "@" + domain,
                        password: password,
                        username: req.payload.request.body.username
                    }).on('success', function (userData, response) {
                        logger.info("User added successfully.");
                        logger.info("Creating profile for that user.");

                        // User id in case we need admin ID in acl
                        //, ''+ ws.options.user_id + ''
                        var user_acl = {
                            "members": ['' + userData.__id__ + ''],
                            "__type__": "acl",
                            "segments": {
                                "public": false,
                                "logged_in": false
                            },
                            "permissions": ["r", "u", "c", "d"],
                            "external_id": req.payload.request.body.external_id,
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
                            "external_id": req.payload.request.body.external_id,
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
                            "external_id": req.payload.request.body.external_id,
                            "meta": "readwrite"
                        };
                        ws.updateACL(readwrite_acl).on('success', function (readwriteacl_data, response) {
                            var readwriteacl_id = Object.keys(readwriteacl_data);
                            ws.updateACL(readonly_acl).on('success', function (readonlyacl_data, response) {
                                var readonlyacl_id = Object.keys(readonlyacl_data);
                                ws.updateACL(user_acl).on('success', function (Acldata, response) {
                                    logger.info("admin, readonly and readwrite ACL created in order to provide access the user");

                                    //it would return acl key which is 0'th location in the array.
                                    var acl_id = Object.keys(Acldata);

                                    var update_obj = {};
                                    var params_keys = Object.keys(req.payload.request.body);
                                    var user_data_obj_update = {};
                                    user_data_obj_update["profile"] = {};
                                    for (var i = 0; i < params_keys.length; i++) {
                                        if (params_keys[i] === 'password' || params_keys[i] === 'access-token' || params_keys[i] === 'request_type') {
                                            continue;
                                        }
                                        if (params_keys[i] == "role") {
                                            user_data_obj_update["profile"][params_keys[i]] = [req.payload.request.body[params_keys[i]]];
                                        } else {
                                            user_data_obj_update["profile"][params_keys[i]] = req.payload.request.body[params_keys[i]];
                                        }
                                    }
                                    // Add userId to profile data so we can update ACL in future.
                                    user_data_obj_update["profile"]["user_id"] = userData.__id__;
                                    user_data_obj_update["profile"]["location"] = ldapResult.meta.location;
                                    user_data_obj_update["profile"]['update_time'] = timestamp;
                                    //user_data_obj_update["profile"]["ldap_id"] = ldapResult.id;
                                    user_data_obj_update["profile"]['cch_id'] = uuid;
                                    user_data_obj_update['__class__'] = "user";
                                    user_data_obj_update['__access__'] = [acl_id[0], readonlyacl_id[0], readwriteacl_id[0]];
                                    user_data_obj_update['user_behavior'] = {};

                                    update_obj[uuid] = user_data_obj_update;

                                    //Get ACL by key
                                    /*ws.getACL(acl_id[0]).on('success',function(data, response) {
                                     console.log(data);
                                     console.log(data["success"][acl_id[0]].members);
                                     });*/

                                    // Update acl to give access to Care manager.
                                    if (req.payload.request.body["caremanager_external_id"] != undefined && req.payload.request.body["caremanager_external_id"] != "") {
                                        custom_acl_module.updateAclForCareManager(ws, req.payload.request.body.external_id, req.payload.request.body["caremanager_external_id"], "readonly")
                                            .then(function (updateAcl_result) {
                                                logger.info("readonly ACL updated in order to provide access the caremanager");
                                                // Create profile object.
                                                createProfileObjectInCLM(ws, update_obj).then(function (createProfileResult) {
                                                    resolve({"message": createProfileResult.message, "status": createProfileResult.status});
                                                }).catch(function (createProfileError) {
                                                    rollBackTransaction(ws, ldapResult.id, password, access_token, "all");
                                                    reject({"message": createProfileError.message, "status": createProfileError.status});
                                                });
                                            })
                                            .catch(function (error) {
                                                rollBackTransaction(ws, ldapResult.id, password, access_token, "all");
                                                logger.error(error);
                                                reject({"message": error, "status": 400});
                                            });
                                    } else if (req.payload.request.body["member_external_id"] != undefined && req.payload.request.body["member_external_id"] != "") {
                                        custom_acl_module.updateAclForCareGiver(ws, req.payload.request.body["member_external_id"], userData.__id__, "readonly")
                                            .then(function (updateAcl_result) {
                                                logger.info("Readonly ACL updated in order to provide access the caremanager");

                                                // Create profile object.
                                                createProfileObjectInCLM(ws, update_obj).then(function (createProfileResult) {
                                                    resolve({"message": createProfileResult.message, "status": createProfileResult.status});
                                                }).catch(function (createProfileError) {
                                                    rollBackTransaction(ws, ldapResult.id, password, access_token, "all");
                                                    reject({"message": createProfileError.message, "status": createProfileError.status});
                                                });
                                            })
                                            .catch(function (error) {
                                                rollBackTransaction(ws, ldapResult.id, password, access_token, "all");
                                                logger.error(error);
                                                reject({"message": error, "status": 400});
                                            });
                                    } else {
                                        // Create profile object.
                                        createProfileObjectInCLM(ws, update_obj).then(function (createProfileResult) {
                                            resolve({"message": createProfileResult.message, "status": createProfileResult.status});
                                        }).catch(function (createProfileError) {
                                            rollBackTransaction(ws, ldapResult.id, password, access_token, "all");
                                            reject({"message": createProfileError.message, "status": createProfileError.status});
                                        });
                                    }
                                }).on('error', function (error) {
                                    rollBackTransaction(ws, ldapResult.id, password, access_token, "all");
                                    logger.error("Can't create admin ACL, Need to revert this transaction." + error);
                                    reject({"message": error, "status": 400});
                                });
                            }).on('error', function (error) {
                                rollBackTransaction(ws, ldapResult.id, password, access_token, "all");
                                logger.error("Can't create readonly ACL, Need to revert this transaction." + error);
                                reject({"message": error, "status": 400});
                            });
                        }).on('error', function (error) {
                            rollBackTransaction(ws, ldapResult.id, password, access_token, "all");
                            logger.error("Can't create readwrite ACL, Need to revert this transaction." + error);
                            reject({"message": error, "status": 400});
                        });
                    }).on('error', function (error) {
                        rollBackTransaction(ws, ldapResult.id, password, access_token, "ldap_user");
                        logger.error("Can't create account there is an issue with user account, account may already exist." + error);
                        reject({"message": error, "status": 400});
                    }).on('complete', function (data, response) {
                        logger.info("Data Transaction completed");
                    });
                }).catch(function (error) {
                    logger.error(error);
                    reject({"message": error.message, "status": error.status});
                });
            }).catch(function (error) {
                logger.error(error);
                reject({"message": error, "status": 400});
            });
        });
    },
    updateProfileAndLdap: function(ws,req,data,access_token){
        return new Promise(function (resolve, reject) {
            var timestamp = new Date().toISOString();
            local_validate.validate_values(req, "update")
                .then(function (result) {
                    logger.info("User already exist. Next step compare data to make sure everything is up to date.");
                    var params_keys = Object.keys(req.payload.request.body);

                    var require_update = false;
                    var ldap_update_required = false;
                    var caremanager_acl_update_required = false;
                    var caregiver_acl_update_required = false;
                    var update_obj = {};
                    var user_data_obj_update = {};
                    user_data_obj_update["profile"] = {};
                    var object_key = Object.keys(data);
                    var profile_id = object_key[0];
                    var ldap_properties = config.get('ping.ldap_properties');
                    var acl_properties_caremanager = ["caremanager_external_id"];
                    var acl_properties_caregiver = ["member_external_id"];

                    var ldap_payload = {};
                    for (var i = 0; i < params_keys.length; i++) {
                        if (params_keys[i] === 'password' || params_keys[i] === 'access-token' || params_keys[i] === 'request_type') {
                            continue;
                        }
                        if (typeof data[profile_id]["profile"][params_keys[i]] !== "undefined") {
                            if (_.isObject(data[profile_id]["profile"][params_keys[i]]) && _.isObject(req.payload.request.body[params_keys[i]])) {
                                if (!_.isEqual(data[profile_id]["profile"][params_keys[i]], req.payload.request.body[params_keys[i]])) {
                                    user_data_obj_update["profile"][params_keys[i]] = req.payload.request.body[params_keys[i]];
                                    require_update = true;
                                    if (ldap_properties.indexOf(params_keys[i]) > -1) {
                                        ldap_update_required = true;
                                        ldap_payload[params_keys[i]] = req.payload.request.body[params_keys[i]];
                                    }
                                }
                            } else if (_.isArray(req.payload.request.body[params_keys[i]]) && _.isArray(data[profile_id]["profile"][params_keys[i]])) {
                                if (check_equal(req.payload.request.body[params_keys[i]], data[profile_id]["profile"][params_keys[i]])) {
                                    user_data_obj_update["profile"][params_keys[i]] = req.payload.request.body[params_keys[i]];
                                    require_update = true;
                                    if (ldap_properties.indexOf(params_keys[i]) > -1) {
                                        ldap_update_required = true;
                                        ldap_payload[params_keys[i]] = req.payload.request.body[params_keys[i]];
                                    }
                                }
                            } else if (!_.isObject(req.payload.request.body[params_keys[i]]) && _.isObject(data[profile_id]["profile"][params_keys[i]])) {
                                if (data[profile_id]["profile"][params_keys[i]].indexOf(req.payload.request.body[params_keys[i]]) <= -1) {
                                    user_data_obj_update["profile"][params_keys[i]] = [req.payload.request.body[params_keys[i]]];
                                    require_update = true;
                                    if (ldap_properties.indexOf(params_keys[i]) > -1) {
                                        ldap_payload[params_keys[i]] = [req.payload.request.body[params_keys[i]]];
                                        ldap_update_required = true;
                                    }
                                }
                            } else {
                                if (req.payload.request.body[params_keys[i]] !== data[profile_id]["profile"][params_keys[i]]) {
                                    if (params_keys[i] == "role") {
                                        user_data_obj_update["profile"][params_keys[i]] = [req.payload.request.body[params_keys[i]]];
                                    } else {
                                        user_data_obj_update["profile"][params_keys[i]] = req.payload.request.body[params_keys[i]];
                                    }
                                    require_update = true;
                                    if (ldap_properties.indexOf(params_keys[i]) > -1) {
                                        if (params_keys[i] == "role") {
                                            ldap_payload[params_keys[i]] = [req.payload.request.body[params_keys[i]]];
                                        } else {
                                            ldap_payload[params_keys[i]] = req.payload.request.body[params_keys[i]];
                                        }
                                        ldap_update_required = true;
                                    }
                                    if (acl_properties_caremanager.indexOf(params_keys[i]) > -1) {
                                        caremanager_acl_update_required = true;
                                    }
                                    if (acl_properties_caregiver.indexOf(params_keys[i]) > -1) {
                                        caregiver_acl_update_required = true;
                                    }
                                }
                            }
                        } else {
                            if (params_keys[i] == "role") {
                                user_data_obj_update["profile"][params_keys[i]] = [req.payload.request.body[params_keys[i]]];
                            } else {
                                user_data_obj_update["profile"][params_keys[i]] = req.payload.request.body[params_keys[i]];
                            }
                            logger.info("Adding new properties");
                            require_update = true;
                            if (ldap_properties.indexOf(params_keys[i]) > -1) {
                                if (params_keys[i] == "role") {
                                    ldap_payload[params_keys[i]] = [req.payload.request.body[params_keys[i]]];
                                } else {
                                    ldap_payload[params_keys[i]] = req.payload.request.body[params_keys[i]];
                                }
                                ldap_update_required = true;
                            }
                        }
                    }
                    user_data_obj_update["profile"]['update_time'] = timestamp;
                    update_obj[profile_id] = user_data_obj_update;
                    if (ldap_update_required && require_update && !caremanager_acl_update_required && !caregiver_acl_update_required) {
                        if (typeof data[profile_id]["profile"]["cch_id"] != "undefined" && data[profile_id]["profile"]["cch_id"] != "") {
                            scim_ldap.updateLdap(ldap_payload, data[profile_id]["profile"]["cch_id"], access_token).then(function (ldap_result) {
                                logger.info("-----------------Ldap Updated ----------------");
                                updateProfileObjectInCLM(ws, update_obj).then(function (updateprofileresult) {
                                    resolve({"message": updateprofileresult.message, "status": updateprofileresult.status});
                                }).catch(function (updateProfileError) {
                                    reject({"message": updateProfileError.message, "status": updateProfileError.status});
                                });
                            }).catch(function (error) {
                                logger.error(error);
                                reject({"message": error.message, "status": error.status});
                            });
                        } else {
                            logger.error("This record Doesn't have LDAP ID in cloudmine profile so can not update ldap.");
                            reject({"message": "This record Doesn't have LDAP ID in cloudmine profile so can not update ldap.", "status": 400});
                        }
                    } else if (ldap_update_required && require_update && caremanager_acl_update_required && !caregiver_acl_update_required) {
                        if (typeof data[profile_id]["profile"]["cch_id"] != "undefined" && data[profile_id]["profile"]["cch_id"] != "") {
                            custom_acl_module.updateAclForCareManager(ws, req.payload.request.body.external_id, req.payload.request.body["caremanager_external_id"], "readonly")
                                .then(function (updateAcl_result) {
                                    logger.info("readonly acl updated in order to provide access to careManager");
                                    scim_ldap.updateLdap(ldap_payload, data[profile_id]["profile"]["cch_id"], access_token).then(function (ldap_result) {
                                        logger.info("-----------------care manager Updated in LDAP----------------");
                                        updateProfileObjectInCLM(ws, update_obj).then(function (updateprofileresult) {
                                            logger.info("-----------------care manager profile updated in Cloudmine----------------");
                                            resolve({"message": updateprofileresult.message, "status": updateprofileresult.status});
                                        }).catch(function (updateProfileError) {
                                            reject({"message": updateProfileError.message, "status": updateProfileError.status});
                                        });
                                    }).catch(function (error) {
                                        logger.error(error);
                                        reject({"message": error.message, "status": error.status});
                                    });
                                })
                                .catch(function (error) {
                                    logger.error(error);
                                    reject({"message": error, "status": 400});
                                });
                        } else {
                            logger.error("This record Doesn't have LDAP ID in cloudmine profile so can not update ldap.");
                            reject({"message": "This record Doesn't have LDAP ID in cloudmine profile so can not update ldap.", "status": 400});
                        }
                    } else if (ldap_update_required && require_update && caregiver_acl_update_required && !caremanager_acl_update_required) {
                        if (typeof data[profile_id]["profile"]["cch_id"] != "undefined" && data[profile_id]["profile"]["cch_id"] != "") {
                            custom_acl_module.updateAclForCareGiver(ws, req.payload.request.body["member_external_id"], data[profile_id]["profile"]["user_id"], "readonly")
                                .then(function (updateAcl_result) {
                                    logger.info("readonly acl updated in order to provide access to careGiver");
                                    scim_ldap.updateLdap(ldap_payload, data[profile_id]["profile"]["cch_id"], access_token).then(function (ldap_result) {
                                        logger.info("-----------------care giver updated in LDAP----------------");
                                        updateProfileObjectInCLM(ws, update_obj).then(function (updateprofileresult) {
                                            logger.info("-----------------care giver profile updated in Cloudmine----------------");
                                            resolve({"message": updateprofileresult.message, "status": updateprofileresult.status});
                                        }).catch(function (updateProfileError) {
                                            reject({"message": updateProfileError.message, "status": updateProfileError.status});
                                        });

                                    }).catch(function (error) {
                                        logger.error(error);
                                        reject({"message": error.message, "status": error.status});
                                    });
                                })
                                .catch(function (error) {
                                    logger.error(error);
                                    reject({"message": error, "status": 400});
                                });
                        } else {
                            logger.error("This record Doesn't have LDAP ID in cloudmine profile so can not update ldap.");
                            reject({"message": "This record Doesn't have LDAP ID in cloudmine profile so can not update ldap.", "status": 400});
                        }
                    } else if (require_update && caremanager_acl_update_required && !ldap_update_required && !caregiver_acl_update_required) {
                        custom_acl_module.updateAclForCareManager(ws, req.payload.request.body.external_id, req.payload.request.body["caremanager_external_id"], "readonly").then(function (updateAcl_result) {
                            logger.info("readonly acl updated in order to provide access to careManager");
                            updateProfileObjectInCLM(ws, update_obj).then(function (updateprofileresult) {
                                resolve({"message": updateprofileresult.message, "status": updateprofileresult.status});
                            }).catch(function (updateProfileError) {
                                reject({"message": updateProfileError.message, "status": updateProfileError.status});
                            });
                        }).catch(function (error) {
                            logger.error(error);
                            reject({"message": error, "status": 400});
                        });
                    } else if (require_update && caregiver_acl_update_required && !ldap_update_required && !caremanager_acl_update_required) {
                        custom_acl_module.updateAclForCareGiver(ws, req.payload.request.body["member_external_id"], data[profile_id]["profile"]["user_id"], "readonly").then(function (updateAcl_result) {
                            logger.info("readonly acl updated in order to provide access to careGiver");
                            updateProfileObjectInCLM(ws, update_obj).then(function (updateprofileresult) {
                                resolve({"message": updateprofileresult.message, "status": updateprofileresult.status});
                            }).catch(function (updateProfileError) {
                                reject({"message": updateProfileError.message, "status": updateProfileError.status});
                            });
                        }).catch(function (error) {
                            logger.error(error);
                            reject({"message": error, "status": 400});
                        });
                    } else if (require_update && !caremanager_acl_update_required && !caregiver_acl_update_required && !ldap_update_required) {
                        updateProfileObjectInCLM(ws, update_obj).then(function (updateprofileresult) {
                            resolve({"message": updateprofileresult.message, "status": updateprofileresult.status});
                        }).catch(function (updateProfileError) {
                            reject({"message": updateProfileError.message, "status": updateProfileError.status});
                        });
                    } else {
                        logger.info("User profile is already up to date.");
                        resolve({"message": "User Data already up to date", "status": 200});
                    }
                })
                .catch(function (error) {
                    logger.error(error);
                    reject({"message": error, "status": 400});
                });
        });
    }
};
