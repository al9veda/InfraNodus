var google = require('google');

google.lang = 'us';
google.tld = 'us';

google.resultsPerPage = 50;
var nextCounter = 0;

google('russian train tickets', function(err, next, links){
    if (err) console.error(err);

    for (var i = 0; i < links.length; ++i) {
        //console.log(links[i].title + ' - ' + links[i].link); //link.href is an alias for link.link
        var searchtext = (links[i].description);
        var searchtext = searchtext.replace(/(0?[1-9]|[12][0-9]|3[01])\s{1}(Jan|Feb|Mar|Apr|May|Jun|Jul|Apr|Sep|Oct|Nov|Dec)\s{1}\d{4}/g, '');
        console.log(searchtext + "\n");
    }

    if (nextCounter < 4) {
        nextCounter += 1;
        if (next) next();
    }

});