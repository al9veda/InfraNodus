var rightNow = new Date();
var res = rightNow.toISOString().slice(0,16).replace(/-|:|T/g,"");

console.log(res);