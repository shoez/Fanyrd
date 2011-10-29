
/**
 * Module dependencies.
 */

var express = require('express');
	app = module.exports = express.createServer(),
	io = require('socket.io').listen(app),
	sys = require("sys"),
	redis = require("redis-node"),
	nbs = require('./base60');
	OAuth = require('ciaranj-node-oauth-99e6259').OAuth,
	MemStore = require('express/node_modules/connect/lib/middleware/session/memory'),
	events = require('events');
	
	
var eventEmitter = new events.EventEmitter();
	
var _twitterConsumerKey = "SYuJNZz75wxB43eE5qgddg";
var _twitterConsumerSecret = "Pc3mmN4o1uEiws5P55aGIbdKpTjZyn6cz9GVFvj0";

var hostname = process.env.HOSTNAME || '127.0.0.1';
// Express/http server port
var port = parseInt(process.env.PORT) || 8080;

// Redis
var redisClient = redis.createClient(); 


function twitterConsumer() {
	console.log('consumer');
	
  	return new OAuth(
    	"https://twitter.com/oauth/request_token", "https://twitter.com/oauth/access_token", 
    	_twitterConsumerKey, _twitterConsumerSecret, "1.0A", "http://"+hostname+":"+port+"/sessions/callback", "HMAC-SHA1");
}




// Configuration

app.configure(function(){
  	app.set('views', __dirname + '/views');
  	app.set('view engine', 'jinjs');
  	
  	app.use(express.cookieParser());
  	app.use(express.session({store: MemStore({reapInterval: 60000 * 10}) ,  secret: 'is a secret'})); 
	//app.use(express.session({ secret: "fh798HNjiojul00932" }));
	
  	app.use(express.bodyParser());
  	app.use(express.methodOverride());
  	
  	app.use(express.static(__dirname + '/public'));
  	app.set("view options", { layout: false });
	app.use(app.router);
});

