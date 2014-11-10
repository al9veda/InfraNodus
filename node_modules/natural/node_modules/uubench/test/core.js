var uutest    = require('./uutest'),
    uubench   = require('../uubench');

function dumpError(err) {
  var out = err.testName + " -> ";
  if (!err.message) {
    err.message = JSON.stringify(err.expected)
      + " " + err.operator + " " + JSON.stringify(err.actual);
  }
  return out + err.stack;
}

uubench.defaults = {
  type:       "adaptive",
  iterations: 1,
  min:        1,
  delay:      0
}

var suite = new uutest.Suite({
  pass: function() {
    process.stdout.write(".");
  },
  fail: function(err) {
    process.stdout.write("F");
  },
  done: function(passed, failed, elapsed) {
    process.stdout.write("\n");
    console.log(passed + " passed " + failed + " failed " + "(" + elapsed + "ms)");
    this.errors.forEach(function(err) {
      console.log(dumpError(err));
    });
  }
});

suite.test("basic", function() {
  var unit = this;

  var suite = new uubench.Suite({
    done: function() {
      unit.pass();
    }
  });

  suite.bench("async", function(next) {
    setTimeout(function() {
      next();
    }, 2);
  });

  suite.bench("sync", function(next) {
    next();
  });

  suite.run();
});

suite.test("fixed", function() {
  var unit = this, iter;

  var suite = new uubench.Suite({
    type: "fixed",
    iterations: 100,
    result: function(name, stats) {
      iter = stats.iterations;
    },
    done: function() {
      try {
        unit.equals(iter, 100);
      } catch(e) {
        unit.fail(e);
        return;
      }
      unit.pass();
    }
  });

  suite.bench("sync", function(next) {
    next();
  });

  suite.run();
});

suite.run();