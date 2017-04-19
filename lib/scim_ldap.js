/**
 * Created by hsingh008c on 1/19/17.
 */

'use strict';
var cloudmine = require('cloudmine');
var winston = require('winston');
var config = require('config');
var promise = require('promise');
var rest = require('restler');
var logger = require('./logger_module');
//
// Comcast Connected Health
// 2017
//
var scim_url = config.get('ping.scim_url');
module.exports = {
    createLdap: function createLdap(payload, access_token) {
        return new Promise(function (resolve, reject) {
            //console.log(access_token)
            var header = {
                'Content-Type': 'application/scim+json',
                'Authorization': 'Bearer ' + access_token
            };
            var options_validate = {
                method: "post",
                data: JSON.stringify(payload),
                headers: header,
                timeout: 10000
            };
            //console.log(JSON.stringify(payload));
            rest.post(scim_url, options_validate).on('success', function (ldap_result, response) {
                logger.info('Ldap Account created ');
                resolve(ldap_result);
            }).on('timeout', function (ms) {
                logger.error('Ldap server [scim] connection Timed out');
                reject({"message": "Ldap server connection Timed out", "status": 408})
            }).on('fail', function (error) {
                logger.error(error);
                error = JSON.parse(error);
                reject({"message": error.detail, "status": error.status});
            }).on('error', function (error) {
                logger.error(error);
                error = JSON.parse(error);
                reject({"message": error.detail, "status": error.status});
            });
        });
    },
    updateLdap: function (ldap_payload, ldap_id, access_token) {
        return new Promise(function (resolve, reject) {
            // console.log(access_token)
            var header = {
                'Content-Type': 'application/scim+json',
                'Authorization': 'Bearer ' + access_token
            };

            var ldap_url = scim_url + "/" + ldap_id;
            var keys = Object.keys(ldap_payload);

            var payload = {};
            payload["schemas"] = config.get('ping.scim_schemas');
            var Operation = [];
            var key;
            for (var i = 0; i < keys.length; i++) {
                if (keys[i] == "email") {
                    key = "emails.value"
                } else {
                    key = keys[i]
                }
                // push keys to the array to make patch call.
                Operation.push({"op": "replace", "path": key, "value": ldap_payload[keys[i]]});
            }
            payload["Operations"] = Operation;

            var options_validate = {
                method: "patch",
                data: JSON.stringify(payload),
                headers: header,
                timeout: 10000
            };

            rest.patch(ldap_url, options_validate).on('success', function (ldap_result, response) {
                logger.info('Ldap Account Updated ');
                resolve(ldap_result);
            }).on('timeout', function (ms) {
                logger.error('Ldap server [scim] connection Timed out');
                reject({"message": "Ldap server connection Timed out", "status": 408})
            }).on('fail', function (error) {
                logger.error(error);
                error = JSON.parse(error);
                reject({"message": error.detail, "status": error.status});
            }).on('error', function (error) {
                logger.error(error);
                error = JSON.parse(error);
                reject({"message": error.detail, "status": error.status});
            });
        });
    },
    deleteLdap: function (ldap_id, access_token) {
        return new Promise(function (resolve, reject) {
            var header = {
                'Content-Type': 'application/scim+json',
                'Authorization': 'Bearer ' + access_token
            };
            var options_validate = {
                method: "del",
                headers: header,
                timeout: 10000
            };
            var ldap_url = scim_url + "/" + ldap_id;
            rest.del(ldap_url, options_validate).on('success', function (ldap_result, response) {
                logger.info('Ldap Account Deleted');
                resolve(ldap_result);
            }).on('timeout', function (ms) {
                logger.error('Ldap server [scim] connection Timed out');
                reject({"message": "Ldap server connection Timed out", "status": 408})
            }).on('fail', function (error) {
                logger.error(error);
                error = JSON.parse(error);
                reject({"message": error.detail, "status": error.status});
            }).on('error', function (error) {
                logger.error(error);
                error = JSON.parse(error);
                reject({"message": error.detail, "status": error.status});
            });
        });
    }
};