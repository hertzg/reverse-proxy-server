#!/bin/bash
cd `dirname $BASH_SOURCE`
if [ -f server.pid ]
then
    kill `cat server.pid` 2> /dev/null
    rm -f server.err server.out server.pid
fi
