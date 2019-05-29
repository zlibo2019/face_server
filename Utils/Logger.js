var Log4js = require('log4js');
// var LogPath = '../Config/Log.json';

function Logger() {
    var LogPath = './Config/Log.json';
    Log4js.configure(LogPath);

    this.m_LogConsole = Log4js.getLogger('console');
    this.m_LogDebug = Log4js.getLogger('LogDebug');
    this.m_LogErr = Log4js.getLogger('LogErr');
    this.m_LogInfo = Log4js.getLogger('LogInfo');
    this.m_LogWarn = Log4js.getLogger('LogWarn');
}

Logger.prototype = {
    constructor: Logger,
    Info: function (msgInfo) {
        this.m_LogConsole.info(msgInfo);
        this.m_LogInfo.info(msgInfo);
    },
    Err: function (msgErr) {
        this.m_LogConsole.error(msgErr);
        this.m_LogErr.error(msgErr);
    },
    Debug: function (msgDebug) {

        this.m_LogConsole.debug(msgDebug);
        this.m_LogDebug.debug(msgDebug);
    },
    Warn: function (msgWarn) {
        this.m_LogConsole.warn(msgWarn);
        this.m_LogWarn.warn(msgWarn);
    }
}

exports.Logger = Logger;
