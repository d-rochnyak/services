var http = require('http');
var express = require('express');
var join = require('path').join;
var favicon = require('static-favicon');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var HttpError = require('./error').HttpError;
var config = require('./config');
var orm = require('orm');
var router = express.Router();
var ejs = require('ejs');
var ejsLocals = require('ejs-locals');

ejs.open = "{{";
ejs.close = "}}";

var app = express();

// view engine setup
app.engine('ejs', ejsLocals);
app.set('views', join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon());
app.use(bodyParser());
app.use(cookieParser());

app.use(orm.express(config.get('mysql:uri'), {
	define: require('./models/map')
}));

app.use(function(req, res, next) {
	res.sendHttpError = function(error) {
		res.status(error.status);
		if (res.req.headers['x-requested-with'] == 'XMLHttpRequest') {
			res.json(error);
		} else {
			res.render("error", {error: error});
		}
	};

	next();
});

app.use(require('./routes'));
app.use(express.static(join(__dirname, 'public')));

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(404);
});

/// error handlers
app.use(function(err, req, res, next) {
	if(typeof err == 'number') {
		err = new HttpError(err);
	}

	if(err instanceof HttpError) {
		res.sendHttpError(err);
	} else {
		console.log(err);
		err = new HttpError(500);
		res.sendHttpError(err);
	}
});


module.exports = app;
