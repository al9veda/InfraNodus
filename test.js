var natural = require('natural');
var tokenizer = new natural.WordTokenizer();
var Lemmer = require('node-lemmer').Lemmer;
var statement = "Your dog has fleas and is desiring I'm the best the privatisation of humanity and becoming animals in progressions of revelations became";
var lemmerEng = new Lemmer('english');

var concepts = tokenizer.tokenize(statement);

console.log(concepts);

for (var i = 0; i < concepts.length; ++i) {
    console.log(lemmerEng.lemmatize(concepts[i]));
}
