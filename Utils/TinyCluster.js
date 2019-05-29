var Process = require('process');

var Master      = require('./Master.js');
var g_Global    = require('./Utils/Global');
var config      = require('./Utils/LoadConfig');
var Logger      = require('./Utils/Logger');

var g_Config;
var g_ConfigPath = './Cluster.cfg';

var Log = new Logger.Logger();

var ClusterConfigParse = function (ConfigBuf)
{
    try {
        g_Config = JSON.parse(ConfigBuf);
    } catch (error) {
        g_Global["Log"].Err("Load cluster config failed, " + error);
        Process.exit(-1);
    }

    return true;
}

function TinyClusterInit() {
    g_Global["Log"] = Log;
    g_Global["Log"].Info("集群主节点正在加载配置...");
    var LoadRes = config.LoadConfig(g_ConfigPath, ClusterConfigParse);
    if (LoadRes !== "")
    {
        Log.Err(LoadRes);
        Process.exit(-1);
    }
    g_Global["Config"] = g_Config;
    g_Global["Log"].Info("集群主节点加载配置完成.");
    g_Global["Log"].Info(g_Config);
    
    var master = new Master.TCMaster();
    master.Init();
    master.Start();
}

TinyClusterInit();

