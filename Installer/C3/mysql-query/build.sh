#!/bin/bash
set -ex

C3BASEPATH=$(case  $(uname -s) in Darwin*) echo "$HOME/open-c3-workspace";; *) echo "/data";; esac)

VERSION=$1
if [ "X$VERSION" == "X" ];then
    VERSION=$(date +%Y%m%d)
fi
echo VERSION:$VERSION
docker build . -t openc3/mysql-query:$VERSION --no-cache

docker ps|grep 0.0.0.0:65113|awk '{print $1}'| xargs -i{} docker kill {}

docker run -d -p 65113:65113 \
  -v /bin/docker:/bin/docker \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $C3BASEPATH/open-c3-data/mysqld-exporter-v3:/data/open-c3-data/mysqld-exporter-v3 \
  -e C3_MysqlQuery_Container=1 \
  --network c3_JobNet \
  openc3/mysql-query:$VERSION
