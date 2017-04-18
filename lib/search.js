'use strict';
var cloudmine = require('cloudmine');
var logger = require('./logger_module');
var config = require('config');
var local_cache = require("./cache");
//
// Comcast Connected Health
// 2016
//

// This function would filter the data based upon object type. E.G.  object_type = "profile"
function custom_filter(data, object_type){
    return new Promise(function (resolve, reject) {
        try {
            var result = {};
            var uuids = Object.keys(data);
            for (var i = 0; i < uuids.length; i++) {
                result[uuids[i]] = {};
                result[uuids[i]][object_type] = data[uuids[i]][object_type];
            }
            resolve(result);
        }catch(error) {
            logger.error("System Error" + error);
            reject({"message": "System Error", "status": 500});
        }
    });
}

module.exports = {
    getUserProfileBasedOnSearchString: function (ws, search_string) {
        return new Promise(function (resolve, reject) {
            //var search_string = '[external_id = "' + req.payload.params["caremanager_external_id"] + '"]';
            ws.search(search_string)
                .on('success', function (data, response) {
                    if (JSON.stringify(data) === '{}') {
                        reject("User profile doesn't exist")
                    } else {
                        resolve(data);
                    }
                }).on('error', function (err) {
                logger.error(err);
                if (search_string === "") {
                    logger.error("Search criteria is empty " + search_string);
                    reject("Search criteria is empty");
                } else {
                    logger.error("Error at getUserProfileBasedOnReq: searching as " + search_string);
                    reject("Error at getUserProfileBasedOnSearchString: searching as " + search_string + err);
                }
            });
        });
    },
    getUserProfileBasedOnReq: function (ws, req, access_token){
        return new Promise(function (resolve, reject) {
            var search_string = "";
            var _cch_id = local_cache.get(access_token + "cch_id");
            var cch_id;

            try {
                if (req.payload.params !== null) {
                    search_string = '[profile.cch_id = "' + _cch_id + '"]';
                    if (typeof req.payload.params.cch_id !== "undefined") {
                        if (req.payload.params.cch_id == "self" && _cch_id !== undefined && _cch_id !== "") {
                            cch_id = _cch_id
                        } else {
                            cch_id = req.payload.params.cch_id;
                        }
                        search_string = '[profile.cch_id = "' + cch_id + '", __class__ = "user"]';
                    } else {
                        if (typeof req.payload.params.search !== "undefined") {
                            search_string = '[profile.' + req.payload.params.search + ']';
                        }
                    }
                } else {
                    search_string = '[profile.cch_id = "' + _cch_id + '", __class__ = "user"]';
                }

            } catch (err) {
                logger.error("System Error" + err);
                reject({"message": "System Error", "status": 500});
            }
            ws.search(search_string)
                .on('success', function (data, response) {
                    if (JSON.stringify(data) === '{}') {
                        logger.debug("User profile doesn't exist");
                        reject({"message": "User profile doesn't exist", "status": 404});
                    } else {
                        logger.info("User profile found and returned");
                        var object_key = Object.keys(data);
                        var profile_id = object_key[0];
                        local_cache.set(access_token + "external_id", data[profile_id]["profile"]["external_id"]);
                        local_cache.set(access_token + "uuid", profile_id);
                        if(data[profile_id]["profile"]["member_external_id"] !== "undefined" && data[profile_id]["profile"]["member_external_id"] !== "" && data[profile_id]["profile"]["member_external_id"] !== null){
                            local_cache.set(access_token + "member_external_id", data[profile_id]["profile"]["member_external_id"]);
                        }
                        custom_filter(data, "profile").then(function (filteredResult) {
                            resolve(filteredResult);
                        }).catch(function (filteredError) {
                            reject(filteredError);
                        });
                    }
                }).on('error', function (err) {
                logger.error(err);
                if (search_string === "") {
                    logger.error("Search criteria is empty");
                    reject({"message": "Search criteria is empty", "status": 400});
                } else {
                    logger.error("Error at getUserProfileBasedOnReq: searching as " + search_string);
                    reject({"message": err, "status": 400});
                }
            }).on('complete', function (data, response) {
                logger.info("Search request completed successfully");
            });
        });
    },
    getAllUserProfileBasedOnReq: function (ws, req, access_token){
        return new Promise(function (resolve, reject) {
            var search_string = "";
            var _cch_id = local_cache.get(access_token + "cch_id");
            var _external_id = local_cache.get(access_token + "external_id");
            var _member_external_id = local_cache.get(access_token + "member_external_id");
            var cch_id;

            try {
                if (req.payload.params !== null) {
                    search_string = '[profile.cch_id = "' + _cch_id + '"]';
                    if (typeof req.payload.params.cch_id !== "undefined") {
                        cch_id = req.payload.params.cch_id;
                        search_string = '[profile.cch_id = "' + cch_id + '", __class__ = "user"]';
                        _external_id="";
                    } else {
                        if (typeof req.payload.params.search !== "undefined") {
                            search_string = '[profile.' + req.payload.params.search + ']';
                            _external_id="N/A";
                        }else {
                            if (_cch_id !== undefined && _cch_id !== "") {
                                search_string = '[profile.cch_id = "' + _cch_id + '", __class__ = "user"]';
                            }
                            if (_external_id !== undefined && _external_id !== "") {
                                search_string = '[profile.caremanager_external_id = "' + _external_id + '", __class__ = "user"]';
                            }
                            if (_member_external_id !== undefined && _member_external_id !== "" && _member_external_id !== null && _external_id !== undefined && _external_id !== "") {
                                search_string = '[profile.caremanager_external_id = "' + _external_id + '" or profile.external_id = "' + _member_external_id + '"]';
                            }
                            if (_member_external_id !== undefined && _member_external_id !== "" && _member_external_id !== null) {
                                search_string = '[profile.external_id = "' + _member_external_id + '", __class__ = "user"]';
                            }
                        }
                    }
                }else {
                    if (_cch_id !== undefined && _cch_id !== "") {
                        search_string = '[profile.cch_id = "' + _cch_id + '", __class__ = "user"]';
                    }
                    if (_external_id !== undefined && _external_id !== "") {
                        search_string = '[profile.caremanager_external_id = "' + _external_id + '", __class__ = "user"]';
                    }
                    if (_member_external_id !== undefined && _member_external_id !== "" && _member_external_id !== null && _external_id !== undefined && _external_id !== "") {
                        search_string = '[profile.caremanager_external_id = "' + _external_id + '" or profile.external_id = "' + _member_external_id + '"]';
                    }
                    if (_member_external_id !== undefined && _member_external_id !== "" && _member_external_id !== null) {
                        search_string = '[profile.external_id = "' + _member_external_id + '", __class__ = "user"]';
                    }
                }
            } catch (err) {
                logger.error("System Error" + err);
            }

            if(_external_id === undefined || _external_id === "") {
                ws.search(search_string).on('success', function (data, response) {
                    if (JSON.stringify(data) === '{}') {
                        logger.debug("User profile doesn't exist");
                        reject({"message": "User profile doesn't exist", "status": 404});
                    } else {
                        logger.info("User profile found and returned");
                        var object_key = Object.keys(data);
                        var profile_id = object_key[0];
                        local_cache.set(access_token + "external_id", data[profile_id]["profile"]["external_id"]);
                        if(data[profile_id]["profile"]["member_external_id"] !== undefined && data[profile_id]["profile"]["member_external_id"] !== "" && data[profile_id]["profile"]["member_external_id"] !== null){
                            local_cache.set(access_token + "member_external_id", data[profile_id]["profile"]["member_external_id"]);
                            search_string = '[profile.caremanager_external_id = "' + data[profile_id]["profile"]["external_id"] + '" or profile.external_id = "' + data[profile_id]["profile"]["member_external_id"] + '"]';
                        }else {
                            search_string = '[profile.caremanager_external_id = "' + data[profile_id]["profile"]["external_id"] + '"]';
                        }
                        ws.search(search_string).on('success', function (allUsers, response) {
                            if (JSON.stringify(allUsers) === '{}') {
                                logger.debug("User profile doesn't exist");
                                reject({"message": "User profile doesn't exist", "status": 404});
                            } else {
                                logger.info("Users profile found and returned");
                                // This custom_filter function would filter the result to return only profile object.
                                custom_filter(allUsers, "profile").then(function(filterResult) {
                                    resolve(filterResult);
                                }).catch(function (filterError){
                                    reject(filterError);
                                });
                            }
                        }).on('error', function (err) {
                            logger.error(err);
                            if (search_string === "") {
                                logger.error("Search criteria is empty");
                                reject({"message": "Search criteria is empty", "status": 400});
                            } else {
                                logger.error("Error at getAllUserProfileBasedOnReq: searching as " + search_string);
                                reject({"message": err, "status": 400});
                            }
                        }).on('complete', function (data, response) {
                            logger.info("Search request completed successfully");
                        });
                    }
                }).on('error', function (err) {
                    logger.error(err);
                    if (search_string === "") {
                        logger.error("Search criteria is empty");
                        reject({"message": "Search criteria is empty", "status": 400});
                    } else {
                        logger.error("Error at getAllUserProfileBasedOnReq: searching as " + search_string);
                        reject({"message": err, "status": 400});
                    }
                }).on('complete', function (data, response) {
                    logger.info("Search request completed successfully");
                });
            }else{
                ws.search(search_string).on('success', function (allUsers, response) {
                    if (JSON.stringify(allUsers) === '{}') {
                        logger.debug("User profile doesn't exist or You don't permissions to view any profile.");
                        reject({"message": "User profile doesn't exist or You don't permissions to view any profile.", "status": 404});
                    } else {
                        logger.info("Users profile found and returned");
                        // This custom_filter function would filter the result to return only profile object.
                        custom_filter(allUsers, "profile").then(function(filterResult) {
                            resolve(filterResult);
                        }).catch(function (filterError){
                            reject(filterError);
                        });
                    }
                }).on('error', function (err) {
                    logger.error(err);
                    if (search_string === "") {
                        logger.error("Search criteria is empty");
                        reject({"message": "Search criteria is empty", "status": 400});
                    } else {
                        logger.error("Error at getAllUserProfileBasedOnReq: searching as " + search_string);
                        reject({"message": err, "status": 400});
                    }
                }).on('complete', function (data, response) {
                    logger.info("Search request completed successfully");
                });
            }
        });
    },
    getUserBehaviorObjectBasedOnReq: function (ws, req, access_token){
        return new Promise(function (resolve, reject) {
            var search_string = "";
            var _cch_id = local_cache.get(access_token + "cch_id");
            var cch_id;

            try {
                if (req.payload.params !== null) {
                    search_string = '[profile.cch_id = "' + _cch_id + '"]';
                    if (typeof req.payload.params.cch_id !== "undefined") {
                        if (req.payload.params.cch_id == "self" && _cch_id !== undefined && _cch_id !== "") {
                            cch_id = _cch_id
                        } else {
                            cch_id = req.payload.params.cch_id;
                        }
                        search_string = '[profile.cch_id = "' + cch_id + '"]';
                    } else {
                        if (typeof req.payload.params.search !== "undefined") {
                            search_string = '[profile.' + req.payload.params.search + ']';
                        }
                    }
                } else {
                    if (_cch_id !== undefined && _cch_id !== "") {
                        cch_id = _cch_id;
                    }
                    search_string = '[profile.cch_id = "' + cch_id + '"]';
                }

            } catch (err) {
                logger.error("System Error" + err);
                reject({"message": "System Error", "status": 500});
            }
            ws.search(search_string)
                .on('success', function (data, response) {
                    if (JSON.stringify(data) === '{}') {
                        logger.debug("User profile doesn't exist");
                        reject({"message": "User profile doesn't exist", "status": 404});
                    } else {
                        logger.info("User profile found and returned");
                        var object_key = Object.keys(data);
                        var profile_id = object_key[0];
                        local_cache.set(access_token + "external_id", data[profile_id]["profile"]["external_id"]);
                        local_cache.set(access_token + "uuid", profile_id);
                        if(data[profile_id]["profile"]["member_external_id"] !== "undefined" && data[profile_id]["profile"]["member_external_id"] !== "" && data[profile_id]["profile"]["member_external_id"] !== null){
                            local_cache.set(access_token + "member_external_id", data[profile_id]["profile"]["member_external_id"]);
                        }
                        // This custom_filter function would filter the result to return only user_behavior object.
                        custom_filter(data, "user_behavior").then(function(filterResult) {
                            resolve(filterResult);
                        }).catch(function (filterError){
                            reject(filterError);
                        });
                    }
                }).on('error', function (err) {
                logger.error(err);
                if (search_string === "") {
                    logger.error("Search criteria is empty");
                    reject({"message": "Search criteria is empty", "status": 400});
                } else {
                    logger.error("Error at getUserBehaviorObjectBasedOnReq: searching as  " + search_string);
                    reject({"message": err, "status": 400});
                }
            }).on('complete', function (data, response) {
                logger.info("Search request completed successfully");
            });
        });
    }
};
