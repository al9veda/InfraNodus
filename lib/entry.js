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

    // TODO create a batch job for adding all the hashtags as nodes, creating connections between them, attaching them all to the statement, and to the user.


    dbneo.insertNode({
        by: this.by_uid,
        text: this.text
    },function(err, node){
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



    dbneo.readIncomingRelationshipsOfNode(origin, function(err, relationships){
        if(err) throw err;


        var entries = relationships;

        console.log(entries);
        fn(null, entries);
    });


};

