# node-reverse-proxy

A small, simple and fast reverse proxy built on Node.js to replace virtual
servers of Apache, Nginx, etc.

### start/restart server
```
./restart.sh
```

### stop server
```
./stop.sh
```

## configuration
If a configuration file exists at `~/.reverse-proxy-server/config.js` it is
loaded. If not default configurations are read from `config.js`.
