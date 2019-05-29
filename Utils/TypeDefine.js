'use strict';

var TinyType = {
    ControlMark : {
        CM_Continue : 0,
        CM_OK       : 1,
        CM_Err      : 2
    },

    WorkerState : {
        NULL : 0,
        Fork : 1,
        Online : 2,
        Listening : 3,
        Disconnect : 4,
        Exit : 5
    }
};

module.exports = TinyType;
