#!/bin/bash

C3BASEPATH=$(case  $(uname -s) in Darwin*) echo "$HOME/open-c3-workspace";; *) echo "/data";; esac)

cd $C3BASEPATH/open-c3/Installer/C3 || exit 1

srv=$1

if [ "X$srv" == "X" ];then
    echo $0 ServerName
    docker ps|awk '{print $NF}'|grep openc3-[a-z]*$
    exit 1

fi
../docker-compose  up -d --build $srv

if [ "X$srv" == "Xopenc3-grafana" ]; then
    docker cp $C3BASEPATH/open-c3/grafana/config/grafana.ini openc3-grafana:/etc/grafana/grafana.ini
    docker restart openc3-grafana
fi
