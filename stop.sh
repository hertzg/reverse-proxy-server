#!/bin/bash
cd `dirname $BASH_SOURCE`
if [ -f var/server.pid ]; then
    kill `cat var/server.pid` 2> /dev/null
    rm -f var/server.err var/server.out var/server.pid
fi
