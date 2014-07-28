var nconf = require('nconf');
var join = require('path').join;

nconf.argv()
	.env()
	.file({ file: join(__dirname, 'base.json') });

module.exports = nconf;