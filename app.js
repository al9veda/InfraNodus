
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');

// add a route for user processing
var user = require('./lib/middleware/user');

// add a route for registration (the destination for users when they request it)
var register = require('./routes/register');

// add a route for login (the destination for users when they request it)
var login = require('./routes/login');

// add a business logic for displaying messages (not a route as we don't need the user to access them directly)
var messages = require('./lib/messages');

var http = require('http');
var path = require('path');


var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');



app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());

// made to manage registration process and messages to user
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(user);
app.use(messages);

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

// on get request for /register request a form route function from register.js
app.get('/register', register.form);

// on post request to /register request a submit rout function from register.js
app.post('/register', register.submit);

// on get request for /register request a form route function from register.js
app.get('/login', login.form);

// on post request to /register request a submit rout function from register.js
app.post('/login', login.submit);

app.get('/logout', login.logout);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
