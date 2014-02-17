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


// request methods available for User objects
var User = require('../lib/user');

// when user accesses /login page with GET, populate login template view with data
exports.form = function(req, res){
    res.render('login', { title: 'Login' });
};

// when user accesses /login page with POST, authenticate the user
exports.submit = function(req, res, next){

    // create variable data and populate it with user data from the submitted form
    var data = req.body.user;

    // call authenticate method for User object
    User.authenticate(data.name, data.pass, function(err, user){
        if (err) return next(err);

        // user exists? add his id into the session parameters and redirect to the main page
        if (user) {
            req.session.uid = user.id;

            // TODO Get their default context in here into req.session parameter
            // Later the user can also also change their default from Private to another one.

            res.redirect('/');
        } else {
            res.error("Sorry! invalid credentials.");
            res.redirect('back');
        }
    });
};

exports.logout = function(req, res){
    req.session.destroy(function(err) {
        if (err) throw err;
        res.redirect('/');
    });
};