#!/bin/bash
set -ex

C3BASEPATH=$( [[ "$(uname -s)" == Darwin ]] && echo "$HOME/open-c3-workspace" || echo "/data" )

VERSION=$1
if [ "X$VERSION" == "X" ];then
    VERSION=$(date +%y%m%d)
fi
echo VERSION:$VERSION

cd $C3BASEPATH/open-c3/Installer/C3/pkg/perl || exit

docker build . -t openc3/pkg-perl:$VERSION --no-cache

docker run -v $C3BASEPATH/open-c3/Installer/C3/pkg/perl:/tempdata openc3/pkg-perl:$VERSION

mkdir -p _tempdata/open-c3/Connector/pkg
mv perl.tar.gz _tempdata/open-c3/Connector/pkg/
mv _tempdata tempdata
