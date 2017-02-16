'use strict';
//
// CloudMine, Inc.
// 2015
//

/**
 * Require your Snippets
 * This can be more expressive, for example, you can use `fs` to
 * read all snippets in a directory and set them to your `module.exports`.
 */

var userAccount = require('./lib/userAccount');
var listUsers = require('./lib/listUsers');
var userBehavior = require('./lib/userBehavior');
var CloudMineNode = require('cloudmine-servercode');
var remove_session = require('./lib/logout');
var cloudmine = require('cloudmine');

// Require any other node module you want...

/**
 * The `module.exports` **must** be called before the server is started,
 * or the server won't be able to read in the exports.
 */
module.exports = {
  user: userAccount,
  listusers: listUsers,
  logout: remove_session,
  userbehavior: userBehavior
};

/**
 * Start the CloudMine server.
 */

CloudMineNode.start(module, './index.js', function(err) {
  console.log('Server Started?', err);
});
