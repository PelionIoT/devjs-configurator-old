var path = require('path');
var util = require('util');
var fs = require('fs');
var commonfuncs = require('./common-funcs.js');

var CONFIGURATOR_ID = "CONFIGURATOR";

var log_dbg = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("devjs-configurator");
    if(global.log)
        log.debug.apply(undefined,args);
    else
        console.log.apply(undefined,args);
// in ES6:
//    log.debug.call(undefined,"Configurator", ...arguments);
};

var log_err = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("devjs-configurator");
    if(global.log) {
        log.error.apply(undefined,args);
    } else {
        console.error.apply(undefined,args);
    }
// in ES6:
//    log.error.call(undefined,"Configurator", ...arguments);
};

var log_warn = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("devjs-configurator");
    if(global.log) {
        log.error.apply(undefined, args);
    } else {
        log.warn.apply(undefined,args);
    }
// in ES6:
//    log.error.call(undefined,"Configurator", ...arguments);
};

/**
 *
 * @param localdir
 * @param cb {callback} function(err,data)
 */
var do_fs_config = function(localdir,cb,filename) {
    var json = null;
    var _path = path.join(localdir,"config.json");
    try {
        json = fs.readFileSync(_path, 'utf8');
    } catch(e) {
        log_warn("Error reading:",_path);
        log_warn("  Details: " + util.inspect(e));
        cb(e,{});
        return;
    }
    if(json && typeof json == 'string') {
        commonfuncs.minifyJSONParseAndSubstVars(json,function(err,data){
            cb(err,data);
        },{
            thisdir: localdir
        });
    } else {
        log_dbg("No config set for",localdir,"Empty file? (",_path,")");
        cb(null,{});
    }
};

var do_fs_jsononly = function(filepath) {
    var json = null;
    try {
        json = fs.readFileSync(filepath, 'utf8');
    } catch(e) {
        log_warn("Error reading:",filepath);
        log_warn("  Details: " + util.inspect(e));
        return null;
    }
    if(json && typeof json == 'string') {
        return JSON.parse(json);
    } else {
        log_err("Failed to parse JSON for",filepath,e);
        return null;
    }
};


module.exports = {};

/**
 *
 * @param modName {string} The lookup name for the module
 * @param trueCB {callback} called if Configurator was running. This does not mean Configurator had a config.
 * @param falseCB {callback} called if Configurator was not running, and no result was returned.
 */
var getConfiguratorConfig = function(modName,trueCB,falseCB) {
    "use strict";
    let found = false;
    if(!modName) {
        falseCB("No module name provided");
        return;
    }
    dev$.selectByID(CONFIGURATOR_ID).call('getModuleConfig',modName).then(function(){
        let existing = arguments[0];
        if(
            existing &&
            existing[CONFIGURATOR_ID] &&
            existing[CONFIGURATOR_ID].receivedResponse &&
            existing[CONFIGURATOR_ID].response
        ) {
            if(existing[CONFIGURATOR_ID].response.error) {
                falseCB(existing[CONFIGURATOR_ID].response.error);
                return;
            } else {
                trueCB(existing[CONFIGURATOR_ID].response.result);
                return;
            }
        } else {
            log.info("No Configurator found. Will use file for config of",modName);
            // no Configurator running or not responding
            falseCB(undefined);
        }
    },function(err){
        log.error("devjs-configurator API error",err);
        falseCB(err);
    });
}


/**
 *
 * @param modName* {string} If not provided, will be found by taking 'name' from devicejs.json
 * @param localdir {string} The local directory of the module where a config.json file should be sitting
 * @param configfilename {string} defaults to 'config.json'
 * @returns {{then: Function}}
 */
module.exports.configure = function(modName,localdir,configfilename) {
    var self = this;
    var invalid = false;
    if(arguments.length < 2) {
        localdir = modName;
        modName = undefined;
    }
    if(!configfilename) configfilename = "config.json";
    if(typeof localdir !== 'string') {
        invalid = true;
    }
    var ret = {
        then: function(cb) {
            if(typeof cb === 'function')
                self.cb = cb;
            if(invalid && self.cb) {
                self.cb("invalid params");
            }
        }
    };
    if(!invalid) {
        if(!modName) {
            // get modName via devicejs.json
            var obj = do_fs_jsononly(path.join(localdir,"devicejs.json"));
            if(!obj || !obj.name) {
                self.cb("Could not gather module name from devicejs.json");
                return;
            }
            modName = obj.name;
        }
        setImmediate(function(self){
            getConfiguratorConfig(modName,function(data){
                    if(data == null) {
                        log.warn("No config set in Configurator for",modName,"Trying file.");
                        do_fs_config(localdir,self.cb,configfilename);
                    } else
                        self.cb(null,data);
                },
                function(err){
                    if(err) {
                        log.error("Error in Configurator API:",err);
                    }
                    do_fs_config(localdir,self.cb,configfilename);
                });
        },this);
    }
    return ret;
}


module.exports.minifyJSONParseAndSubstVars = commonfuncs.minifyJSONParseAndSubstVars;
module.exports.minifyJSONParse = commonfuncs.minifyJSONParse;
module.exports.resolveVarsPath = commonfuncs.resolveVarsPath;
module.exports.CONFIGURATOR_ID = CONFIGURATOR_ID;
