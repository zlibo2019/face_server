
var offlineUploadInit = require('../Project/offlineUploadInit.js');
var receiveDaySub = require('../Project/receiveDaySub.js');
var offlineUpload = require('../Project/offlineUpload.js');
var offlineRecordStateUpdate = require('../Project/offlineRecordStateUpdate.js');

var offlineErrorRecordDeal = require('../Project/offlineErrorRecordDeal.js');
var should = require('should');
var CO = require('co');
var g_Global = require('../Utils/Global');   //!!!!
var InitGlobal = require('../Utils/InitGlobal');
var DBOp_pg = require('../Utils/DBOp_pg');

describe('离线记录上传', function () {
  it('扣款', function () {
    CO(function* () {
      yield InitGlobal.InitGlobal();

      // //charge_mode 0先扣补贴1只扣补贴2只扣现金3先扣现金
      // //初始化现金10000，补贴1000，离线限额500，只扣现金,主卡，扣款1
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
      arg_in.device_id = 10001;
      arg_in.trad_mode = 0;  //消费模式 1份/0金额
      arg_in.record_resource = 0;//0终端1卡片
      arg_in.trad_content = '1770883357,10001,amtpay,4B52909C,148,38,0,38,230,1,0';
      arg_in.trad_sj = new Date().toLocaleString();
      arg_in.media_id = 148;
      arg_in.card_serial = 8518;
      arg_in.card_number = '75E9AB5E';
      arg_in.card_trad_serial = 1;
      arg_in.card_record_upload_dev = 10001;
      arg_in.cash_money = 1;
      arg_in.sub_money = 1;
      arg_in.device_flow = 1;
      arg_in.merchant_account_id = 1;

      arg_in.resultCode = 0;
      arg_in.resultMessage = '';



      var arg_out = yield offlineUploadInit.offlineUploadInit(arg_in);
      arg_out.should.be.an.instanceof(Object);
      arg_out.should.have.property("resultCode");
      arg_out.should.have.property("resultMessage");
      arg_out.resultCode.should.equal(0);
      g_Global.Log.Info("offlineUploadInit pass");
      g_Global.Log.Info(arg_out.resultMessage);
      if (arg_out.resultCode > 0) return;

      arg_in = arg_out;

      if (arg_in.id === 0 && arg_in.day_sub_enable === 1 && arg_in.is_day_sub_receive === 0 && arg_in.user_type !== 51 && arg_in.total_sub_amt + arg_in.day_sub_amt < g_Global["Config"].MAX_SYS_LIMIT) {
        arg_out = yield receiveDaySub.receive_day_sub(arg_in);
        g_Global.Log.Info(arg_out.resultMessage);
        arg_out.should.be.an.instanceof(Object);
        arg_out.should.have.property("resultCode");
        arg_out.should.have.property("resultMessage");
        arg_out.resultCode.should.equal(0);
        g_Global.Log.Info("receive_day_sub pass");
        if (arg_out.resultCode > 0) return;
      }

      if (arg_in.id === 0) {
        arg_in = arg_out;
        arg_out = yield offlineUpload.offlineUpload(arg_in);
        g_Global.Log.Info(arg_out.resultMessage);
        arg_out.should.be.an.instanceof(Object);
        arg_out.should.have.property("resultCode");
        arg_out.should.have.property("resultMessage");
        arg_out.resultCode.should.equal(0);
        // arg_out.cash_amt_after.should.equal(9999);
        // arg_out.total_sub_amt_after.should.equal(999);
        g_Global.Log.Info("offlineUpload pass");
        if (arg_out.resultCode > 0) return;
      }

      arg_in = arg_out;
      if (arg_in.id > 0 && arg_in.db_trad_content === arg_in.trad_content) {
        arg_out = yield offlineRecordStateUpdate.offline_record_state_update(arg_in);
        g_Global.Log.Info(arg_out.resultMessage);
        arg_out.should.be.an.instanceof(Object);
        arg_out.should.have.property("resultCode");
        arg_out.should.have.property("resultMessage");
        arg_out.resultCode.should.equal(0);
        g_Global.Log.Info("offline_record_state_update pass");
        if (arg_out.resultCode > 0) return;
      }

      arg_in = arg_out;
      if (arg_in.id > 0 && arg_in.db_trad_content !== arg_in.trad_content) {
        arg_out = yield offlineErrorRecordDeal.offlineErrorRecordDeal(arg_in);
        g_Global.Log.Info(arg_out.resultMessage);
        arg_out.should.be.an.instanceof(Object);
        arg_out.should.have.property("resultCode");
        arg_out.should.have.property("resultMessage");
        arg_out.resultCode.should.equal(0);
        g_Global.Log.Info("offlineErrorRecordDeal pass");
        if (arg_out.resultCode > 0) return;
      }
    });
  });

  // it('余额判断', function () {
  //   CO(function* () {
  //      //初始化现金10000，补贴1000，离线限额500，先扣补贴,副卡，扣款10501
  //     var arg_in = {};
  //     arg_in.device_id = 10001;
  //     arg_in.card_serial = 8475;
  //     arg_in.card_number = 'F97350B6';
  //     arg_in.limit_pwd = '';
  //     arg_in.media_id = 148;
  //     arg_in.money = 10501;
  //     arg_in.trad_mode = 0;  //消费模式 1份/0金额
  //     arg_in.trad_content = '1770883357,10001,amtpay,4B52909C,148,8289,0,3570,230, ,';
  //     arg_in.session_id = 1770883357;
  //     arg_in.trad_sj = new Date('2017-09-26 20:05').toLocaleString();
  //     arg_in.trad_id = 34160;
  //     arg_in.card_trad_serial = 1;
  //     arg_in.resultCode = 0;
  //     arg_in.resultMessage = '';
  //     arg_in.bz = "hahaha";
  //     arg_in.user_unit_id = 1;
  //     arg_in.trad_unit_id = 1;

  //     var arg_out = yield onlineTradInit.onlineTradInit(arg_in);
  //     arg_out.should.be.an.instanceof(Object);
  //     arg_out.should.have.property('total_sub_amt_before');
  //     arg_out.should.have.property("resultCode");
  //     arg_out.should.have.property("resultMessage");
  //     arg_out.resultCode.should.equal(0);
  //     g_Global.Log.Info("onlineTradInit pass");
  //     g_Global.Log.Info(arg_out.resultMessage);
  //     if (arg_out.resultCode > 0) return;

  //     arg_in = arg_out;
  //     arg_out = yield update_card_dynamic.update_card_dynamic(arg_in);
  //     arg_out.should.be.an.instanceof(Object);
  //     arg_out.should.have.property("resultCode");
  //     arg_out.should.have.property("resultMessage");
  //     arg_out.resultCode.should.equal(0);
  //     g_Global.Log.Info("update_card_dynamic pass");
  //     g_Global.Log.Info(arg_out.resultMessage);
  //     if (arg_out.resultCode > 0) return;

  //     arg_in = arg_out;
  //     arg_out = yield online_judge_access.online_judge_access(arg_in);
  //     arg_out.should.be.an.instanceof(Object);
  //     arg_out.should.have.property("resultCode");
  //     arg_out.should.have.property("resultMessage");
  //     arg_out.resultCode.should.equal(0);
  //     g_Global.Log.Info("online_judge_access pass");
  //     g_Global.Log.Info(arg_out.resultMessage);
  //     if (arg_out.resultCode > 0) return;

  //     arg_in = arg_out;
  //     arg_out = yield receive_day_sub.receive_day_sub(arg_in);
  //     arg_out.should.be.an.instanceof(Object);
  //     arg_out.should.have.property("resultCode");
  //     arg_out.should.have.property("resultMessage");
  //     arg_out.resultCode.should.equal(0);
  //     g_Global.Log.Info("receive_day_sub pass");
  //     g_Global.Log.Info(arg_out.resultMessage);
  //     if (arg_out.resultCode > 0) return;

  //     arg_in = arg_out;
  //     arg_out = yield online_judge_balance.online_judge_balance(arg_in);
  //     arg_out.should.be.an.instanceof(Object);
  //     arg_out.should.have.property("resultCode");
  //     arg_out.should.have.property("resultMessage");
  //     arg_out.resultCode.should.equal(6508);
  //     g_Global.Log.Info("online_judge_balance pass");
  //     g_Global.Log.Info(arg_out.resultMessage);
  //     if (arg_out.resultCode > 0) return;

  //     arg_in = arg_out;
  //     arg_out = yield onlineTrad.onlineTrad(arg_in);
  //     arg_out.should.be.an.instanceof(Object);
  //     arg_out.should.have.property("resultCode");
  //     arg_out.should.have.property("resultMessage");
  //     arg_out.resultCode.should.equal(0);
  //     g_Global.Log.Info("onlineTrad pass");
  //     g_Global.Log.Info(arg_out.resultMessage);
  //     if (arg_out.resultCode > 0) return;

  //     arg_in = arg_out;
  //     arg_out = yield querySynInfo.querySynInfo(arg_in);
  //     arg_out.should.be.an.instanceof(Object);
  //     arg_out.should.have.property("resultCode");
  //     arg_out.should.have.property("resultMessage");
  //     arg_out.resultCode.should.equal(0);
  //     g_Global.Log.Info("querySynInfo pass");
  //     g_Global.Log.Info(arg_out.resultMessage);
  //     if (arg_out.resultCode > 0) return;
  //   });
  // });
});









