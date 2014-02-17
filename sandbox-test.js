var FlowdockText = require("flowdock-text");

console.log(;

FlowdockText.autoLinkMentions("hello @Username #greets",{hashtagUrlBase:"/filter/"});