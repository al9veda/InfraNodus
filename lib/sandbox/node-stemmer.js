// A stemming module for use in the browser frontend

// To create a .js file:
// browserify --standalone jstemmer node-stemmer.js > bundle-stemmer.js

// copy bundle-stemmer to public/javascripts

// access through window.jstemmer(term);


var natural = require('natural');


module.exports = function (term) {

    // A rather complicated way of detecting language because language detect module works like shit

    var lng = 'english';

    var is_cyrillic = /[а-яА-ЯЁё]/.test(term);

    if (is_cyrillic == true) {
        lng = 'russian';
    }

    if (lng == 'english') {
        return natural.LancasterStemmer.stem(term);
    }
    else if (lng == 'russian') {
        return natural.PorterStemmerRu.stem(term);
    }

};