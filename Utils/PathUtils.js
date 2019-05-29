'use strict';

var Path = require('path');
var FS = require('fs');
var Process = require('process');

function CheckFileExists(filePath) {
    if (typeof (filePath) !== 'string'
        || filePath === '')
        return false;

    var AbsolutePath = filePath;
    if (Path.isAbsolute(filePath) === false) {
        var BasePath = Process.cwd();
        AbsolutePath = Path.join(BasePath, filePath);
    }

    if (FS.existsSync(AbsolutePath) === true)
        return true;
    return false;
}

function GetAbsolutePath(filePath) {
    if (typeof (filePath) !== 'string'
        || filePath === '')
        return "";

    var AbsolutePath = filePath;
    if (Path.isAbsolute(filePath) === false) {
        var BasePath = Process.cwd();
        AbsolutePath = Path.join(BasePath, filePath);
    }

    if (FS.existsSync(AbsolutePath) === true)
        return AbsolutePath;
    return "";
}

exports.CheckFileExists = CheckFileExists;
exports.GetAbsolutePath = GetAbsolutePath;

