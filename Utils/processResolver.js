var TypeUtils = require('./TypeUtils');
var CO = require('co');
var g_Global = require('./Global');

class ProcessResolver {
    constructor(resolveFile) {
        this.resolveFile = resolveFile;
        this.processArr = [];
        this.num = 0;
    }

    init() {
        var self = this;
        try {
            var config = require(self.resolveFile);
            var j = 0;
            for (var i = 0; i < config.sequence.length; i++) {

                // 前插处理 
                if (TypeUtils.isUndefined(config.sequence[i].FunctionName_front) === false && config.sequence[i].FunctionName_front.toString() !== '') {
                    var condition_front = config.sequence[i].Condition_front;
                    var path_front = config.sequence[i].Path_front;
                    var functionName_front = config.sequence[i].FunctionName_front;
                    self.processArr[j] = {};
                    self.processArr[j].condition = condition_front;
                    self.processArr[j].functionName = functionName_front;
                    self.processArr[j].fun = require(path_front)[functionName_front];
                    j++;
                }

                // 标准处理
                if (TypeUtils.isUndefined(config.sequence[i].FunctionName) === false && config.sequence[i].FunctionName.toString() !== '') {
                    var condition = config.sequence[i].Condition;
                    var path = config.sequence[i].Path;
                    var functionName = config.sequence[i].FunctionName;
                    self.processArr[j] = {};
                    self.processArr[j].condition = condition;
                    self.processArr[j].functionName = functionName;
                    self.processArr[j].fun = require(path)[functionName];
                    j++;
                }

                // 后插处理
                if (TypeUtils.isUndefined(config.sequence[i].FunctionName_end) === false && config.sequence[i].FunctionName_end.toString() !== '') {
                    var condition_end = config.sequence[i].Condition_end;
                    var path_end = config.sequence[i].Path_end;
                    var functionName_end = config.sequence[i].FunctionName_end;
                    self.processArr[j] = {};
                    self.processArr[j].condition = condition_end;
                    self.processArr[j].functionName = functionName_end;
                    self.processArr[j].fun = require(path_end)[functionName_end];
                    j++;
                }
            }
        }
        catch (ex) {
            g_Global.Log.Err("process init err:" + self.processArr[j].functionName + ":" + ex.message);
        }
    }

    run(arg_in) {
        var self = this;
        var arg_out = {};
        var functionName;
        arg_out.resultCode = 0;
        arg_out.resultMessage = '';
        var conn = null;
        return CO(function* () {
            var sInterval = '';
            conn = yield g_Global.POOL.connect();
            self.num++;
            for (let i = 0; i < self.processArr.length; i++) {
                var process = self.processArr[i];
                functionName = process.functionName;

                // 如果执行条件非空，并且不满足执行条件，则continue下一个
                if (
                    TypeUtils.isEmptyStr(process.condition.run) === false
                    && !eval(process.condition.run)
                ) {
                    continue;
                }

                var startTime = new Date().getTime();

                arg_out = yield process.fun(conn, arg_in);    // 执行模块

                var funInterval = new Date().getTime() - startTime;

                sInterval += ' ' + functionName + ':' + funInterval;
                arg_out.sInterval = sInterval;

                // 如果退出条件非空，并且满足退出条件，则退出
                if (
                    TypeUtils.isEmptyStr(process.condition.exit) === false
                    && eval(process.condition.exit)
                ) {
                    g_Global.Log.Err(process.functionName + " is exit because:" + arg_out.resultCode + ",message:" + arg_out.resultMessage + " account_id:" + arg_in.account_id);
                    if (null !== conn) {
                        conn.release();
                        self.num--;
                    }
                    return arg_out;
                }
                arg_in = arg_out;
                // g_Global.Log.Err(process.functionName + " success finish");
            }

            if (null !== conn) {
                conn.release();
                self.num--;
            }
            // g_Global.Log.Err('process end!');
            return arg_out;
        }).catch(function (err) {
            if (null !== conn) {
                conn.release();
                self.num--;
            }
            g_Global.Log.Err("processResolver failed : " + functionName + " " + err);
            arg_out.resultCode = 6904;
            arg_out.resultMessage = 'processResolver failed';
            return arg_out;
        })
    }
}
module.exports = ProcessResolver;