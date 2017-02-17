'use strict';
var cloudmine = require('cloudmine');
var logger = require('./logger_module');
var config = require('config');
var local_cache = require("./cache");
//
// Comcast Connected Health
// 2016
//

module.exports = {
    getUserProfileBasedOnSearchString: function (ws, search_string) {
        return new Promise(function (resolve, reject) {
            //var search_string = '[partner_id = "' + req.payload.params["care_manager"] + '"]';
            ws.search(search_string)
                .on('success', function (data, response) {
                    if (JSON.stringify(data) === '{}') {
                        reject("User profile doesn't exist")
                    } else {
                        resolve(data);
                    }
                }).on('error', function (err) {
                if (search_string === "") {
                    reject("Search criteria is empty");
                } else {
                    reject("Search format is incorrect: Trying to search as " + search_string + err);
                }
            });
        });
    },
    getUserProfileBasedOnReq: function (ws, req, access_token){
        return new Promise(function (resolve, reject) {
            var t = local_cache.get(access_token + "WS");
            var search_string = "";
            var _cch_id = local_cache.get(access_token + "cch_id");
            var cch_id;

            try {
                if (req.payload.params !== null) {
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
                        local_cache.set(access_token + "partner_id", data[profile_id]["profile"]["partner_id"]);
                        local_cache.set(access_token + "uuid", profile_id);
                        if(data[profile_id]["profile"]["member_partner_id"] !== "undefined" && data[profile_id]["profile"]["member_partner_id"] !== "" && data[profile_id]["profile"]["member_partner_id"] !== null){
                            local_cache.set(access_token + "member_partner_id", data[profile_id]["profile"]["member_partner_id"]);
                        }
                        resolve(data);
                    }
                }).on('error', function (err) {
                if (search_string === "") {
                    logger.error("Search criteria is empty");
                    reject({"message": "Search criteria is empty", "status": 400});
                } else {
                    logger.error("Search format is incorrect: Trying to search as " + search_string + err);
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
            var _partner_id = local_cache.get(access_token + "partner_id");
            var _member_partner_id = local_cache.get(access_token + "member_partner_id");
            var cch_id;

            try {
                if (req.payload.params !== null) {
                    if (typeof req.payload.params.cch_id !== "undefined") {
                        cch_id = req.payload.params.cch_id;
                        search_string = '[profile.cch_id = "' + cch_id + '"]';
                        _partner_id="";
                    } else {
                        if (typeof req.payload.params.search !== "undefined") {
                            search_string = '[profile.' + req.payload.params.search + ']';
                            _partner_id="N/A";
                        }
                    }
                } else {
                    if (_cch_id !== undefined && _cch_id !== "") {
                        search_string = '[profile.cch_id = "' + _cch_id + '"]';
                    }
                    if(_partner_id !== undefined && _partner_id !== "") {
                        search_string = '[profile.care_manager = "' + _partner_id + '"]';
                    }
                    if(_member_partner_id !== undefined && _member_partner_id !== "" && _member_partner_id !== null && _partner_id !== undefined && _partner_id !== ""){
                        search_string = '[profile.care_manager = "' + _partner_id + '" or profile.partner_id = "' + _member_partner_id + '"]';
                    }
                    if(_member_partner_id !== undefined && _member_partner_id !== "" && _member_partner_id !== null) {
                        search_string = '[profile.partner_id = "' + _member_partner_id + '"]';
                    }
                }

            } catch (err) {
                logger.error("System Error" + err);
            }

            if(_partner_id === undefined || _partner_id === "") {
                ws.search(search_string).on('success', function (data, response) {
                    if (JSON.stringify(data) === '{}') {
                        logger.debug("User profile doesn't exist");
                        reject({"message": "User profile doesn't exist", "status": 404});
                    } else {
                        logger.info("User profile found and returned");
                        var object_key = Object.keys(data);
                        var profile_id = object_key[0];
                        local_cache.set(access_token + "partner_id", data[profile_id]["profile"]["partner_id"]);
                        if(data[profile_id]["profile"]["member_partner_id"] !== undefined && data[profile_id]["profile"]["member_partner_id"] !== "" && data[profile_id]["profile"]["member_partner_id"] !== null){
                            local_cache.set(access_token + "member_partner_id", data[profile_id]["profile"]["member_partner_id"]);
                            search_string = '[profile.care_manager = "' + data[profile_id]["profile"]["partner_id"] + '" or profile.partner_id = "' + data[profile_id]["profile"]["member_partner_id"] + '"]';
                        }else {
                            search_string = '[profile.care_manager = "' + data[profile_id]["profile"]["partner_id"] + '"]';
                        }
                        ws.search(search_string).on('success', function (allUsers, response) {
                            if (JSON.stringify(allUsers) === '{}') {
                                logger.debug("User profile doesn't exist");
                                reject({"message": "User profile doesn't exist", "status": 404});
                            } else {
                                logger.info("Users profile found and returned");
                                resolve(allUsers);
                            }
                        }).on('error', function (err) {
                            if (search_string === "") {
                                logger.error("Search criteria is empty");
                                reject({"message": "Search criteria is empty", "status": 400});
                            } else {
                                logger.error("Search format is incorrect: Trying to search as " + search_string + err);
                                reject({"message": err, "status": 400});
                            }
                        }).on('complete', function (data, response) {
                            logger.info("Search request completed successfully");
                        });
                    }
                }).on('error', function (err) {
                    if (search_string === "") {
                        logger.error("Search criteria is empty");
                        reject({"message": "Search criteria is empty", "status": 400});
                    } else {
                        logger.error("Search format is incorrect: Trying to search as " + search_string + err);
                        reject({"message": err, "status": 400});
                    }
                }).on('complete', function (data, response) {
                    logger.info("Search request completed successfully");
                });
            }else{
                ws.search(search_string).on('success', function (data, response) {
                    if (JSON.stringify(data) === '{}') {
                        logger.debug("User profile doesn't exist or You don't permissions to view any profile.");
                        reject({"message": "User profile doesn't exist or You don't permissions to view any profile.", "status": 404});
                    } else {
                        logger.info("Users profile found and returned");
                        resolve(data);
                    }
                }).on('error', function (err) {
                    if (search_string === "") {
                        logger.error("Search criteria is empty");
                        reject({"message": "Search criteria is empty", "status": 400});
                    } else {
                        logger.error("Search format is incorrect: Trying to search as " + search_string + err);
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
            var t = local_cache.get(access_token + "WS");
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
                        local_cache.set(access_token + "partner_id", data[profile_id]["profile"]["partner_id"]);
                        local_cache.set(access_token + "uuid", profile_id);
                        if(data[profile_id]["profile"]["member_partner_id"] !== "undefined" && data[profile_id]["profile"]["member_partner_id"] !== "" && data[profile_id]["profile"]["member_partner_id"] !== null){
                            local_cache.set(access_token + "member_partner_id", data[profile_id]["profile"]["member_partner_id"]);
                        }
                        var result={};
                        result[profile_id] = {};
                        result[profile_id]["user_behavior"] = data[profile_id]["user_behavior"];
                        // var params_keys = Object.keys(data[object_key]);
                        // for (var i = 0; i < params_keys.length; i++) {
                        //     console.log(params_keys[i]);
                        // }
                        resolve(result);
                    }
                }).on('error', function (err) {
                if (search_string === "") {
                    logger.error("Search criteria is empty");
                    reject({"message": "Search criteria is empty", "status": 400});
                } else {
                    logger.error("Search format is incorrect: Trying to search as " + search_string + err);
                    reject({"message": err, "status": 400});
                }
            }).on('complete', function (data, response) {
                logger.info("Search request completed successfully");
            });
        });
    }
};
