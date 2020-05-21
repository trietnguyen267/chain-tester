#!/bin/sh
# Run this bash to setup prometheus sever and grafana
# Datasource for grafana: http://10.10.10.1:9090 
# Import dashboard from grafana/dashboard.json

pushd $(pwd)/prometheus 
docker-compose up -d
popd
docker-compose up -d
