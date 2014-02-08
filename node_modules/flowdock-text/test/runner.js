var jasmine = require("../lib/jasmine");
var cases = require("./conformance");
var FlowdockText = require("../flowdock-text");
var testers = require("./testers");
var ansi = { green: '\033[32m', red: '\033[31m', yellow: '\033[33m', none: '\033[0m' };

(function(){
  for (var suite in cases) {
    (function(suite) {
      jasmine.describe(suite, function(){
        for (var section in cases[suite]) {
          (function(section) {
            jasmine.describe(section, function() {
              cases[suite][section].forEach(function(testCase){
                var tester = testers.getTester(suite, section);
                jasmine.it(testCase.description, function(){
                  jasmine.expect(tester(testCase)).toEqual(testCase.expected);
                });
              });
            });
          }(section));
        }
      });
    }(suite));
  }
  var reporter = new jasmine.jasmine.JsApiReporter();
  jasmine.jasmine.getEnv().addReporter(reporter);
  jasmine.jasmine.getEnv().execute();
  setTimeout(function(){
    var output = "";
    var failed = 0;
    var passed = 0;
    var results = reporter.results();
    for(var i in results){
      if(results[i].result === "passed"){
        passed++;
        output += ansi.green + ".";
      } else if(results[i].result === "failed"){
        //output += results[i].messages.map(function(msg){return msg.message + "\n"}).join("\n")
        output += ansi.red + "F";
        failed++;
      }
    }
    expectations_count = passed + failed;
    var result_str = output +
      ansi.none + "\n" +
      (failed > 0 ? ansi.red : ansi.green ) +
      expectations_count + " specs, " +
      failed + " failures." +
      ansi.none
    console.log(result_str);
    process.exit(failed > 0 ? 1 : 0);
  }, 1);
}());

