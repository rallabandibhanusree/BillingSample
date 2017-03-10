'use strict';
var cloudmine = require('cloudmine');
var config = require('config');
var promise = require('promise');
var validator = require('validator');
var logger = require('./logger_module');
var _ = require('underscore');
var allow_role = config.get('ping.role');
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
      if (req.payload.request.body === null || req.payload.request.body == "") {
        if (req.payload.request.method != 'GET') {
          return reject("Payload is missing.");
        }
      } else {
        // if (typeof req.payload.params['access_token'] === 'undefined' || req.payload.params['access_token'] === "") {
        //     return reject("access_token is missing from the payload from promise");
        // }
        if (req.payload.request.method === 'POST' || req.payload.request.method === 'PUT') {
          if (typeof req.payload.request.body.partner_id === "undefined" || req.payload.request.body.partner_id === "") {
            return reject("Partner Id is missing from payload");
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
      if (req.payload.request.body === null || req.payload.request.body == "") {
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
      var errormsg = "";
      var rejectRequest = false;
      if (req.payload.request.body.email !== undefined) {
        if (!validator.isEmail(req.payload.request.body.email)) {
          //reject("Invalid email")
          errormsg = errormsg + "Invalid email, ";
          rejectRequest = true;
        }
      } else {
        if(type == "create") {
          //reject("Email field is undefined");
          errormsg = errormsg + "Email field is undefined, ";
          rejectRequest = true;
        }
      }

      // Role check in case creating new record
      if (req.payload.request.body.role == 'undefined') {
        if (type == "create") {
          //reject("Must have role in the payload in case creating new profile.")
          errormsg = errormsg + "Must have role in the payload in case creating new profile, ";
          rejectRequest = true;
        }
      }else{
        if (type == "create" && allow_role.indexOf(req.payload.request.body.role) <= -1) {
          errormsg = errormsg + "Unknown [ "+ req.payload.request.body.role + " ] role, ";
          rejectRequest = true;
        }
      }

      // Partner ID validation.
      if (req.payload.request.body.partner_id !== undefined) {
        if(validator.trim(req.payload.request.body.partner_id) == ""){
          errormsg = errormsg + "partner_id is Empty, ";
          rejectRequest = true;
        }
        if (validator.contains(req.payload.request.body.partner_id, " ")) {
          //reject("partner_id can't have space in it.");
          errormsg = errormsg + "partner_id can't have space in it, ";
          rejectRequest = true;
        }
      }else{
        errormsg = errormsg + "partner_id is undefined, ";
        rejectRequest = true;
      }

      // Care manager validation.
      if (req.payload.request.body.care_manager !== undefined) {
        if(validator.trim(req.payload.request.body.care_manager) == ""){
          errormsg = errormsg + "care_manager is Empty, ";
          rejectRequest = true;
        }
        if (validator.contains(req.payload.request.body.care_manager, " ")) {
          //reject("care_manager id can't have space in it.");
          errormsg = errormsg + "care_manager id can't have space in it, ";
          rejectRequest = true;
        }
      }

      // Member partner id validation.
      if (req.payload.request.body.member_partner_id !== undefined) {
        if (validator.contains(req.payload.request.body.member_partner_id, " ")) {
          //reject("member_partner_id can't have space in it.");
          errormsg = errormsg + "member_partner_id can't have space in it, ";
          rejectRequest = true;
        }
      }

      if (req.payload.request.body.full_name !== undefined) {
        if(validator.trim(req.payload.request.body.full_name) == ""){
          errormsg = errormsg + "full_name can not be empty, ";
          rejectRequest = true;
        }
        var full_name = req.payload.request.body.full_name;
        full_name = full_name.replace(/ /g, "");
        if (!validator.isAlpha(full_name, 'en-US')) {
          //reject("full_name can only have letters");
          errormsg = errormsg + "full_name can only have letters, ";
          rejectRequest = true;
        }
      }else{
        if(type == "create" && req.payload.request.body.role == "CAREGIVER") {
          errormsg = errormsg + " full_name is undefined";
          rejectRequest = true;
        }
      }

      // Fitst name validation
      if (req.payload.request.body.first_name !== undefined) {
        if(validator.trim(req.payload.request.body.first_name) == ""){
          errormsg = errormsg + "first_name is Empty, ";
          rejectRequest = true;
        }
        if (!validator.isAlpha(req.payload.request.body.first_name, 'en-US')) {
          //reject("first_name only can have letters");
          errormsg = errormsg + "first_name only can have letters, ";
          rejectRequest = true;
        }
      }else{
        if(type == "create" && (req.payload.request.body.role == "MEMBER" || req.payload.request.body.role == "CAREMANAGER")) {
          errormsg = errormsg + "first_name is undefined, ";
          rejectRequest = true;
        }
      }

      // Last name validaiton
      if (req.payload.request.body.last_name !== undefined) {
        if(validator.trim(req.payload.request.body.last_name) == ""){
          errormsg = errormsg + "last_name is empty, ";
          rejectRequest = true;
        }
        if (!validator.isAlpha(req.payload.request.body.last_name, 'en-US')) {
          //reject("last_name only can have letters");
          errormsg = errormsg + "last_name only can have letters, ";
          rejectRequest = true;
        }
      }else{
        if(type == "create" && (req.payload.request.body.role == "MEMBER" || req.payload.request.body.role == "CAREMANAGER")) {
          errormsg = errormsg + "last_name is undefined, ";
          rejectRequest = true;
        }
      }

      // Address 1 validation
      if (req.payload.request.body.address1 === undefined) {
        if(type == "create" && req.payload.request.body.role == "MEMBER") {
          errormsg = errormsg + "Primary address is undefined, ";
          rejectRequest = true;
        }
      }else{
        if(type == "create" &&  validator.trim(req.payload.request.body.address1) === ""){
          errormsg = errormsg + "Primary address is empty, ";
          rejectRequest = true;
        }
      }

      // City validation
      if (req.payload.request.body.city !== undefined) {
        if(validator.trim(req.payload.request.body.city) == ""){
          errormsg = errormsg + "city is empty, ";
          rejectRequest = true;
        }
        if (!validator.isAlpha(req.payload.request.body.city, 'en-US')) {
          //reject("City only can have letters");
          errormsg = errormsg + "city only can have letters, ";
          rejectRequest = true;
        }
      }else{
        if(type == "create" && req.payload.request.body.role == "MEMBER") {
          errormsg = errormsg + "city is undefined, ";
          rejectRequest = true;
        }
      }

      // State Validation
      if (req.payload.request.body.state !== undefined) {
        if(validator.trim(req.payload.request.body.state) == ""){
          errormsg = errormsg + "state is empty, ";
          rejectRequest = true;
        }
        if (!validator.isAlpha(req.payload.request.body.state, 'en-US')) {
          //reject("State only can have letters");
          errormsg = errormsg + "State only can have letters, ";
          rejectRequest = true;
        }
      }else{
        if(type == "create" && req.payload.request.body.role == "MEMBER") {
          errormsg = errormsg + "State is undefined, ";
          rejectRequest = true;
        }
      }

      // Zip code validation
      if (req.payload.request.body.zipcode !== undefined) {
        if(validator.trim(req.payload.request.body.zipcode) == ""){
          errormsg = errormsg + "Zipcode is Empty, ";
          rejectRequest = true;
        }
        if (!validateZip(req.payload.request.body.zipcode)) {
          //reject("Invalid Zip code");
          errormsg = errormsg + "Invalid Zip code, ";
          rejectRequest = true;
        }
      }else{
        if(type == "create" && req.payload.request.body.role == "MEMBER") {
          errormsg = errormsg + "Zipcode is undefined, ";
          rejectRequest = true;
        }
      }

      // Birthday Validation.
      if (req.payload.request.body.birthdate !== undefined) {
        if(validator.trim(req.payload.request.body.birthdate) == ""){
          errormsg = errormsg + "Birthdate is empty, ";
          rejectRequest = true;
        }
        // if (req.payload.params.birthdate.indexOf("-") <= -1) {
        //   reject("Birth date should be in ISO8601 format");
        // }
        var iso_date = new Date().toISOString();
        if (!validator.isISO8601(req.payload.request.body.birthdate) || req.payload.request.body.birthdate.indexOf("-") <= -1) {
          //reject("Birth date should be in ISO8601 format");
          errormsg = errormsg + "Birth date should be in ISO8601 format, ";
          rejectRequest = true;
        }
        if (validator.isAfter("1900-01-01", req.payload.request.body.birthdate)) {
          //reject("Birth date is before 1900-01-01");
          errormsg = errormsg + "Birth date is before 1900-01-01, ";
          rejectRequest = true;
        }
        if (validator.isBefore(iso_date, req.payload.request.body.birthdate)) {
          //reject("Birth date is After " + iso_date + " date");
          errormsg = errormsg + "Birth date is After " + iso_date + " date, ";
          rejectRequest = true;
        }
      }else{
        if(type == "create" && req.payload.request.body.role == "MEMBER") {
          errormsg = errormsg + "Birthdate is undefined, ";
          rejectRequest = true;
        }
      }

      // Phone number Validation
      if (req.payload.request.body.phone != undefined && _.isObject(req.payload.request.body.phone) && !_.isEmpty(req.payload.request.body.phone)) {
        var mobile;
        var home;
        var office;
        if (req.payload.request.body.phone.mobile !== undefined && req.payload.request.body.phone.mobile != "") {
          mobile = validator.trim(req.payload.request.body.phone.mobile);
          mobile = mobile.replace(/-/g, "");
          if (!validator.isMobilePhone(mobile, 'en-US')) {
            //reject("Mobile phone is Invalid");
            errormsg = errormsg + "Mobile phone is Invalid, ";
            rejectRequest = true;
          }
          mobile = true;
        }else{
          mobile = false;
        }
        if (req.payload.request.body.phone.home !== undefined && req.payload.request.body.phone.home != "") {
          home = validator.trim(req.payload.request.body.phone.home);
          home = home.replace(/-/g, "");
          if (!validator.isMobilePhone(home, 'en-US')) {
            //reject("Home phone is Invalid");
            errormsg = errormsg + "Home phone is Invalid, ";
            rejectRequest = true;
          }
          home = true;
        }else{
          home = false;
        }
        if (req.payload.request.body.phone.office !== undefined && req.payload.request.body.phone.office != "") {
          office = validator.trim(req.payload.request.body.phone.office);
          office = office.replace(/-/g, "");
          if (!validator.isMobilePhone(office, 'en-US')) {
            //reject("Office phone is Invalid");
            errormsg = errormsg + "Office phone is Invalid, ";
            rejectRequest = true;
          }
          office = true;
        }else{
          office = false;
        }
        if(!mobile && !home && !office){
          errormsg = errormsg + "Must have at least one phone number from mobile, home or office, ";
          rejectRequest = true;
        }
      }else{
        // for initial roll out phone number is not required field.
        // if(type == "create" && (req.payload.request.body.role == "MEMBER" || req.payload.request.body.role == "CAREMANAGER")) {
        //   errormsg = errormsg + "Phone can't be undefined, Empty and must be object, ";
        //   rejectRequest = true;
        // }
        logger.info("Phone is not required field for first roll out");
      }
      if(rejectRequest){
        reject(errormsg);
      }
      resolve("validated");
    });
  }
};