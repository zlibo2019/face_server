var http = require('http');
var equal = require('assert').equal;
var CO = require('co');
var mysql = require('mysql');
var g_Global = require('../Utils/Global');
var moment = require('moment')
var fs = require("fs");
var path = require('path');



function readPhotofile(photoPath) {
    let base64 = '';
    let data = fs.readFileSync(photoPath);
    base64 = data.toString("base64");
    return base64;
}

// function readPhotofile(photoPath) {
//     setTimeout(() => {
//       let sResult =  _readPhotofile(photoPath);
//       if (sResult === ''){
//           readPhotofile(photoPath);
//       }
//     }, 100);
// }


function getDevIdFromPath(photoPath) {
    let arrDir = photoPath.split("\\");
    let len = arrDir.length;
    let devId = arrDir[len - 3];
    return devId;
}

function postRecord(record) {
    let jResult = {
        code: "00000000",
        message: "success",
    };
    return CO(function* () {
        let outInt = record.outInt;

        let arrField = record.inStr.split(",");
        let photoName = arrField[6];
        let dev_id = arrField[7];
        let id = Number(arrField[0]);
        var arrResult;
        arrResult = yield getUserIdById(id);
        let pin = '0';
        if (undefined !== arrResult) {
            pin = arrResult[0].user_id;
        }
        let date = moment().format("YYYY-MM-DD")
        let root = path.resolve(__dirname, '..');
        let photoPath = `${root}\\record_photo\\${dev_id}\\${date}\\${photoName}.jpg`;


        let base64 = '';
        base64 = readPhotofile(photoPath);
        if ('' === base64) {
            jResult.code = "00000001";
            jResult.message = 'get photo fail';
            return jResult;
        }


        let log = {
            date: arrField[1],
            verify_type: 4096,
            pin: pin,
            io_flag: outInt,
            picture: base64,
            status: 0
        }
        let postData = {};
        postData.sn = dev_id;
        postData.sid = `device.data.upload.checklog`;
        let params = {};
        params.logs = [log];
        let payload = {};
        payload.params = params;
        postData.payload = payload;

        // console.log('post data:' + JSON.stringify(postData));

        let result = yield new Promise(function (resolve, reject) {

            var options = {
                host: g_Global["Config"].connectIp,
                port: g_Global["Config"].connectPort,
                path: '/web/WebUser/SyncHeart',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8',
                    'Content-Length':
                        Buffer.byteLength(JSON.stringify(postData), 'utf8')
                },
                json: true,
                // body:postData,
            };

            var req = http.request(options, function (res) {
                // console.log('STATUS: ' + res.statusCode);
                // equal(200, res.statusCode);
                // console.log('HEADERS: ' + JSON.stringify(res.headers));
                // res.setEncoding('utf8');
                res.on('data', function (body) {
                    resolve(body);
                    // console.log('BODY: ' + body);
                });
            });
            // console.log(JSON.stringify(postData));
            req.write(JSON.stringify(postData));
            req.on('error', function (e) {
                console.log('problem with request: ' + e.message);
                reject(e);
            });
            req.end();
        })
        // console.log('res11111111111111' + JSON.stringify(result));
        return jResult;
    }).catch((err) => {
        jResult.code = "00000001";
        jResult.message = err;
        return jResult;
    });
}





