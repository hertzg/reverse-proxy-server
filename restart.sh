#!/bin/bash
cd `dirname $BASH_SOURCE`
./stop.sh
node server.js > server.out 2> server.err &
echo $! > server.pid
sleep 0.2
cat server.out server.err
