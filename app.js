var sys = require('util'),
	rest = require('restler'),
	async = require('async'),
	events = require("events");
var ical = require('./my_node_modules/node-ical/ical');
var cf       = require("./my_node_modules/cloudfoundry");
// MongoDB
var mongoose = require("mongoose"),
    Schema   = mongoose.Schema;

// Express
var express  = require("express");
var app      = express.createServer();
app.configure(function() {
	app.set('running in cloud', cf.isRunningInCloud());
	app.set('view engine', 'ejs');
	app.set('view options', {
	    layout: false
	});	
	console.log('running in cloud ' + cf.isRunningInCloud());
	if(!cf.isRunningInCloud()) {
		// Only use this in public for samples or development
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	}
});

var EventCal = new Schema({
	    list: { type: String },
		timestamp: { type: Date },
	    ical: { type: String }
});
mongoose.model('EventCal', EventCal);

var mongoConfig = cf.getServiceConfig("eventcal");
console.log(mongoConfig);
var db = mongoose.createConnection("mongo://" + mongoConfig.username + ":" + mongoConfig.password + "@" + mongoConfig.hostname + ":" + mongoConfig.port + "/" + mongoConfig.db);

function getFromMongo(req, res) {

	function getCalUrl(item, callback) {
		var res = (item['screen_name'] ? item['screen_name'] : null);
		callback(null, res);
	}

	function getCalData(item, callback) {
		var url = 'http://lanyrd.com/profile/' + item + '/' + item + '.ics';
		rest.get(url).on('complete', function(data) {
			callback(null, data);
		});	
	}

	function parseCal(item, callback) {
		events = ical.parseICS(item);
		res = [];
		for (uid in events) {
			res.push(events[uid]['data']);
		}
		callback(null, res);
	}

	function allICalData(err, icals) {
		cal = [];
		for (e in icals) {
			cal.push(icals[e]);
		}
		updateMongo(cal.join(''));
	}

	function allCalData(err, cals) {
		async.concat(cals, parseCal, allICalData);
	}

	function getCals(err, cals) {
	//	cals = ['chanezon', 'mewzherder'];
		async.map(cals, getCalData, allCalData);
	}

	function getList(tList) {
		console.log('refreshing the list');
		rest.get('https://api.twitter.com/1/lists/members.json?slug=' + tList.list + '&owner_screen_name=' + tList.owner).on('complete', function(data) {
			async.map(data['users'], getCalUrl, getCals);
		});
	}

	function updateMongo(s) {
		var EventCal = db.model("EventCal", EventCal);
		EventCal.findOne({list: tList.toString()}, function (err, data) {
			if (err) {
				throw(err);
			}
			var evCal;
			if (data) {
				evCal = data;
			} else {
				evCal = new EventCal();
				evCal.list = tList.toString();
			}
			evCal.ical = s;
			evCal.timestamp = new Date();
			evCal.save(function (err) {
				if (err) {
					throw(err);
				}
				console.log('new eventcal saved at ' + evCal.timestamp);
			});
		});
	}

	function getCurrentUrl(req) {
		//todo: enhance to handle https
		return 'http://'+ req.headers.host + req.url;
	}

	function getTwitterListUrl(tList) {
		return 'https://twitter.com/#!/' + tList.owner + '/' + tList.list;
	}

	var tList = { 	owner: req.params.owner,
					list: req.params.list};
	tList.toString = function() { return this.owner + '/' + this.list };
	
	console.log(tList);
	var EventCal = db.model("EventCal", EventCal);
	console.log('in getFromMongo');
	EventCal.findOne({list: tList.toString()}, function (err, data) {
		if (err) {
			console.log('error accessing the db ' + err);
			throw(err);
		}
		var ical;
		if (data) {
			now = new Date();
			if (now.getTime() > data.timestamp.getTime() + 5000) {
				console.log('bust cache');
				getList(tList);
			}
			console.log('found events');
			ical = data.ical;
		} else {
			getList(tList);
			//send back empty cal for now
			ical = null;
			console.log('sent empty cal');
		}
		res.contentType('ics');
		res.render('ical', {
			url: getCurrentUrl(req),
			title: 'Aggregated Lanyrd Calendar for Twitter list ' + getTwitterListUrl(tList),
			cal: ical
		});
	});
}

app.get('/cal/:owner/:list', getFromMongo);

app.listen(cf.getAppPort());
