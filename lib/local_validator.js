'use strict';
var cloudmine = require('cloudmine');
var config = require('config');
var promise = require('promise');
var validator = require('validator');
var logger = require('./logger_module');
var _ = require('underscore');
var allow_role = config.get('ping.role');
//var moment = require('moment');
//
// Comcast Connected Health
// 2016
//
function validateZip(zipcode){
  var US_postalCodeRegex = /^([0-9]{5})(?:[-\s]*([0-9]{4}))?$/;
  return US_postalCodeRegex.test(zipcode);
}
function validateEffectiveDate(date){
  var dateReg = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})Z$/;
  return dateReg.test(date);
}
function validateyyyy_mm_dd_Date(date){
  var dateReg = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;
  return dateReg.test(date);
}
function validatePhoneFormat(phone){
  var phoneReg = /^\(?([0-9]{3})\)?[-. ]([0-9]{3})[-. ]([0-9]{4})$/;
  return phoneReg.test(phone);
}
// Generate error message.
function gen_errormsg(error, new_error){
  if(error != ""){
    error = error + ", ";
  }
  error = error + new_error;
  return error;
}
// Getting from config files.
var phone_schema = config.get('ping.phone_schema');
var top_level_schema = config.get('ping.top_level_schema');
var service_order_schema = config.get('ping.service_order_schema');

