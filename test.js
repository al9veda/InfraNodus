var fs = require('fs');

var natural = require('natural');

natural.LancasterStemmer.attach();

var tokenizer = new natural.WordTokenizer();
var Lemmer = require('node-lemmer').Lemmer;
var lemmerEng = new Lemmer('english');

var statement = "Your dog having fleas and is desiring I'm the best the privatisation of humanity and becoming animals in progressions of revelations became";

var stopwords = [];

fs.readFile( __dirname + '/public/files/stopwords_en_en.txt', function (err, data) {
    if (err) {
        throw err;
    }
    stopwords = data.toString().split("\n");

    var concepts = tokenizer.tokenize(statement.toLowerCase());



    var conceptsclean = [];

    for (var i = 0; i < concepts.length; i++) {
        if (stopwords.indexOf(concepts[i]) == -1  && concepts[i].length > 1) {
            conceptsclean.push(concepts[i]);
        }
    }




    var lemmas = [];

    for (var i = 0; i < conceptsclean.length; ++i) {
        lemmas.push(lemmerEng.lemmatize(conceptsclean[i]));
    }

    var lemmasclean = [];

    for (var i = 0; i < lemmas.length; ++i) {
        lemmasclean.push(lemmas[i][0]);
    }

    console.log(lemmasclean);

});






