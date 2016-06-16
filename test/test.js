const should = require('should')
const shouldPromised = require('should-promised')
const configurator = require('../index.js');
const configurator2 = require('../index.js').instance(10099);

var test_server = null;
const configurator_server = require('devjs-configurator-server');

describe('Configurator', function() {
    it('should work', function() {
        return configurator_server.createServer().then(function(server) {
            test_server = server;
            return configurator.setModuleConfig('module1', { hello: 2 })
        }).then(function() {
            return configurator.configure('module1', __dirname, 'testConf.json').should.be.fulfilledWith({ hello: 2 })
        }).then(function() {
            return configurator.configure('module2', __dirname, 'testConf.json').should.be.fulfilledWith({ hi: 'hello' })
        }).then(function() {
            return configurator.configure('module2', __dirname).should.be.fulfilledWith({ theConf: 'hello' })
        }).then(function() {
            return configurator.setModuleConfig('module2', { hellooo: 2 })
        }).then(function() {
            return configurator.configure('module2', __dirname).should.be.fulfilledWith({ hellooo: 2 })
        }).then(function() {
            return configurator.configure('module3', __dirname, 'badConf.json').should.be.rejected()
        })
    });

    it('should work again', function() {
        return configurator_server.shutdownServer(test_server).then(function(server){
            test_server = server;
            return configurator_server.createServer(10099);    
        }).then(function(){
            return configurator_server.setModuleConfig('t2_module1', { hello: 2 }) // try the server side version also
        }).then(function() {
            return configurator2.configure('t2_module1', __dirname, 'testConf.json').should.be.fulfilledWith({ hello: 2 })
        }).then(function() {
            return configurator2.configure('t2_module2', __dirname, 'testConf.json').should.be.fulfilledWith({ hi: 'hello' })
        }).then(function() {
            return configurator2.configure('t2_module2', __dirname).should.be.fulfilledWith({ theConf: 'hello' })
        }).then(function() {
            return configurator2.setModuleConfig('t2_module2', { hellooo: 2 })
        }).then(function() {
            return configurator2.configure('t2_module2', __dirname).should.be.fulfilledWith({ hellooo: 2 })
        }).then(function() {
            return configurator2.configure('t2_module3', __dirname, 'badConf.json').should.be.rejected()
        })
    });

})