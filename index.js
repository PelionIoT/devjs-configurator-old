'use strict'

const request = require('request')
const path = require('path')
const fs = require('fs')
const JSONminify = require('./lib/minify.json.js')
const common = require('./common-funcs')

const CONFIGURATOR_DEFAULT_PORT = 45367


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

/**
 *
 * @param moduleName* {string} If not provided, will be found by taking 'name' from devicejs.json
 * @param moduleLocalDirectory {string} The local directory of the module where a config.json file should be sitting
 * @param moduleLocalConfigFileName {string} defaults to 'config.json'
 * @returns {{then: Function}}
 */
var configurator = function(port) {
    if(!port) {
        port = CONFIGURATOR_DEFAULT_PORT
    }
    
    return {
        configure: function(moduleName, moduleLocalDirectory, moduleLocalConfigFileName) {
            if(arguments.length < 2) {
                moduleLocalDirectory = moduleName;
                moduleName = undefined;
            }

            if(!moduleLocalConfigFileName) {
                moduleLocalConfigFileName = 'config.json'
            }
            
            if(!moduleName) {
                // get modName via devicejs.json
                var _path = path.join(moduleLocalDirectory,"devicejs.json");
                var obj = do_fs_jsononly(_path);
                if(!obj || !obj.name) {
                    return Promise.reject("Could not gather module name from devicejs.json ("+_path+")");
                } else {
                    moduleName = obj.name;
                }
            }

            return new Promise(function(resolve, reject) {
                request.get({
                    url: 'http://127.0.0.1:' + port + '/config/' + moduleName,
                    json: true
                }, function(error, response, body) {
                    if(error) {
                        resolve(null)
                    }
                    else if(response.statusCode != 200) {
                        resolve(null)
                    }
                    else {
                        resolve(body)
                    }
                })
            }).then(function(configuration) {
                if(configuration != null) {
                    return configuration
                }
                
                common.log_warn('Unable to retrieve configuration from server for module ' + moduleName + '. Trying to read config from ' + path.resolve(moduleLocalDirectory, moduleLocalConfigFileName))
                
                // try to read from file
                return new Promise(function(resolve, reject) {
                    fs.readFile(path.resolve(moduleLocalDirectory, moduleLocalConfigFileName), 'utf8', function(error, data) {
                        if(error) {
                            common.log_err('Unable to load configuration from file for module ' + moduleName + ': ' + error.message)
                            
                            reject(new Error('Unable to load configuration: ' + error.message))
                        }
                        else {
                            try {
                                resolve(JSON.parse(JSONminify(data)))
                            }
                            catch(e) {
                                common.log_err('Unable to load configuration from file for module ' + moduleName + ': ' + e.message)
                                
                                reject(new Error('Unable to load configuration: ' + e.message))
                            }
                        }
                    })
                })
            })
        },
        setModuleConfig: function(moduleName, configuration) {
            return new Promise(function(resolve, reject) {
                request.put({
                    url: 'http://127.0.0.1:' + port + '/config/' + moduleName,
                    body: configuration,
                    json: true
                }, function(error, response, body) {
                    if(error) {
                        common.log_err('Unable to set configuration for module ' + moduleName + ': ' + error.message)
                        
                        reject(error)
                    }
                    else if(response.statusCode != 200) {
                        common.log_err('Unable to set configuration for module ' + moduleName + ': HTTP response is ' + response.statusCode)
                        
                        reject(new Error(''))
                    }
                    else {
                        resolve()
                    }
                })
            })
        }
        // Server component in [github]/WigWagCo/devjs-configurator-server
    }
};

module.exports = new configurator();
module.exports.instance = configurator;
module.exports.minifyJSONParseAndSubstVars = common.minifyJSONParseAndSubstVars;
module.exports.minifyJSONParse = common.minifyJSONParse;
module.exports.resolveVarsPath = common.resolveVarsPath;
module.exports.JSONminify = require('./lib/minify.json.js');
module.exports.DEFAULTS = {
    port: CONFIGURATOR_DEFAULT_PORT
};
