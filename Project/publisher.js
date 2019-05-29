var g_Global        = require('../Utils/Global');
var CO              = require('co');
// var Events          = require('events');
var TypeUtils       = require('../Utils/TypeUtils');

class MQPublisher{
    constructor(channel) {
        this.m_Channel  = channel;
        this.m_Exchange = null;
        this.m_Queue    = null;
    }

    /**
     * 初始化发布者
     * 
     * Options中的Exchange是必填项，因为发布者要将消息发不到Exchange上
     * Queue是可选项，如果需要发布者来创建Queue来保证数据不丢失，则需要Queue配置
     * 
     * @param {*} Options
     * Option = {
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
     *      }
     *  },  // requierd
     *  Queue : {
     *      name : 'xxx',                           // Queue的名字
     *      routing : 'xxx',                        // 路由Key
     *      Options : {
     *          passive : true/false(default),          // true,只检查不创建
     *          durable : true/false(default),          // true,开启持久化
     *          exclusive   : true/false(default),      // true,私有队列
     *          autoDelete  : false/true(default),      // true,在没有消费者使用后，自动删除
     *          noDeclare   : true/false(default),      // true,用来删除同名的队列
     *          arguments   : map,                      // 
     *          closeChannelOnUnsubscribe   : true/false(default),  // true,在调用unsubscri之后，关闭Channel
     *      }
     *  }   // undefined(default)
     * } 
     * 
        // {
        //     "type" : "console",
        //     "category" : "console"
        // },
     */
    Init(Options) {
        var self    = this;
        return CO(
            function *() {
            if (TypeUtils.isEmptyObj(self.m_Channel) === true) {
                throw 'Invalid channel';
            }
            if (TypeUtils.isEmptyObj(Options.Exchange) === true) {
                throw 'Invalid options';
            }

            self.m_Exchange = yield new Promise((resolve, reject) => {
                self.m_Channel.exchange(Options.Exchange.name,
                    Options.Exchange.Options,
                    (exchange) => {
                        resolve(exchange);
                });
            });         // 创建Exchange

            if (TypeUtils.isEmptyObj(Options.Queue) === false) {
                self.m_Queue    = yield new Promise((resolve, reject) => {
                    self.m_Channel.queue(Options.Queue.name,
                        Options.Queue.Options,
                        (queue) => {
                            resolve(queue);
                    })
                });     // 如果有Queue的配置，就创建一个Queue
                yield new Promise((resolve, reject) => {
                    self.m_Queue.bind(Options.Exchange.name, Options.Queue.routing, (queue) => {
                        resolve();
                    });
                });     // Queue绑定Exchange
            }
        });
    }

    Publish(routingKey, msg, Options) {
        if (TypeUtils.isEmptyObj(this.m_Exchange) === true) {
            throw 'No init';
        }
        var self = this;
        return CO(function *() {
            yield new Promise((resolve, reject) => {
                self.m_Exchange.publish(routingKey, msg, Options, (res, err) => {
                    // console.log(res);
                    if (res === true) {
                        return reject(err);
                    }
                    resolve();
                });
            });
        });
    }
}

module.exports  = MQPublisher;
