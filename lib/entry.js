var redis = require('redis');
var db = redis.createClient();
var FlowdockText = require('flowdock-text');
var neo4j = require('node-neo4j');
dbneo = new neo4j('http://localhost:7474');

module.exports = Entry;

function Entry(obj) {
    for (var key in obj) {
        this[key] = obj[key];
    }
}

/*Entry.prototype.save = function(fn){
    var entryJSON = JSON.stringify(this);

    db.lpush(
        'entries',
        entryJSON,
        function(err) {
            if (err) return fn(err);
            fn();
        }
    );
};     */

Entry.prototype.save = function(fn){

    var from_node = this.by_id;

    // TODO here we do a cypher request from sandbox2, same context (Betatest), floating user, floating statement


    dbneo.insertNode({
        by: this.by_uid,
        text: this.text
    },"Statement", function(err, node){
        if(err) throw err;



        // Output node id.
        console.log("Node added, Neo4J ID: " + node._id);

        createNeoRelationship(node._id,from_node);

        fn();
    });



    function createNeoRelationship (neo_node_id, from_node) {
        dbneo.insertRelationship(neo_node_id, from_node, 'BY', {
            context: 'unknown'
        }, function(err, relationship){
            if(err) throw err;


            // Output relationship id.
            console.log(relationship._id); /* for 2.0.0-RC4, use: console.log(relationship._id) */

            // Output relationship start_node_id.
            console.log(relationship._start); /* for 2.0.0-RC4, use: console.log(relationship._start) */

            // Output relationship end_node_id.
            console.log(relationship._end); /* for 2.0.0-RC4, use: console.log(relationship._end) */
        });
    }

}

Entry.getRange = function(origin, fn){

    /*
    db.lrange('entries', from, to, function(err, items){
        if (err) return fn(err);
        var entries = [];

        items.forEach(function(item){
            entries.push(JSON.parse(item));
        });

        fn(null, entries);
    });  */


    // TODO 1. default view: statements  readNodesWithLabelsAndProperties (then index by:uid, label:statement)

     console.log("Retrieving nodes for User UID: " + origin);

     dbneo.cypherQuery("MATCH (u:User{uid:'" + origin + "'}), (s:Statement), s-[rel:BY]->u RETURN s ORDER BY rel.timestamp DESC;", function(err, statements){
            if(err) throw err;

            console.log(statements);

            fn(null,statements.data);

     });


     // TODO 2. readNodesWithLabelsAndProperties (c:Concept{by:uid}) OR BETTER WITH CYPHER


};

