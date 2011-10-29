
var sys = require("sys"),
	user = require("./lib/User");
	
	
var u = new user.User();
sys.puts(u.userExists('tom@leitchy.com'));