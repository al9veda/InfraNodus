var nativeLemmer = require('../build/Release/node_lemmer.node');
var path = require('path');

var PoS = new Array();
PoS[0]='NOUN'
PoS[1]='ADJ_FULL';
PoS[2]='VERB';
PoS[3]='PRONOUN';
PoS[4]='PRONOUN_P';
PoS[5]='PRONOUN_PREDK';
PoS[6]='NUMERAL';
PoS[7]='NUMERAL_P';
PoS[8]='ADV';
PoS[9]='PREDK';
PoS[10]='PREP';
PoS[11]='POSL';
PoS[12]='CONJ';
PoS[13]='INTERJ';
PoS[14]='INP';
PoS[15]='PHRASE';
PoS[16]='PARTICLE';
PoS[17]='ADJ_SHORT';
PoS[18]='PARTICIPLE';
PoS[19]='ADVERB_PARTICIPLE';
PoS[20]='PARTICIPLE_SHORT';
PoS[21]='INFINITIVE';

function Lemmer(lang) {
	if (['english', 'russian'].indexOf(lang) == -1)
		throw new Error('lang must be enlgish or russian');

	var dir = path.join(__dirname, '..', 'dict');
	this.lemmer = new nativeLemmer.Lemmer(
		path.join(dir, 'dict_' + lang + '.auto'),
		path.join(dir, 'paradigms_' + lang + '.bin'),
		path.join(dir, 'prediction_' + lang + '.auto'));

	this.lang = lang;
}

Lemmer.prototype.lemmatize = function(word) {
	var res;
	if (this.lang == 'english')
		res = this.lemmer.lemmatizeEng(word);
	else
		res = this.lemmer.lemmatizeRus(word);
	res.forEach(function(form) {
		form.partOfSpeech = PoS[form.partOfSpeech];
	});
	return res;
}

exports.Lemmer = Lemmer;
