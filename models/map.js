module.exports = function (db, models, next) {
	models.service = require('./service')(db);
	next();
}