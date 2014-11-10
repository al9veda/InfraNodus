uubench
=======

> A tiny asynchronous JavaScript benchmarking library

uubench provides a simple harness for measuring the execution time of JavaScript code. Design your experiments, analyze the numbers and present the data as you see fit.

Features:

* small (~100 LOC)
* asynchronous, evented operation
* fixed or adaptive test cycles
* no DOM-related cruft

Synopsis
--------

Set up a benchmark suite:

    var suite = new uubench.Suite({
      start: function() {
        console.log("starting...");
      },
      result: function(name, stats) {
        console.log(name + ": " + stats.iterations/stats.elapsed);
      },
      done: function() {
        console.log("finished");
      }
    });

Add some benchmarks:

    suite.bench("async", function(next) {
      myAsyncFunc(function() {
        next();
      });
    });

    suite.bench("sync", function(next) {
      mySyncFunc();
      next();
    });

Go man go!

    suite.run();

Installation
------------

Via npm:

    $ npm install uubench

In Node:

    var uubench = require('uubench');

In the browser:

    <script src="uubench.js"></script>

Guide
-----

By design, uubench doesn't come with extras. Instead, you use the low-level API to build your own unique benchmark suites.

### Defaults

uubench ships with the following defaults that apply to every test suite:

    uubench.defaults = {
      type:       "adaptive", // adaptive or fixed
      iterations: 10,         // starting iterations
      min:        100,        // minimum run time (ms) - adaptive only
      delay:      100         // delay between tests (ms)
    }

You may override these globally or per-suite. Read on to find out what each option does.

### Fixed test cycles

By default uubench uses adaptive test cycles to allow reasonable execution time across different environments. To use fixed cycles instead, set the `type` to "fixed":

    var suite = new uubench.Suite({
      type: "fixed",
      iterations: 1000, // run each benchmark exactly 1000 times
      ...
    });

### Setting the minimum runtime

uubench defaults to a minimum runtime of 100ms in adaptive mode. To adjust this runtime:

    var suite = new uubench.Suite({
      min: 1000, // each benchmark should run for at least 1000ms
      ...
    });

### Starting iterations

In adaptive mode it is sometimes useful to bump up the starting iterations to reach the minimum runtime faster:

    var suite = new uubench.Suite({
      iterations: 1000, // run each benchmark a minimum of 1000 times
      ...
    });

### Setting the benchmark delay

uubench imposes a 100ms delay between benchmarks to give any UI elements that might be present time to update. This delay can be tweaked:

    var suite = new uubench.Suite({
      delay: 500, // 500ms delay between benchmarks
      ...
    });

### Disabling auto-looping

To manually loop within a given benchmark, add a second argument to the benchmark's argument list. uubench will then automatically disable auto-looping:

    suite.bench("foo", function(next, count) {
      while (count--) {
        ...
      }
      next();
    });

### Multiple runs

To collect benchmark data over multiple runs, simply rerun the suite on completion:

    var suite = new uubench.Suite({
      ...
      done: function() {
        if (--runCounter) {
          console.log("I'm finished!");
        } else {
          suite.run();
        }
      }
    });

Beware of relying on multiple in-process runs to establish statistical relevance. Better data can be obtained by completely re-running your test scripts.

### Stats

Rather than imposing a limited statistical model on benchmark data, uubench gives you the raw numbers. If you want to go nuts with the math have a look at [this gist](http://gist.github.com/642690).

### Loop calibration

In most cases auto looping doesn't add enough overhead to benchmark times to be worth worrying about, but extremely fast benchmarks can suffer. Add a calibration test if you want to correct for this overhead:

    suite.bench("calibrate", function(next) {
      next();
    });

You can then subtract the elapsed time of the "calibrate" test from other tests in the suite.

Examples
--------

* Dust browser benchmarks: <http://akdubya.github.com/dustjs/benchmark/index.html>
* Dust node benchmarks: <http://github.com/akdubya/dustjs/blob/master/benchmark/server.js>

About
-----

uubench was inspired by the venerable [jslitmus](http://github.com/broofa/jslitmus)