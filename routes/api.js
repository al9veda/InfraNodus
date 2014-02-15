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
    Entry.getNodes(res.locals.user.neo_uid, function(err, entries){
        if (err) return next(err);

        // Change the result we obtained into a nice json we need

        res.format({
            json: function(){
                res.send(entries);
            }


        });
    });
};