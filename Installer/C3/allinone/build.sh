#!/bin/bash
set -x
set -e
rm -rf temp
mkdir -p temp/c3-front

cat /data/open-c3/*/schema.sql  /data/open-c3/Installer/C3/mysql/init.sql > temp/init.sql

cp ../mysql/conf/my.cnf temp/
cp -r /data/open-c3/Connector temp/
rm -rf temp/Connector/pkg/book
rm -rf temp/Connector/pkg/book.tar.gz
rm -rf temp/Connector/pkg/dev-cache
rm -rf temp/Connector/pkg/dev-cache.tar.gz
rm -rf temp/Connector/pkg/install-cache.tar.gz
rm -rf temp/Connector/pkg/install-cache/.git
bash -c "cd temp/Connector/pkg/install-cache && ls | grep -v ^bin$|xargs -i{} rm -rf {}"

cp -r /data/open-c3/MYDan temp/
rm -rf temp/MYDan/repo/data/perl/data/CYGWIN_NT-10.0
rm -rf temp/MYDan/repo/data/perl/data/CYGWIN_NT-6.1
rm -rf temp/MYDan/repo/data/perl/data/FreeBSD
rm -rf temp/MYDan/repo/data/perl/data/Linux/x86_64/perl.20171215122230.tar.gz
rm -rf temp/MYDan/repo/data/perl/data/Linux/x86_64/perl.20190328144900.tar.gz

cp -r /data/open-c3/JOBX temp/
cp -r /data/open-c3/JOB temp/
cp -r /data/open-c3/AGENT temp/
cp -r /data/open-c3/CI temp/
cp -r /data/open-c3/c3-front/dist temp/c3-front/dist
rm -rf temp/c3-front/dist/book*
cp -r /data/open-c3/c3-front/nginxconf temp/c3-front/nginxconf
cp /data/open-c3/c3-front/nginx.conf temp/c3-front/nginx.conf
cp -r /data/open-c3/web-shell temp/
rm temp/web-shell/node_modules/zeparser/benchmark.html
cp -r /data/open-c3/Installer/install-cache/bin temp/install-cache-bin

#prometheus
cp -r /data/open-c3/prometheus temp/
rm -f temp/prometheus/config/*temp*
bash -c "cd temp/prometheus/config/targets/ && ls|grep -v example|xargs -i{} rm {}"
bash -c "cd temp/prometheus/config/ && ls|grep yml|grep -v example|xargs -i{} rm {}"
bash -c "cd temp/prometheus/config/ && ls|grep yml|grep example |awk '{print \$1,\$1}'| sed 's/.example//' |awk '{print \"cp\", \$2,\$1}' |bash"
bash -c "cd prometheus && ./download.sh"

#alertmanager
cp -r /data/open-c3/alertmanager temp/
bash -c "cd alertmanager && ./download.sh"

#lua
cp -r /data/open-c3/lua      temp/

#grafana-data
cp -r /data/open-c3/Installer/install-cache/grafana-data temp/

VERSION=$1
if [ "X$VERSION" == "X" ];then
    VERSION=$(date +%Y%m%d)
fi
echo VERSION:$VERSION
docker build . -t openc3/allinone:$VERSION --no-cache
rm -rf temp

docker ps|grep 0.0.0.0:8080|awk '{print $1}'|xargs -i{} docker stop {}
docker run -p 8080:88 -d openc3/allinone:$VERSION
