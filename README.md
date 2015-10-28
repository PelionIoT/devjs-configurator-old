# devjs-configurator
deviceJS common module config system

```javascript
// example use
require('devjs-configurator').configure(__dirname)
  .then(function(err,data){
  if(err)
    log.error(err);
  else
    log.debug("config:",data);
});

// specify a module name (instead of using 'name' in devicejs.json in __dirname)
require('devjs-configurator').configure("my_module_name",__dirname)
  .then(function(err,data){
  if(err)
    log.error(err);
  else
    log.debug("config:",data);
});

// specify the config file also (by default is config.json)
require('devjs-configurator').configure("my_module_name",__dirname,"myconfig.json")
  .then(function(err,data){
  if(err)
    log.error(err);
  else
    log.debug("config:",data);
});
```

``configure()``
always returns a ``thenable`` which always fulfills.

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


