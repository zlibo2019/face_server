var Process = require('process');
var g_Global = require('./Global');
var Config = require('./LoadConfig');
var Logger = require('./Logger');
var AMQP = require('amqp');
var CO = require('co');
var MQSubscriber = require('../Project/subscriber');
var mysql = require('mysql');
var common = require('../Project/serviceCommon');
const express = require('express')
const app = express();
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.json({ strict: false })


var g_Config;
var g_ConfigPath = './Config/config.json';

var Log = new Logger.Logger();

var ConfigParse = function (ConfigBuf) {
    g_Config = JSON.parse(ConfigBuf);
    return true;
}

function LoadConfig() {
    return new Promise((resolve, reject) => {
        var LoadRes = Config.LoadConfig(g_ConfigPath, ConfigParse);
        if (LoadRes !== "") {
            Log.Err(LoadRes);
            Process.exit(-1);
        }
        g_Global["Config"] = g_Config;
        resolve();
    });
}

function ConnectToMQ() {
    g_Global.MQ = null;
    var connectOptions = {
        host: g_Config.RabbitMQ.Host,
        port: g_Config.RabbitMQ.Port,
        login: g_Config.RabbitMQ.User,
        password: g_Config.RabbitMQ.PWD,
        connectionTimeout: g_Config.RabbitMQ.ConnectionTimeout,
        authMechanism: g_Config.RabbitMQ.AuthMechanism,
        vhost: g_Config.RabbitMQ.VHost,
        noDelay: g_Config.RabbitMQ.NoDelay,
        ssl: {
            enabled: g_Config.RabbitMQ.SSL.enabled
        }
    };

    return new Promise((resolve, reject) => {
        var connection = AMQP.createConnection(connectOptions);

        connection.on('error', (e) => {
            if (g_Global.MQ === null) {
                return reject(e);
            }
            g_Global.Log.Err("Error from amqp :" + e);
        });

        connection.on('ready', () => {
            g_Global.MQ = connection;
            resolve(connection);
        })
    });
}



// function CreatePool_mysql() {
//     g_Global.POOL = null;
//     var connectOptions = {
//         queueLimit: g_Config.MySQL.connectionLimit,
//         host: g_Config.MySQL.Host,
//         port: g_Config.MySQL.Port,
//         user: g_Config.MySQL.User,
//         password: g_Config.MySQL.PWD,
//         database: g_Config.MySQL.DBName
//     };
//     return new Promise((resolve, reject) => {
//         var pool = mysql.createPool(connectOptions);
//         g_Global.POOL = pool;
//         resolve(pool);
//     });
// }

// function CreateConnection_mysql() {
//     const dbInstance = new Db({
//         host: g_Config.MySQL.Host,
//         user: g_Config.MySQL.User,
//         password: g_Config.MySQL.PWD,
//         database: g_Config.MySQL.DBName
//     })
//     g_Global.connection = dbInstance;
// }




// mq参数配置
function initMQ() {
    return CO(function* () {
        var Subscriber = new MQSubscriber(g_Global.MQ);
        yield Subscriber.Init(g_Config.Subscriber);

        g_Global.Subscriber = Subscriber;

        // var Publisher = new MQPublisher(g_Global.MQ);
        // yield Publisher.Init(g_Config.Publisher);
        // g_Global.Publisher = Publisher;
    }).catch((err) => {
        g_Global.Log.Err("initMQ failed : " + err);
    });
}



function restful_server() {

    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

    app.post('/kaocher/sycPersonsForYunan', urlencodedParser, function (req, res) {
        return CO(function* () {
            let body = req.body;
            let jResult;
            if (body.sid === 'icc.user.update') {
                jResult = yield common.postUser(body);
            } else if (body.sid === 'icc.user.delete') {
                jResult = yield common.deleteUser(body);
            }
            res.end(JSON.stringify(jResult));
        }).catch((err) => {
            console.log(err);
        });

    });

    app.listen(g_Global["Config"].listenPort);
}



function InitGlobal() {
    g_Global["Log"] = Log;
    return CO(function* () {
        Log.Info("Load config...");
        yield LoadConfig();
        Log.Info("Load config succeed.");
        Log.Info("Connect to RabbitMQ...");
        yield ConnectToMQ();
        Log.Info("Connect to RabbitMQ succeed.");
        // yield CreatePool_mysql();
        Log.Info("create mysql connection succeed.");
        yield initMQ();
        Log.Info("init mq succeed.");
        // 存记录
        g_Global.map = new Map();

        restful_server();

    }).catch((err) => {
        g_Global.Log.Err("Init Global failed : " + err);
    });
}

exports.InitGlobal = InitGlobal;
