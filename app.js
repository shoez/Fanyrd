
/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

var io = require('socket.io').listen(app);


var data = new Object();

data.conferences = {
	ota2011: {
		name: 'Over The Air 2011',
		location: 'Bletchley Park',
		geo: { lat: -23.32, long: 0.243 },
		from: '2011-09-30 09:00:00',
		to: '2011-10-01 15:00:00'
	}
};

data.talks = {
	'dv1': {
		id: 'dv1',
		conference: 'ota2011',
		date: '2011-09-30',
		start: '2011-09-30 23:00:00',
		end: '2011-09-30 10:30:00'
	},
};

data.to_process = new Array();

data.live_rating = {
	dv1: {
		shoez: [],
		indeox: [],
		aggregate: [],
		totalScore: 0
	},
};

data.user = {
	shoez: {
		twitter: '@shoez',
		name: 'Tom Leitch'
	},
	indeox: {
		twitter: '@indeox',
		name: 'David Vella'
	}
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
  app.set("view options", { layout: false })
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'Express'
  });
});


app.get('/talk', function(req, res){
  res.render('talk.jinjs', {
    title: 'About ' 
  });
});


app.get('/talk/:id', function(req, res){

  res.render('talk.jinjs', {
    title: 'About ' + data.talks[req.params.id]
  });
});


app.listen(3000);
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
		socket.broadcast.emit('live', data.clients);
	}, 200);
	
	socket.on('rate', function (d) {
		console.log('rate!!');
		console.log(d);
		data.to_process.push(d);
  	});

	socket.on('disconnect', function () {
    	socket.emit('user disconnected');
    	data.clients--;
  	});
});



/****************************/


var App = function(){};
App.prototype = {

	rateTalk: function(talk, userId, timestamp, ratingArray) {

		var r = new Resolver();
		/*var seconds = r.resolveTimestamp(timestamp, talk.start);
		this.updateRating(talk.id, userId, seconds, ratingArray);*/
	},


	updateRating: function(id, userId, secondsSinceStart, ratingArray) {
		/*var halfSeconds = secondsSinceStart * 2;
		var aggregate = 0;
		for (var i = 0; i < ratingArray.length; i++) {
			data.live_rating[id][userId][halfSeconds+i] += ratingArray[i];
			data.live_rating[id]['aggregate'][halfSeconds+i] += ratingArray[i];
			data.live_rating[id].totalScore += ratingArray[i];
		}*/
		
	},

};



/****************************/





var myApp = new App();
setInterval(function() {

	while (data.to_process.length){
	    req = data.to_process.pop();
	    //console.log(req);
	    //console.log(data);
		myApp.rateTalk(data.talks[req.id], req.user, req.timestamp, req.rating);
		console.log('processing req');
	}

}, 200);




var Resolver = function(){};

Resolver.prototype = {
	/* returns seconds since the session started */
	resolveTimestamp: function(timestamp, startTime) {
		var s = parseInt((Date.parse(startTime)) / 1000);
		var c = parseInt((Date.parse(timestamp)) / 1000);
		return c-s;
	},
};



