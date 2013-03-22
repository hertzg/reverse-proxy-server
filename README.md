# reverse-proxy-server

A small, simple and fast reverse proxy built on Node.js to replace virtual
servers of Apache, Nginx, etc. Additional features:
* Replace error pages for `500 Internal Server Error`, `503 Bad Gateway`, etc.
* Remove headers such as `Server`, `X-Powered-By`, etc.
* Redirect hosts to other locations. (`www.example.com` to `example.com`, `my.example.com/anything` to `example.com/other-page/anything`, etc)

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
