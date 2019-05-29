'use strict';

var Process = require('process');
var OS = require('os');

var config = require('./Utils/LoadConfig');
var Logger = require('./Utils/Logger');
var WorkerState = require('./Utils/TypeDefine');
var g_Global = require('./Utils/Global');

// var g_ClusterConfigPath = "../Config/Cluster.cfg";
var g_ClusterConfig = {}

// var ClusterConfigParse = function (ConfigBuf)
// {
//     try {
//         g_ClusterConfig = JSON.parse(ConfigBuf);
//     } catch (error) {
//         g_Global["Log"].Err("Load cluster config failed, " + error);
//         Process.exit(-1);
//     }

//     return true;
// }

function WorkerInfo() {
    this.m_PID = 0;                    // 进程ID
    this.m_Handle = 0;                    // 进程对象
    this.m_StartTime = 0;                    // 进程启动时间
    this.m_State = WorkerState.NULL;     // 进程状态
}

class TCMaster {
    constructor() {
        this.m_Workers = new Object();         // 工作进程组
        this.m_MaxWorkers = 0;                    // 最大工作进程数
        this.m_WorkerNum = 0;                   // 工作进程数
        this.m_OnLineNum = 0;                    // 已经完成启动的进程数
        this.m_MaxRestart = 0;                    // 工作进程最大连续自动重启次数
        this.m_Restart = 0;                    // 工作进程连续自动重启次数
        this.m_Init = false;                // 初始化标志
        this.m_NeedKill = false;                // 关闭标志
        this.m_Cluster = require('cluster');   // cluster对象
    };

    // private
    _LoadConfig() {
        g_Global["Log"].Info("集群主节点正在初始化配置...");
        // var LoadRes = config.LoadConfig(g_ClusterConfigPath, ClusterConfigParse);
        // if (LoadRes !== "")
        // {
        //     Log.Err(LoadRes);
        //     Process.exit(-1);
        // }
        // g_Global["Log"].Info("集群主节点加载配置完成.");
        // g_Global["Log"].Info(g_ClusterConfig);

        if (g_Global["Config"]["MaxWorker"] === "Auto") {
            this.m_MaxWorkers = OS.cpus().length;
        } else {
            this.m_MaxWorkers = parseInt(g_Global["Config"]["MaxWorker"], 0);
        }

        this.m_MaxRestart = g_ClusterConfig["MaxRestart"];
        g_Global["Log"].Info("集群主节点初始化配置完成.");
    };

    _KillAllWorker() {
        this.m_NeedKill = true;
        for (var nIndex = 0; nIndex < this.m_Workers.length; nIndex++) {
            this.m_Worker[nIndex].m_Handle.kill();
        }
    };

    _OnFork(worker) {
        this.m_WorkerNum++;
        this.m_Workers[worker.process.pid] = new WorkerInfo();
        this.m_Workers[worker.process.pid].m_PID = worker.process.pid;
        this.m_Workers[worker.process.pid].m_Handle = worker;
        this.m_Workers[worker.process.pid].m_State = WorkerState.Fork;
        this.m_Workers[worker.process.pid].m_StartTime = Date.now();
        g_Global["Log"].Info("工作进程: " + worker.process.pid + " 创建...");
        g_Global["Log"].Info("当前工作进程数: " + this.m_WorkerNum + ".");
    };

    _OnOnline(worker) {
        this.m_OnLineNum++;
        this.m_Workers[worker.process.pid].m_State = WorkerState.Online;
        g_Global["Log"].Info("工作进程: " + worker.process.pid + " 创建完成.");
        if (this.m_OnLineNum === this.m_MaxWorkers) {
            g_Global["Log"].Info("集群启动完毕.");
        }
    };

    _OnListening(worker, address) {
        this.m_Workers[worker.process.pid].m_State = WorkerState.Listening;
        g_Global["Log"].Info("工作进程: " + worker.process.pid
            + " 已上线，正在监听-> " + address.address + ":" + address.port + " .");
    };

