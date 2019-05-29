var g_Global = require('../Utils/Global');
var CO = require('co');
var TypeUtils = require('../Utils/TypeUtils');

class MQSubscriber {
    constructor(channel) {
        this.m_Channel = channel;
        this.m_Exchange = null;
        this.m_Queue = null;
    }

    /**
     * 
     * @param {*} Options 
     * Option = {
     *  Queue : {
     *      name : 'xxx',                           // Queue的名字
     *      routing : 'xxx',                        // 路由Key,
     *      Options : {
     *          passive : true/false(default),          // true,只检查不创建
     *          durable : true/false(default),          // true,开启持久化
     *          exclusive   : true/false(default),      // true,私有队列
     *          autoDelete  : false/true(default),      // true,在没有消费者使用后，自动删除
     *          noDeclare   : true/false(default),      // true,用来删除同名的队列
     *          arguments   : map,                      // 
     *          closeChannelOnUnsubscribe   : true/false(default),  // true,在调用unsubscri之后，关闭Channel
     *      }
     *  },  // requierd
     *  Exchange : {
     *      name : 'xx',                                // Exchange的名字
     *      Options : {
     *          type : 'direct'/'fanout'/'topic'(default),  // exchange的类型
     *          passive : true/false(default),              // true,只检查不创建
     *          durable : true/false(default),              // true,开启持久化
     *          autoDelete  : false/true(default),          // true,在没有queues绑定之后，自动删除
     *          noDeclare   : true/false(default),          // true,用来删除同名的交换器
     *          confirm     : true/false(default),          // true,开启confirm模式（手动确认）
     *          arguments   : map,                          // 
     *      }   // undefined(default)
     *  }   // requierd
     * } 
     */
    Init(Options) {
        var self = this;
        return CO(function* () {
            if (TypeUtils.isEmptyObj(self.m_Channel) === true) {
                throw 'Invalid channel';
            }
            if (TypeUtils.isEmptyObj(Options.Queue) === true
                || TypeUtils.isEmptyObj(Options.Exchange) === true
                || TypeUtils.isString(Options.Exchange.name) === false) {
                throw 'Invalid options';
            }

            if (TypeUtils.isEmptyObj(Options.Exchange.Options) === false) {
                self.m_Exchange = yield new Promise(function (resolve, reject) {
                    self.m_Channel.exchange(Options.Exchange.name,
                        Options.Exchange.Options, (exchange) => {
                            resolve(exchange);
                        });
                });
            }

            self.m_Queue = yield new Promise((resolve, reject) => {
                self.m_Channel.queue(Options.Queue.name,
                    Options.Queue.Options, (queue) => {
                        resolve(queue);
                    })
            });
            yield new Promise((resolve, reject) => {
                self.m_Queue.bind(Options.Exchange.name, Options.Queue.routing, (queue) => {
                    resolve();
                })
            });
        })
    }

    Subscribe(CB, Options) {
        if (TypeUtils.isEmptyObj(this.m_Queue) === true) {
            throw 'No init';
        }

        var self = this;
        self.m_Queue.subscribe(Options, (message, headers, deliveryInfo, messageObject) => {
            if (TypeUtils.isFunction(CB) === true) {
                CB(message, headers, deliveryInfo, messageObject)
            }
        });
    }

    Shift() {
        if (TypeUtils.isEmptyObj(this.m_Queue) === true) {
            throw 'No init';
        }

        this.m_Queue.shift();
    }
}

module.exports = MQSubscriber;
