/**
 * Created by hsingh008c on 3/26/17.
 */
fs = require('fs');
json = JSON.parse(fs.readFileSync('release.json', 'utf8'));
info = {};
info["app"] = json.app;
info["environment"] = json.env;
info["version"] = json.version;
info["commit"] = json.commit;

module.exports = function(req, reply) {
    reply(info);
};

