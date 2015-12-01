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
    var _path = path.join(localdir,filename);
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
    if(global.dev$ !== undefined) {
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
                log_dbg("No Configurator found. Will use cache / file for config of",modName);
                // no Configurator running or not responding
                falseCB(undefined);
            }
        },function(err){
            log_err("devjs-configurator API error",err);
            falseCB(err);
        });
    } else {
        log_dbg("No Configurator. Ok.");
        falseCB(undefined);
    }
};

var addToCache = function(modname,obj) {
    if(global.__CONFIGURATOR === undefined)
        global.__CONFIGURATOR = {};
    global.__CONFIGURATOR[modname] = obj;
};


var configurator = function(modName,localdir,configfilename) {
    var invalid = false;
    var self = this;
    this._cb = [];
    var errmsg = null;
    if(typeof localdir !== 'string') {
        invalid = true;
    }
    this.getThen = function() {
        var ret = {};
        ret.then = function(cb) {
                if(typeof cb === 'function') {
                    self._cb.push(cb);
                }
                else invalid = true;
                if(invalid) {
                    self._cb.push(function(){ log_err("Configurator INVALID PARAMS"); });
                }
            return this;  // yes, return this 'ret' object from then(), so the then() is chainable.
        };
        return ret;
    };
    setImmediate(function(self,_modName){
        var do_cb = function() {
            for(var n=0;n<self._cb.length;n++) {    // all callbacks will be called in the same turn of
                try {                               // node.js event loop
                    self._cb[n].apply(undefined,arguments);
                } catch(e) {
                    log_err("Failure in config callback ["+n+"]: ",e);
                    if(e.stack) {
                        log_err("stack:",e.stack);
                    }
                }
            }
        };
        if(!invalid) {
            if(!_modName) {
                // get modName via devicejs.json
                var _path = path.join(localdir,"devicejs.json");
                var obj = do_fs_jsononly(_path);
                if(!obj || !obj.name) {
//                    console.log("obj",obj,"self.cb",self.cb);
                    errmsg = "Could not gather module name from devicejs.json ("+_path+")";
                } else {
                    _modName = obj.name;
                }
            }

            if(errmsg) {
                if(self._cb.length > 0) do_cb(errmsg);
                else log_err(errmsg);
                return;
            }

            getConfiguratorConfig(_modName,function(data){
                    if(data == null) {
                        log_warn("No config set in Configurator for",_modName,"Trying cache, then file.");
                        if(global.__CONFIGURATOR && global.__CONFIGURATOR[_modName]) {
                            // Necessary? Well, its messy - but yes. Some modules, such as core-lighting, have all kinds of code floating
                            // about which don't really execute together. So, as long as each user just does a .configure('core-lighting')
                            // there will be no issues, and no wasted re-reading.
                            log_dbg("Using cached config for: ",_modName);
                            do_cb(null,global.__CONFIGURATOR[_modName]);
                        } else {
                            do_fs_config(localdir,function(err,data){
                                addToCache(_modName,data);
                                do_cb(err,data)
                            },configfilename);
                        }
                    } else {
                        do_cb(null,data);
                    }
                },
                function(err){
                    if(err) {
                        log_warn("Error in Configurator API:",err);
                    }
                    if(global.__CONFIGURATOR && global.__CONFIGURATOR[_modName]) {
                        log_dbg("Using cached config for: ",_modName);
                        do_cb(null,global.__CONFIGURATOR[_modName]);
                    } else {
                        do_fs_config(localdir,function(err,data){
                            addToCache(_modName,data);
                            do_cb(err,data)
                        },configfilename);
                    }
                });

        }
    },this,modName);
};




/**
 *
 * @param modName* {string} If not provided, will be found by taking 'name' from devicejs.json
 * @param localdir {string} The local directory of the module where a config.json file should be sitting
 * @param configfilename {string} defaults to 'config.json'
 * @returns {{then: Function}}
 */
module.exports.configure = function(modName,localdir,configfilename) {
    if(arguments.length < 2) {
        localdir = modName;
        modName = undefined;
    }
    if(!configfilename) configfilename = "config.json";
    var doit = new configurator(modName,localdir,configfilename);
    return doit.getThen();
};


module.exports.minifyJSONParseAndSubstVars = commonfuncs.minifyJSONParseAndSubstVars;
module.exports.minifyJSONParse = commonfuncs.minifyJSONParse;
module.exports.resolveVarsPath = commonfuncs.resolveVarsPath;
module.exports.CONFIGURATOR_ID = CONFIGURATOR_ID;