module.exports = {
  validate_req: function (req) {
    return new promise(function (resolve, reject) {
      var errormsg = "";
      var rejectRequest = false;
      if (req.payload.request.body === null || req.payload.request.body == "") {
        if (req.payload.request.method != 'GET') {
          errormsg = gen_errormsg(errormsg, "Payload is missing");
          rejectRequest = true;
        }
      } else {
        // if (typeof req.payload.params['access_token'] === 'undefined' || req.payload.params['access_token'] === "") {
        //     return reject("access_token is missing from the payload from promise");
        // }
        if (req.payload.request.method === 'POST' || req.payload.request.method === 'PUT') {
          if (typeof req.payload.request.body.partner_id === "undefined" || req.payload.request.body.partner_id === "") {
            errormsg = gen_errormsg(errormsg, "Partner Id is missing from payload");
            rejectRequest = true;
          }
        }
      }
      if (typeof req.payload.session['session_token'] === 'undefined' || req.payload.session['session_token'] === "" || req.payload.session['session_token'] === null) {
        errormsg = gen_errormsg(errormsg, "access_token is missing from the session");
        rejectRequest = true;
      }
      if (typeof req.payload.session['app_id'] === 'undefined' || req.payload.session['app_id'] === "" || req.payload.session['app_id'] === null) {
        errormsg = gen_errormsg(errormsg, "app_id is missing from the session");
        rejectRequest = true;
      }
      if (typeof req.payload.session['api_key'] === 'undefined' || req.payload.session['api_key'] === "" || req.payload.session['api_key'] === null) {
        errormsg = gen_errormsg(errormsg, "api_key is missing from the session");
        rejectRequest = true;
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
      if (!config.has('cloudmine.app_id')) {
        return reject("app_id property is missing from config file.");
      }
      if (!config.has('cloudmine.api_key')) {
        return reject("api_key property is missing from config file.");
      }

      if(rejectRequest){
        reject(errormsg);
      }
      resolve("validated");
    })
  },
  validate_req_user_behavior: function (req) {
    return new promise(function (resolve, reject) {
      var errormsg = "";
      var rejectRequest = false;
      if (req.payload.request.body === null || req.payload.request.body == "") {
        if (req.payload.request.method != 'GET') {
          errormsg = gen_errormsg(errormsg, "Payload is missing");
          rejectRequest = true;
        }
      }
      if (typeof req.payload.session['session_token'] === 'undefined' || req.payload.session['session_token'] === "" || req.payload.session['session_token'] === null) {
        errormsg = gen_errormsg(errormsg, "access_token is missing from the session");
        rejectRequest = true;
      }
      if (typeof req.payload.session['app_id'] === 'undefined' || req.payload.session['app_id'] === "" || req.payload.session['app_id'] === null) {
        errormsg = gen_errormsg(errormsg, "app_id is missing from the session");
        rejectRequest = true;
      }
      if (typeof req.payload.session['api_key'] === 'undefined' || req.payload.session['api_key'] === "" || req.payload.session['api_key'] === null) {
        errormsg = gen_errormsg(errormsg, "api_key is missing from the session");
        rejectRequest = true;
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

      if(rejectRequest){
        reject(errormsg);
      }
      resolve("validated");
    })
  },
  validate_val_service_order: function (req) {
    return new promise(function (resolve, reject) {
      var errormsg = "";
      var rejectRequest = false;

      // Schema Validation.
      var service_order_schema_validation_failed = false;
      var params_keys = Object.keys(req.payload.request.body);
      for (var i = 0; i < params_keys.length; i++) {
        if (!(service_order_schema.indexOf(params_keys[i]) > -1)) {
          errormsg = gen_errormsg(errormsg, params_keys[i]);
          service_order_schema_validation_failed = true;
        }else{
          if (_.isObject(req.payload.request.body[params_keys[i]])) {
            console.error(params_keys[i] + " Can't be object");
            reject(params_keys[i] + " Can't be object");
          }
        }
      }
      if(service_order_schema_validation_failed){
        errormsg = gen_errormsg(errormsg, " Keys are not allow to have in service order schema");
        rejectRequest = true;
      }

      // Service order id validation.
      if (req.payload.request.body.service_order_id == undefined || req.payload.request.body.service_order_id == "") {
        errormsg = gen_errormsg(errormsg, "service_order_id cant be undefined or empty");
        rejectRequest = true;
      }

      // Partner id validation.
      if (req.payload.request.body.partner_id == undefined || req.payload.request.body.partner_id == "") {
        errormsg = gen_errormsg(errormsg, "partner_id cant be undefined or empty");
        rejectRequest = true;
      }

      // Operation Type validation.
      if (req.payload.request.body.operation_type == undefined || req.payload.request.body.operation_type == "") {
        errormsg = gen_errormsg(errormsg, "operation_type cant be undefined or empty");
        rejectRequest = true;
      } else {
        var input_type = req.payload.request.body.operation_type;
        var Operation_list = ["A","R","M","C"];
        if (!(Operation_list.indexOf(input_type.toUpperCase()) > -1)) {
          errormsg = gen_errormsg(errormsg, "Operation Type isn't supported");
          rejectRequest = true;
        }
      }

      // Service code validation.
      if (req.payload.request.body.service_code == undefined || req.payload.request.body.service_code == "") {
        errormsg = gen_errormsg(errormsg, "service_code cant be undefined or empty");
        rejectRequest = true;
      }

      // Effective Date Validation.
      if (req.payload.request.body.effective_date !== undefined) {
        //console.log(moment(req.payload.request.body.effective_date, moment.ISO_8601).isValid());
        if(validator.trim(req.payload.request.body.effective_date) == ""){
          errormsg = gen_errormsg(errormsg, "effective_date is empty");
          rejectRequest = true;
        }else{
          if(!validateEffectiveDate(req.payload.request.body.effective_date)){
            errormsg = gen_errormsg(errormsg, "effective_date must be in the YYYY-MM-DDThh:mm:ssZ format");
            rejectRequest = true;
          }
        }
        var iso_date = new Date().toISOString();
        if (!validator.isISO8601(req.payload.request.body.effective_date) || req.payload.request.body.effective_date.indexOf("-") <= -1) {
          errormsg = gen_errormsg(errormsg, "effective_date should be in ISO8601 format");
          rejectRequest = true;
        }
        if (validator.isAfter("1900-01-01", req.payload.request.body.effective_date)) {
          errormsg = gen_errormsg(errormsg, "effective_date is before 1900-01-01");
          rejectRequest = true;
        }
        // if (validator.isBefore(iso_date, req.payload.request.body.effective_date)) {
        //   //reject("Birth date is After " + iso_date + " date");
        //   errormsg = gen_errormsg(errormsg, "effective_date is After " + iso_date + " date");
        //   rejectRequest = true;
        // }
      }else{
        errormsg = gen_errormsg(errormsg, "effective_date is undefined");
        rejectRequest = true;
      }
      if(rejectRequest){
        reject(errormsg);
      }
      resolve("validated");
    });
  },
  validate_values: function(req, type) {
    return new promise(function (resolve, reject) {
      var errormsg = "";
      var rejectRequest = false;

      // Schema Validation.
      var top_schema_validation_failed = false;
      var params_keys = Object.keys(req.payload.request.body);
      for (var i = 0; i < params_keys.length; i++) {
        if (!(top_level_schema.indexOf(params_keys[i]) > -1)) {
          errormsg = gen_errormsg(errormsg, params_keys[i]);
          top_schema_validation_failed = true;
        }else{
          if(params_keys[i] != "phones") {
            if (_.isObject(req.payload.request.body[params_keys[i]])) {
              console.error(params_keys[i] + " Can't be an object");
              reject(params_keys[i] + " Can't be an object");
              //errormsg = gen_errormsg(errormsg, params_keys[i] + "Can't be object");
              //top_schema_validation_failed = true;
            }
          }else{
            if (!(_.isObject(req.payload.request.body[params_keys[i]]))) {
              console.error(params_keys[i] + " Must be an object");
              reject(params_keys[i] + " Must be an object");
            }
          }
        }
      }
      if(top_schema_validation_failed){
        errormsg = gen_errormsg(errormsg, " Keys are not allow to have in user profile schema");
        rejectRequest = true;
      }

      // Email Validation
      if (req.payload.request.body.email !== undefined) {
        if (!validator.isEmail(req.payload.request.body.email)) {
          errormsg = gen_errormsg(errormsg, "Invalid email");
          rejectRequest = true;
        }
      } else {
        if(type == "create") {
          errormsg = gen_errormsg(errormsg, "Email field is undefined");
          rejectRequest = true;
        }
      }

      // Role check in case creating new record
      if (req.payload.request.body.role == 'undefined') {
        if (type == "create") {
          errormsg = gen_errormsg(errormsg, "Must have role in the payload in case creating new profile");
          rejectRequest = true;
        }
      }else{
        if (type == "create" && allow_role.indexOf(req.payload.request.body.role) <= -1) {
          errormsg = gen_errormsg(errormsg, "Unknown [ "+ req.payload.request.body.role + " ] role");
          rejectRequest = true;
        }
      }

      // Partner ID validation.
      if (req.payload.request.body.partner_id !== undefined) {
        if(validator.trim(req.payload.request.body.partner_id) == ""){
          errormsg = gen_errormsg(errormsg, "partner_id is Empty");
          rejectRequest = true;
        }
        if (validator.contains(req.payload.request.body.partner_id, " ")) {
          errormsg = gen_errormsg(errormsg, "partner_id can't have space in it");
          rejectRequest = true;
        }
      }else{
        errormsg = gen_errormsg(errormsg, "partner_id is undefined");
        rejectRequest = true;
      }

      // Care manager validation.
      if (req.payload.request.body.care_manager !== undefined) {
        if(validator.trim(req.payload.request.body.care_manager) == ""){
          errormsg = gen_errormsg(errormsg, "care_manager is Empty");
          rejectRequest = true;
        }
        if (validator.contains(req.payload.request.body.care_manager, " ")) {
          errormsg = gen_errormsg(errormsg, "care_manager id can't have space in it");
          rejectRequest = true;
        }
      }

      // Member partner id validation.
      if (req.payload.request.body.member_partner_id !== undefined) {
        if (validator.contains(req.payload.request.body.member_partner_id, " ")) {;
          errormsg = gen_errormsg(errormsg, "member_partner_id can't have space in it");
          rejectRequest = true;
        }
      }

      if (req.payload.request.body.full_name !== undefined) {
        if(validator.trim(req.payload.request.body.full_name) == ""){
          errormsg = gen_errormsg(errormsg, "full_name can not be empty");
          rejectRequest = true;
        }
        var full_name = req.payload.request.body.full_name;
        full_name = full_name.replace(/ /g, "");
        if (!validator.isAlpha(full_name, 'en-US')) {
          errormsg = gen_errormsg(errormsg, "full_name can only have letters");
          rejectRequest = true;
        }
      }else{
        if(type == "create" && req.payload.request.body.role == "CAREGIVER") {
          errormsg = gen_errormsg(errormsg, "full_name is undefined");
          rejectRequest = true;
        }
      }

      // Fitst name validation
      if (req.payload.request.body.first_name !== undefined) {
        if(validator.trim(req.payload.request.body.first_name) == ""){
          errormsg = gen_errormsg(errormsg, "first_name is Empty");
          rejectRequest = true;
        }
        var first_name = req.payload.request.body.first_name
        first_name = first_name.replace(/[-'. ]/g, "");
        if (!validator.isAlpha(first_name, 'en-US')) {
          //reject("first_name only can have letters");
          errormsg = gen_errormsg(errormsg, "first_name only can have letters");
          rejectRequest = true;
        }
      }else{
        if(type == "create" && (req.payload.request.body.role == "MEMBER" || req.payload.request.body.role == "CAREMANAGER")) {
          errormsg = gen_errormsg(errormsg, "first_name is undefined");
          rejectRequest = true;
        }
      }

      // Last name validation
      if (req.payload.request.body.last_name !== undefined) {
        if(validator.trim(req.payload.request.body.last_name) == ""){
          errormsg = gen_errormsg(errormsg, "last_name is empty");
          rejectRequest = true;
        }
        var last_name = req.payload.request.body.last_name
        last_name = last_name.replace(/[-'. ]/g, "");
        if (!validator.isAlpha(last_name, 'en-US')) {
          errormsg = gen_errormsg(errormsg, "last_name only can have letters");
          rejectRequest = true;
        }
      }else{
        if(type == "create" && (req.payload.request.body.role == "MEMBER" || req.payload.request.body.role == "CAREMANAGER")) {
          errormsg = gen_errormsg(errormsg, "last_name is undefined");
          rejectRequest = true;
        }
      }

      // Address 1 validation
      if (req.payload.request.body.address1 === undefined) {
        if(type == "create" && req.payload.request.body.role == "MEMBER") {
          errormsg = gen_errormsg(errormsg, "Primary address is undefined");
          rejectRequest = true;
        }
      }else{
        if(type == "create" &&  validator.trim(req.payload.request.body.address1) === ""){
          errormsg = gen_errormsg(errormsg, "Primary address is empty");
          rejectRequest = true;
        }
      }

      // City validation
      if (req.payload.request.body.city !== undefined) {
        if(validator.trim(req.payload.request.body.city) == ""){
          errormsg = gen_errormsg(errormsg, "City is empty");
          rejectRequest = true;
        }
        if (!validator.isAlpha(req.payload.request.body.city, 'en-US')) {
          errormsg = gen_errormsg(errormsg, "City only can have letters");
          rejectRequest = true;
        }
      }else{
        if(type == "create" && req.payload.request.body.role == "MEMBER") {
          errormsg = gen_errormsg(errormsg, "City is undefined");
          rejectRequest = true;
        }
      }

      // State Validation
      if (req.payload.request.body.state !== undefined) {
        if(validator.trim(req.payload.request.body.state) == ""){
          errormsg = gen_errormsg(errormsg, "State is empty");
          rejectRequest = true;
        }
        if (!validator.isAlpha(req.payload.request.body.state, 'en-US')) {
          errormsg = gen_errormsg(errormsg, "State only can have letters");
          rejectRequest = true;
        }
      }else{
        if(type == "create" && req.payload.request.body.role == "MEMBER") {
          errormsg = gen_errormsg(errormsg, "State is undefined");
          rejectRequest = true;
        }
      }

      // Zip code validation
      if (req.payload.request.body.zipcode !== undefined) {
        if(validator.trim(req.payload.request.body.zipcode) == ""){
          errormsg = gen_errormsg(errormsg, "Zipcode is Empty");
          rejectRequest = true;
        }
        if (!validateZip(req.payload.request.body.zipcode)) {
          errormsg = gen_errormsg(errormsg, "Invalid Zip code");
          rejectRequest = true;
        }
      }else{
        if(type == "create" && req.payload.request.body.role == "MEMBER") {
          errormsg = gen_errormsg(errormsg, "Zipcode is undefined");
          rejectRequest = true;
        }
      }

      // Birthday Validation.
      if (req.payload.request.body.birthdate !== undefined) {
        if(validator.trim(req.payload.request.body.birthdate) == ""){
          errormsg = gen_errormsg(errormsg, "Birth date is empty");
          rejectRequest = true;
        }else{
          if(!validateyyyy_mm_dd_Date(req.payload.request.body.birthdate)){
            errormsg = gen_errormsg(errormsg, "Birth date must be in the YYYY-MM-DD format");
            rejectRequest = true;
          }
        }
        var iso_date = new Date().toISOString();
        if (!validator.isISO8601(req.payload.request.body.birthdate) || req.payload.request.body.birthdate.indexOf("-") <= -1) {
          errormsg = gen_errormsg(errormsg, "Birth date should be in ISO8601 format");
          rejectRequest = true;
        }
        if (validator.isAfter("1900-01-01", req.payload.request.body.birthdate)) {
          errormsg = gen_errormsg(errormsg, "Birth date is before 1900-01-01");
          rejectRequest = true;
        }
        if (validator.isBefore(iso_date, req.payload.request.body.birthdate)) {
          errormsg = gen_errormsg(errormsg, "Birth date is After " + iso_date + " date");
          rejectRequest = true;
        }
      }else{
        if(type == "create" && req.payload.request.body.role == "MEMBER") {
          errormsg = gen_errormsg(errormsg, "Birthdate is undefined");
          rejectRequest = true;
        }
      }

      // Phone number Validation
      if (req.payload.request.body.phones != undefined && _.isObject(req.payload.request.body.phones) && !_.isEmpty(req.payload.request.body.phones)) {
        var mobile;
        var home;
        var office;
        var phone_schema_validation_failed = false;
        var params_keys = Object.keys(req.payload.request.body.phones);
        for (var i = 0; i < params_keys.length; i++) {
          if (!(phone_schema.indexOf(params_keys[i]) > -1)) {
            phone_schema_validation_failed = true;
          }
        }
        if(phone_schema_validation_failed){
          errormsg = gen_errormsg(errormsg, "Phones object only allow to have mobile, home and office keys in it");
          rejectRequest = true;
        }
        if (req.payload.request.body.phones.mobile !== undefined && req.payload.request.body.phones.mobile != "") {
          mobile = validator.trim(req.payload.request.body.phones.mobile.toString());
          if(!validatePhoneFormat(mobile)){
            errormsg = gen_errormsg(errormsg, "Mobile phone Must be in the proper format ex: NNN-NNN-NNNN, NNN.NNN.NNNN, (NNN)-NNN-NNNN, NNN NNN NNNN, (NNN) NNN NNNN or (NNN).NNN.NNNN");
            rejectRequest = true;
          }
          mobile = mobile.replace(/[^0-9]/g, "");
          if (!validator.isMobilePhone(mobile, 'en-US')) {
            errormsg = gen_errormsg(errormsg, "Mobile phone is Invalid");
            rejectRequest = true;
          }
          mobile = true;
        }else{
          mobile = false;
        }
        if (req.payload.request.body.phones.home !== undefined && req.payload.request.body.phones.home != "") {
          home = validator.trim(req.payload.request.body.phones.home.toString());
          if(!validatePhoneFormat(home)){
            errormsg = gen_errormsg(errormsg, "Home phone Must be in the proper format ex: NNN-NNN-NNNN, NNN.NNN.NNNN, (NNN)-NNN-NNNN, NNN NNN NNNN, (NNN) NNN NNNN or (NNN).NNN.NNNN");
            rejectRequest = true;
          }
          home = home.replace(/[^0-9]/g, "");
          if (!validator.isMobilePhone(home, 'en-US')) {
            errormsg = gen_errormsg(errormsg, "Home phone is Invalid");
            rejectRequest = true;
          }
          home = true;
        }else{
          home = false;
        }
        if (req.payload.request.body.phones.office !== undefined && req.payload.request.body.phones.office != "") {
          office = validator.trim(req.payload.request.body.phones.office.toString());
          if(!validatePhoneFormat(office)){
            errormsg = gen_errormsg(errormsg, "Office phone Must be in the proper format ex: NNN-NNN-NNNN, NNN.NNN.NNNN, (NNN)-NNN-NNNN, NNN NNN NNNN, (NNN) NNN NNNN or (NNN).NNN.NNNN");
            rejectRequest = true;
          }
          office = office.replace(/[^0-9]/g, "");
          if (!validator.isMobilePhone(office, 'en-US')) {
            errormsg = gen_errormsg(errormsg, "Office phone is Invalid");
            rejectRequest = true;
          }
          office = true;
        }else{
          office = false;
        }
        if(!mobile && !home && !office){
          errormsg = gen_errormsg(errormsg, "Must have at least one phone number from mobile, home or office");
          rejectRequest = true;
        }
      }else{
        // for initial roll out phone number is not required field.
        // if(type == "create" && (req.payload.request.body.role == "MEMBER" || req.payload.request.body.role == "CAREMANAGER")) {
        //   errormsg = errormsg + "Phone can't be undefined, Empty and must be object, ";
        //   rejectRequest = true;
        // }
        logger.info("Phones is not required field for first roll out");
      }
      // Effective Date Validation.
      if (req.payload.request.body.effective_date !== undefined) {
        //console.log(moment(req.payload.request.body.effective_date, moment.ISO_8601).isValid());
        if(validator.trim(req.payload.request.body.effective_date) == ""){
          errormsg = gen_errormsg(errormsg, "effective_date is empty");
          rejectRequest = true;
        }else{
          if(!validateyyyy_mm_dd_Date(req.payload.request.body.effective_date)){
            errormsg = gen_errormsg(errormsg, "effective_date must be in the YYYY-MM-DD format");
            rejectRequest = true;
          }
        }
        var iso_date = new Date().toISOString();
        if (!validator.isISO8601(req.payload.request.body.effective_date) || req.payload.request.body.effective_date.indexOf("-") <= -1) {
          errormsg = gen_errormsg(errormsg, "effective_date should be in ISO8601 format");
          rejectRequest = true;
        }
        if (validator.isAfter("1900-01-01", req.payload.request.body.effective_date)) {
          errormsg = gen_errormsg(errormsg, "effective_date is before 1900-01-01");
          rejectRequest = true;
        }
        if (req.payload.request.body.status == undefined || validator.trim(req.payload.request.body.status) == "") {
          errormsg = gen_errormsg(errormsg, "In case you have effective_date you must pass status along with it");
          rejectRequest = true;
        }
      }else {
        if (req.payload.request.body.status !== undefined) {
          if (type == "update") {
            errormsg = gen_errormsg(errormsg, "effective_date is undefined");
            rejectRequest = true;
          }
        }
      }

      // Status validation in case update object.
      if (req.payload.request.body.status !== undefined) {
        if(validator.trim(req.payload.request.body.status) == ""){
          errormsg = gen_errormsg(errormsg, "Status is empty");
          rejectRequest = true;
        }else{
          var input_type = req.payload.request.body.status;
          var Status_list = ["INACTIVE","ACTIVE"];
          if (!(Status_list.indexOf(input_type.toUpperCase()) > -1)) {
            errormsg = gen_errormsg(errormsg, "Status isn't supported");
            rejectRequest = true;
          }
          if (req.payload.request.body.effective_date == undefined || validator.trim(req.payload.request.body.effective_date) == "") {
            errormsg = gen_errormsg(errormsg, "In case you have status you must pass effective_date along with it");
            rejectRequest = true;
          }
        }
      }else{
        if (req.payload.request.body.effective_date !== undefined) {
          if (type == "update") {
            errormsg = gen_errormsg(errormsg, "Status is undefined");
            rejectRequest = true;
          }
        }
      }

      if(rejectRequest){
        reject(errormsg);
      }
      resolve("validated");
    });
  }
};