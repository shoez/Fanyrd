
/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

var io = require('socket.io').listen(app);
io.set('transports', ['xhr-polling']); io.set('polling duration', 10);


var data = new Object();

data.conferences = {
	ota2011: {
		name: 'Over The Air 2011',
		location: 'Bletchley Park',
		geo: { lat: -23.32, long: 0.243 },
		from: '2011-09-30 09:00:00',
		to: '2011-10-01 18:00:00'
	}
};

data.talks = {
	'comps': {
		id: 'comps',
		conference: 'ota2011',
		date: '2011-10-01',
		start: '2011-10-01 15:30:00',
		end: '2011-10-01 17:00:00'
	},
};

data.to_process = new Array();

data.live_rating = {
	comps: {
		shoez: [],
		indeox: [],
		aggregate: [],
		totalScore: 0
	},
};

data.user = {
};


data.clients = 0;



// Configuration

app.configure(function(){
  	app.set('views', __dirname + '/views');
  	app.set('view engine', 'jinjs');
  	app.use(express.bodyParser());
  	app.use(express.methodOverride());
  	app.use(app.router);
  	app.use(express.static(__dirname + '/public'));
  	app.set("view options", { layout: true });
	app.use(express.cookieParser());
	app.use(express.session({ secret: "keyboard cat" }));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/view', function(req, res){
  res.render('view.jinjs', {
    title: 'Express'
  });
});


app.get('/', function(req, res){
  res.render('home.jinjs', {
    title: 'All talks'
  });
});

app.post('/talks', function(req, res){

	if (req.body.name == '' || req.body.name == '@') {
		res.redirect('home');
	} else {
		if (req.session === undefined) {
			req.session = {};
		}
		req.session.userId = req.body.name;
		res.render('talks.jinjs', {
    		title: 'All talks',
    		user: req.body.name
  		});
  	}
});


app.post('/talk', function(req, res){

	if (req.body.user == '' || req.body.user == '@') {
		res.redirect('home');
	}
	if (req.body.conference == '' || !req.body.conference) {
		res.redirect('home');
	}
	if (req.body.talk == '' || !req.body.talk) {
		res.redirect('home');
	}	

	var user = req.body.user;
	user = user.replace('@', '');
	data.user[user] = { twitter: req.body.user, name: 'Unknown' };

	data.live_rating[req.body.talk][user] = [];

	res.render('talk.jinjs', {
		title: 'About ' + data.talks[req.params.talk],
	    user: req.body.user,
    	conference: req.body.conference,
    	talk: req.body.talk
  	});
});


app.listen(8154);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);



/******* socket.io bits */

io.sockets.on('connection', function (socket) {
	//io.sockets.emit('clients', { clients: ++data.clients});
	++data.clients;
	//var msg = JSON.stringify({clients: data.clients});
	//socket.broadcast.emit(msg);
	
	
	setInterval(function() {
		socket.broadcast.emit('clients', data.clients);
	}, 1000);
	
	
	setInterval(function() {
		socket.broadcast.emit('live', data.live_rating);
	}, 200);
	
	socket.on('rate', function (d) {
		data.to_process.push(d);
  	});

	socket.on('disconnect', function () {
		data.clients--;
    	socket.broadcast.emit('clients', data.clients);
  	});
});



/****************************/

/* This is the bit that processes the rating for each talk and each user */
var App = function(){};
App.prototype = {

	rateTalk: function(talk, rating) {
		var r = new Resolver();
		console.log('rating', rating, talk);
		
		data.live_rating[rating.id].aggregate.push(rating.r);
		data.live_rating[rating.id].totalScore += rating.r;
		
		if (data.live_rating[rating.id].totalScore > 1) {
			data.live_rating[rating.id].totalScore = 1;
		} else if (data.live_rating[rating.id].totalScore < -1) {
			data.live_rating[rating.id].totalScore = -1;
		}
		//console.log(data.live_rating[rating.id].totalScore);

	},


	updateRating: function(id, userId, secondsSinceStart, ratingArray) {

	},

};



/****************************/



var myApp = new App();

/* Every 200 milliseconds go through the array and add the data ready to be processed */
setInterval(function() {
	while (data.to_process.length){
	    req = data.to_process.pop();
		myApp.rateTalk(data.talks[req.id], req);
	}
}, 100);




var Resolver = function(){};
Resolver.prototype = {
	/* returns seconds since the session started */
	resolveTimestamp: function(timestamp, startTime) {
		var s = parseInt((Date.parse(startTime)) / 1000);
		var c = parseInt((Date.parse(timestamp)) / 1000);
		return c-s;
	},
};



