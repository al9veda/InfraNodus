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
            res.redirect('/');
        } else {
            res.error("Sorry! invalid credentials.");
            res.redirect('back');
        }
    });
};