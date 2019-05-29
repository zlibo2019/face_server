var path = require('path');         // 解析路径
var fs = require('fs');           // file stream

var g_ParseErr = "";

var ReadAndParseConfig = function (ConfigPath, ParseFunc) {
    var Res = true;
    var normalPath = path.normalize(ConfigPath);
    if (!fs.existsSync(normalPath)) {
        g_ParseErr = "Not found: " + normalPath;
        Res = false;
    } else {
        var err;
        var file = fs.readFileSync(normalPath, "utf8", err);
        if (err) {
            g_ParseErr = "Read failed : " + normalPath + ". Error : " + err + ".";
            Res = false;
        } else {
            Res = ParseFunc(file);
        }
    }

    return Res;
}

function LoadConfigSync(path, ParseFunc) {
    ReadAndParseConfig(path, ParseFunc);
    return g_ParseErr;
}

exports.LoadConfig = LoadConfigSync;
