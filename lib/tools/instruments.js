module.exports = Instruments;


function Instruments() {

}

// Borrowed from this beautiful example: http://stackoverflow.com/a/9229821/712347

Instruments.uniqualizeArray = function(ary, key) {
    var seen = {};
    return ary.filter(function(elem) {
        var k = key(elem);
        return (seen[k] === 1) ? 0 : seen[k] = 1;
    })
};


Instruments.cleanHtml = function(Description) {
    var tmp = Description.replace(/<br\s*\/?>/mg,"\n");
    tmp = tmp.replace(/(<([^>]+)>)/ig," ");
    tmp = tmp.replace(/&nbsp;/g, ' ');
    return tmp;
}