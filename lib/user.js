/**
 * InfraNodus is a lightweight interface to graph databases.
 *
 * This open source, free software is available under MIT license.
 * It is provided as is, with no guarantees and no liabilities.
 * You are very welcome to reuse this code if you keep this notice.
 *
 * Written by Dmitry Paranyushkin | Nodus Labs, you, you and you!
 * www.noduslabs.com | info AT noduslabs DOT com
 *
 * In some parts the code from the book "Node.js in Action" is used,
 * (c) 2014 Manning Publications Co.
 *
 */

var redis = require('redis');
var bcrypt = require('bcrypt');
var db = redis.createClient();

var neo4j = require('node-neo4j');
dbneo = new neo4j('http://localhost:7474');

var uuid = require('node-uuid');


module.exports = User;

function User(obj) {
    for (var key in obj) {
        this[key] = obj[key];
    }
}

User.prototype.save = function(fn){
    if (this.id) {
        this.update(fn);
    } else {
        var user = this;
        db.incr('user:ids', function(err, id){
            if (err) return fn(err);
            user.id = id;
            user.hashPassword(function(err){
                if (err) return fn(err);
                user.update(fn);
            });
        });


    }
};


User.prototype.update = function(fn){
    var user = this;
    var id = user.id;
    var user_uid = uuid.v1();


    // Create a user node in Neo4J

    dbneo.insertNode({
        auth_id: user.id,
        username: user.name,
        uid: user_uid,
        name: user.name
    },'User',function (err, node){
        if(err) return fn(err);
        // Output node id.

        console.log("User created. Neo4J ID: " + node._id);
        console.log("Unique UID (retrieved): " + node.uid);
        // Do we have the node.id from neo4j? send it to internal login system
        send_neo_id(node._id,node.uid);
        // And create a context for that user
        create_context(node.uid);
    });

    // Save neo4j id of the user to our internal login system
    function send_neo_id(neo_id,neo_uid) {
        user.neo_id = neo_id;
        user.neo_uid = neo_uid;
        db.set('user:id:' + user.name, id, function(err) {
            if (err) return fn(err);
            db.hmset('user:' + id, user, function(err) {
                fn(err);
            });
        });
    };

    // Create a context for that user
    function create_context(neo_uid) {

        var context_uid = uuid.v1();
        var context_name = "Private Pad";
        var timestamp = new Date().getTime() * 10000;

        var cypherRequest = 'MATCH (u:User{uid:"' + neo_uid + '"}) MERGE (c:Context ' + '{uid:"' + context_uid + '",name:"' + context_name + '",timestamp:"' + timestamp + '"}) MERGE c-[c_u:BY]->u ON CREATE SET c_u.timestamp="' + timestamp + '";';

        dbneo.cypherQuery(cypherRequest, function(err, cypherAnswer){

            // Important: this returns an error instead of crashing the server

            if(err) {
                err.type = 'neo4j';
                return fn(err);
            }


            // Save context ID into our internal DB
            send_context_id(context_uid);



        });

        // Save neo4j id of the context to our internal login system
        function send_context_id(context_uid) {
            user.context_uid = context_uid;
            db.set('user:id:' + user.name, id, function(err) {
                if (err) return fn(err);
                db.hmset('user:' + id, user, function(err) {
                    if (err) return fn(err);
                });
            });
        };


    };


};

User.prototype.hashPassword = function(fn){
    var user = this;
    bcrypt.genSalt(12, function(err, salt){
        if (err) return fn(err);
        user.salt = salt;
        bcrypt.hash(user.pass, salt, function(err, hash){
            if (err) return fn(err);
            user.pass = hash;
            fn();
        })
    });
};


/* Testing user creation

var Toby = new User({
    name: 'Tobi',
    pass: 'im a ferret',
    age: '2'
})

Toby.save(function(err) {
    if (err) throw err;
    console.log('user id %d', Toby.id);
})

*/

User.getByName = function(name, fn){
    User.getId(name, function(err, id){
        if (err) return fn(err);
        User.get(id, fn);
    });
};

User.getId = function(name, fn){
    db.get('user:id:' + name, fn);
};

User.get = function(id, fn){
    db.hgetall('user:' + id, function(err, user){
        if (err) return fn(err);
        fn(null, new User(user));
    });
};

User.authenticate = function(name, pass, fn){
    User.getByName(name, function(err, user){
        if (err) return fn(err);
        if (!user.id) return fn();

        // let's see if the password is right by computing hash from the user.pass and the salt and seeing if it's related to the hashed pass we store in our db
        bcrypt.hash(pass, user.salt, function(err, hash){
            if (err) return fn(err);
            if (hash == user.pass) {

                console.log("Logged in " + user.neo_uid);
                return fn(null, user);
            }
            fn();
        });
    });
};

User.prototype.toJSON = function(){
    return {
        id: this.id,
        name: this.name
    }
};