#!/bin/bash -ex
cd $HOME

python fuzzfetch/fetch.py -o $HOME -n firefox -a

cd framboise
xvfb-run -s '-screen 0 1024x768x24' $@ &
sleep ${FUZZER_MAX_RUNTIME:-600}; kill $(ps -s $$ -o pid=)
