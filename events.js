'use strict';

 function Events(){
	this.topics = {}
};

Events.prototype.subscribe = function(topic,listener){
	if(!hasOwnProperty.call(this.topics,topic)){
		this.topics[topic] = [];
	}

	this.topics[topic].push(listener) -1;
};


Events.prototype.publish = function(topic,data){
	if(!hasOwnProperty.call(this.topics,topic)){
		return;
	}
	this.topics[topic].forEach(function(item){
		item(data != undefined ? data : {});
	});
};

module.exports = Events;