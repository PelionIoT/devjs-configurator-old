const should = require('should')
const shouldPromised = require('should-promised')
const configurator = require('../index.js')()

describe('Configurator', function() {
    it('should work', function() {
        return configurator.createServer().then(function() {
            return configurator.setModuleConfiguration('module1', { hello: 2 })
        }).then(function() {
            return configurator.configure('module1', __dirname, 'testConf.json').should.be.fulfilledWith({ hello: 2 })
        }).then(function() {
            return configurator.configure('module2', __dirname, 'testConf.json').should.be.fulfilledWith({ hi: 'hello' })
        }).then(function() {
            return configurator.configure('module2', __dirname).should.be.fulfilledWith({ theConf: 'hello' })
        }).then(function() {
            return configurator.setModuleConfiguration('module2', { hellooo: 2 })
        }).then(function() {
            return configurator.configure('module2', __dirname).should.be.fulfilledWith({ hellooo: 2 })
        }).then(function() {
            return configurator.configure('module3', __dirname, 'badConf.json').should.be.rejected()
        })
    })
})