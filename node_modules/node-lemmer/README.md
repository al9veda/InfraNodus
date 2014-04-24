# node-lemmer #

## Introduction ##

English and Russian lemmatizer for Node.js, based on lemmatizer.org project.

Lemmatization is a process of finding *lemma* (main form) and *part of speech*
(e. g. noun, verb, adjective) for a word. This is useful for the purposes of
natural language processing,
e.g. fact extraction, indexing for full-text search, etc.

Some words have several lemmas. These are so-called *homonyms*, groups
of words which have the same spelling (and often pronounciation) but have
different meanings.

## Lemmatization examples ##

English:

* uses -> USE
* fought -> FIGHT
* found -> FIND, FOUND

Russian:

* ешь -> ЕСТЬ
* стулья -> СТУЛ
* белок -> БЕЛОК, БЕЛКА

## Usage ##

```javascript
var Lemmer = require('node-lemmer').Lemmer;

var lemmerEng = new Lemmer('english');
lemmerEng.lemmatize('fought');

var lemmerRus = new Lemmer('russian');
lemmerRus.lemmatize('белок');

```

## License ##

LGPL
