function isEmptyObj(obj) {
    return (obj === undefined || obj === null) ? true : false;
}

function isEmptyStr(str) {
    return (str === undefined || str === null || str === "") ? true : false;
}

function isArray(obj) {
    return Object.prototype.toString.call(obj)  === '[object Array]';
}

function isNumber(obj) {
    return Object.prototype.toString.call(obj)  === '[object Number]';
}

function isString(obj) {
    return Object.prototype.toString.call(obj)  === '[object String]';
}

function isNull(obj) {
    return Object.prototype.toString.call(obj)  === '[object Null]';
}

function isUndefined(obj) {
    return Object.prototype.toString.call(obj)  === '[object Undefined]';
}

function isObject(obj) {
    return Object.prototype.toString.call(obj)  === '[object Object]';
}

function isFunction(obj) {
    return Object.prototype.toString.call(obj)  === '[object Function]';
}

function checkType(obj, Type) {
    return obj instanceof Type;
}

exports.isEmptyObj      = isEmptyObj;
exports.isEmptyStr      = isEmptyStr;
exports.isArray         = isArray;
exports.isNumber        = isNumber;
exports.isString        = isString;
exports.isNull          = isNull;
exports.isUndefined     = isUndefined;
exports.isObject        = isObject;
exports.isFunction      = isFunction;
exports.checkType       = checkType;
