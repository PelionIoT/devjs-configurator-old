'use strict'

const request = require('request')
const path = require('path')
const fs = require('fs')
const common = require('./common-funcs')
const util = require('util');

const CONFIGURATOR_DEFAULT_PORT = 45367


var do_fs_jsononly = function(filepath) {
    var json = null;
    try {
        json = fs.readFileSync(filepath, 'utf8');
    } catch(e) {
        common.log_warn("Error reading:",filepath);
        common.log_warn("  Details: " + util.inspect(e));
        return null;
    }
    if(json && typeof json == 'string') {
        return JSON.parse(json);
    } else {
        common.log_err("Failed to parse JSON for",filepath,e);
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
            var conf_name = "default";
            if(global.MAESTRO_CONFIG_NAMES && global.MAESTRO_CONFIG_NAMES[moduleName]) {
                conf_name = global.MAESTRO_CONFIG_NAMES[moduleName];
            } else {
                console.log("No config name provided for",moduleName,"so using 'default'");
            }

            // return new Promise(function(resolve, reject) {
            //     request.get({
            //         url: 'http://127.0.0.1:' + port + '/config/' + moduleName,
            //         json: true
            //     }, function(error, response, body) {
            //         if(error) {
            //             resolve(null)
            //         }
            //         else if(response.statusCode != 200) {
            //             resolve(null)
            //         }
            //         else {
            //             resolve(body)
            //         }
            //     })
            // }).then(function(configuration) {
            //     if(configuration != null) {
            //         return configuration;
            //     }
            //     var fpath = path.resolve(moduleLocalDirectory, moduleLocalConfigFileName)
            //     common.log_warn('devjs-configurator: Unable to retrieve config from server for module ' + moduleName + '. Trying to read config from ' + fpath);
                
            //     // try to read from file
            //     return new Promise(function(resolve, reject) {
            //         fs.readFile(fpath, 'utf8', function(error, json) {
            //             if(error) {
            //                 common.log_err('devjs-configurator: Unable to load configuration from file for module ' + moduleName + ': ' + util.inspect(error))
            //                 reject(new Error('Unable to load configuration: ' + error.message))
            //             } else {
            //                 common.minifyJSONParseAndSubstVars(json,function(err,data){
            //                     if(err){
            //                         common.log_err('devjs-configurator: Error parsing config file ['+fpath+'] for module ' + moduleName + ': ' + util.inspect(err))
            //                         reject(new Error("Error reading config file: "+util.inspect(err)));
            //                     } else {
            //                         resolve(data);
            //                     }
            //                 },{
            //                     thisdir: moduleLocalDirectory
            //                 });
            //             }
            //         })
            //     })
            // })

            return new Promise(function(resolve, reject) {

                if (global.MAESTRO_UNIX_SOCKET) {
                    var localUrl = 'http://unix:' + MAESTRO_UNIX_SOCKET + ':/jobConfig/' + job + '/' + conf_name;

                    request.get({
                        url: 'http://127.0.0.1:' + port + '/config/' + moduleName,
                        json: true
                    }, function(error, response, body) {
                        if(error) {
                            console.log("devjs-configurator - looks like no response from maestro. Doing fallback.",error)
                            resolve(null)
                        }
                        else if(response.statusCode != 200) {
                            console.error("Bad response. maybe problem with maestro or path?",response.statusCode,"path was:",localUrl)
                            resolve(null)
                        }
                        else {
                            resolve(body)
                        }
                    })

                } else {
                    console.log("No MAESTRO_UNIX_SOCKET defined - not ran with maestroRunner or problem with config.")
                    resolve(null)
                }
            }).then(function(configuration) {
                if(configuration != null) {
                    return configuration;
                }
                var fpath = path.resolve(moduleLocalDirectory, moduleLocalConfigFileName)
                common.log_warn('devjs-configurator: Unable to retrieve config from server for module ' + moduleName + '. Trying to read config from ' + fpath);
                
                // try to read from file
                return new Promise(function(resolve, reject) {
                    fs.readFile(fpath, 'utf8', function(error, json) {
                        if(error) {
                            common.log_err('devjs-configurator: Unable to load configuration from file for module ' + moduleName + ': ' + util.inspect(error))
                            reject(new Error('Unable to load configuration: ' + error.message))
                        } else {
                            common.minifyJSONParseAndSubstVars(json,function(err,data){
                                if(err){
                                    common.log_err('devjs-configurator: Error parsing config file ['+fpath+'] for module ' + moduleName + ': ' + util.inspect(err))
                                    reject(new Error("Error reading config file: "+util.inspect(err)));
                                } else {
                                    resolve(data);
                                }
                            },{
                                thisdir: moduleLocalDirectory
                            });
                        }
                    })
                })
            })



        },
        // setModuleConfig: function(moduleName, configuration) {
        //     return new Promise(function(resolve, reject) {
        //         request.put({
        //             url: 'http://127.0.0.1:' + port + '/config/' + moduleName,
        //             body: configuration,
        //             json: true
        //         }, function(error, response, body) {
        //             if(error) {
        //                 common.log_err('devjs-configurator: Unable to set configuration for module ' + moduleName + ': ' + error.message)
                        
        //                 reject(error)
        //             }
        //             else if(response.statusCode != 200) {
        //                 common.log_err('devjs-configurator: Unable to set configuration for module ' + moduleName + ': HTTP response is ' + response.statusCode)                        
        //                 reject(new Error('HTTP error'+response.statusCode))
        //             }
        //             else {
        //                 resolve()
        //             }
        //         })
        //     })
        // }
        setModuleConfig: function(moduleName, configuration) {
            return new Promise(function(resolve, reject) {
                var conf_name = 'default';
                if (global.MAESTRO_UNIX_SOCKET) {
                    var localUrl = 'http://unix:' + MAESTRO_UNIX_SOCKET + ':/jobConfig/' + job + '/' + conf_name;

                    request.post({
                        url: localUrl,
                        body: configuration,
                        json: true
                    }, function(error, response, body) {
                        if(error) {
                            common.log_err('devjs-configurator: Unable to set configuration for module ' + moduleName + ': ' + error.message)
                            
                            reject(error)
                        }
                        else if(response.statusCode != 200) {
                            common.log_err('devjs-configurator: Unable to set configuration for module ' + moduleName + ': HTTP response is ' + response.statusCode)                        
                            reject(new Error('HTTP error'+response.statusCode))
                        }
                        else {
                            resolve()
                        }
                    })
                } else {
                    console.error("No MAESTRO_UNIX_SOCKET defined - can't setModuleConfig.")
                    resolve(null)                    
                }
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
