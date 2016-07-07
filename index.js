(function(){
	
	require('./site/index.html')
	require('./site/style.css')
	let Events = require('./events.js')
	"use strict"

	// Change this to get detailed logging from the stomp library
	global.DEBUG = false
	const url = "ws://localhost:8011/stomp"
	const client = Stomp.client(url)

	client.debug = function(msg) {
	  if (global.DEBUG) {
	    console.info(msg)
	  }
	}
	let events = new Events();

	/*
	 * Store the recent and previous 'lastChangeBid'
	 * and compare them
	 */
	let compare = [];

	function connectCallback(data) {
	  	client.subscribe("/fx/prices", (data) => {
	  		events.publish('fxData',JSON.parse(data.body));
	  	});
	}
	client.connect({}, connectCallback, (error) => { alert(error.headers.message)})

	/**
	 * Create and append DOM elements 
	 * @param  {[type]} domElement    DOM element to be create]
	 * @param  {[type]} className     Class name to add to DOM element]
	 * @param  {[type]} parentElement The name of the parent element to append the new child to
	 */
	function createAndAppendElement(domElement,className,parentElement){
		let element = document.createElement(domElement);
		element.classList.add(className);
		let _parentElement = document.querySelector(parentElement);
		_parentElement.appendChild(element);
	}

	/**
	 * Creates TD DOM elements added in the text node of the data object
	 * and appends it to the row
	 * @param  {[Array]} tableBody Table body element
	 * @param  {[Array]} rowNames  Array of items from the data object
	 */
	function createTableDataItems(tableBody,rowNames,arr){
		rowNames.forEach((item) => {
			let td = document.createElement('TD');
			let textNode = document.createTextNode(item);
			td.appendChild(textNode);
			let trClass = '.'+ rowNames[0];
			tableBody.querySelector(trClass).appendChild(td);	
		})
		getCurrentTableRow(tableBody)
	}

	/**
	 * Compares the previous set of data to the current set
	 * and returns a match or in other words compares 2 arrays and returns the difference
	 * @param  {[Array]} a The array we want to comopare
	 * @return {[Array]}   Returns a new array only containing the elements that have changed
	 */
	Array.prototype.compareArrays = function(a){		
		if(typeof a === 'undefined' || this.length != a.length) return false;
		var j;
	  	for(var i =0;i<this.length;i++){
	    	j = a.indexOf(this[i]);
	    	if(j != -1) {
				a.splice(j, 1);
	    	}
	  	}
	  	return a; 
	};

	/**
	 * Find the newest changed lastChangeBid element in our current table and 
	 * shift it to the top of the table
	 * @param  {[Array]} elem     Array containing 1 string of the lastChangeBid
	 * @param  {[Array]} tableBody Table body element
	 */
	function findAndMoveRowElement(elem,tableBody){
		return new Promise((resolve,reject) =>{
			let td = tableBody.querySelectorAll('td');
			let row;
			[].forEach.call(td,function(item){
				if(elem[0] === item.innerHTML){
					row = item.parentNode;
					row.classList.add('changed');
					tableBody.insertBefore(row, tableBody.firstChild);
				}
			});
			//Remove the changed class after half a sec
			if(typeof row != 'undefined') setTimeout(() =>{ resolve(row) },500);
		})
	}

	/**
	 * Get previous and current table row, compare them 
	 * to see if they have changed to then find and move it to the top
	 * @param  {[Array]} tableBody Table body
	 */
	function getCurrentTableRow(tableBody){
		let tr = tableBody.querySelectorAll('tr');
		let arr = [].map.call(tr,(item) =>{
			return item.querySelectorAll('td')[6].innerHTML;
		});

		compare.push(arr);
		let a = compare.slice(Math.max(compare.length -2, 0));
		let result = a[0].compareArrays(a[1]);
		findAndMoveRowElement(result,tableBody)
		.then((row) => { row.classList.remove('changed') })
	}

	/**
	 * Build up the table as the data is brought back from the stomp server
	 * added new rows and updating exiting rows
	 * @param  {[object]} data    Data from stomp server 
	 * @param  {[Array]} tableBody Table body
	 */
	function createTableDataRow(data,tableBody){
		let rowNames = [];
		for(var obj in data){
			rowNames.push(data[obj]);
		}
		rowNames.forEach((item,i,arr) =>{
		 	if (tableBody.querySelector('.'+arr[0]).childNodes.length > 0) {
		 		//Update row
		 	    let node = tableBody.querySelector('.'+arr[0]);
		 	   	node.querySelectorAll('td').forEach(function(item){
		 	   	item.parentNode.removeChild(item);
		 	   });
		 	   createTableDataItems(tableBody,rowNames)	    
		 	} else {
		 		//Add row
			 	createTableDataItems(tableBody,rowNames)
		 	}		
		});
	}

	/**
	 * Create table rows
	 * @param  {[object]} data data object from stomp server
	 */
	function createTableRows(data){
		let tableBody = document.querySelector('.table-body');
		let tr;
		let className;
		for (var obj in data){
			className = '.'+ data.name;
			if(tableBody.querySelector(className) === null){
				tr = document.createElement('TR');
				tr.classList.add(data.name);	
				tableBody.appendChild(tr);
			}
		}
		if(tableBody.querySelector(className) != null){
			createTableDataRow(data,tableBody)
		}
	}

	/**
	 * Create table header
	 * @param  {[object]} data 	Data object from stomp server containing FX currency pairs
	 */
	function createTableHeader(data){		
		if(document.querySelector('.table-head-tr') === null){
			let td;
			let textNode;		
			createAndAppendElement('tr','table-head-tr','.table-head');
			let tableHead = document.querySelector('.table-head-tr');
			for(var obj in data){
				td = document.createElement('TD');
				textNode = document.createTextNode(obj);
				td.appendChild(textNode);
				tableHead.appendChild(td);
			}
		}
	
	}
	
	function init(){
		events.subscribe('fxData',(data) => {
			createTableHeader(data)
			createTableRows(data)
		});

		//Create table and child elements
		createAndAppendElement('table','fx-table','.content');
		createAndAppendElement('thead','table-head','.fx-table');
		createAndAppendElement('tbody','table-body','.fx-table');
		
	}
	/**
	 *  Check if the document supports querySelector
	 */
	if ('querySelector' in document) {
	  init();
	}
})();