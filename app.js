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
var api2 = require('./routes/api2');
var express = require('express');
var routes = require('./routes');
var oauths = require('./routes/evernote');
var entries = require('./routes/entries');
var Entry = require('./lib/entry');
var page = require('./lib/middleware/page');
var validate = require('./lib/middleware/validate');
var user = require('./lib/middleware/user');
var register = require('./routes/register');
var login = require('./routes/login');
var messages = require('./lib/messages');
var http = require('http');
var path = require('path');

var pass = require('./lib/pass')
var passport = require('passport');

var settings = require('./routes/settings');
var imports = require('./routes/imports');

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

// This makes sure that when someone accesses external /api2 they are authenticated first
app.use('/api2', api2.auth);

app.use(user);
app.use(messages);
app.use(app.router);
app.use(routes.notfound);
app.use(routes.error);
app.use(routes.badrequest);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


// First we declare all the static paths in the script

app.get('/signup', register.form);
app.post('/signup', register.submit);
app.get('/login', login.form);

// POST /login
//   This is an alternative implementation that uses a custom callback to
//   acheive the same functionality.
app.post('/login', login.submit);

app.get('/logout', login.logout);
app.get('/post', entries.form);
app.post(
    '/post',
    pass.ensureAuthenticated,
    validate.isLoggedIn(),
    validate.isToDelete(),
    validate.getContextForEntry('entry[body]'),
    entries.submit
);

app.post(
    '/context',
    pass.ensureAuthenticated,
    validate.changeContextPrivacy()
);

// Internal API to get nodes and statements for user's own nodes
app.get('/api/user/nodes/:context?', api.nodes);

// Internal API to get nodes and statements for somebody else's nodes in context
app.get('/api/public/nodes/:user?/:context?', validate.getUserID(), validate.getContextPrivacy(), api.nodes);

app.get('/api/user/statements/:context?', api.entries);

// External API to get nodes and statements
app.get('/api2/user/nodes/:context?', api2.nodes);
app.get('/api2/user/statements/:context?', api2.entries);

// For posting through API POST parameters:
// entry[body] is the statement,
// context is the context (optional, default: private),
// statementid is the ID of a statement to edit / delete (optional)
// submit = 'edit' to edit, delete = 'delete' to delete (optional)
app.post('/api2/post',
    validate.isToDelete(),
    validate.getContextForEntry('entry[body]'),
    entries.submit);

app.get('/settings', pass.ensureAuthenticated, settings.render);
app.post('/settings', pass.ensureAuthenticated, settings.modify);
app.get('/import', pass.ensureAuthenticated, imports.render);
app.post('/import', pass.ensureAuthenticated, imports.submit);

app.get('/evernote_oauth', oauths.oauth);
app.get('/evernote_oauth_callback', oauths.oauth_callback);
app.get('/evernote_clear', oauths.clear);

// From here we declare all the dynamic paths at the first level of the content tree

app.get('/:user/edit', pass.ensureAuthenticated, entries.list);
app.get('/:user/:context?/edit', pass.ensureAuthenticated, validate.getContextPrivacy(), entries.list);
app.get('/:user/:context?', validate.getUserID(), validate.getContextPrivacy(), entries.list);

app.get('/', pass.ensureAuthenticated, entries.list);



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

