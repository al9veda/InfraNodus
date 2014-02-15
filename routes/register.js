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

// get methods to operate on a User object

var User = require('../lib/user');

// the form route function renders the register.ejs template from views and adds 'Register' into the title field there

exports.form = function(req, res){
    res.render('register', { title: 'Register' });
};

// this happens when the user accesses /register with a POST request

exports.submit = function(req, res, next){

    // define data as the parameters entered into the registration form
    var data = req.body.user;

    // call getByName method from User class with the user.name from the form and check if it already exists
    User.getByName(data.name, function(err, user){
        if (err) return next(err);

        if (user.id) {
            res.error("Username already taken!");
            res.redirect('back');
        } else {

            // user does not exist? then create a new object User with the data from the form
            user = new User({
                name: data.name,
                pass: data.pass
            });

            // save that object in redis database
            user.save(function(err){
                if (err) return next(err);

                // save his ID into the session
                req.session.uid = user.id;

                // redirect to the main page
                res.redirect('/');
            });
        }
    });
};
