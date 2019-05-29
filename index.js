var CO = require('co');
var g_Global = require('./Utils/Global');
var InitGlobal = require('./Utils/InitGlobal');
var common = require('./Project/serviceCommon')


function Start() {
    return CO(function* () {

        yield InitGlobal.InitGlobal();

        // 开始订阅
        g_Global.Subscriber.Subscribe(
            (message, headers, deliveryInfo, messageObject) => {
                return CO(function* () {
                    // var len = message.length;
                    console.log(message.data.toString());
                    let sData = message.data.toString();
                    let data = JSON.parse(sData);

                    if (undefined !== data.inStr) {
                        let sRecord = sData;
                        let record = data;
                        let arrField = record.inStr.split(",");
                        let devId = arrField[7];
                        g_Global.map.set(devId, sRecord);
                    } else if (undefined !== data.path) {
                        let photoPath = data.path;
                        let devId =common. getDevIdFromPath(photoPath);
                        let sRecord = g_Global.map.get(devId);
                        if(undefined !== sRecord && null !== sRecord){
                            let record = JSON.parse(sRecord);
                            let jResult = yield common.postRecord(record);
                            if (jResult.code !== '00000000') {
                                console.log(jResult.message);
                            }
                        }
                    }
                    messageObject.acknowledge();
                }).catch((err) => {
                    // messageObject.acknowledge();
                    g_Global.Log.Err("Subscribe failed : " + err);
                });
            }, { ack: true, prefetchCount: 1 }
        );
    }).catch((err) => {
        // messageObject.acknowledge();
        g_Global.Log.Err("Subscribe failed : " + err);
    });
}

Start();
