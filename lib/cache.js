/**
 * Created by hsingh008c on 2/2/17.
 */
var NodeCache = require( "node-cache" );
var local_cache = function local_cache(){

};
local_cache.instance = null;
local_cache.getInstance = function(){
    if(this.instance === null){
        this.instance = new NodeCache( { stdTTL: 600 } );
    }
    return this.instance;
};
module.exports = local_cache.getInstance();