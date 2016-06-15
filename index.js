'use strict'

const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const path = require('path')
const fs = require('fs')
const JSONminify = require('./lib/minify.json.js')
const common = require('./common-funcs')

const CONFIGURATOR_DEFAULT_PORT = 45367

/**
 *
 * @param moduleName* {string} If not provided, will be found by taking 'name' from devicejs.json
 * @param moduleLocalDirectory {string} The local directory of the module where a config.json file should be sitting
 * @param moduleLocalConfigFileName {string} defaults to 'config.json'
 * @returns {{then: Function}}
 */
module.exports = (function(port) {
    if(!port) {
        port = CONFIGURATOR_DEFAULT_PORT
    }
    
    return {
        configure: function(moduleName, moduleLocalDirectory, moduleLocalConfigFileName) {
            if(!moduleLocalConfigFileName) {
                moduleLocalConfigFileName = 'config.json'
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
        setModuleConfiguration: function(moduleName, configuration) {
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
        },
        createServer: function() {
            const app = express()
            const server = http.createServer(app)
            const configurations = new Map()
            
            app.use(bodyParser.json())
            
            app.get('/config/:moduleName', function(req, res) {
                let moduleName = req.params.moduleName
                
                if(!configurations.has(moduleName)) {
                    res.status(404).send()
                }
                else {
                    res.status(200).send(configurations.get(moduleName))
                }
            })
            
            app.put('/config/:moduleName', function(req, res) {
                let moduleName = req.params.moduleName
                let configuration = req.body
                
                if(configuration == null || typeof configuration != 'object') {
                    res.status(400).send()
                }
                else {
                    configurations.set(moduleName, configuration)
                    
                    res.status(200).send()
                }
            })
            
            return new Promise(function(resolve, reject) {
                server.listen(port, '127.0.0.1', function(error) {
                    if(error) {
                        reject(error)
                    }
                    else {
                        resolve(server)
                    }
                })
            })
        }
    }
})
