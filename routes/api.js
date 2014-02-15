var Entry = require('../lib/entry');
var express = require('express');
var User = require('../lib/user');

exports.auth = express.basicAuth(User.authenticate);


exports.user = function(req, res, next){
    User.get(req.params.id, function(err, user){
        if (err) return next(err);
        if (!user.id) return res.send(404);
        res.json(user);
    });
};

exports.entries = function(req, res, next){
    var page = req.page;
    Entry.getRange(res.locals.user.neo_uid, function(err, entries){
        if (err) return next(err);

        res.format({
            json: function(){
                res.send(entries);
            }


        });
    });
};

exports.nodes = function(req, res, next){
    var page = req.page;
    Entry.getRange(res.locals.user.neo_uid, function(err, entries){
        if (err) return next(err);

        res.format({
            json: function(){
                res.send(entries);
            }


        });
    });
};