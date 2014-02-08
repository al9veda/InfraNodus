var neo4j = require('node-neo4j');
db = new neo4j('http://localhost:7474');

db.readIncomingRelationshipsOfNode(270, function(err, relationships){
    if(err) throw err;


    console.log(relationships);


    //fn(null, entries);
});