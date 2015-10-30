var util = require('util');
var JSONminify = require('./lib/minify.json.js');

var mod = {};

var substVarsRegex = /\$\{[^\s}]+\}/g; // substitute var looks like --> ${something}

var log_info = function() {
    //var args = Array.prototype.slice.call(arguments);
    //args.unshift("WebDeviceSim");
    if(global.log)
        log.info.apply(undefined,arguments);
    else
        console.log.apply(undefined,arguments);
};

var log_err = function() {
    if(global.log)
        log.error.apply(undefined,arguments);
    else {
        var args = Array.prototype.slice.call(arguments);
        args.unshift("ERROR");
        console.error.apply(undefined,args);
    }

};


var log_warn = function() {
    if(global.log)
        log.warn.apply(undefined,arguments);
    else {
        var args = Array.prototype.slice.call(arguments);
        args.unshift("WARN");
        console.error.apply(undefined,args);
    }
};


var getUserHome = function() {
    return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
};


/**
 * An internal functions which replaces substitution variables like: '${devjs_root}' with an actual value. Review
 * the code for a complete list of all variables.
 * @method  resolveSubstitutionVars
 * @protected
 * @param  {String} str [description]
 * @param  {Object} map If passed in, this will replace any var named ${key} in 'map' with the given value for that key.
 * @return {String}       [description]
 */
mod.resolveVarsPath = function(str,map) {
    var replaceSubstVars = function(match) { //, p1, p2, p3, offset, string) {
        if(match == "${home}") {
            return getUserHome();
        } else {
            if(map) {
                var keys = Object.keys(map);
                for(var n=0;n<keys.length;n++) {
                    if(match == "${" + keys[n] + "}") {
                        return map[keys[n]];
                    }
                }
            }
            log_warn('Unknown substitution variable: ' + match);
            return match;
        }
    }
    return str.replace(substVarsRegex,replaceSubstVars);
};


/**
 * Takes a string, replace meta variables, and parses the JSON safely using JSON minify. This
 * function automatically provide meta variables for all environmental variables. For instance, "${HOME}"
 * is replaced with the user's home directory.
 * @param s
 * @param cb
 * @param map
 */
mod.minifyJSONParseAndSubstVars = function(s,cb, map) {
    if(!map) map = {};
    var envkeys = Object.keys(process.env);
    if(!s) { cb("No string"); return; }
    for(var n=0;n<envkeys.length;n++) {
        if(map[envkeys[n]] == undefined)
            map[envkeys[n]] = process.env[envkeys[n]];
    }
    var ok = false;
    try {
        var data = mod.resolveVarsPath(s, map);
        var config = JSON.parse(JSONminify(data));
        ok = true;
    } catch(e) {
        cb("Error on JSON / vars sub parse: " + util.inspect(e));
    }
    if(ok)
        cb(null,config);
};

mod.minifyJSONParse = function(s,cb) {
    var ok = false;
    try {
        var config = JSON.parse(JSONminify(data));
        ok = true;
    } catch(e) {
        cb("Error on JSON / vars sub parse: " + util.inspect(e));
    }
    if(ok)
        cb(null,config);
};

mod.JSONminify = JSONminify;

module.exports = mod;
