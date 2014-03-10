/**
 * InfraNodus is a lightweight interface to graph databases.
 *
 * Inspired from ThisIsLike.Com and KnowNodes (now Rhizi) we
 * want to create a basic interface for rich edge annotation of graphs
 * for collaborative use.
 *
 * This open source, free software is available under MIT license.
 * It is provided as is, with no guarantees and no liabilities.
 *
 * You are very welcome to reuse this code if you keep this notice.
 *
 * Written by Dmitry Paranyushkin | Nodus Labs and hopefully you also...
 * www.noduslabs.com | info AT noduslabs DOT com
 *
 *
 * In some parts the code from the book "Node.js in Action" is used,
 * (c) 2014 Manning Publications Co.
 * by Marc Harter, T.J. Holowaychuk, Nathan Rajlich
 * Any source code files provided as a supplement to the book are freely
 * available to the public for download. Reuse of the code is permitted,
 * in whole or in part, including the creation of derivative works, provided
 * that you acknowledge that you are using it and identify the source:
 * title, publisher and year.
 */

var api = require('./routes/api');
var express = require('express');
var routes = require('./routes');
var entries = require('./routes/entries');
var Entry = require('./lib/entry');
var page = require('./lib/middleware/page');
var validate = require('./lib/middleware/validate');
//var user = require('./lib/middleware/user');
var register = require('./routes/register');
var login = require('./routes/login');
var messages = require('./lib/messages');
var http = require('http');
var path = require('path');
var leap = require('./routes/leap');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var users = [
    {id: 1, username: 'admin', name: 'admin', password: 'tutu', neo_id: '0', neo_uid: 'b9745f70-a13f-11e3-98c5-476729c16049', email: 'info@noduslabs.com' },
    {id: 2, username: 'joe', password: 'birthday', email: 'joe@example.com' }
]

function findById(id, fn) {
    var idx = id - 1;
    if (users[idx]) {
        fn(null, users[idx]);
    } else {
        fn(new Error('User ' + id + ' does not exist'));
    }
}

function findByUsername(username, fn) {
    for (var i = 0, len = users.length; i < len; i++) {
        var user = users[i];
        if (user.username === username) {
            return fn(null, user);
        }
    }
    return fn(null, null);
}

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    findById(id, function (err, user) {
        done(err, user);
    });
});

//   Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(
    function(username, password, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {

            // Find the user by username.  If there is no user with the given
            // username, or the password is not correct, set the user to `false` to
            // indicate failure and set a flash message.  Otherwise, return the
            // authenticated `user`.
            findByUsername(username, function(err, user) {
                if (err) { return done(err); }
                if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
                if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
                return done(null, user);
            })
        });
    }
));

var app = express();





app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');



app.use(express.bodyParser());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
// This makes sure that when someone accesses /api they are authenticated first
//app.use('/api', api.auth);
//app.use(user);
app.use(messages);
app.use(app.router);
app.use(routes.notfound);
app.use(routes.error);
app.use(routes.badrequest);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/register', register.form);
app.post('/register', register.submit);
app.get('/login', login.form);

// POST /login
//   This is an alternative implementation that uses a custom callback to
//   acheive the same functionality.
app.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) { return next(err) }
        if (!user) {
            req.session.messages =  [info.message];
            return res.redirect('/login')
        }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            return res.redirect('/');

        });
    })(req, res, next);
});

app.get('/logout', login.logout);
app.get('/post', entries.form);
app.post(
    '/post',
    ensureAuthenticated,
    validate.isLoggedIn(),
    validate.required('entry[body]'),
    validate.lengthAbove('entry[body]', 4),
    validate.sanitize('entry[body]'),
    validate.getHashtags('entry[body]'),
    validate.isToDelete(),
    validate.getContext('entry[body]'),
    entries.submit
);

app.get('/leap', leap.render);
app.get('/api/user/nodes/:context?', api.nodes);
app.get('/api/user/statements', api.entries);
app.get('/api/user/:id', api.user);
app.get('/api/public/nodes/:user?', validate.getUserID(), api.nodes);
app.post('/api/entry', entries.submit);
app.get('/contexts/:context?', ensureAuthenticated, entries.list);
app.get('/users/:user?', validate.getUserID(), entries.list);
app.get('/', ensureAuthenticated, entries.list);



if (process.env.ERROR_ROUTE) {
    app.get('/dev/error', function(req, res, next){
        var err = new Error('database connection failed');
        err.type = 'database';
        next(err);
    });
}


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        res.locals.user = req.user;
        return next();
    }
    res.redirect('/login')
}