(function() {
    'use strict';

    angular
        .module('openc3')
        .controller('TerminalCmdController', TerminalCmdController);

    function TerminalCmdController($timeout, $state, $http, $uibModal, $scope, treeService, ngTableParams, resoureceService, $injector) {

        var vm = this;
        vm.treeid = $state.params.treeid;
        var toastr = toastr || $injector.get('toastr');
        $scope.selected_inip = [];
        $scope.selected_exip = [];
        $scope.selected_name = [];
        $scope.radioselected = {};
        $scope.selectedData = [];
        $scope.selectedDataName = [];
        $scope.selectedDataInip = [];
        $scope.selectedDataExip = [];
        $scope.choiceShow = false;
        $scope.selectedUser = 'root';
        vm.nodecount = 0;

        treeService.sync.then(function(){ 
            vm.nodeStr = treeService.selectname(); 
        });

        if (vm.treeid){
            $http.get('/api/job/userlist/' + vm.treeid).then(

                function successCallback (response) {
                    if (response.data.stat){
                        $scope.allProUsers= response.data.data;
                    }else {
                        toastr.error( "获取执行账户列表失败："+response.data.info)
                    }
                },
                function errorCallback () {
                    toastr.error( "获取执行账户列表失败："+response.status)
                }
            );
        }

        vm.allinip = [];
        vm.reload = function () {
            vm.loadover = false
            vm.allinip = [];
            $http.get('/api/agent/nodeinfo/' + vm.treeid).then(
                function successCallback(response) {
                    if (response.data.stat){
                        vm.nodecount = response.data.data.length;
                        vm.machine_Table = new ngTableParams({count:10}, {counts:[],data:response.data.data.reverse()});
                        angular.forEach(response.data.data, function (value, key) {
                            if( value.inip )
                            {
                                vm.allinip.push( value.inip )
                            }
                        });
                        vm.loadover = true
                    }else {
                        toastr.error( "获取机器列表失败："+response.data.info)
                    }
                },
                function errorCallback (response ){
                    toastr.error( "获取机器列表失败："+response.status)
                });
        };

        vm.reload();

        var changeSelected = function (action, id, data, type) {
            if (action == 'add') {
                if (type == 'name'){
                    $scope.selectedData.push(data)
                }
                if (type == 'inip'){
                    $scope.selectedData.push(data)
                }
                if (type == 'exip'){
                    $scope.selectedData.push(data)
                }
            }
            if (action == 'remove'){
                if (type == 'name'){
                    $scope.selectedData.splice($scope.selectedData.indexOf(data), 1)
                }
                if (type == 'inip'){
                    $scope.selectedData.splice($scope.selectedData.indexOf(data), 1)
                }
                if (type == 'exip'){
                    $scope.selectedData.splice($scope.selectedData.indexOf(data), 1)
                }
            }
        };
        // 机器名称
        $scope.nameUpdateSelection = function ($event, id, data) {
            var checkbox = $event.target;
            var action = (checkbox.checked ? 'add' : 'remove');
            changeSelected(action, id, data, 'name');
        };
        // 内网IP
        $scope.inipUpdateSelection = function ($event, id, data) {
            var checkbox = $event.target;
            var action = (checkbox.checked ? 'add' : 'remove');
            changeSelected(action, id, data, 'inip');
        };
        // 外网IP
        $scope.exipUpdateSelection = function ($event, id, data) {
            var checkbox = $event.target;
            var action = (checkbox.checked ? 'add' : 'remove');
            changeSelected(action, id, data, 'exip');
        };
        $scope.isSelected = function (addr) {
            return $scope.selectedData.indexOf(addr) >= 0;
        };
        vm.delChoice = function (id) {
            if (id >=0){
                $scope.selectedData.splice(id, 1);
            }
        };

        vm.delAllData = function () {
            $scope.selectedData.splice(0,$scope.selectedData.length);
        };

        vm.selectAllData = function () {
            angular.forEach(vm.allinip, function (value, key) {
                if( $scope.isSelected(value) == false )
                {
                    $scope.selectedData.push(value)
                }
            });
        };

        $scope.openOneTab = function (name) {
            var terminalAddr = window.location.protocol + "//" + window.location.host+"/api/job/cmd/";
            var s = vm.treeid+"?node=" + name + '&bash=1' +'&sudo=' + $scope.selectedUser + '&siteaddr=' + window.location.protocol + "//" + window.location.host;
            window.open(terminalAddr+s, '_blank')
        };

        vm.openNewTab = function () {
            if($scope.selectedData.length<=0){
                swal({
                    title:"所选节点为空",
                    type:'error'
                });
            }
            else {
                var terminalAddr = window.location.protocol + "//" + window.location.host+"/api/job/cmd/";
                var node_str = $scope.selectedData.join(",");
                var s = vm.treeid+"?node=" + node_str +'&sudo=' + $scope.selectedUser + '&siteaddr=' + window.location.protocol + "//" + window.location.host;
                window.open(terminalAddr+s, '_blank')
            }

        };

        vm.choiceServer = function () {
            var openChoice = $uibModal.open({
                templateUrl: 'app/components/machine/choiceMachine.html',
                controller: 'ChoiceController',
                controllerAs: 'choice',
                backdrop: 'static',
                size: 'lg',
                keyboard: false,
                bindToController: true,
                resolve: {
                    treeId: function () { return vm.treeid},

                }
            });
            openChoice.result.then(
                function (result) {
                    $scope.selectedData = result;
                },function (reason) {
                    console.log("error reason", reason)
                }
            );
        };

        vm.openTailLog = function () {
            if($scope.selectedData.length<=0){
                swal({
                    title:"所选节点为空",
                    type:'error'
                });
            }
            else {
                var terminalAddr = window.location.protocol + "//"+window.location.host+"/api/job/cmd/";
                var node_str = $scope.selectedData.join(",");
                var s = vm.treeid + "?node=" + node_str +'&sudo=' + $scope.selectedUser + '&tail=1';
                window.open(terminalAddr + s, '_blank');
            }

        };
    }

})();