app.dynamicHelpers({
  session: function(req, res){
    return req.session;
  }
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

// Routes

app.get('/', function(req, res){
  try {
	  res.render('index.jinjs', {
    	title: 'Slider test'
	  });
  } catch(e) {
     console.log(e);
  }
});


app.get('/register', function(req, res){
	res.render('register.jinjs', {
		title: 'Register to rate',
		fields: {}
	});
});

app.post('/register', function(req, res){

	var fields = {};
	var err = false;

	if (!req.body.name || req.body.name.length < 0 || req.body.name.length > 100) {
		fields['name'] = 'Please enter the name of the talk';
		err = true;
	}
	if (!req.body.twitter) {
		fields['twitter'] = 'Please enter your Twitter username.';
		err = true;
	}
	if (!req.body.minutes || req.body.minutes < 5 || req.body.minutes > 90) {
		fields['minutes'] = 'Must be between 5 and 90 minutes.';
		err = true;
	}
	
	if (err) {
		res.render('register.jinjs', {
    		title: 'Register to rate',
    		fields: fields
	  	});
	} else {
	
		var s = Math.pow(2,32);
        var n = Math.floor(Math.random()*s);
        var talkCode = nbs.numtosxg(n);
        
        // check talkCode doesn't exist
        
        // check if user exists
		redisClient.exists('user:'+req.body.twitter, function userExist(err, exists) {
			if (!exists) {
				 var userDetails = JSON.stringify({
				 	user: req.body.twitter,
				 	date: new Date(),
				 	talksCreated: {},
				 	lastLogin: new Date()
				 });
				
				redisClient.set('user:'+req.body.twitter, userDetails, function (err, exists) {
					if (err) {
						console.log(err);
						throw err;
					}
	    			var talkDetails = JSON.stringify({
	    				name: req.body.name,
	    				created: new Date(),
	    				minutesLong: req.body.minutes,
	    				expires: new Date(), // needs to be changed to Date + minutes
	    				creator: req.body.twitter,
	    				id: talkCode
	    			});
	    			
	    			redisClient.set('talk:'+talkCode, talkDetails, function (err, exists) {
	    				if (err) {
							console.log(err);
							throw err;
						}
	    			});	
	    		});
	    			
			} //if exists
			else {
				var talkDetails = JSON.stringify({
					name: req.body.name,
					created: new Date(),
					minutesLong: req.body.minutes,
					expires: new Date(), // needs to be changed to Date + minutes
					creator: req.body.twitter,
					id: talkCode
				});
				
				redisClient.set('talk:'+talkCode, talkDetails, function (err, exists) {
					if (err) {
						console.log(err);
						throw err;
					}
				});	
			}
		});
		
		
		res.render('register_complete.jinjs', {
    		title: 'Registration complete',
    		talkCode: talkCode,
    		user: req.body.twitter,
    		talkName: req.body.name,
    		minutes: req.body.minutes
	  	});
	}
});


app.get('/sessions/connect', function authWithTwitter(req, res) {
	console.log('/sessions/connect');
	twitterConsumer().getOAuthRequestToken(function getOAuthRequestToken(error, oauthToken, oauthTokenSecret, results) {
    	if (error) {
			res.send("Error getting OAuth request token /sessions/connect : " + sys.inspect(error), 500);
		} else {  
			req.session.oauthRequestToken = oauthToken;
			req.session.oauthRequestTokenSecret = oauthTokenSecret;
			res.redirect("https://twitter.com/oauth/authorize?oauth_token="+req.session.oauthRequestToken);      
		}
	});
});

app.get('/sessions/callback', function(req, res) {
	sys.puts(">>"+req.session.oauthRequestToken);
	sys.puts(">>"+req.session.oauthRequestTokenSecret);
	sys.puts(">>"+req.query.oauth_verifier);
	console.log(req.session);
	console.log(req.query);
	twitterConsumer().getOAuthAccessToken(req.session.oauthRequestToken, req.session.oauthRequestTokenSecret, req.query.oauth_verifier, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
		if (error) {
		  	res.send("Error getting OAuth access token : " + sys.inspect(error) + "["+oauthAccessToken+"]"+ "["+oauthAccessTokenSecret+"]"+ "["+sys.inspect(results)+"]", 500);
		} else {
			req.session.oauthAccessToken = oauthAccessToken;
			req.session.oauthAccessTokenSecret = oauthAccessTokenSecret;
			// Right here is where we would write out some nice user stuff
			twitterConsumer().get("http://twitter.com/account/verify_credentials.json", req.session.oauthAccessToken, req.session.oauthAccessTokenSecret, function (error, data, response) {
				console.log(data);
				if (error) {
			  		res.send("Error getting twitter screen name : " + sys.inspect(error), 500);
				} else {
					//profile_image_url
					//screen_name
					//name
			  		req.session.twitterScreenName = data["screen_name"];    
			  		res.send('You are signed in: ' + req.session.twitterScreenName);
				}  
			});  
		}
	});
});




app.get('/r/:id', function(req, res){
  res.redirect('/rate/' + req.params.id);
});



// toms raiting...
app.get('/rating/:id', function(req, res){


	redisClient.get('rating:'+req.params.id, function(err, rating) {
		if (err) {
			console.log(err);
			throw err;
		}
		
		redisClient.get('clients:'+req.params.id, function(err, clients) {
			if (err) {
				console.log(err);
				throw err;
			}
			res.render('rating.jinjs', {
				title: 'Fischer Price rating',
				rating: (rating / clients)
			});
  		
  		});
  	});

});


app.get('/rate/:id', function(req, res){
  res.render('rate.jinjs', {
    title: 'Get Rating'
  });
});

app.get('/rate/list', function(req, res){
  res.render('list.jinjs', {
    title: 'List all to rate'
  });
});




app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);



