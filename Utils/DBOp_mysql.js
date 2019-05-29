var g_Global = require('./Global');
var CO = require('co');
const Db = require('node-easy-mysql');
function sqlSelect(conn, sql) {
    var Con = null;
    return CO(function* () {
        if (null === conn) {
            Con = yield g_Global.POOL.getConnection();
        } else {
            Con = conn;
        }
        let res = yield Con.query(sql);
        console.log(JSON.stringify(res));
        if (null !== Con && null === conn) {
            Con.release();
        }
    }).catch((err) => {
        console.log(err);
    });
}


function sqlInsert(conn, sql, param) {
    return CO(function* () {
        if (null === conn) {
            g_Global.POOL.getConnection(function (err, connection) {
                if (err) throw err; // not connected!

                let query = connection.query(sql, param, function (error, results, fields) {
                    connection.release();
                    if (error) throw error;
                    // return results;
                });
            });
        } else {



            var query = conn.query(sql, param, function (error, results, fields) {

                if (error) throw error;
                // return results;
            });
            // console.log(query);
        }
    }).catch((err) => {
        console.log(err);
    });
}

// function sqlSelectEasy(conn, tableName) {
//     return CO(function* () {
//         // let aa = yield conn.table('dt_user').select();

//         const dbInstance = new Db({
//             host: "127.0.0.1",
//             user: "root",
//             password: "",
//             database: "scm_main"
//         })
//         yield dbInstance.table('dt_user').limit(1).select();

//         // let aa = yield dbInstance.table('dt_user').where().find();
//         console.log('asssssssssssssss' + JSON.stringify(aa));
//     }).catch((err) => {
//         console.log('eerrrrr:' + err);
//     });
// }


function sqlInsert(conn, sql, param) {
    return CO(function* () {
        if (null === conn) {
            g_Global.POOL.getConnection(function (err, connection) {
                if (err) throw err; // not connected!

                let query = connection.query(sql, param, function (error, results, fields) {
                    connection.release();
                    if (error) throw error;
                    // return results;
                });
            });
        } else {



            var query = conn.query(sql, param, function (error, results, fields) {

                if (error) throw error;
                // return results;
            });
            // console.log(query);
        }
    }).catch((err) => {
        console.log(err);
    });
}



exports.sqlSelect = sqlSelect;
exports.sqlInsert = sqlInsert;
// exports.sqlSelectEasy = sqlSelectEasy;
