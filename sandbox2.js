/* Lessons in Javascript */


// Callback functions

function sumup(a1,a2,callback) {
    result = a1 + a2;
    callback(result);
}

sumup(10,5, function(sum) {
    console.log(sum);
})


// Always make a variable empty after announcing it just in case so you don't get undefined functions

var hashtags = ['TAG1','tag2','tag3'];


for(var i = 0; i < hashtags.length; i++) {
    hashtags[i] = hashtags[i].toLowerCase();
}

console.log(hashtags);

var timestamp = new Date().getTime() * 10000;

console.log(timestamp + 1);


console.log(timestamp + 2);



