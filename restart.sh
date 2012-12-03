#!/bin/bash
cd `dirname $BASH_SOURCE`
./stop.sh
node src/server.js > var/server.out 2> var/server.err &
echo $! > var/server.pid
