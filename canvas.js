// JavaScript Document

var Canvas = function(el,opts) {
	
	this.opts = $.extend({
		
		'draggable' : true,
		'widgetClass' : 'widget',
		'hoverClass' : 'over',
		'unit' : 100
		
	},opts);
	
	
	this.el = $(el);
	this.width = $(el).width();
	this.height = $(el).height();
	this.widgets = {};
	this.widgetsCount = 0;
	this.widgetsOpened = [];
	this.widgetsClosed = [];
	
	this.refreshGrid();
	
	console.log(this.grid);
	
};

Canvas.prototype = {
	
	
	
	'addWidget' : function(name, widget) {
		
		this.widgets[name] = {
			'name' : name,
			'el' : $(widget).addClass(this.opts.widgetClass),
			'closed' : $(widget).is('.small')
		};
		this.widgetsCount++;
		
		this.el.append(this.widgets[name].el);
		
		if(this.widgets[name].closed) {
			this.widgetsClosed.push(this.widgets[name]);
		} else {
			this.widgetsOpened.push(this.widgets[name]);
		}
		
	},
	
	'removeWidget' : function(name) {
		
		if(this.widgets[name].closed) {
			var widgetsClosed = [];
			for(var i = 0; i < this.widgetsClosed; i++) {
				if(this.widgetsClosed[i].name != name) widgetsClosed.push(this.widgetsClosed[i]);
			}
			this.widgetsClosed = widgetsClosed;
		} else {
			var widgetsOpened = [];
			for(var i = 0; i < this.widgetsOpened; i++) {
				if(this.widgetsOpened[i].name != name) widgetsOpened.push(this.widgetsOpened[i]);
			}
			this.widgetsOpened = widgetsOpened;
		}
		
		this.widgets[name] = null;
		this.widgetsCount--;
		
		
	},
	
	'moveWidget' : function($widget,top,left) {
		if(!$widget.is('.absolute')) {
			$widget.addClass('absolute');
		}
		
		$widget.animate({
			'top': top,
			'left': left
		},300);
	},
	
	'makeDraggable' : function($widget) {
		
		$widget.draggable({
			grid: [50, 50],
			opacity: 0.8,
			revert: 'invalid',
			snap: true,
			zIndex: 2000,
			containment: this.el
		});
		
		var self = this;
		$widget.droppable({
			accept: '.widget',
			greedy: true,
			addClasses: false,
			hoverClass: this.opts.hoverClass,
			tolerance: 'pointer',
			drop: function(e,ui) {
				var destination = $(this).attr('rel');
				var origin = $(ui.draggable).attr('rel');
				
				var originIndex = -1;
				var destinationIndex = -1;
				for(var i = 0; i < self.widgetsOpened.length; i++) {
					if(self.widgetsOpened[i].name == destination) {
						destinationIndex = i;
					}
					if(self.widgetsOpened[i].name == origin) {
						originIndex = i;
					}
				}
				var dest = self.widgetsOpened[destinationIndex];
				self.widgetsOpened.splice(destinationIndex,1,self.widgetsOpened[originIndex]);
				self.widgetsOpened.splice(originIndex,1,dest);
				
				self.refresh();
			}
		});
	},
	
	'notDraggable' : function($widget) {
		$widget.draggable('destroy');
		$widget.droppable('destroy');
	},
	
	'refreshGrid' : function() {
		
		this.cols = Math.floor(this.width/this.opts.unit);
		this.rows = Math.floor(this.height/this.opts.unit);
		var grid = [];
		for(var i = 0; i < this.rows; i++) {
			grid[i] = [];
			for(var ii = 0; ii < this.cols; ii++) {
				grid[i][ii] = false;
			}
		}
		
		this.grid = grid;
		
	},
	
	'createRow' : function(row) {
		this.grid[row] = [];
		for(var jjj = 0; jjj < this.grid[0].length; jjj++) {
			this.grid[row][jjj] = false;
		}
		this.rows = this.grid.length;
	},
	
	'refresh' : function() {
		
		this.width = this.el.width();
		this.height = this.el.height();
		
		this.refreshGrid();
		
		for(var z = 0; z < this.widgetsOpened.length; z++) {
			
				console.log(this.widgetsOpened[z].name);
				var $widget = this.widgetsOpened[z].el;
				
				var cols = Math.ceil($widget.width()/this.opts.unit);
				var rows = Math.ceil($widget.height()/this.opts.unit);
				var pos = this.getFreePosition(rows,cols);
				
				this.fillGrid(pos,rows,cols);
				console.log(this.grid);
				
				this.moveWidget($widget, pos.top.px, pos.left.px);
				if(this.opts.draggable) this.makeDraggable($widget);
				
		}
		
		
		var lastFreeRow = this.getLastFreeRow();
		console.log('lastFreeRow : ',lastFreeRow);
		
		var closedRows = Math.ceil(this.widgetsClosed.length/this.cols);
		var i = 0;
		var nextRow = 0;
		for(var z = 0; z < this.widgetsClosed.length; z++) {
			
			var $widget = this.widgetsClosed[z].el;	
			if(this.opts.draggable) this.notDraggable($widget);
			
			var row = (lastFreeRow > 0 ? (lastFreeRow-1):0)+nextRow;
			if(typeof(this.grid[row]) == 'undefined') this.createRow(row);
			var freeCount = this.getRowFreeColCount(row);
			if(freeCount == 0) {
				row++;
				nextRow++;
				if(typeof(this.grid[row]) == 'undefined') this.createRow(row);
			}
			
			var cols = Math.ceil($widget.width()/this.opts.unit);
			var rows = Math.ceil($widget.height()/this.opts.unit);
			var pos = this.getRowFreePosition(row,rows,cols);
			
			this.fillGrid(pos,rows,cols);
			this.moveWidget($widget, pos.top.px, pos.left.px);
			
		}
		
		//console.log('closedWidgets');
		//console.log(this.widgetsClosed);
		
		this.adjustHeight();
		
		
	},
	
	'adjustHeight' : function() {
		
		var lastUsed = this.getLastUsedRow();
		
		var minHeight = (lastUsed+1)*this.opts.unit;
		if(minHeight > this.el.height()) {
			this.el.height(minHeight+5);
		} else if(minHeight < (this.el.height()-5)) {
			this.el.height(minHeight+5);
		}
		
	},
	
	'getFreePosition' : function(rows,cols) {
		
		for(var i = 0; i < this.rows; i++) {
			var pos = this.getRowFreePosition(i,rows,cols);
			if(pos != null) {
				return pos;
			}
		}
		
		return {
			'top' : {
				'px' : (i*this.opts.unit)+'px',
				'unit' : i
			},
			'left' : {
				'px' : 0+'px',
				'unit' : 0
			}
		};
		
	},
	
	
	'getRowFreePosition' : function(row,rows,cols) {
		
		col:
		for(var ii = 0; ii < this.cols; ii++) {
			if(this.grid[row][ii] === true) {
				continue col;
			}
			
			for(var j = 0; j < rows; j++) {
				if(typeof(this.grid[row+j]) == 'undefined') {
					this.grid[row+j] = [];
					for(var jjj = 0; jjj < this.grid[0].length; jjj++) {
						this.grid[row+j][jjj] = false;
					}
					this.rows = this.grid.length;
				}
				for(var jj = 0; jj < cols; jj++) {
					if(typeof(this.grid[row+j][ii+jj]) == 'undefined') {
						continue col;
					}
					if(this.grid[row+j][ii+jj]) {
						continue col;
					}
				}
			}
			
			return {
				'top' : {
					'px' : (row*this.opts.unit)+'px',
					'unit' : row
				},
				'left' : {
					'px' : (ii*this.opts.unit)+'px',
					'unit' : ii
				}
			};
			
		}
		
		return null;
		
	},
	
	
	'fillGrid' : function(pos,rows,cols) {
		for(var i = 0; i < rows; i++) {
			for(var ii = 0; ii < cols; ii++) {
				if(typeof(this.grid[i+pos.top.unit]) == 'undefined') this.grid[i+pos.top.unit] = [];
				this.grid[i+pos.top.unit][ii+pos.left.unit] = true;
			}
		}
	},
	
	'getLastFreeRow' : function() {
		var lastFreeRow = 0;
		for(var i = 0; i < this.rows; i++) {
			for(var ii = 0; ii < this.cols; ii++) {
				if(this.grid[i][ii]) {
					lastFreeRow = i+1;
				}
			}
		}
		
		return lastFreeRow;
		
	},
	
	'getLastUsedRow' : function() {
		var lastUsed = null;
		for(var i = 0; i < this.grid.length; i++) {
			for(var ii = 0; ii < this.grid[i].length; ii++) {
				if(this.grid[i][ii] === true) {
					lastUsed = i;	
				}
			}
		}
		if(lastUsed == null) {
			lastUsed = 0;
		}
		return lastUsed;
		
	},
	
	'getRowFreeColCount' : function(row) {
		var freeCount = 0;
		for(var ii = 0; ii < this.grid[0].length; ii++) {
			if(!this.grid[row][ii]) {
				if(typeof(this.grid[row][ii]) == 'undefined') {
					this.grid[row][ii] = false;
				}
				freeCount++;
			}
		}
		
		return freeCount;
		
	}
	
	
	
};