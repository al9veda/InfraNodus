// A stemming module for use in the browser frontend

// To create a .js file:
// browserify --standalone jstemmer node-stemmer.js > bundle-stemmer.js

// copy bundle-stemmer to public/javascripts

// access through window.jstemmer(term);


var natural = require('natural');


module.exports = function (term) {

    // A rather complicated way of detecting language because language detect module works like shit

    var lng = 'english';

    var is_cyrillic = term.match(/[а-яА-Я]/);

    if (is_cyrillic != null) {
        lng = 'russian';
    }


    if (lng == 'english') {
        return natural.LancasterStemmer.stem(term);
    }
    else if (lng == 'russian') {
        return natural.PorterStemmerRu.stem(term);
    }

};