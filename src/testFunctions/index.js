const {
  isString,
  isArray,
  looseEqual,
  URL_REGEX,
} = require('../util');

const CUSTOM = (val, f, obj) => f(val, obj);
const OPTIONAL = (val, state) => val === undefined && state === true;

const NUMBER = {
  min: (val, min) => val - min > 0,
  max: (val, max) => val - max < 0,
  equal: (val, equal) => val === equal,
  type: val => Number(val) === val,
};

const STRING = {
  minLength: (val, min) => val.length - min > 0,
  maxLength: (val, max) => val.length - max < 0,
  equal: (val, equal) => val === equal,
  match: (val, regex) => regex.test(val),
  notEmpty: val => val !== '',
  type: isString,
};

const BOOLEAN = {
  type: val => val === true || val === false,
  toBe: (val, bool) => val === bool,
};

const oneOf = (val, array) => {
  for (let i = 0; i < array.length; i += 1) {
    if (looseEqual(array[i], val)) {
      return true;
    }
  }
  return false;
};

const TEST_FUNCTIONS = {
  int: {
    ...NUMBER,
    type: val => Number.isInteger(val),
  },

  float: {
    ...NUMBER,
    type: val => Number(val) === val && val % 1 !== 0,
  },

  number: {
    ...NUMBER,
  },

  string: {
    ...STRING,
  },

  boolean: {
    ...BOOLEAN,
  },

  password: {
    ...STRING,
    numbers: (val, number) => !!val.match(/(\d)/g) && val.match(/(\d)/g).length >= number,
    uppercase: (val, number) => !!val.match(/([A-Z])/g) && val.match(/([A-Z])/g).length >= number,
    specialChars: (val, number) => !!val.match(/([^a-zA-Z])/g) && val.match(/([^a-zA-Z])/g).length >= number,
    matchesOneOf: (val, arr) => {
      for (let i = 0; i < arr.length; i += 1) {
        if (val.indexOf(arr[i]) !== -1) {
          return true;
        }
      }
      return false;
    },
    matchesAllOf: (val, arr) => {
      for (let i = 0; i < arr.length; i += 1) {
        if (val.indexOf(arr[i]) === -1) {
          return false;
        }
      }
      return true;
    },
  },

  email: {
    ...STRING,
    type: val => isString(val) && /\S+@\S+\.\S+/.test(val),
    user: (val, f) => f(val.match(/(\S+)@\S+\.\S+/)[1]),
    domain: (val, f) => f(val.match(/\S+@(\S+)\.\S+/)[1]),

  },

  url: {
    ...STRING,
    type: val => isString(val) && URL_REGEX.test(val),
    domain: (val, f) => f(val.match(URL_REGEX)[3]),
    protocol: (val, f) => f(val.match(URL_REGEX)[1]),
  },

  date: {
    after: (val, min) => val - min > 0,
    before: (val, max) => val - max < 0,
    between: (val, range) => val - range[0] > 0 && val - range[1] < 0,
    equal: (val, equal) => val - equal === 0,
    type: val => val instanceof Date,
  },


  array: {
    of: (arr, rule) => {
      let ret = true;
      arr.forEach((el) => {
        if (rule.test(el) === false) {
          ret = false;
        }
      });
      return ret;
    },
    notEmpty: val => val.length !== 0,
    length: (val, len) => val.length === len,
    type: isArray,
  },

  function: {
    type: val => val && {}.toString.call(val) === '[object Function]',
    result: (val, obj) => obj.toBe.test(val(obj.of)),
  },
};

Object.keys(TEST_FUNCTIONS).forEach((key) => {
  TEST_FUNCTIONS[key].custom = CUSTOM;
  TEST_FUNCTIONS[key].optional = OPTIONAL;
  TEST_FUNCTIONS[key].oneOf = oneOf;
});

module.exports = { TEST_FUNCTIONS, OPTIONAL };
