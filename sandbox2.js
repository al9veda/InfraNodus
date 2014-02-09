/* Lessons in Javascript */


// Callback functions

function sumup(a1,a2,callback) {
    result = a1 + a2;
    callback(result);
}

sumup(10,5, function(sum) {
    console.log(sum);
})