// 接收档案 
function postUser(body) {

    // console.log('userInfo:' + JSON.stringify(body));
    let dev_ids = body.payload.params.sns;
    let arrDev = dev_ids.split(",");
    let arrUser = body.payload.params.users;
    let jResult = {
        code: "00000000",
        message: "添加成功！",
    };

    return CO(function* () {
        var connection = mysql.createConnection({
            host: g_Global["Config"].MySQL.Host,
            user: g_Global["Config"].MySQL.User,
            password: g_Global["Config"].MySQL.PWD,
            database: g_Global["Config"].MySQL.DBName
        });

        connection.connect();

        // 更新人员

        for (let i = 0; i < arrUser.length; i++) {
            let userId = arrUser[i].identity_number;
            // let arrResult = yield getIdByUserId(userId);
            // let id = 0;
            // if (undefined !== arrResult) {
            //     id = Number(arrResult[0].id);
            // }
            let imgData = arrUser[i].picture;
            let root = path.resolve(__dirname, '..');
            let id = 0;

            // 更新人员档案
            yield new Promise((resolve, reject) => {
                let userName = arrUser[i].name;
                let userNo = arrUser[i].pin;

                // let param = { id: arrUser[i].id, user_id: arrUser[i].user_id, user_name: arrUser[i].user_name };
                sql = `insert INTO dt_user (user_id,user_no,user_name) VALUES('${userId}', '${userNo}', '${userName}') 
                ON DUPLICATE KEY 
                UPDATE user_no=VALUES(user_no),user_name = VALUES(user_name)`;

                connection.query(sql, function (error, results, fields) {
                    if (error) {
                        reject(error);
                    };

                    id = results.insertId;
                    if (undefined === id || null === id) {
                        id = 0;
                    }
                    resolve();
                });
            });

            if (id === 0) {
                let arrResult = yield getIdByUserId(userId);
                if (undefined !== arrResult) {
                    id = arrResult[0].id;
                }
            }
            let dir = (Math.floor(id / 1000));
            let photoPath = `${root}\\photo\\${dir}`;
            let fileName = `${photoPath}\\${id}.jpg`;


            // 创建文件夹
            yield new Promise((resolve, reject) => {
                fs.stat(photoPath, (err, stats) => {
                    if (err) {
                        fs.mkdir(photoPath, err => {
                            if (err) {
                                console.log(err);
                            }
                            resolve();
                        })
                    }
                    resolve();
                })
            })

            // 保存照片
            yield new Promise((resolve, reject) => {
                var base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
                var dataBuffer = Buffer.from(base64Data, 'base64');
                fs.writeFile(fileName, dataBuffer, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
                resolve();
            })

        }


        // 设置白名单、下发增量

        for (let i = 0; i < arrDev.length; i++) {
            let curDev = arrDev[i];
            for (let j = 0; j < arrUser.length; j++) {
                let userId = arrUser[j].identity_number;

                // 设备人员关系 
                yield new Promise((resolve, reject) => {
                    sql = `insert INTO dev_user (dev_id,user_id) VALUES(${curDev},'${userId}') 
                    ON DUPLICATE KEY
                    update dev_id = VALUES(dev_id),user_id = VALUES(user_id)`;

                    connection.query(sql, function (error, results, fields) {
                        if (error) {
                            reject(error);
                        };
                        resolve();
                    });
                });

                let arrResult = yield getIdByUserId(userId);
                let id = 0;
                if (undefined !== arrResult) {
                    id = arrResult[0].id;
                }
                // 下发增量 
                yield new Promise((resolve, reject) => {
                    let userNo = arrUser[j].pin;
                    let userName = arrUser[j].name;
                    let userCard = arrUser[j].card_number;
                    let userBirthday = arrUser[j].birth;
                    let str = `1,1,${id},${userNo},${userName},${userCard},0000000000,1,123456,${userBirthday},0,4`

                    let param = { jdev_id: curDev, juser_id: id, jdodata: 134217728, jdata_str: str };
                    sql = 'INSERT INTO jreal_update_1 SET ?';
                    connection.query(sql, param, function (error, results, fields) {
                        if (error) {
                            reject(error);
                        };
                        resolve();
                    });
                });
            }
        }
        connection.end();
        return jResult;
    }).catch((err) => {
        jResult.code = '00000001';
        jResult.message = err;
        return jResult;
    });
}



// 删除档案 
function deleteUser(body) {
    let jResult = {
        code: "00000000",
        message: "success",
    };
    let devId = body.payload.params.sns;
    let arrUserId = body.payload.params.pins;


    return CO(function* () {
        var connection = mysql.createConnection({
            host: g_Global["Config"].MySQL.Host,
            user: g_Global["Config"].MySQL.User,
            password: g_Global["Config"].MySQL.PWD,
            database: g_Global["Config"].MySQL.DBName
        });

        connection.connect();

        // 下发增量
        for (let j = 0; j < arrUserId.length; j++) {
            let userId = arrUserId[j];
            //删除设备人员关系 
            yield new Promise((resolve, reject) => {
                sql = `delete from dev_user where dev_id = ${devId} and user_id = ${userId}`;
                connection.query(sql, function (error, results, fields) {
                    if (error) {
                        reject(error);
                    };
                    resolve();
                });
            });

            let arrResult = yield getIdByUserId(userId);
            let id = 0;
            if (undefined !== arrResult) {
                id = arrResult[0].id;
            }
            // 下发增量 
            yield new Promise((resolve, reject) => {
                let str = `1,3,${id}`

                let param = { jdev_id: devId, juser_id: id, jdata_str: str };
                sql = 'INSERT INTO jreal_update_1 SET ?';
                connection.query(sql, param, function (error, results, fields) {
                    if (error) {
                        reject(error);
                    };
                    resolve();
                });
            });
        }


        connection.end();
        return jResult;
    }).catch((err) => {
        jResult.code = '00000001';
        jResult.message = 'fail';
        return jResult;
    });
}


function getUserIdById(id) {
    let res = new Promise(function (resolve, reject) {
        var connection = mysql.createConnection({
            host: g_Global["Config"].MySQL.Host,
            user: g_Global["Config"].MySQL.User,
            password: g_Global["Config"].MySQL.PWD,
            database: g_Global["Config"].MySQL.DBName
        });
        connection.connect();
        // 所有设备下发
        sql = `select user_id from dt_user where id = ${id}`;
        connection.query(sql, function (error, results, fields) {
            if (error) {
                reject([]);
            }
            resolve(results);
        });
        connection.end();
    })
    return res;
}

function getIdByUserId(userId) {
    let res = new Promise(function (resolve, reject) {
        var connection = mysql.createConnection({
            host: g_Global["Config"].MySQL.Host,
            user: g_Global["Config"].MySQL.User,
            password: g_Global["Config"].MySQL.PWD,
            database: g_Global["Config"].MySQL.DBName
        });
        connection.connect();
        // 所有设备下发
        sql = `select id from dt_user where user_id = ${userId}`;
        connection.query(sql, function (error, results, fields) {
            if (error) {
                reject([]);
            }
            resolve(results);
        });
        connection.end();
    })
    return res;
}




exports.postUser = postUser;
exports.postRecord = postRecord;
exports.deleteUser = deleteUser;
exports.getDevIdFromPath = getDevIdFromPath;