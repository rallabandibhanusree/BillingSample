/**
 * Created by hsingh008c on 12/14/16.
 */

'use strict';
var cloudmine = require('cloudmine');
var _ = require('underscore');
var uuidV4 = require('uuid/v4');
var winston = require('winston');
var rest = require('restler');
var config = require('config');
var NodeCache = require( "node-cache" );
var promise = require('promise');
var validator = require('validator');
var EventEmitter = require('events').EventEmitter;
var localCache = new NodeCache( { stdTTL: 600 } );

var fs = require('fs');

var env = process.env.NODE_ENV || 'development';
var logDir = 'logs';

if(!fs.existsSync(logDir)){
    fs.mkdirSync(logDir);
}

var tsFormat = function() {
    return new Date().toLocaleString();
};

var logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            name: "Info",
            timestamp: tsFormat,
            filename:'./logs/user_account_info.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880,
            colorize: false,
            level: 'info'
        }),
        new winston.transports.File({
            name: "error",
            timestamp: tsFormat,
            filename:'./logs/user_account_error.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880,
            colorize: false,
            level: 'error'
        }),
        new winston.transports.File({
            name: "debug",
            timestamp: tsFormat,
            filename:'./logs/user_account_debug.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880,
            colorize: false,
            level: 'debug'
        }),
        new winston.transports.Console({
            timestamp: tsFormat,
            level: env === 'development' ? 'info' : 'error',
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

//

// Comcast Connected Health
// 2016
//

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

var createUserAndProfile = function(ws,req,searchData,reply,access_token) {
    var uuid = uuidV4();
    function validate_values(req) {
        return new promise(function (resolve, reject) {
            if(req.payload.params.email !== undefined) {
                if (!validator.isEmail(req.payload.params.email)) {
                    reject("Invalid email")
                }
            }else{
                reject("Email field is undefined");
            }
            if(req.payload.params.password !== undefined) {
                if (validator.isEmpty(req.payload.params.password)) {
                    reject("Password can't be empty.")
                }
            }
            else{
                reject("Password field is undefined");
            }
            if (req.payload.params.first_name !== undefined) {
                if (!validator.isAlpha(req.payload.params.first_name, 'en-US')) {
                    reject("first_name only can have letters");
                }
            }
            if (req.payload.params.last_name !== undefined) {
                if (!validator.isAlpha(req.payload.params.last_name, 'en-US')) {
                    reject("last_name only can have letters");
                }
            }
            if (req.payload.params.city !== undefined) {
                if (!validator.isAlpha(req.payload.params.city, 'en-US')) {
                    reject("City only can have letters");
                }
            }
            if (req.payload.params.state !== undefined) {
                if (!validator.isAlpha(req.payload.params.state, 'en-US')) {
                    reject("State only can have letters");
                }
            }
            if(req.payload.params.phone != undefined &&  req.payload.params.phone != "")  {
                if (req.payload.params.phone.mobile !== undefined && req.payload.params.phone.mobile != "") {
                    if (!validator.isMobilePhone(req.payload.params.phone.mobile, 'en-US')) {
                        reject("Mobile phone is Invalid");
                    }
                }
                if (req.payload.params.phone.home !== undefined && req.payload.params.phone.home != "") {
                    if (!validator.isMobilePhone(req.payload.params.phone.home, 'en-US')) {
                        reject("Home phone is Invalid");
                    }
                }
            }
            resolve("validated");
        });
    }
    function createLdap(){
        return new Promise(function (resolve, reject){
            //console.log(access_token)
            var header = {
                'Content-Type': 'application/scim+json',
                'Authorization': 'Bearer ' + access_token
            };
            var payload = {};
            payload["schemas"] = config.get('ping.scim_schemas');
            payload["emails"] = [{"value":req.payload.params.email}];
            payload["username"] = req.payload.params.username;
            payload["password"] = req.payload.params.password;
            payload["role"] = [];
            payload["status"] = req.payload.params.status;
            payload["partner_id"] = req.payload.params.partner_id;

            var options_validate = {
                method: "post",
                data: JSON.stringify(payload),
                headers: header,
                timeout: 10000
            };
            //console.log(JSON.stringify(payload));
            rest.post(config.get('ping.scim_url'), options_validate).on('success', function(ldap_result, response) {
                logger.info('Ldap Account created ');
                resolve(ldap_result);
            }).on('timeout', function (ms) {
                logger.error('Time out');
                reject("Timeout")
            }).on('fail', function (error) {
                logger.error(error);
                reject(error);
            }).on('error', function (error) {
                logger.error(error);
                reject(error)
            });
        });
    }
    validate_values(req).then(function (result) {
        createLdap().then(function (ldap_result) {
            // convert string to json object
            var ldapResult=JSON.parse(ldap_result);
            ws.createUser({
                email: ldapResult.id + "@cch.com",
                password: ldapResult.id + "-cch",
                username: req.payload.params.username
            }).on('success', function (userData, response) {
                logger.info("User added successfully.");
                logger.info("Creating profile for that user.");
                // User id in case we need admin ID in acl
                //, ''+ ws.options.user_id + ''
                var acl = {
                    "members": ['' + userData.__id__ + ''],
                    "__type__": "acl",
                    "segments": {
                        "public": false,
                        "logged_in": false
                    },
                    "permissions": ["r", "u", "c", "d"],
                    "my_extra_info": req.payload.params.partner_id
                };
                ws.updateACL(acl).on('success', function (Acldata, response) {
                    //it would return acl key which is 0'th location in the array.
                    var acl_id = Object.keys(Acldata);
                    logger.info("ACL created in order to provide access the user");


                    var update_obj = {};
                    var params_keys = Object.keys(req.payload.params);
                    var user_data_obj_update = {};
                    for (var i = 0; i < params_keys.length; i++) {
                        if (params_keys[i] === 'password' || params_keys[i] === 'access-token') {
                            continue;
                        }
                        user_data_obj_update[params_keys[i]] = req.payload.params[params_keys[i]];
                    }
                    user_data_obj_update["location"] = ldapResult.meta.location;
                    user_data_obj_update["ldap_id"] = ldapResult.id;
                    user_data_obj_update['cch_id'] = uuid;
                    user_data_obj_update['__class__'] = "user";
                    user_data_obj_update['__access__'] = acl_id[0];
                    update_obj['profile_' + uuid] = user_data_obj_update;

                    //Get ACL by key
                    /*ws.getACL(acl_id[0]).on('success',function(data, response) {
                     console.log(data);
                     console.log(data["success"][acl_id[0]].members);
                     });*/

                    ws.set(update_obj).on('success', function (Profiledata, response) {
                        logger.info("User profile created successfully");
                        reply({"message":"Added successfully", "cch_id": uuid}).code(201);
                    }).on('error', function (err) {
                        logger.error("Error creating user profile, need to revert the transaction." + err);
                        reply(err);
                    });
                }).on('error', function (err) {
                    logger.error("Cant create ACL, Need to revert this transaction." + err);
                    reply(err);
                });
            }).on('error', function (err) {
                logger.error("Cant create account there is an issue with user account, account may already exist." + err);
                reply(err);
            }).on('complete', function (data, response) {
                logger.info("Data Transaction completed");
            });
        }).catch(function (error) {
            logger.error(error);
            reply(error).code(400)
        });
    }).catch(function (error) {
        logger.error(error);
        reply(error).code(400);
    });
}

var update = function(ws,req,data,reply,access_token){
    function updateLdap(ldap_payload, ldap_id){
        return new Promise(function (resolve, reject){
            // console.log(access_token)
            var header = {
                'Content-Type': 'application/scim+json',
                'Authorization': 'Bearer ' + access_token
            };

            var ldap_url = config.get('ping.scim_url') + "/" + ldap_id;
            var keys = Object.keys(ldap_payload);

            var payload = {};
            payload["schemas"] = config.get('ping.scim_schemas');
            var Operation = [];
            var key;
            for (var i = 0; i < keys.length; i++) {
                if(keys[i] == "email"){
                    key = "emails.value"
                }else{
                    key = keys[i]
                }
                // push keys to the array to make patch call.
                Operation.push({"op": "replace","path": key, "value": ldap_payload[keys[i]]});
            }
            payload["Operations"] = Operation;

            var options_validate = {
                method: "patch",
                data: JSON.stringify(payload),
                headers: header,
                timeout: 10000
            };

            rest.patch(ldap_url, options_validate).on('success', function(ldap_result, response) {
                logger.info('Ldap Account Updated ');
                resolve(ldap_result);
            }).on('timeout', function (ms) {
                logger.error('Time out');
                reject("Timeout")
            }).on('fail', function (error) {
                logger.error(error);
                reject(error);
            }).on('error', function (error) {
                logger.error(error);
                reject(error)
            });
        });
    }
    function validate_values(req) {
        return new promise(function (resolve, reject) {
            if (req.payload.params.email !== undefined) {
                if (!validator.isEmail(req.payload.params.email)) {
                    reject("Invalid email")
                }
            }
            if (req.payload.params.first_name !== undefined) {
                if (!validator.isAlpha(req.payload.params.first_name, 'en-US')) {
                    reject("first_name only can have letters");
                }
            }
            if (req.payload.params.last_name !== undefined) {
                if (!validator.isAlpha(req.payload.params.last_name, 'en-US')) {
                    reject("last_name only can have letters");
                }
            }
            if (req.payload.params.city !== undefined) {
                if (!validator.isAlpha(req.payload.params.city, 'en-US')) {
                    reject("City only can have letters");
                }
            }
            if (req.payload.params.state !== undefined) {
                if (!validator.isAlpha(req.payload.params.state, 'en-US')) {
                    reject("State only can have letters");
                }
            }
            if(req.payload.params.phone != undefined &&  req.payload.params.phone != "") {
                if (req.payload.params.phone.mobile !== undefined && req.payload.params.phone.mobile != "") {
                    if (!validator.isMobilePhone(req.payload.params.phone.mobile, 'en-US')) {
                        reject("Mobile phone is Invalid");
                    }
                }

                if (req.payload.params.phone.home !== undefined && req.payload.params.phone.home != "") {
                    if (!validator.isMobilePhone(req.payload.params.phone.home, 'en-US')) {
                        reject("Home phone is Invalid");
                    }
                }
            }
            resolve("validated");
        });
    }
    validate_values(req)
        .then(function (result) {
            logger.info("User already exist. Next step compare data to make sure everything is up to date.");
            var params_keys = Object.keys(req.payload.params);

            var require_update = false;
            var ldap_update_required = false;
            var update_obj = {};
            var user_data_obj_update = {};
            var object_key = Object.keys(data);
            var profile_id = object_key[0];
            var ldap_properies = config.get('ping.ldap_properties');

            var ldap_payload = {};
            for (var i = 0; i < params_keys.length; i++) {
                if (params_keys[i] === 'password' || params_keys[i] === 'access-token') {
                    continue;
                }
                if (typeof data[profile_id][params_keys[i]] !== "undefined") {
                    if (_.isObject(data[profile_id][params_keys[i]]) && _.isObject(req.payload.params[params_keys[i]])) {
                        if (!_.isEqual(data[profile_id][params_keys[i]], req.payload.params[params_keys[i]])) {
                            user_data_obj_update[params_keys[i]] = req.payload.params[params_keys[i]];
                            require_update = true;
                            if(ldap_properies.indexOf(params_keys[i]) > -1){
                                ldap_update_required = true;
                                ldap_payload[params_keys[i]] = req.payload.params[params_keys[i]];
                            }
                        }
                    }else if (_.isArray(req.payload.params[params_keys[i]]) && _.isArray(data[profile_id][params_keys[i]])){
                        if(check_equal(req.payload.params[params_keys[i]],data[profile_id][params_keys[i]])){
                            user_data_obj_update[params_keys[i]] = req.payload.params[params_keys[i]];
                            require_update = true;
                            if(ldap_properies.indexOf(params_keys[i]) > -1){
                                ldap_update_required = true;
                                ldap_payload[params_keys[i]] = req.payload.params[params_keys[i]];
                            }
                        }
                    } else {
                        if (req.payload.params[params_keys[i]] !== data[profile_id][params_keys[i]]) {
                            user_data_obj_update[params_keys[i]] = req.payload.params[params_keys[i]];
                            require_update = true;
                            if(ldap_properies.indexOf(params_keys[i]) > -1){
                                ldap_payload[params_keys[i]] = req.payload.params[params_keys[i]];
                                ldap_update_required = true;
                            }
                        }
                    }
                } else {
                    user_data_obj_update[params_keys[i]] = req.payload.params[params_keys[i]];
                    logger.info("Adding new properties");
                    require_update = true;
                    if(ldap_properies.indexOf(params_keys[i]) > -1){
                        ldap_payload[params_keys[i]] = req.payload.params[params_keys[i]];
                        ldap_update_required = true;
                    }
                }
            }

            update_obj[profile_id] = user_data_obj_update;
            if(ldap_update_required && require_update){
                updateLdap(ldap_payload, data[profile_id]["ldap_id"]).then(function (ldap_result) {
                    ws.update(update_obj).on('success', function (userdata, response) {
                        logger.info("User profile updated in CM");
                        reply("User Profile Updated");
                    }).on('error', function (err, response) {
                        logger.error("Can't update profile." + err);
                        reply(err);
                    }).on('complete', function (data, response) {
                        logger.info('Request to update profile completed successfully');
                    });
                }).catch(function (error) {
                    logger.error(error.id);
                    reply(error)
                });
            }else if (require_update ) {
                ws.update(update_obj).on('success', function (userdata, response) {
                    logger.info("User profile updated");
                    reply("User Profile Updated");
                }).on('error', function (err, response) {
                    logger.error("Can't update profile." + err);
                    reply(err);
                }).on('complete', function (data, response) {
                    logger.info('Request to update profile completed successfully');
                });
            } else {
                logger.info("User profile is already up to date.");
                reply('User Data already up to date');
            }
        }).catch(function (error){
            logger.error(error);
            reply(error).code(400)
        });
};

var searchUserProfile = function(ws,req,reply,access_token){
    var search_string = "";
    var cch_id;
    try {
        if (typeof req.payload.params.cch_id !== "undefined") {
            cch_id = req.payload.params.cch_id;
            search_string = '[cch_id = "' + cch_id + '"]'
        } else {
            if (typeof req.payload.params.search !== "undefined") {
                search_string = '[' + req.payload.params.search + ']';
            }
        }
    }catch(err){
        logger.error("System Error" + err);
        reply("System error");
    }
    // Following code is commented cause we can't have custom header in clodumine at this point
    // try {
    //     // It would override the params id.
    //     if (typeof req.headers.cch_id !== "undefined") {
    //         cch_id = req.headers.cch_id;
    //         search_string = '[cch_id = "' + cch_id + '"]'
    //     }else{
    //         if (typeof req.headers.search !== "undefined") {
    //             search_string = '[' + req.headers.search + ']';
    //         }
    //     }
    //
    // }catch(err){
    //     logger.error("System Error" + err);
    //     reply("System error");
    // }
    //search_string = '[cch_id = "' + cch_id + '"]'
    ws.search(search_string)
        .on('success', function (data, response) {
            if (JSON.stringify(data) === '{}') {
                logger.debug("User profile doesn't exist");
                reply("User profile doesn't exist").code(404);
            } else {
                logger.info("User profile found and returned");
                reply(data);
            }
        }).on('error', function (err) {
            if (search_string === "") {
                logger.error("Search criteria is empty");
                reply("Search criteria is empty").code(400);
            } else {
                logger.error("Search format is incorrect: Trying to search as " + search_string + err);
                //reply('Search format is incorrect: Make sure format of search is like \'last_name="singh" or first_name="harvinder"\' or pass cch_id="{your_cch_id}" ');
                reply(err);
            }
        }).on('complete', function (data, response) {
            logger.info("Search request completed successfully");
        });
}


module.exports = function(req, reply) {
    // After successful login call main function.
    var main = function (ws, req, reply, access_token) {
        if (req.payload.request.method === 'POST') {
            //Search the record first then add, otherwise Update
            try {
                ws.search('[partner_id = "' + req.payload.params.partner_id + '"]').on('success', function (searchData, response) {
                    if (JSON.stringify(searchData) === '{}') {
                        createUserAndProfile(ws, req, searchData, reply, access_token);
                    } else {
                        //update(ws, req, searchData, reply, access_token);
                        logger.error("User profile already exist");
                        reply("User profile already exist").code(409);
                    }
                }).on("error", function (error) {
                    logger.error("Error searching partner_id" + error);
                    reply("Error searching partner_id" + error);
                });
            }catch (error) {
                logger.error("Server Error" + error);
                reply("Server Error").code(500);
            }
        } else if (req.payload.request.method === 'GET') {
            try {
                searchUserProfile(ws, req, reply,access_token);
            } catch (err) {
                logger.error("Server Error" + err);
                reply("Server Error").code(500);
            }
        } else if (req.payload.request.method === 'PUT') {
            try {
                ws.search('[partner_id = "' + req.payload.params.partner_id + '"]').on('success', function (searchData, response) {
                    if (JSON.stringify(searchData) === '{}') {
                        // logger.debug("User profile does't exist");
                        // reply("User profile does't exist").code(404);
                        createUserAndProfile(ws, req, searchData, reply, access_token);
                    } else {
                        update(ws, req, searchData, reply,access_token);
                    }
                }).on('error', function (err) {
                    logger.error(err);
                    //reply('Search format is incorrect: Make sure format of search is like \'last_name="singh" or first_name="harvinder"\' or pass cch_id="{your_cch_id}" ');
                    reply(err);
                });
            }catch (error) {
                logger.error("Server Error" + error);
                reply("Server Error").code(500);
            }
        } else {
            logger.error("Method isn't supported");
            reply({Failed: "Method isn't supported"});
        }
    };

    function validate_req(req){
        return new promise(function (resolve, reject){
            if (req.payload.params === null) {
                return reject("Payload is missing.");
            }else{
                // if (typeof req.payload.params['access_token'] === 'undefined' || req.payload.params['access_token'] === "") {
                //     return reject("access_token is missing from the payload from promise");
                // }
                if (req.payload.request.method === 'POST' || req.payload.request.method === 'PUT') {
                    if (typeof req.payload.params['partner_id'] === "undefined" || req.payload.params['partner_id'] === "") {
                        return reject("Partner Id is missing from promise");
                    }
                }
            }
            if (typeof req.payload.session['session_token'] === 'undefined' || req.payload.session['session_token'] === "" || req.payload.session['session_token'] === null) {
                return reject("access_token is missing from the session");
            }
            if (typeof req.payload.session['app_id'] === 'undefined' || req.payload.session['app_id'] === "" || req.payload.session['app_id'] === null) {
                return reject("app_id is missing from the session");
            }
            if (typeof req.payload.session['api_key'] === 'undefined' || req.payload.session['api_key'] === "" || req.payload.session['api_key'] === null) {
                return reject("api_key is missing from the session");
            }
            if(! config.has('ping.validation_url')){
                return reject("validation_url property is missing from config file.");
            }
            if(! config.has('ping.authorization')){
                return reject("authorization property is missing from config file.");
            }
            if(! config.has('ping.grant_type')){
                return reject("grant_type property is missing from config file.");
            }
            if(! config.has('ping.scim_url')){
                return reject("scim_url property is missing from config file.");
            }
            if(! config.has('ping.scim_schemas')){
                return reject("scim_schemas property is missing from config file.");
            }
            if(! config.has('ping.ldap_properties')){
                return reject("ldap_properties property is missing from config file.");
            }

            resolve("validated");
        })
    }
//TESTING to make sure user we added also have access to its own profile since data belongs to admin user.
//     var testws = new cloudmine.WebService({
//         appid: req.payload.session.app_id,
//         apikey: req.payload.session.api_key,
//         shared: true,
//         appname: "UserAccount"
//     });
//     testws.login("Harvinder_singh11@comcast.com", "Welcome123")
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

    validate_req(req)
        .then(function (result) {
            logger.info((result));
            var session_token = "";

            try {
                session_token = localCache.get(req.payload.session['session_token']);
                var access_token = req.payload.session['session_token'];
            }catch(err){
                logger.error(err);
            }

            if (session_token !== undefined && session_token !== "") {
                logger.info("No need to login, resume existing session");
                var ws = new cloudmine.WebService({
                    appid: req.payload.session.app_id,
                    apikey: req.payload.session.api_key,
                    session_token: session_token,
                    shared: true,
                    appname: "UserAccount"
                });
                main(ws,req,reply,access_token);
            } else {
                var ws = new cloudmine.WebService({
                    appid: req.payload.session.app_id,
                    apikey: req.payload.session.api_key,
                    shared: true,
                    appname: "UserAccount"
                });

                var header = {
                    'content-type': 'application/x-www-form-urlencoded',
                    'Authorization': config.get('ping.authorization')
                };

                var payload_validate = {};
                payload_validate['grant_type'] = config.get('ping.grant_type');
                payload_validate['token'] = access_token;
                var options_validate = {
                    method: "post",
                    data: payload_validate,
                    headers: header,
                    timeout: 10000
                };

                rest.post(config.get('ping.validation_url'), options_validate).on('success', function (validate_result, response) {
                    ws.login(validate_result["access_token"]["entryuuid"] + "@cch.org", validate_result["access_token"]["entryuuid"] + "-cch")
                        .on('success', function (data, response) {
                            logger.info("Login successful");
                            localCache.set(req.payload.session['session_token'], data['session_token']);
                            main(ws, req, reply,access_token);
                        }).on('error', function (err) {
                        logger.error("login error" + err);
                        reply(err);
                    });
                }).on('timeout', function (ms) {
                    logger.error('Did not return within ' + ms + ' ms');
                    reply(error).code(504);
                }).on('fail', function (error) {
                    logger.error(error);
                    reply(error).code(401);
                }).on('error', function (error) {
                    logger.error(error);
                    reply(error).code(401);
                });
            }
        })
        .catch(function (error) { logger.error(error); reply(error).code(400)});
};