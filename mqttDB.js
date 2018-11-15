var MongoClient = require('mongodb').MongoClient; 
var mongodb = require('mongodb'); //MongoDB Server.
var mqtt = require('mqtt'); //is a client library for the MQTT protocol.

//MQTT connect
module.exports = {
	mqtt: function(qrString){
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

		//MQTT Connect
        var client = mqtt.connect('mqtt://m23.cloudmqtt.com', options);

        client.on('connect', function() { // When connected
            console.log("Scan publish on");
            // subscribe to a topic
            client.subscribe('Scan');
            client.publish('Scan', qrString,{qos:1},function(err){
                if(err) throw err;
                console.log(qrString+" publish");
            })
        });
    }  
}