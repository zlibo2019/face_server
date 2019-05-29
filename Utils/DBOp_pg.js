var g_Global = require('./Global');
var CO = require('co');

function execsql(conn, query) {
    var Con = null;
    return CO(function* () {
        if (null === conn) {
            Con = yield g_Global.POOL.connect();
        } else {
            Con = conn;
        }
        var Res = yield Con.query(query);
        if (null !== Con && null === conn) {
            Con.release();
        }
        return Res;
    }).catch(function (err) {
        if (null !== Con && null === conn) {
            Con.release();
        }
        g_Global.Log.Err('execsql err:' + query.text + ' ' + err);
        return null;
    });
}


exports.execsql = execsql;

