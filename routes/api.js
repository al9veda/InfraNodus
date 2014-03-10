/**
 * InfraNodus is a lightweight interface to graph databases.
 *
 * This open source, free software is available under MIT license.
 * It is provided as is, with no guarantees and no liabilities.
 * You are very welcome to reuse this code if you keep this notice.
 *
 * Written by Dmitry Paranyushkin | Nodus Labs and hopefully you also...
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

        console.log("Getting nodes for " + res.locals.user.neo_id);

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

    var contexts = [];

    // The one who sees the statements (hello Tengo @1Q84 #Murakami)
    var receiver = '';
    // The one who made the statements (hello Fuka-Eri @1Q84 #Murakami)
    var perceiver = '';

    // TODO think of how this is bypassed when API is functional
    // Give this user a variable
    res.locals.user = req.user;

    // Let's define the contexts from URL if exist
    contexts.push(req.params.context);

    // And is there one to compare with also?
    if (req.query.addcontext) contexts.push(req.query.addcontext);

    // Is the user logged in? Then he is the receiver
    if (res.locals.user) {
        receiver = res.locals.user.neo_uid;
    }
    // Is there user in the URL and we know their ID already? Then the receiver will see their graph...
    if (req.params.user && res.locals.viewuser) {
        perceiver = res.locals.viewuser;
    }
    // Otherwise they see their own
    else {
        if (res.locals.user) {
            perceiver = res.locals.user.neo_uid;
        }
    }

    Entry.getNodes(receiver, perceiver, contexts, function(err, graph){
        if (err) return next(err);

        // Change the result we obtained into a nice json we need


        if (req.query.gexf) {
            res.render('entries/nodes', { graph: graph });
        }
        else {
            res.format({
                json: function(){
                    res.send(graph);
                }
            });
        }
    });
};