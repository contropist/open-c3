# OPEN-C3

<div align="center">
  <img width="100" style="max-width:100%" src="./c3-front/src/assets/images/open-c3-logo.jpeg" title="open-c3">
  <br><br>
  <p><b>OPEN-C3</b>为解决CI/CD/CO而生。</p>	
</div>

# 文档

[点击查看详细文档](https://open-c3.github.io)

# 快速开始

## 体验版

```
docker run -p 8080:88 openc3/allinone:latest
```

[点击查看体验版文档](https://open-c3.github.io/体验版安装/)

## 单机版

```
# 在centos 7 的系统上执行下面命令(最小资源磁盘： 4核8G 100G磁盘 )，执行成功后通过80端口访问服务。
curl https://raw.githubusercontent.com/open-c3/open-c3/v2.6.1/Installer/scripts/single.sh | OPENC3VERSION=v2.6.1 bash -s install

```

[点击查看单机版文档](https://open-c3.github.io/单机版安装/)

# 问题反馈

在使用过程中遇到任何问题，欢迎把问题提交到issues中:  [github issues](https://github.com/open-c3/open-c3/issues) :)

# 功能简介

Open-C3是一套运维系统，包含了下面子系统。

## 资源管理 CMDB

* 支持公有云资源的同步和管理。包括AWS、腾讯云、华为云、阿里云、谷歌云、金山云 等。
* 同时可以通过流程模块进行资源的创建和回收。
* 资源时间机器、可以查阅资源在历史时间点的详情。
* 服务分析功能，系统会进行自动搜索，把调用关系展示出来。如查询某个域名的时可以展示整个链路 域名 -> 加速服务 -> 负载均衡 -> Nginx -> Service -> Pod

## 监控系统

* 支持主机监控，数据库监控，云监控。
* 主机监控除了通用指标，可以自定义监控，如监控端口、进程。

## Kubernetes集群管理

* 可以对Kubernetes集群进行管理，包括自建的Kubernetes集群、或者云上的 TKE、EKS 等。
* 可以对应用进行查看、创建、编辑、删除。
* 支持按照命名空间进行授权。
* 发布系统可以直接选择集群管理中的应用进行发布。

## 工单系统

* 提供了工单的提交处理功能。
* 工单处理过程中进行响应超时和处理超时提醒。
* 提供工单的处理情况的报告。
* 同时和流程系统进行了对接，需要人工处理的流程，会自动流转到工单系统中进行跟踪。

## 流程系统

* 流程系统包含审批功能。可以在流程系统中创建，销毁云资源，可以申请堡垒机权限、可以申请启动Kubernetes应用等。

## 故障自愈

* 可以配置故障自愈套餐。在故障发生时，系统会根据套餐的设置执行相应的作业尝试对故障进行修复。

## 作业平台

* 可以批量操作机器、批量同步文件。
* 同时提供了webshell进入机器的shell中进行操作、也可以进行批量操作。
* 作业步骤可以进行编排、作业可以设置成定时执行。执行结果可以通知相关人员。

## 发布系统

* 支持发布传统的部署在主机上的服务。
* 支持发布Kubernetes应用、AWS ECS 服务、Serverless 服务等。
* 构建过程可以在容器中进行也可以在运程主机中进行。
* 发布过程可以随时回滚。
* 发布过程可以自动触发，通过手机进行审批确认即可。

## 成本优化

* 系统默认会显示资源利用率低的主机信息、磁盘没挂载到机器上等。
* 如果开启了云监控的情况下，可以查看云资源的资源利用率低的资源。
* 资源利用率低的策略可以自定义，同时支持复杂的比较方式。
* 资源利用率低的资源支持定时通知资源归属人。支持标注。

# 联系我们

微信:

![微信二维码](https://open-c3.github.io/社区/images/open-c3-微信二维码.jpeg)

# 特点

* 一体化: Open-C3提供的是一体化的运维工具平台。一键部署后即可拥有多云管理平台、监控系统、发布系统等。
* 简洁的网络方案: 企业中的资源很多情况下分布在很多区域下。资源在多个隔离的网络中。Open-C3自带网络代理功能，只要部署Open-C3的机器能访问通每个区域中的一台机器，即可做主机监控和发布。并可以对数据进行跨区域的传输调度。
* 高效的传输协议: 发布系统在对文件进行分发过程中，文件只要跨区域传输一份数据，然后在同一个区域中可以进行多对多的传输，就能完成整个的文件分发。
* 易维护易升级: Open-C3提供了一个upgrade命令，用于服务一键升级，Open-C3的服务会一直对旧版兼容，任何一个版本都可以升级到最新的版本中。
* 模块独立性: Open-C3可以全平台一起使用，但是如果只想用其中的部分模块，只要提供合适的接口，Open-C3即可完美对接。比如已经有了资产系统，让资产系统给Open-C3提供简单的接口，Open-C3在做发布监控的时候，就可以使用已有资产系统中的资源分组信息。
