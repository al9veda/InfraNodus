var ref = require('ref')
  , ffi = require('./')
  , bindings = require('bindings')({ module_root: __dirname + '/test', bindings: 'ffi_tests' })
  , assert = require('assert')

var cb = ffi.Callback('void', [ ], function () {
  console.error('callback called')
  throw new Error('callback');
})

// register the callback function
bindings.set_cb(cb)

//cb = null; gc();

// XXX: remove this timeout and the script exits immediately as expected...
/*
setTimeout(function () {
  console.error('timeout')
}, 5000)

process.on('uncaughtException', function () {
  console.error('uncaught:', arguments);
})
*/

// should generate an "uncaughtException" asynchronously
bindings.call_cb_async()
