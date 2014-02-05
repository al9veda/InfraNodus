var redis = require('redis');
var bcrypt = require('bcrypt');
var db = redis.createClient();

var neo4j = require('node-neo4j');
dbneo = new neo4j('http://localhost:7474');

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

    // Create a user node in Neo4J

    dbneo.insertNode({
        auth_id: user.id,
        username: user.name,
        name: user.name
    },function (err, node){
        if(err) throw err;
        // Output node properties.
        console.log(node.data);
        // Output node id.
        console.log(node.id);

        // Do we have the node.id from neo4j? send it to internal login system
        send_neo_id(node.id);
    });

    // Save neo4j id of the user to our internal login system
    function send_neo_id(neo_id) {
        user.neo_id = neo_id;
        db.set('user:id:' + user.name, id, function(err) {
            if (err) return fn(err);
            db.hmset('user:' + id, user, function(err) {
                fn(err);
            });
        });
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
            if (hash == user.pass) return fn(null, user);
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