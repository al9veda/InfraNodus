// This is just a way to remember how to do callback functions

var neo4j = require('node-neo4j');
dbneo = new neo4j('http://localhost:7474');

var contexts = '';

var content = '';

queryContexts = "MATCH (c1:Concept) RETURN c1";


// Way 1

function getContexts (callback) {
    dbneo.cypherQuery(queryContexts, function(err, cypherAnswer){


        if(err) {
            err.type = 'neo4j';
            contexts = "big shit";
            return callback(err);
        }

        contexts = "big success";
        callback(null,cypherAnswer);


    });
}

function showContexts (err,answer) {
    if (err) console.log(err);
    console.log(answer);
    console.log(contexts);
}


getContexts(showContexts);


// Way 2

// Here we know from main.js of node-neo4j that cypherQuery function has callback as its parameter
// Tha means as soon as there's a function in the brackets, it will have 2 values: error and return from cypher
// So we use that.

dbneo.cypherQuery(queryContexts, finishedQuery);

function finishedQuery(err,cypherAnswer) {
      console.log(cypherAnswer);
}



