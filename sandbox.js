var neo4j = require('node-neo4j');
db = new neo4j('http://localhost:7474');

db.insertNode({
    name: 'Darth Vader',
    sex: 'male'
},function(err, node){
    if(err) throw err;

    // Output node properties.
    console.log(node.name);

    // Output node id.
    console.log(node._id); /* for 2.0.0-RC4, use: console.log(node._id) */
});