/******* socket.io bits */
var globalSocket;
io.sockets.on('connection', function (socket) {

	globalSocket = socket;
	// register ID of client
	socket.on('setClientId', function (id) {
	    socket.set('clientId', id, function () {
	    	// tell the UI that things are nearly ready
      		socket.emit('clientReady');
    	});
  	});
  	
  	// once the client has registered the client id, then it registers the talk
	socket.on('setTalkId', function (id) {
	
		// when the client ID has been registered, then increment the 
		// client counter and tell the UI to start.
	    socket.set('talkId', id, function () {
			redisClient.incr('clients:'+id , function incrClients (err, count) {
				if (err) {
					console.log(err);
					throw err;
				}
				console.log('incr clients now: ' + count);
			});
      		socket.emit('talkReady');
    	});
    	

  	});
  	
	
	setInterval(function() {
		var talkId;
		socket.get('talkId', function (err, id) {
			talkId = id;
    	});
	
		//redisClient.transaction( function getRating() {

			redisClient.get('clients:'+talkId, function(err, count) {
				if (err) {
					console.log(err);
					throw err;
				}
				var clients = count;
				redisClient.get('rating:'+talkId, function(err, rating) {
					if (err) {
						console.log(err);
						throw err;
					}
					// send to the web clients
					socket.emit('rating', JSON.stringify({ s: rating, c: clients }) );
				});
			});
		//});
	}, 300);
	
	socket.on('rate', function (d) {
	
		//redisClient.transaction( function getRating() {
			var clientKey = 'client:'+d.id+':score';
			
			redisClient.get('rating:'+d.t, function(err, v) {
				if (err) {
					console.log(err);
					throw err;
				}
				var rating = v;
				//console.log('RATING> ' + v);

				if (!rating || rating == undefined || rating < 0) {
					rating = 0;
				}
				
				// do delta rating change
				redisClient.get(clientKey, function(err, s) {
					var lastRating = s;
					if (!lastRating || lastRating == undefined) {
						lastRating = 0;
					}
					
					var deltaRating = parseInt(d.s) - parseInt(lastRating);
					rating = parseInt(rating) + deltaRating;
					//console.log('Client Score ID: ' + clientKey, 'Current rating: ' + rating + ', Last Client Rating: ' + lastRating + ', Delta: ' + deltaRating + ', New Rating: ' + d.s);

					redisClient.set('rating:'+d.t, rating, function (err, didSet) { 
						if (err) {
							console.log(err);
							throw err;
						}		

						redisClient.set(clientKey, d.s, function(err, didSet) { 
							if (err) {
								console.log(err);
								throw err;
							}
							//console.log('Client rating ' + clientKey + ' set to: ' + d.s);
						});
						
						//console.log('Global rating set to: ' + rating);
						socket.emit('global.rating', JSON.stringify({rating:rating, didSet: didSet }) );

					});
							
				});				
			});

		//});
		
		
  	});

	socket.on('disconnect', function () {

		socket.get('clientId', function (err, id) {
			if (err) throw err;
			var clientId = id;
			//console.log('Destroying Client ID: ', id);
			
			
			socket.get('talkId', function (err, id) {
				if (err) throw err;
				var talkId = id;
				
				// now destroy the last score provided by the client
				redisClient.transaction( function destroyClient() {
					redisClient.decr('clients:'+talkId, function decClients (err, count) {
						if (err) throw err;

						console.log('dec clients now: ' + count);
						var score = 0;
						var clientKey = 'client:'+clientId+':score';
						
						redisClient.get(clientKey, function(err, s) {
							if (err) throw err;
							score = s;
							//console.log('rating for ' + talkId + ' now...: ' + score);

							// decrement by the last score the client recorded...
							redisClient.decrby('rating:'+talkId, score, function(err, num) {
								if (err) throw err;
								eventEmitter.emit('global.client.disconnect', JSON.stringify({disconnected:clientKey, score:score, talk: talkId }) );
							});
						});
						
					});
		
					
				});
					
			});
			
    	});

    	
  	});
});



/* send global messages to the web clients because you can't 
  call socket.emit() from within a socket.get callback */
eventEmitter.on('global.client.disconnect', function(message){
	if (globalSocket) {
		globalSocket.emit('global.client.disconnect', message);
	}
});

