var FlowdockText = require('flowdock-text');

var text = "So #Paris is a bit like #Moscow but it doesn't compare to #NewYork";

var hashtags = FlowdockText.extractHashtags(text);

hashtags.splice(0,0,"");

console.log(hashtags);


hashtags_str = hashtags.join(" #").substr(1);


console.log(hashtags_str);


