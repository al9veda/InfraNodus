
// --expose_gc must be passed
if ('function' != typeof gc) {
  var command = [process.argv[0], '--expose_gc'].concat(process.argv.slice(1)).join(' ')
  console.error('Run with --expose_gc: %j', command)
  process.exit(1)
}

var ref = require('ref')
  , ffi = require('./')
  , bindings = require('bindings')({ module_root: __dirname + '/test', bindings: 'ffi_tests' })
  , assert = require('assert')

var cb = ffi.Callback('void', [ ], function () {
  console.error('callback called')
})

// register the callback function
bindings.set_cb(cb)

cb = null // KILL!!
gc()

// XXX: remove this timeout and the script exits immediately as expected...
setTimeout(function () {
  console.error('timeout')
}, 5000)

// should generate an "uncaughtException" asynchronously
bindings.call_cb_async()

process.on('uncaughtException', function () {
  console.error('uncaught:', arguments);
});
