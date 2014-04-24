var Lemmer = require('./').Lemmer;

if (process.argv.length < 4) {
	console.log('Usage: node test <lang> <word>');
	process.exit(1);
}

var lang = process.argv[2];
var word = process.argv[3];

var lemmer = new Lemmer(lang);

var lemmas = lemmer.lemmatize(word);

lemmas.forEach(function(lemma) {
	console.log('Form: ' + JSON.stringify(lemma, null, '\t'));
});
