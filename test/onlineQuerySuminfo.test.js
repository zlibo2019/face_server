var onlineQuerySuminfoInit = require('../Project/onlineQuerySuminfoInit.js');
var updateCardinfor = require('../Project/updateCardinfor.js');
var querySynInfo = require('../Project/querySynInfo.js');

var should = require('should');
var CO = require('co');
var g_Global = require('../Utils/Global');   //!!!!
var InitGlobal = require('../Utils/InitGlobal');
var DBOp_pg = require('../Utils/DBOp_pg');

describe('终端机查询', function () {
  it('终端机查询', function () {
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
      arg_in.media_id = 148;
      arg_in.card_serial = 8518;
      arg_in.card_trad_serial = 1;
      arg_in.card_number = '75E9AB5E';
      arg_in.device_id = 10001;
      arg_in.trad_sj = new Date().toLocaleString();

      arg_in.resultCode = 0;
      arg_in.resultMessage = '';



      arg_out = yield onlineQuerySuminfoInit.onlineQuerySuminfoInit(arg_in);
      g_Global.Log.Info(arg_out.resultMessage);
      arg_out.should.be.an.instanceof(Object);
      arg_out.should.have.property("resultCode");
      arg_out.should.have.property("resultMessage");
      arg_out.resultCode.should.equal(0);
      g_Global.Log.Info("onlineQuerySuminfoInit pass");
      if (arg_out.resultCode > 0) return;

      arg_out = yield updateCardinfor.update_card_dynamic(arg_in);
      g_Global.Log.Info(arg_out.resultMessage);
      arg_out.should.be.an.instanceof(Object);
      arg_out.should.have.property("resultCode");
      arg_out.should.have.property("resultMessage");
      arg_out.resultCode.should.equal(0);
      g_Global.Log.Info("update_card_dynamic pass");
      if (arg_out.resultCode > 0) return;

      arg_out = yield querySynInfo.querySynInfo(arg_in);
      g_Global.Log.Info(arg_out.resultMessage);
      arg_out.should.be.an.instanceof(Object);
      arg_out.should.have.property("resultCode");
      arg_out.should.have.property("resultMessage");
      arg_out.resultCode.should.equal(0);
      // arg_out.cash_amt.should.equal(10000);
      // arg_out.total_sub_amt.should.equal(1000);
      // arg_out.sub_info.should.equal('1000|20000101|20171203');

      // console.log(arg_out.user_info);
      // console.log(arg_out.sub_info);
      // console.log(arg_out.sum_info);

      g_Global.Log.Info("querySynInfo pass");
      if (arg_out.resultCode > 0) return;
    });
  });
});