    _OnDisconnect(worker) {
        try {
            var WorkerInfo = this.m_Workers[worker.process.pid];
            if (WorkerInfo.hasOwnProperty('m_PID')) {
                this.m_WorkerNum--;
                this.m_OnLineNum--;
            }
            if (WorkerInfo.m_State === WorkerState.Disconnect
                || WorkerInfo.m_State === WorkerState.Exit) {
                g_Global["Log"].Warn("工作进程: " + worker.process.pid + " 断开与Master的连接，状态异常！当前状态为: " + ((WorkerInfo.m_State === WorkerState.Exit) ? "退出状态." : "断开状态."));
            } else {
                g_Global["Log"].Info("工作进程: " + worker.process.pid + " 正在退出...");
                g_Global["Log"].Info("当前工作进程数: " + this.m_WorkerNum + ".");
            }
            this.m_Workers[worker.process.pid].m_State = WorkerState.Disconnect;
        } catch (error) {
            g_Global["Log"].Err(error);
        }
    };

    _OnWorkerExit(worker, code, signal) {
        var WorkerInfo = this.m_Workers[worker.process.pid];
        if (WorkerInfo.m_State !== WorkerState.Disconnect) {
            this.m_WorkerNum--;
        }

        this.m_Workers[worker.process.pid] = undefined;

        if (this.m_NeedKill) {
            g_Global["Log"].Info("工作进程: " + worker.process.pid + "已退出，Code: " + code + " .");
            g_Global["Log"].Info("当前工作进程数: " + this.m_WorkerNum + ".");
            if (this.m_WorkerNum === 0) {
                g_Global["Log"].Info("工作进程全部退出.");
                g_Global["Log"].Info("集群已停止.");
                this.m_NeedKill = false;
            }
        } else {
            g_Global["Log"].Info("工作进程: " + worker.process.pid + " 异常退出， Code: " + code + " , Signal: " + signal + " .");
            g_Global["Log"].Info("当前工作进程数: " + this.m_WorkerNum + ".");
            g_Global["Log"].Info("重新创建工作进程...");

            // fork new worker
            this.m_Cluster.fork();
        }
    };

    // public

    // Init function
    Init() {
        if (this.m_Init) {
            g_Global["Log"].Warn("重复初始化.");
            return;
        }

        g_Global["Log"].Info("集群初始化中...");
        this._LoadConfig();
        this.m_Cluster.setupMaster({
            exec: "./TestSubscribe.js"
        });

        var that = this;
        // fork
        this.m_Cluster.on('fork', function (worker) {
            that._OnFork(worker);
        });

        // online
        this.m_Cluster.on('online', function (worker) {
            that._OnOnline(worker);
        });

        // listening
        this.m_Cluster.on('listening', function (worker, address) {
            that._OnListening(worker, address);
        });

        // disconnect
        this.m_Cluster.on('disconnect', function (worker) {
            that._OnDisconnect(worker);
        });

        // exit
        this.m_Cluster.on('exit', function (worker, code, signal) {
            that._OnWorkerExit(worker, code, signal);
        });

        this.m_Init = true;
        g_Global["Log"].Info("集群初始化完毕.");
    };

    Start() {
        if (this.m_NeedKill) {
            g_Global["Log"].Warn("正在停止集群所有工作进程，稍后在试...");
            return;
        }

        g_Global["Log"].Info("集群正在创建工作进程...");
        g_Global["Log"].Info("集群工作进程正在启动...");
        for (var nIndex = 0; nIndex < this.m_MaxWorkers; nIndex++) {
            this.m_Cluster.fork();
        }
    };

    Stop() {
        if (this.m_NeedKill) {
            g_Global["Log"].Info("正在停止集群所有进程，稍后在试...");
            return;
        }
        if (this.m_WorkerNum === 0) {
            g_Global["Log"].Info("集群已停止.");
            return;
        }
        g_Global["Log"].Info("集群正在停止所有工作进程...");
        this._KillAllWorker();
    };

    Shutdown(timeout) {
        this.Stop();
        if (timeout >= 0) {
            g_Global["Log"].Info("集群将在: " + (timeout / 1000) + " 秒后退出.");
            setTimeout(function () {
                g_Global["Log"].Warn("集群退出超时!");

                setTimeout(function () {
                    Process.exit(-1);
                }, 1000);
            }, timeout);
        }
    };

    // To Do : restart
};

exports.TCMaster = TCMaster;

