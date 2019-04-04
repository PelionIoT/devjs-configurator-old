/*
 * Copyright (c) 2018, Arm Limited and affiliates.
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var util = require('util');
var JSONminify = require('./lib/minify.json.js');

var mod = {};

var substVarsRegex = /\$\{[^\s}]+\}/g; // substitute var looks like --> ${something}

var log_info = function() {
    //var args = Array.prototype.slice.call(arguments);
    //args.unshift("WebDeviceSim");
    if(global.log)
        log.debug.apply(log,arguments);
    else
        console.log.apply(console,arguments);
};

var log_err = function() {
    if(global.log)
        log.error.apply(log,arguments);
    else {
        var args = Array.prototype.slice.call(arguments);
        args.unshift("ERROR");
        console.error.apply(console,args);
    }

};


var log_warn = function() {
    if(global.log)
        log.warn.apply(log,arguments);
    else {
        var args = Array.prototype.slice.call(arguments);
        args.unshift("WARN");
        console.error.apply(console,args);
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
    var _s = s;
    try {
        if(util.isBuffer(s)) {
            _s = s.toString('utf8');
        }
        var config = JSON.parse(JSONminify(_s));
        ok = true;
    } catch(e) {
        cb("Error on JSON / vars sub parse: " + util.inspect(e));
    }
    if(ok)
        cb(null,config);
};

mod.JSONminify = JSONminify;

mod.log_info = log_info
mod.log_err = log_err
mod.log_warn = log_warn

module.exports = mod;
