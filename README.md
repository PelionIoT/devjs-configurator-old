# devjs-configurator
deviceJS common module config system

```javascript
// example use
require('devjs-configurator').configure(__dirname)
  .then(function(data){
    log.debug("config:",data);
},function(err){
    log.error(err);
});

// specify a module name (instead of using 'name' in devicejs.json in __dirname)
require('devjs-configurator').configure("my_module_name",__dirname)
  .then(function(data){
    log.debug("config:",data);
},function(err){
    log.error(err);
});

// specify the config file also (by default is config.json)
require('devjs-configurator').configure("my_module_name",__dirname,"myconfig.json")
  .then(function(data){
    log.debug("config:",data);
},function(err){
    log.error(err);
});
```

``configure()``
always returns an ES6 ``Promise`` which fulfills if a config is available, either via file or through the ``devjs-configurator-server``.  A deviceJS API is no longer used for configuration, but instead a local http server (available on loopback only) which is started inside Runner.

====
**Parsing**

Data is always parsed using JSON.minify and JSON.parse. This means your config file can have comments in it.

**Variable subsitution**

The config file can use meta variables. This are of the form ``${VARNAME}``

Variables are automatically any environmental variable. So in your config file you could have something like this:

```
{
  home: "${HOME}"
}
```

Other supported vars:

``${thisdir}`` The same directory as the config file.


