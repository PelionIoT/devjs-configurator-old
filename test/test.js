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

const should = require('should')
const shouldPromised = require('should-promised')
const configurator = require('../index.js');
const configurator2 = require('../index.js').instance(10099);

var test_server = null;
const configurator_server = require('devjs-configurator-server');

global.MAESTRO_UNIX_SOCKET = "/tmp/maestroapi.sock";

describe('Configurator', function() {
    // it('should work', function() {
    //     return configurator_server.createServer().then(function(server) {
    //         test_server = server;
    //         return configurator.setModuleConfig('module1', { hello: 2 })
    //     }).then(function() {
    //         return configurator.configure('module1', __dirname, 'testConf.json').should.be.fulfilledWith({ hello: 2 })
    //     }).then(function() {
    //         return configurator.configure('module2', __dirname, 'testConf.json').should.be.fulfilledWith({ hi: 'hello', mydir: __dirname })
    //     }).then(function() {
    //         return configurator.configure('module2', __dirname).should.be.fulfilledWith({ theConf: 'hello' })
    //     }).then(function() {
    //         return configurator.setModuleConfig('module2', { hellooo: 2 })
    //     }).then(function() {
    //         return configurator.configure('module2', __dirname).should.be.fulfilledWith({ hellooo: 2 })
    //     }).then(function() {
    //         return configurator.configure('module3', __dirname, 'badConf.json').should.be.rejected()
    //     }).then(function() {
    //         return configurator.setModuleConfig('TestModule', { hellooo: "thereman" })
    //     }).then(function() {
    //         return configurator.configure(__dirname).should.be.fulfilledWith({ hellooo: 'thereman' }) // picks up the module name from the devicejs.json file ('TestModule')
    //     }).then(function() {                                                                          // this is the simplest API for the user and the default in many places
    //         return configurator.configure("TestModule-not-there",__dirname,"not-there.json").should.be.rejected()
    //     });
    // });

    // it('should work again', function() {
    //     return configurator_server.shutdownServer(test_server).then(function(server){
    //         test_server = server;
    //         return configurator_server.createServer(10099);
    //     }).then(function(){
    //         return configurator_server.setModuleConfig('t2_module1', { hello: 2 }) // try the server side version also
    //     }).then(function() {
    //         return configurator2.configure('t2_module1', __dirname, 'testConf.json').should.be.fulfilledWith({ hello: 2 })
    //     }).then(function() {
    //         return configurator2.configure('t2_module2', __dirname, 'testConf.json').should.be.fulfilledWith({ hi: 'hello', mydir: __dirname  })
    //     }).then(function() {
    //         return configurator2.configure('t2_module2', __dirname).should.be.fulfilledWith({ theConf: 'hello' })
    //     }).then(function() {
    //         return configurator2.setModuleConfig('t2_module2', { hellooo: 2 })
    //     }).then(function() {
    //         return configurator2.configure('t2_module2', __dirname).should.be.fulfilledWith({ hellooo: 2 })
    //     }).then(function() {
    //         return configurator2.configure('t2_module3', __dirname, 'badConf.json').should.be.rejected()
    //     })
    // });
    it('should work', function() {
        return configurator.setModuleConfig('module1', { hello: 2 })
        .then(function() {
	    console.log("setModuleConfig success");
            return configurator.configure('module1', __dirname, 'testConf.json').should.be.fulfilledWith({ hello: 2 })
        }).then(function() {
            return configurator.configure('module2', __dirname, 'testConf.json').should.be.fulfilledWith({ hi: 'hello', mydir: __dirname })
        }).then(function() {
            return configurator.configure('module2', __dirname).should.be.fulfilledWith({ theConf: 'hello' })
        }).then(function() {
            return configurator.setModuleConfig('module2', { hellooo: 2 })
        }).then(function() {
            return configurator.configure('module2', __dirname).should.be.fulfilledWith({ hellooo: 2 })
        }).then(function() {
            return configurator.configure('module3', __dirname, 'badConf.json').should.be.rejected()
        }).then(function() {
            return configurator.setModuleConfig('TestModule', { hellooo: "thereman" })
        }).then(function() {
            return configurator.configure(__dirname).should.be.fulfilledWith({ hellooo: 'thereman' }) // picks up the module name from the devicejs.json file ('TestModule')
        }).then(function() {                                                                          // this is the simplest API for the user and the default in many places
            return configurator.configure("TestModule-not-there",__dirname,"not-there.json").should.be.rejected()
        });
    });

    // it('should work again', function() {
    //     return configurator.setModuleConfig('t2_module1', { hello: 2 }) // try the server side version also
    //     .then(function() {
    //         return configurator2.configure('t2_module1', __dirname, 'testConf.json').should.be.fulfilledWith({ hello: 2 })
    //     }).then(function() {
    //         return configurator2.configure('t2_module2', __dirname, 'testConf.json').should.be.fulfilledWith({ hi: 'hello', mydir: __dirname  })
    //     }).then(function() {
    //         return configurator2.configure('t2_module2', __dirname).should.be.fulfilledWith({ theConf: 'hello' })
    //     }).then(function() {
    //         return configurator2.setModuleConfig('t2_module2', { hellooo: 2 })
    //     }).then(function() {
    //         return configurator2.configure('t2_module2', __dirname).should.be.fulfilledWith({ hellooo: 2 })
    //     }).then(function() {
    //         return configurator2.configure('t2_module3', __dirname, 'badConf.json').should.be.rejected()
    //     })
    // });

})
