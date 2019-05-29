var onlineTradRecovery = require('../Project/onlineTradRecovery.js');

var should = require('should');
var CO = require('co');
var g_Global = require('../Utils/Global');   //!!!!
var InitGlobal = require('../Utils/InitGlobal');
var DBOp_pg = require('../Utils/DBOp_pg');

describe('冲正流程', function () {
  it('冲正', function () {
    CO(function* () {
      yield InitGlobal.InitGlobal();

      // //charge_mode 0先扣补贴1只扣补贴2只扣现金3先扣现金
      // //trad_type 51金额消费撤销 53计次消费撤销
      // //初始化现金10000，补贴1000，离线限额500，冲正现金消费1000，冲正补贴消费1000
      // var sqlStr = "update fin_account set cash_amt = 10000 where account_id = 38;"
      //   + "update fin_sub_account set sub_amt = 0 where account_id = 38;"
      //   + "update fin_sub_account set sub_amt = 1000 where account_id = 38 and sub_id = 36;"
      //   + "update fin_device set charge_mode = 2 where device_id = 10001;"
      //   + "update fin_crowd_master set day_sub_enable = 1,day_sub_amt = 0,day_limit_amt = 0,single_limit = 0,offline_limit_amt_enable = 1,offline_limit_amt = 500 where crowd_id = 1;"
      //   + "update fin_day_total set is_day_sub_receive = 0 where  account_id  = 38;"
      //   + "update fin_meal_total set is_fixed_meal_receive = 0 where  account_id  = 38;"
      //   + "update fin_rule_master set meal_sub_type = 0,meal_sub_enable = 1,meal_sub_amt = 0,meal_sub_rate = 0;"
      // yield DBOp_pg.execsql(null, sqlStr);

      var arg_in = {};
      arg_in.trad_type = 51;
      arg_in.session_id = 1770883357;
      arg_in.device_id = 10001;
      arg_in.card_serial = 8518;
      arg_in.money = 1;
      arg_in.trad_content = '1770883357,10001,amtpay,4B52909C,148,38,0,38,230,1,0';
      arg_in.trad_sj = new Date().toLocaleString();

      arg_in.resultCode = 0;
      arg_in.resultMessage = '';

      arg_out = yield onlineTradRecovery.onlineTradRecovery(arg_in);
      g_Global.Log.Info(arg_out.resultMessage);
      arg_out.should.be.an.instanceof(Object);
      arg_out.should.have.property("resultCode");
      arg_out.should.have.property("resultMessage");
      arg_out.resultCode.should.equal(0);
      g_Global.Log.Info("onlineTradRecovery pass");
      if (arg_out.resultCode > 0) return;
    });
  });
});









