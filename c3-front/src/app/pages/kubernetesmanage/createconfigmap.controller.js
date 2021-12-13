(function() {
    'use strict';

    angular
        .module('openc3')
        .controller('KubernetesCreateConfigMapController', KubernetesCreateConfigMapController);

    function KubernetesCreateConfigMapController( $uibModalInstance, $location, $anchorScroll, $state, $http, $uibModal, treeService, ngTableParams, resoureceService, $scope, $injector, ticketid, clusterinfo, namespace, name ) {

        var vm = this;
        vm.treeid = $state.params.treeid;
        var toastr = toastr || $injector.get('toastr');

        vm.cancel = function(){ $uibModalInstance.dismiss(); };

        treeService.sync.then(function(){
            vm.nodeStr = treeService.selectname();
        });

        $scope.editstep = 1;

        vm.tasktype = 'create';
        if( namespace && name )
        {
            vm.tasktype = 'apply';
        }

        vm.reload = function(){
            vm.loadover = false;

            var url = "/api/ci/kubernetes/data/template/configmap";

            if( vm.tasktype == 'apply' )
            {
                url = "/api/ci/v2/kubernetes/app/json?ticketid=" + ticketid + "&type=configmap&name=" + name + "&namespace=" + namespace;
            }

            $http.get(url).success(function(data){
                if(data.stat == true) 
                { 
                   vm.loadover = true;
                   vm.editData = data.data;

                   if( namespace )
                   {
                      vm.editData.metadata.namespace = namespace;
                   }

                   $scope.labels = [];
                   if( vm.editData.metadata.labels )
                   {
                       angular.forEach(vm.editData.metadata.labels, function (v, k) {
                           $scope.labels.push( { "K": k, "V": v })
                       });
                   }

                   vm.configMapData = [];

                   angular.forEach(vm.editData.data, function (v, k) {
                       vm.configMapData.push({"key": k, "val": v});
                   });


                } else { 
                    swal({ title:'加载模版信息失败', text: data.info, type:'error' });
                    vm.cancel();
                }
            });

            if( vm.tasktype == 'create' )
            {
            $http.get("/api/ci/v2/kubernetes/namespace?ticketid=" + ticketid ).then(
                function successCallback(response) {
                    if (response.data.stat){
                        vm.namespaces = response.data.data; 
                    }else {
                        toastr.error( "获取集群NAMESPACE数据失败："+response.data.info );
                    }
                },
                function errorCallback (response){
                    toastr.error( "获取集群NAMESPACE数据失败: " + response.status )
                });
            }
        };
        vm.reload();

        vm.gotostep0 = function(){
            $scope.editstep = 0; 
        };


        vm.gotostep1 = function(){
            vm.loadover = false;

            var d = {
                "data": vm.newyaml,
            };
            $http.post("/api/ci/kubernetes/data/yaml2json", d  ).success(function(data){
                if(data.stat == true) 
                { 
                    vm.editData = data.data

                    $scope.labels = [];
                    if( vm.editData.metadata.labels )
                    {
                        angular.forEach(vm.editData.metadata.labels, function (v, k) {
                            $scope.labels.push( { "K": k, "V": v })
                        });
                    }

                    vm.configMapData = [];

                    angular.forEach(vm.editData.data, function (v, k) {
                        vm.configMapData.push({"key": k, "val": v});
                    });

                    vm.loadover = true;
                    $scope.editstep = 1; 
                } else { 
                   swal({ title:'YAML格式转换失败', text: data.info, type:'error' });
                }
            });

        };

        vm.gotostep2 = function(){
//labels
            var labels = {};
            angular.forEach($scope.labels, function (v, k) {
                var key = v["K"]
                labels[key] = v["V"];
            });


            if( Object.keys(labels).length > 0 )
            {
                vm.editData.metadata.labels = labels;
            }
            else
            {
                delete vm.editData.metadata.labels;
            }

//datas
            var datas = {};

            angular.forEach(vm.configMapData, function (v, k) {
                var key = v["key"]
                datas[key] = v["val"];
            });

            if( Object.keys(datas).length > 0 )
            {
                vm.editData.data = datas;
            }
            else
            {
                delete vm.editData.data;
            }

            if( !( vm.editData.metadata.namespace && vm.editData.metadata.name ) )
            {
                swal({ title:'错误', text: "Namespace和Name不齐全", type:'error' });
                return;
            }

            if( vm.editData.kind !== 'ConfigMap' )
            {
                swal({ title:'错误', text: "kind不正确，必须为ConfigMap", type:'error' });
                return;
            }

 
            $scope.editstep = 2; 
            vm.loadover = false;

            var d = {
                "data": vm.editData,
            };
            $http.post("/api/ci/kubernetes/data/json2yaml", d  ).success(function(data){
                if(data.stat == true) 
                { 
                   vm.newyaml = data.data

                   $http.get("/api/ci/v2/kubernetes/app/yaml/always?ticketid=" + ticketid + "&type=" + vm.editData.kind + "&name=" + vm.editData.metadata.name + "&namespace=" + vm.editData.metadata.namespace ).success(function(data){
                        if(data.stat == true) 
                        { 
                            vm.oldyaml = data.data;
                            vm.diff();
                            vm.loadover = true;
                        } else { 
                            toastr.error("获取最新的配置信息失败:" + data.info)
                        }
                    });

                } else { 
                   swal({ title:'提交失败', text: data.info, type:'error' });
                }
            });
        };


//labels
        $scope.labels = [];

        vm.addLabel = function()
        {
            $scope.labels.push({ "K": "", "V": ""});
        }
        vm.delLabel = function(id)
        {
            $scope.labels.splice(id, 1);
        }

//configMapData
        vm.configMapData = [];
        vm.addData = function()
        {
            vm.configMapData.push({"key": "", "val": ""})
        }
 
        vm.delData = function(id)
        {
            vm.configMapData.splice(id, 1);
        }


        vm.apply = function(){
            vm.loadover = false;
            var d = {
                "ticketid": ticketid,
                "yaml": vm.newyaml,
            };
            $http.post("/api/ci/v2/kubernetes/app/" + vm.tasktype, d  ).success(function(data){
                if(data.stat == true) 
                { 
                   vm.loadover = true;
                   vm.cancel();
                   swal({ title:'提交成功', text: data.info, type:'success' });
                } else { 
                   swal({ title:'提交失败', text: data.info, type:'error' });
                }
            });
        };

        vm.assignment = function () {
            var postData = {
                "type": "kubernetes",
                "name": "kubernetes ConfigMap " + vm.tasktype,
                "handler": clusterinfo.create_user,
                "url": "/api/ci/v2/kubernetes/app/" + vm.tasktype,
                "method": "POST",
                "submit_reason": "",
                "remarks": "\n集群ID:" + ticketid + ";\n集群名称:" + clusterinfo.name +";\n配置:\n" + vm.newyaml,
                "data": {
                    "ticketid": ticketid,
                    "yaml": vm.newyaml,
                },
            };

            $uibModal.open({
                templateUrl: 'app/pages/assignment/assignmentcommit.html',
                controller: 'AssignmentCommitController',
                controllerAs: 'assignmentcommit',
                backdrop: 'static',
                size: 'lg',
                keyboard: false,
                bindToController: true,
                resolve: {
                    treeid: function () {return vm.treeid},
                    postData: function () {return postData},
                    homecancel: function () {return vm.cancel},
                }
            });
        };


        vm.oldyaml = "";
        vm.newyaml = "";

        vm.diffresultstring = "";
        vm.diff = function()
        {
            var diffresultstring = document.getElementById('diffresultstring');
            //三种diff类型，字符、单词、行 ，分别对应下面参数：diffChars  diffWords diffLines
            var diff = JsDiff["diffLines"](vm.oldyaml, vm.newyaml);

            var fragment = document.createDocumentFragment();
            for (var i=0; i < diff.length; i++) {

                if (diff[i].added && diff[i + 1] && diff[i + 1].removed) {
                    var swap = diff[i];
                    diff[i] = diff[i + 1];
                    diff[i + 1] = swap;
                }

                var node;
                if (diff[i].removed) {
                    node = document.createElement('del');
                    node.appendChild(document.createTextNode(diff[i].value));
                } else if (diff[i].added) {
                    node = document.createElement('ins');
                    node.appendChild(document.createTextNode(diff[i].value));
                } else {
                    node = document.createTextNode(diff[i].value);
                }
                fragment.appendChild(node);
            }

            diffresultstring.textContent = '';
            diffresultstring.appendChild(fragment);
        };

    }
})();
