var express = require('express'); //Express 是最小又靈活的 Node.js Web 應用程式架構
var app = express();
var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient; 
var mqtt = require('mqtt'); //is a client library for the MQTT protocol.
var mongoUrl = 'mongodb://yizhen:jenny0728@ds151180.mlab.com:51180/dbtest';
var bodyParser = require('body-parser');
var mqttDB = require('./mqttDB.js')
var split = require('split-string');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var myDB;
var t ;
var options = {
    port: 15601,
    host: 'mqtt://m23.cloudmqtt.com',
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
    username: 'qgxusvba',
    password: 'O0QPhjo5O9eb',
    keepalive: 60,
    reconnectPeriod: 1000,
    protocolId: 'MQIsdp',
    protocolVersion: 3,
    clean: true,
    encoding: 'utf8'
};

MongoClient.connect(mongoUrl, { useNewUrlParser: true }, function (err, client) {
			if(err) throw err;
			else{
				myDB = client.db('dbtest');
				//Write databse Insert/Update/Query code here..
				console.log('mongodb is running!');
			}  
		});
//MQTT Connect
var client = mqtt.connect('mqtt://m23.cloudmqtt.com', options);

client.on('connect', function() { // When connected
    console.log('MQTT Connected');
    // subscribe to a topic
    client.subscribe('RaspBerry');
    client.subscribe('RaspBerry/paid');
    // when a message arrives, do something with it

});
client.on('message', function(topic, msg) {
	if(topic === 'RaspBerry'){
		var splitMessage = split(msg.toString(),{ separator: ',' });
            var inLicense = splitMessage[0];
            var inParkNum = splitMessage[1];
            console.log(inLicense);
            console.log(inParkNum);
            t = {LicensePlate: inLicense,ParkNum: inParkNum};

            //DB insert
            myDB.collection('find').insertOne(t, function(err, res){          
            
            if(err) throw err;
            console.log('insert success:');
            });
	}
	if(topic === 'RaspBerry/paid'){
		console.log(msg.toString());
		myDB.collection('QRCode',function(err,collection){
			collection.find({Pay:"Y"}).toArray(function(err,items){
            if(err) {
            	client.publish('RaspBerry/back',"0",{qos:1},function(err){
                if(err) throw err;
            })

            }
            else{
            	client.publish('RaspBerry/back',"Y",{qos:1},function(err){
            		if(err) throw err;
            	});
            }
        });
		});
	};    
});
var qrDB;

//reservation insert
app.get('/api/insert', function(req, res){
	var strlicense = req.query.license;
	console.log(strlicense);
	var strtime = req.query.time;
	console.log(strtime);

	myDB.collection("Reservation", function(err, collection){
		if(err) throw err;
		collection.insertOne({LicensePlate:strlicense,ReservationTime:strtime});
		res.status(200).end();
	});
});

//order insert
app.get('/api/order_insert', function(req, res){
	var strlicense = req.query.license;
	console.log(strlicense);
	var parking_space = 
	console.log(parking_space);

	myDB.collection("Order", function(err, collection){
		if(err) throw err;
		collection.insertOne({LicensePlate:strlicense, parking_space:parking_space});
		res.status(200).end();
	});
});
//Order finish query
app.get('/api/queryOrder', function(req,res){
	var queryLicense = req.query.license;
	myDB.collection("LicensePlate",function(err,collection){
        collection.find({LicensePlate:queryLicense}).toArray(function(err,items){
            if(err) throw err;
            console.log(items);
            res.send(items).end();
        });
    });
})
//change reservation
app.get('/api/update', function(req, res){
	var strlicense = req.query.license;
	var strtime = req.query.time;
	myDB.collection("Order", function(err, collection){
		collection.find({LicensePlate:strlicense}).toArray(function(err,items){
			if(err) throw err;
			collection.update({LicensePlate:strlicense},{$set:{TimeReservation:strtime}},{w:1}, function(err,result){
				if(err) throw err;
				res.send(strtime).end();
			});
			
		});
	});
});

//delete reservation
app.get('/api/delete', function(req,res){
	var strlicense = req.query.license;
	console.log(strlicense);
	myDB.collection("Order", function(err,collection){
		collection.remove({LicensePlate:strlicense},{w:1},function(err,items){
			if(err) throw err;
			res.send(strlicense).end();
		});
	});
});

//Scan insert
app.get('/api/insertScan', function(req, res){
	var QrScan = {LicensePlate: req.query.license, Time: req.query.time, Pay: "N"}
	var passScan = req.query.license;
	myDB.collection('QRCode').insertOne(QrScan, function(err, result){
		if(err){
			res.status(400).send(err).end();
		}
		else{
			console.log('insert success');
			res.send('scan insert success');
			res.status(200).end();
		}
	})
	mqttDB.mqtt(passScan);
})

//payInfo query
app.get('/api/payquery', function(req, res){
	var checkLi = req.query.check;
	var checkTi = req.query.time;
	myDB.collection("QRCode",function(err,collection){
        collection.find({LicensePlate:checkLi,Time:checkTi}).toArray(function(err,items){
            if(err) throw err;
            console.log(items);
            res.send(items).end();
        });
    });
})

//pay change
app.get('/api/paycheck', function(req, res){
	var payLic = req.query.license;
	myDB.collection("QRCode",function(err,collection){
        collection.updateOne({LicensePlate:payLic},{$set:{Pay:"Y"}},{w:1}, function(err, result){
        	if(err) throw err;
        	console.log('Document Updated Successfully');
        });
    });
});


//ppsition query
app.get('/api/PosQuery', function(req, res){
	var checkLi = req.query.check;
	myDB.collection("find",function(err,collection){
        collection.find({LicensePlate:checkLi}).toArray(function(err,items){
            if(err) throw err;
            console.log(items);
            res.send(items).end();
        });
    });
})





const port = process.env.PORT || 8080;

app.listen(port);





