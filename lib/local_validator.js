'use strict';
var cloudmine = require('cloudmine');
var config = require('config');
var promise = require('promise');
var validator = require('validator');
var logger = require('./logger_module');
//
// Comcast Connected Health
// 2016
//
function validateZip(zipcode){
  var US_postalCodeRegex = /^([0-9]{5})(?:[-\s]*([0-9]{4}))?$/;
  return US_postalCodeRegex.test(zipcode);
}
module.exports = {
  validate_req: function (req) {
    return new promise(function (resolve, reject) {
      if (req.payload.params === null) {
        if (req.payload.request.method != 'GET') {
          return reject("Payload is missing.");
        }
      } else {
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
      if (!config.has('ping.validation_url')) {
        return reject("validation_url property is missing from config file.");
      }
      if (!config.has('ping.authorization')) {
        return reject("authorization property is missing from config file.");
      }
      if (!config.has('ping.grant_type')) {
        return reject("grant_type property is missing from config file.");
      }
      if (!config.has('ping.scim_url')) {
        return reject("scim_url property is missing from config file.");
      }
      if (!config.has('ping.scim_schemas')) {
        return reject("scim_schemas property is missing from config file.");
      }
      if (!config.has('ping.ldap_properties')) {
        return reject("ldap_properties property is missing from config file.");
      }
      if (!config.has('cch.domain')) {
        return reject("domain property is missing from config file.");
      }

      resolve("validated");
    })
  },
  validate_req_user_behavior: function (req) {
    return new promise(function (resolve, reject) {
      if (req.payload.params === null) {
        if (req.payload.request.method != 'GET') {
          return reject("Payload is missing.");
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
      if (!config.has('ping.validation_url')) {
        return reject("validation_url property is missing from config file.");
      }
      if (!config.has('ping.authorization')) {
        return reject("authorization property is missing from config file.");
      }
      if (!config.has('ping.grant_type')) {
        return reject("grant_type property is missing from config file.");
      }
      if (!config.has('ping.scim_url')) {
        return reject("scim_url property is missing from config file.");
      }
      if (!config.has('ping.scim_schemas')) {
        return reject("scim_schemas property is missing from config file.");
      }
      if (!config.has('ping.ldap_properties')) {
        return reject("ldap_properties property is missing from config file.");
      }
      if (!config.has('cch.domain')) {
        return reject("domain property is missing from config file.");
      }

      resolve("validated");
    })
  },
  validate_values: function(req, type) {
    return new promise(function (resolve, reject) {
      if (req.payload.params.email !== undefined) {
        if (!validator.isEmail(req.payload.params.email)) {
          reject("Invalid email")
        }
      } else {
        if(type == "create") {
          reject("Email field is undefined");
        }
      }
      // if(type == "create") {
      //   if (req.payload.params.password !== undefined) {
      //     if (validator.isEmpty(req.payload.params.password)) {
      //       reject("Password can't be empty.")
      //     }
      //   }
      //   else {
      //     reject("Password field is undefined");
      //   }
      // }
      if (req.payload.params.partner_id !== undefined) {
        if (validator.contains(req.payload.params.partner_id, " ")) {
          reject("partner_id can't have space in it.");
        }
      }
      if (req.payload.params.care_manager !== undefined) {
        if (validator.contains(req.payload.params.care_manager, " ")) {
          reject("care_manager id can't have space in it.");
        }
      }
      if (req.payload.params.member_partner_id !== undefined) {
        if (validator.contains(req.payload.params.member_partner_id, " ")) {
          reject("member_partner_id can't have space in it.");
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
      if (req.payload.params.zipcode !== undefined) {
        if (!validateZip(req.payload.params.zipcode)) {
          reject("Invalid Zip code");
        }
      }
        if (req.payload.params.birthdate !== undefined) {

            var iso_date = new Date().toISOString();
            if (!validator.isISO8601(req.payload.params.birthdate)) {
                reject("Birth date should be in ISO8601 format");
            }
            if (validator.isAfter("1900-01-01", req.payload.params.birthdate)) {
                reject("Birth date is before 1900-01-01");
            }
            if (validator.isBefore(iso_date, req.payload.params.birthdate)) {
                reject("Birth date is After "+ iso_date + " date");
            }
        }
      if (req.payload.params.phone != undefined && req.payload.params.phone != "") {
        if (req.payload.params.phone.mobile !== undefined && req.payload.params.phone.mobile != "") {
          var mobile = req.payload.params.phone.mobile;
          mobile = mobile.replace(/-/g, "");
          if (!validator.isMobilePhone(mobile, 'en-US')) {
            reject("Mobile phone is Invalid");
          }
        }
        if (req.payload.params.phone.home !== undefined && req.payload.params.phone.home != "") {
          var home = req.payload.params.phone.home;
          home = home.replace(/-/g, "");
          if (!validator.isMobilePhone(home, 'en-US')) {
            reject("Home phone is Invalid");
          }
        }
        if (req.payload.params.phone.office !== undefined && req.payload.params.phone.office != "") {
          var office = req.payload.params.phone.office;
          office = office.replace(/-/g, "");
          if (!validator.isMobilePhone(office, 'en-US')) {
            reject("Office phone is Invalid");
          }
        }
      }
      resolve("validated");
    });
  }
};