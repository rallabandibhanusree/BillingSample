/**
 * Created by hsingh008c on 3/26/17.
 */
fs = require('fs');
info = {};
try {
    json = JSON.parse(fs.readFileSync('release.json', 'utf8'));
    info["app"] = json.app;
    info["environment"] = json.env;
    info["version"] = json.version;
    info["commit"] = json.commit;
}catch(e){
    info["error"] = e;
}

module.exports = function(req, reply) {
    reply(info);

};

