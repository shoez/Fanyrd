
console.log(__dirname)
require.paths.unshift(require('path').join(__dirname, '..'));

/**
 * Module dependencies.
 */

var sys = require("sys"),
	events = require('events'),
	redis = require("redis-node"),
	nbs = require('./base60');


function pp(obj) {
  sys.puts(sys.inspect(obj));
}



function User() {
	// Redis
	this.redisClient = redis.createClient(); 
};

User.prototype.userExists = function userExists(id) {
	return this.redisClient.exists('user:'+id, function userExist(err, exists) {
			if (!exists) {
				return false;	
			} else {
				return true;	
			}
		});
};

User.prototype.t = function t() {
	console.log('do a t');
};

exports.User = User;