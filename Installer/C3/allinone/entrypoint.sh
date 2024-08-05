#!/bin/bash
set -x

function movedata() {
    SRC=$1
    DST=$2
    if [ -d $SRC ];then
        if [ ! -d $DST ];then
            cp -r $SRC $DST
        fi
        rm -rf $SRC
        ln -fsn $DST $SRC
    fi
}

movedata /data/Software/mydan/etc/agent/auth /data/open-c3-data/auth
movedata /data/logs /data/open-c3-data/logs
movedata /data/glusterfs /data/open-c3-data/glusterfs

movedata /var/lib/mysql /data/open-c3-data/mysql-data
chown mysql.mysql /data/open-c3-data/mysql-data -R

# nginx 依赖 hosts的解析，需要放在nginx之前，否则可能会导致nginx启动失败。
cat >> /etc/hosts <<EOF

127.0.0.1	api.agent.open-c3.org
127.0.0.1	api.job.open-c3.org
127.0.0.1	api.jobx.open-c3.org
127.0.0.1	api.ci.open-c3.org
127.0.0.1	api.connector.open-c3.org

127.0.0.1	OPENC3_DB_IP

127.0.0.1	OPENC3_GRAFANA_IP
127.0.0.1	OPENC3_PROMETHEUS_IP
127.0.0.1	OPENC3_ALERTMANAGER_IP
127.0.0.1	OPENC3_LUA_IP

127.0.0.1       openc3-server
EOF


if [ "X$OPEN_C3_EXIP" == "X" ];then
    OPEN_C3_EXIP=127.0.0.1
fi

if [ "X$OPEN_C3_NAME" == "X" ];then
    OPEN_C3_NAME=test
fi

if [ "X$JUYUN_APPKEY" == "X" ];then

    cp /data/Software/mydan/Connector/config.ini/openc3 /data/Software/mydan/Connector/config.ini/current

    sed -i 's/openc3_style_ctrl=\\"[a-zA-Z0-9]*\\"/openc3_style_ctrl=\\"openc3\\"/g' /data/Software/mydan/c3-front/dist/scripts/*
    sed -i 's/#24293e/#f63/g' /data/Software/mydan/c3-front/dist/styles/*
    sed -i 's/#293fbb/#e52/g' /data/Software/mydan/c3-front/dist/styles/*

else

    cp /data/Software/mydan/Connector/config.ini/juyun /data/Software/mydan/Connector/config.ini/juyun_
    sed -i s/xxxxxx/$JUYUN_APPKEY/ /data/Software/mydan/Connector/config.ini/juyun_
    if [ "X$JUYUN_APPNAME" != "X" ];then
        sed -i "s/appname: openc3/appname: $JUYUN_APPNAME/" /data/Software/mydan/Connector/config.ini/juyun_
    fi

    cp /data/Software/mydan/Connector/config.ini/juyun_ /data/Software/mydan/Connector/config.ini/current

    sed -i 's/openc3_style_ctrl=\\"[a-zA-Z0-9]*\\"/openc3_style_ctrl=\\"juyun\\"/g' /data/Software/mydan/c3-front/dist/scripts/*
    sed -i 's/#f63/#24293e/g' /data/Software/mydan/c3-front/dist/styles/*
    sed -i 's/#e52/#293fbb/g' /data/Software/mydan/c3-front/dist/styles/*
fi

echo openc3-srv-docker > /data/Software/mydan/.open-c3.hostname

if [ ! -f /data/Software/mydan/etc/agent/auth/c3_${OPEN_C3_NAME}.key ]; then
    cd /data/Software/mydan/etc/agent/auth && \
    ssh-keygen -f c3_${OPEN_C3_NAME} -P "" && \
    mv c3_${OPEN_C3_NAME} c3_${OPEN_C3_NAME}.key && \
    echo success
fi

nginx
crond

if [ -f /var/lib/mysql/mysql.sock.lock ];then
    rm /var/lib/mysql/mysql.sock.lock
fi
mysqld --daemonize --user=mysql --datadir=/var/lib/mysql --log-error=/var/log/mysqld.log

if [ ! -d /var/lib/mysql/connector ];then
    TEMPMYSQLPW=$(grep 'temporary password' /var/log/mysqld.log|tail -n 1|awk '{print $NF}')

    mysql --connect-expired-password -uroot -p$TEMPMYSQLPW <<EOF
      alter user 'root'@'localhost' identified by 'openc3123456^!';
      source /tmp/init.sql;
EOF

fi

#单机版初始化对应
mkdir -p /data/open-c3-data/glusterfs/oncall/{conf,data};
mkdir -p /data/open-c3-data/glusterfs/mailmon/{conf,data,run};
mkdir -p /data/open-c3-data/monitor-sender

/data/Software/mydan/Connector/pp/c3mc-sys-sup
/data/Software/mydan/Connector/pp/c3mc-sys-dup
#=end

nohup /usr/prometheus/prometheus --config.file=/data/Software/mydan/prometheus/config/prometheus.yml --storage.tsdb.path=/data/open-c3-data/prometheus-data --web.enable-lifecycle --storage.tsdb.retention=14d &

nohup /usr/alertmanager/alertmanager --config.file=/data/Software/mydan//alertmanager/config/alertmanager.yml --storage.path=/alertmanager &

rm -f /var/run/grafana-server.pid
/etc/rc.d/init.d/grafana-server start

/data/Software/mydan/Connector/restart-open-c3-auto-config-change.pl
