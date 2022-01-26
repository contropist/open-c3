(function() {
    'use strict';

    angular
        .module('openc3')
        .controller('MonitorConfigController', MonitorConfigController);

    function MonitorConfigController($location, $anchorScroll, $state, $http, $uibModal, treeService, ngTableParams, resoureceService, $websocket, genericService, $scope, $injector, $sce ) {

        var vm = this;
        vm.treeid = $state.params.treeid;
        var toastr = toastr || $injector.get('toastr');

        vm.alias = { 'port': '端口', 'process': '进程', 'http': 'HTTP', 'tcp': 'TCP','udp': 'UDP' }
        treeService.sync.then(function(){
            vm.nodeStr = treeService.selectname();
        });

        vm.siteaddr = window.location.protocol + '//' + window.location.host;
        vm.url = vm.siteaddr + '/third-party/monitor/grafana/d/dUrNraOnz/openc3-dashboard?orgId=1&var-origin_prometheus=&var-job=openc3&var-hostname=All&var-device=All&var-interval=2m&var-maxmount=&var-show_hostname=&var-total=1&var-treeid=treeid_' + vm.treeid + '&kiosk';
        vm.prometheusurl = vm.siteaddr + '/third-party/monitor/prometheus/alerts';
        vm.alertmanagerurl = vm.siteaddr + '/third-party/monitor/alertmanager/#/alerts?silenced=false&inhibited=false&active=true&filter=%7Bfromtreeid%3D"' + vm.treeid + '"%7D';
        vm.grafanaurl = vm.siteaddr + '/third-party/monitor/grafana/';

        vm.openNewWindow = function( url )
        {
            window.open( url, '_blank')
        }

        vm.trustSrc = function()
        {
            return $sce.trustAsResourceUrl( vm.url );
        }

        vm.reload = function(){
            vm.loadover = false;
            $http.get('/api/agent/monitor/config/collector/' + vm.treeid ).success(function(data){
                if(data.stat == true) 
                { 
                    vm.activeRegionTable = new ngTableParams({count:20}, {counts:[],data:data.data.reverse()});
                    vm.loadover = true;
                } else { 
                    toastr.error( "加载采集列表失败:" + data.info )
                }
            });
        };

        vm.reload();

        vm.reloadRule = function(){
            vm.loadoverRule = false;
            $http.get('/api/agent/monitor/config/rule/' + vm.treeid ).success(function(data){
                if(data.stat == true) 
                { 
                    vm.activeRuleTable = new ngTableParams({count:20}, {counts:[],data:data.data.reverse()});
                    vm.loadoverRule = true;
                } else { 
                    toastr.error( "加载监控策略失败:" + data.info )
                }
            });
        };

        vm.reloadRule();

        vm.reloadAlert = function(){
            vm.loadoverAlert = false;
            $http.get('/api/agent/monitor/alert/' + vm.treeid ).success(function(data){
                if(data.stat == true) 
                { 
                    vm.activeAlertTable = new ngTableParams({count:20}, {counts:[],data:data.data.reverse()});
                    vm.loadoverAlert = true;
                } else { 
                    toastr.error( "加载当前告警失败:" + data.info )
                }
            });
        };

        vm.reloadAlert();

        vm.reloadUser = function(){
            vm.loadoverUser = false;
            $http.get('/api/agent/monitor/config/user/' + vm.treeid ).success(function(data){
                if(data.stat == true) 
                { 
                    vm.activeUserTable = new ngTableParams({count:20}, {counts:[],data:data.data.reverse()});
                    vm.loadoverUser = true;
                } else { 
                    toastr.error( "加载报警接收人失败:" + data.info )
                }
            });
        };

        vm.reloadUser();

        vm.createCollector = function (postData, title) {
            $uibModal.open({
                templateUrl: 'app/pages/quickentry/monitorconfig/create/collector.html',
                controller: 'CreateMonitorConfigController',
                controllerAs: 'createMonitorConfig',
                backdrop: 'static',
                size: 'lg',
                keyboard: false,
                bindToController: true,
                resolve: {
                    treeid: function () { return vm.treeid},
                    reload : function () { return vm.reload},
                    title: function(){ return title},
                    postData: function(){ return postData}
                }
            });
        };

        vm.createRule = function (postData, title) {

            $uibModal.open({
                templateUrl: 'app/pages/quickentry/monitorconfig/create/rule.html',
                controller: 'CreateMonitorConfigRuleController',
                controllerAs: 'createMonitorConfigRule',
                backdrop: 'static',
                size: 'lg',
                keyboard: false,
                bindToController: true,
                resolve: {
                    treeid: function () { return vm.treeid},
                    reload : function () { return vm.reloadRule},
                    title: function(){ return title},
                    postData: function(){ return postData}
                }
            });
        };


        vm.createUser = function () {
            vm.newuser = $scope.newUser;
            if (vm.newuser.length > 0){
                $http.post('/api/agent/monitor/config/user/' + vm.treeid, {'user': vm.newuser}).then(
                    function successCallback(response) {
                        if (response.data.stat){
                            vm.reloadUser();
                            $scope.newUser = '';
                        }else {
                            toastr.error( "添加失败：" + response.data.info );
                        }
                    },
                    function errorCallback (response ){
                        toastr.error( "添加失败：" + response.status );
                    }
                );
            }
        };

 
        vm.deleteCollector = function(id) {
          swal({
            title: "是否要删除该指标采集",
            text: "删除",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            cancelButtonText: "取消",
            confirmButtonText: "确定",
            closeOnConfirm: true
          }, function(){
            $http.delete('/api/agent/monitor/config/collector/' + vm.treeid + '/' + id ).success(function(data){
                if( ! data.stat ){ toastr.error("删除监控采集失败:" + date.info)}
                vm.reload();
            });
          });
        }


        vm.deleteRule = function(id) {
          swal({
            title: "是否要删除该监控策略",
            text: "删除",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            cancelButtonText: "取消",
            confirmButtonText: "确定",
            closeOnConfirm: true
          }, function(){
            $http.delete('/api/agent/monitor/config/rule/' + vm.treeid + '/' + id ).success(function(data){
                if( ! data.stat ){ toastr.error("删除监控策略:" + date.info)}
                vm.reloadRule();
            });
          });
        }

        vm.deleteUser = function(id) {
          swal({
            title: "是否要删除该用户",
            text: "删除",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            cancelButtonText: "取消",
            confirmButtonText: "确定",
            closeOnConfirm: true
          }, function(){
            $http.delete('/api/agent/monitor/config/user/' + vm.treeid + '/' + id ).success(function(data){
                if( ! data.stat ){ toastr.error("删除报警接收人失败:" + date.info)}
                vm.reloadUser();
            });
          });
        }


    }
})();