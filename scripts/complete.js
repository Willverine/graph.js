(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
Object Discription:
Mathematical function object for graph.js
Stores a list of points and an origin point for them to be drawn off from. 
*/

//requiremenets: (require JS)
var point = require("./point.js");


//object declaration:
//takes in an Origin Point object, and a colour
function FDO(o,c) {
    this.origin = o;
    this.data = [];
    this.altdata = null;
    this.method = null;
    this.colour = c;
    this.mousePointIndex = null;
}
//add prototype methods:
FDO.prototype.getX = function (i) { return (this.data[i].x + this.origin.x); };//asusming they are both POINT type objects
FDO.prototype.getY = function (i) { return (this.data[i].y + this.origin.y); };
FDO.prototype.getP = function (i) { return this.data[i]; };
FDO.prototype.getData = function () { var x = []; for (var i = 0; i < this.data.length; i++) { x[i] = [this.data[i].x, this.data[i].y]; } return x; }

//add other utility functions:



//export:
module.exports.FDO = FDO;
//end
},{"./point.js":4}],2:[function(require,module,exports){
/*
This is the graph object that will handle all the drawing and rendering of data.
Create this object, feed the data and provide sizes, etc; and see it drawn and whatnot.
This takes advantage of browserify.js to compile the multiple files into one complete.js
Open source license; anyone can use and reuse as long as credit is given to this original.
@author William Owers 03/12/2016

*/

//REQUIREMENTS used with browserify stuff.
var _ = {};//keeps required elements out of global scope and stuff; better memory management.
_.point = require("./point.js");
_.util = require("./util.js");
_.label = require("./label.js");
_.FDO = require("./dataobject.js");

function graph() {
    this.originPoint = new _.point.Point(0, 0);//point where all point are drawn from on the canvas
    this.mousePoint = new _.point.Point(0, 0);//mouse point
    this.mousePointIndex = null;
    this.mousePointClick = null;//can probably depricate this
    this.limits = { xLeft: -10, xRight: 10, yTop: 10, yBottom: -10, xLen: (this.xRight - this.xLeft), yLen: (this.yTop - this.yBot) };//the values on the axis limits. initialised in the Load function 
    this.showGrid = true;//draw a grid (or not)
    this.drawAxis = true;//draw the axis (or not)
    this.showLabels = true;//whether to put labels on the graph
    this.fillArea = true;
    this.drawLines = true;
    this.snapToPoints = true;
    this.fillColour = "rgba(255,150,0,0.4)";
    this.pointColour = "#ff0000";
    
    this.canvas = _.util.createCanvas(500, 300);
    this.context = this.canvas.getContext("2d");
    this.data = [];//a list of points of x and y values to be drawn sotred in an FDO
    this.labels = [];

    //Timing events are local to a graph.
    this.now;
    this.then = Date.now();
    this.delta;

    //utility functions:
    this.getXPoint = function (p, k) {
        if (p != undefined) {
            //k is the INDEX of the dataset it is working off; ie: graph.data[k]
            if (k != undefined) {
                return (p * this.xUnits) + this.xOffset + (this.data[k].origin.x * this.xUnits);
            }
            return (p * this.xUnits) + this.xOffset + (this.data[0].origin.x * this.xUnits);
        }
    }

    this.getYPoint = function (p,k) {
        if (p != undefined) {
            //same above
            if (k != undefined) {
                return (p * this.yUnits) + this.yOffset + (this.data[k].origin.y * this.yUnits);
            }

            return (-(p * this.yUnits) + this.yOffset + (-this.data[0].origin.y * this.yUnits));
        }
    }
}

//these methods are protyped so they are used by All instances of this object. 
graph.prototype.load = function (limits, data) {
    var that = this;
    initialiseAxis(this, limits);
    loadData(this, data);
    this.canvas.addEventListener("mousemove", function (event) { getMouse(event, that); }, false);
    this.canvas.addEventListener("mousedown", function (event) { getMouseClick(event, that); }, false);
    this.canvas.addEventListener("mouseup", function (event) { getMouseUp(event, that); }, false);
    initDrawLoop(this);
    this.context.font = "14px Georgia";
    this.context.textAlign = "center";
    //if the graph is resized or length/width increased or whatever these need to be reset (else it will be wrong);
    this.xOffset = this.canvas.width / 2;
    this.yOffset = this.canvas.height / 2;
    this.xUnits = this.canvas.width / this.limits.xLen;
    this.yUnits = this.canvas.height / this.limits.yLen;
    
}

graph.prototype.update = function () {
    dataUpdate(this);
}

graph.prototype.draw = function () {
    drawAxis(this);
    drawGrid(this);
    drawLabels(this);
    drawData(this);
    drawTooltips(this);
    drawTextBox(this);
}

graph.prototype.newLabel = function (x,y,text) {
    //this function should produce a label with given inputs x,y,and text. (or like text item)
    this.labels.push(new _.label.Label(x, y, text));
}



//UPDATE TIMING ITEMS ARE NOW LOCAL TO THE OBJECT
//functions used by the graph object:
//draws at the FPS rate (taking into account the overhead from other functions)
//creates the update/draw looping on that objects canvas at that set FPS rate.
//This means any updates to data or mouse or anything placed in the objects update state will automatically show. 
//It can also be interrupted/paused so that it will only update on events for example (if performance becomes an issue)
var fps = 30;//controls the number of times a second this is refreshed; high for lower performance but smoother operation
var interval = 1000 / fps;//interval time
function initDrawLoop(obj) {
    requestAnimationFrame(function () { initDrawLoop(obj); });//requests the browser to draw a frame before the next repaint.
    obj.now = Date.now();
    obj.delta = obj.now - obj.then;
    if (obj.delta > interval) {//for FPS setting
        obj.then = obj.now - (obj.delta % interval);
        obj.context.clearRect(0, 0, obj.canvas.width, obj.canvas.height);//wipe the display
        //---------- add the actual content to be drawn:
        obj.draw();
        obj.update();
    }
}




//takes a reference to the object being modified and the limits of the graph. 
function initialiseAxis(obj, lims) {
    //lims to be an array 4 items long corresponding to the xLeft, xRight, yTop, yBottom values
    obj.limits.xLeft = lims[0];
    obj.limits.xRight = lims[1];
    obj.limits.yTop = lims[3];
    obj.limits.yBottom = lims[2];
    obj.limits.xLen = lims[1] - lims[0];
    obj.limits.yLen = lims[3] - lims[2];
}


//takes data and feeds it into the objects data list;
function loadData(obj, data, lab) {
    //data should be a lsit of Points to be drawn. (Coordinates of the graph)
    //obj.data = data;
    //obj.labels.push(lab);//adds the label to the list of labels DO LATER? MAYBE NOT NECESSARY
    //this Should actually take a normal array and convert it to the point type. 
    //so like input of data like [[1,0],[2,3],[5,2],etc];
    //so like input of data like [ [[1,0],[2,3],[5,2]], [[x,y],[x,y],[x,y]], etc ];
    var colourTable = ["#FF0000", "#00FF00", "#0000FF"];
    for (var i = 0; i < data.length; i++) {
        var TempD = new _.FDO.FDO(new _.point.Point(0, 0), colourTable[i]);//FDO is the data object, initialises the point(0,0) for the origin to draw off
        for (var j = 0; j < data[i].length; j++) {
            TempD.data.push(new _.point.Point(data[i][j][0], data[i][j][1]));
        }
        obj.data.push(TempD);//then add this new FDO to the actual graph itself
    }
}


//mousePosition event makes sure the mouse values aren't affected by the movement of the window and updates the objects mouse coordinates
function getMouse(event,obj) {//updates mouse x and y
    var rect = obj.canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    obj.mousePoint.x = x;
    obj.mousePoint.y = y;
    //loop through each data object
    for (var i = 0; i < obj.data.length; i++) {
        if (event.which == 1 && obj.data[i].mousePointIndex != null) {
            //assuming the user is clicking and holding, and is over a point on the graph:
            if (obj.snapToPoints) {//will snap to rounded points
                obj.data[i].getP(obj.data[i].mousePointIndex).x = Math.round((x - obj.xOffset - (obj.data[i].origin.x * obj.xUnits)) / obj.xUnits);
                obj.data[i].getP(obj.data[i].mousePointIndex).y = Math.round(-(y - obj.yOffset - (-obj.originPoint.y * obj.yUnits)) / obj.yUnits);
            } else {
                obj.data[i].getP(obj.data[i].mousePointIndex).x = (x - obj.xOffset - (obj.data[i].origin.x * obj.xUnits)) / obj.xUnits;
                obj.data[i].getP(obj.data[i].mousePointIndex).y = -(y - obj.yOffset - (-obj.originPoint.y * obj.yUnits)) / obj.yUnits;
            }
        } else {
            obj.data[i].mousePointIndex = null;
        }
    }
    //TRANSLATION
    if (event.which == 3) {
        if (obj.snapToPoints) {
            if (event.movementX < 2) {
                obj.data[0].origin.x += Math.round(event.movementX);
            }
        } else {
            obj.data[0].origin.x += event.movementX / 10;

        }
    }
}


function getMouseClick(event, obj) {//can this be depricated
    var rect = obj.canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
}

function getMouseUp(event, obj) {
    for (var i = 0; i < obj.data.length; i++) {
        obj.data[i].mousePointIndex = null;//reset all mousePointIndex's
    }
}


function dataUpdate(obj) {
	//this function is NOW necessary for applying transformations to data. 
	//give a datasetobject a modifier function (and original data function)
	//during update HERE run that function over its original dataset again (to its normal dataset).
	//should check for changes somehow; maybe through some flag or something.
    //console.log(obj.data[0].altdata);
    if (obj.data[0].altdata != null && obj.data[0].method != null) {
        //so for this dataset, it has an alternative dataset and a method attached.
        //what should happen is the altdata should be run through the method function and produce the actual data.
        obj.data[0].method();
    }

}


//draw the axis on the canvas. 
//CURRENTLY this will not be drawn off the origin points; this is so the function itself can be translated along the graph; rather than moving the graph around.
function drawAxis(obj) {
    if (obj.drawAxis) {
        var ctx = obj.context;
        ctx.strokeStyle = "#000000";
        ctx.beginPath();
        ctx.moveTo(obj.xOffset, 0);
        ctx.lineTo(obj.xOffset, obj.canvas.height);
        ctx.moveTo(0, obj.yOffset);
        ctx.lineTo(obj.canvas.width, obj.yOffset);
        ctx.stroke();
    }
}


//draw the grid along each x and y value. 
function drawGrid(obj) {
    //draw grey grid lines
    if (obj.showGrid) {
        var ctx = obj.context;
        ctx.fillStyle = "rgba(80,80,80,0.4)";
        //now need to loop through the units we need to print items for:
        for (var i = obj.limits.xLeft; i < obj.limits.xRight; i++) {
            //loops through each unit on the x axis
            ctx.fillRect((obj.xUnits * i) + obj.xOffset, 0, 1, obj.canvas.height);
        }
        //now same for yAxis
        for (var i = obj.limits.yBottom; i < obj.limits.yTop; i++) {
            //loops through each unit on the y axis
            ctx.fillRect(0, (obj.yUnits * i) + obj.yOffset, obj.canvas.width, 1);
        }
    }
}


//draw the tooltips like if mosue is over a point print its given text value.
function drawTooltips(obj) {
    for (var i = 0; i < obj.data.length; i++) {
        if (obj.data[i].mousePointIndex != null) {
            var p = obj.data[i].getP(obj.data[i].mousePointIndex);
            var pX = Math.round(obj.data[i].getX(obj.data[i].mousePointIndex)*10)/10;
            var pY = Math.round(obj.data[i].getY(obj.data[i].mousePointIndex));
            obj.context.strokeStyle = "#000000";
            obj.context.beginPath();//remove this line if i want to highlight the lines (redrawing them or whatever) when mouse overing
            obj.context.rect(obj.getXPoint(p.x,i) - 15, obj.getYPoint(p.y) - 20, 30, 16);
            obj.context.fillStyle = "#000000";
            obj.context.fillText((pX + obj.originPoint.x) + ", " + (pY + obj.originPoint.y), obj.getXPoint(p.x,i), obj.getYPoint(p.y) - 10);
            //TODO: 
            //check if it is a NEGATIVE y value and if so draw this tooltip thing Below the line instead of above (is neater)
            obj.context.stroke();
        }
    }
}


function drawLabels(obj) {
    if (obj.drawAxis) {
        var ctx = obj.context;
        ctx.fillStyle = "#000000";
        //now need to loop through the units we need to print items for:
        //on the x axis we want vertical 'ticks' and on the y axis we want horizontal 'ticks' say 9 pixels long (?)
        for (var i = obj.limits.xLeft; i < obj.limits.xRight; i++) {
            //loops through each unit on the x axis
            //fill a rect (1 pix thin so a line) just above the point on the line till just below it
            ctx.fillRect((obj.xUnits * i) + obj.xOffset, -4 + obj.yOffset, 1, 9);//negative - value so it is the right side of the axis
            ctx.fillText(i, (obj.xUnits * i) + obj.xOffset, 15 + obj.yOffset);
        }
        //now same for yAxis
        for (var i = obj.limits.yBottom; i < obj.limits.yTop; i++) {
            //loops through each unit on the y axis
            ctx.fillRect(obj.xOffset - 4, (obj.yUnits * i) + obj.yOffset, 9, 1);
            ctx.fillText(-i, obj.xOffset + 15, (obj.yUnits * i) + obj.yOffset + 4);
        }
    }
}


function drawData(obj) {
    var ctx = obj.context;
    var numMPI = 0;//this is just to test for overlapping points
    //with these: to draw a point, place a dot at 0,1 units it would be drawn on pixels:
    //x = (xOffset + (0 * xUnits);   y = yOffset + (1 * yUnits)
    //which is gained through the function obj.getXPoint(p); or obj.getYPoint(p)
    var currentLineWidth = obj.context.lineWidth;
    //loop through the data in the obj
    for (var k = 0; k < obj.data.length; k++) {
        var d = obj.data[k];
        if (obj.drawLines) {
            //FOR LINES: this assumes left most point on the graph is hte first in the array, and right most point is the last in the array
            ctx.beginPath();
            var p = d.getP(0);
            ctx.moveTo(obj.getXPoint(p.x,k), obj.getYPoint(p.y));
            ctx.strokeStyle = d.colour;
            for (var i = 1; i < d.data.length; i++) {
                var p = d.getP(i);//point = the item at d's index
                ctx.lineTo(obj.getXPoint(p.x,k), obj.getYPoint(p.y));
            }
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.lineWidth = currentLineWidth;
            //move from the last point of the array to the x axis and complete the shape then fill it if necessary
            ctx.lineTo(obj.getXPoint(d.getP(d.data.length - 1).x,k), 0 + obj.yOffset);
            ctx.lineTo(obj.getXPoint(d.getP(0).x,k), 0 + obj.yOffset);
            ctx.closePath();
            if (obj.fillArea) {
                ctx.fillStyle = obj.fillColour;
                ctx.fill();
            }
        }
        //then draw the Points themselves (This is done after shading so they are therefore drawn above the shaded area)
        ctx.fillStyle = obj.pointColour;
        for (var i = 0; i < d.data.length; i++) {
            //for each data item, draw it to the canvas as a point
            var p = d.getP(i);//point = the item at d's index
            //FOR DOT POINT
            ctx.fillRect(obj.getXPoint(p.x,k) - 2, obj.getYPoint(p.y) - 2, 4, 4);//draws a rect at point t,t of size 4,4
            //check if the mouse point is Near one of these particular points: if so set the mousePointIndex to this i value.
            var ix = obj.getXPoint(p.x,k);
            var iy = obj.getYPoint(p.y);
            if (obj.mousePoint.x > (ix - 8) && obj.mousePoint.x < (ix + 8) && obj.mousePoint.y > (iy - 8) && obj.mousePoint.y < (iy + 8)) {
                //this means current point is within 16 pixels of a point:
                if (numMPI <= 0) {
                    obj.data[k].mousePointIndex = i;
                    numMPI++;
                }
            }
        }
    }
}


function drawTextBox(obj) {
    //should draw each label in the labels list
    if (obj.labels.length > 0) {
        for (var i = 0; i < obj.labels.length; i++) {
            obj.context.fillStyle = "#000000";
            obj.context.fillText(obj.labels[i].text(), obj.labels[i].point.x, obj.labels[i].point.y);
        }
    }
}

module.exports.graph = graph;
},{"./dataobject.js":1,"./label.js":3,"./point.js":4,"./util.js":6}],3:[function(require,module,exports){
/*
Object Discription:
*/

//requiremenets: (require JS)
var Point = require("./point.js");


//object declaration:
function Label(x, y, m) {
    this.point = new Point.Point(x, y);
    this.text = m;
}

//add prototype methods:
Label.prototype.mod = function () {
    //do thing
};



//add other utility functions:



//export:
module.exports.Label = Label;
//end
},{"./point.js":4}],4:[function(require,module,exports){
/*
Object Discription:
Point object: Maintains an X, Y and Z value.
(z is probably for drawing order).
contains operations for modifying positions and what not.
Modifiers available so original value is unchanged.
*/

//requiremenets: (require JS)
//var thing = require(things.js);


//object declaration:
function Point(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.xmod = 0;
    this.ymod = 0;
    this.zmod = 0;
}
//add prototype methods:
//getters: Gets X value
Point.prototype.getX = function () {
    return this.x + this.xmod;
    //reset xmod after every call?
};
//Gets Y value
Point.prototype.getY = function () {
    return this.y + this.ymod;
};
//Gets Z value
Point.prototype.getZ = function () {
    return this.z + this.zmod;
};
//modifies a Value (x,y,z) as a temporary increase or whatever (like on mouse Over);
Point.prototype.modX = function (mod) {
    this.xmod = mod;
};
Point.prototype.modY = function (mod) {
    this.ymod = mod;
};
Point.prototype.modZ = function (mod) {
    this.zmod = mod;
};


//add other utility functions:



//export:
module.exports.Point = Point;
//end
},{}],5:[function(require,module,exports){
/*
This is to demonstrate the capabilities of the graph currently
*/

//require the graph class
var graph = require("./graph.js");

var mygraphs = [];
for (var i = 0; i < 5; i++) {
    mygraphs[i] = new graph.graph();
}

var xTc = [];
for (var i = 0; i < 9; i++ ) {
	xTc[i] = [ 1*i, i ];
}



mygraphs[0].load([-5, 5, -5, 5], [xTc]);
//mygraphs[0].data[0].data[0].y = -2;
mygraphs[0].fillArea = false;

mygraphs[0].newLabel(80, 30, function () { return Math.round(mygraphs[0].data[0].origin.x) });

mygraphs[1].load([-5, 5, -5, 5], [[[-4, 0], [-1, 0], [-1, -3], [2, -3], [2, 3], [5, 3], [5, 0], [7, 0]]]);
mygraphs[1].data[0].colour = "#00FF00";

mygraphs[2].load([-5, 5, -5, 5], [[]]);
mygraphs[2].data[0] = mygraphs[0].data[0];
mygraphs[2].data[1] = mygraphs[1].data[0];

mygraphs[3].load([-5, 5, -5, 5], [[]]);
mygraphs[3].data = mygraphs[1].data;

mygraphs[4].load([-5, 5, -5, 5], [mygraphs[3].data[0].getData()]);

//need to give the dataset an ALTDATA set (pointing to the data we want to read off)
//and a METHOD to transform the data from the given altdata 

mygraphs[4].data[0].altdata = mygraphs[3].data[0];

mygraphs[4].data[0].method = function () {
    //this function here COPIES graph[3]'s dataset but translates it by 1 along the x and by 2 along the y. 
    for (var i = 0; i < this.data.length; i++) {
        this.data[i].x = this.altdata.getX(i) + 1;
        this.data[i].y = this.altdata.getY(i) + 2;
    }
    this.mousePointIndex = mygraphs[3].data[0].mousePointIndex;
};

mygraphs[4].data[0].colour = "#0000FF";
/*
function doThings(inp) {
    //like gets the thing of the data and does magic to it to make convolutions:
    for (var i = 0; i < inp.data[0].data.length; i++) {
        inp.data[0].data[i].x = 1;
    }
	
}

var theDatas = mygraphs[0].data[0].data;
for (var i = 0; i < theDatas.length; i++) {
	theDatas[i].y = -2;
}
*/


/*
//delete this later
var g = new graph.graph();
//the first array input is the graph limits on the x axis and the y axis.
g.load([-10, 10, -10, 10], [[[-2, 1], [3, 4], [5,5], [6,-2]],[[-2,-3],[1,0],[6,2]]]);
//g.fillArea = true;//shows how to modify some options for different results:
//g.showGrid = false;
//g.drawAxis = false;
//g.showLabels = false;
//g.drawLines = false;


var gf = new graph.graph();
gf.load([-10, 10, -10, 10], [[[-10,10],[-9,8],[-8,6],[-7,4],[-6,2],[-5,0],[-4,-2],[-3,-4],[-2,-6],[-1,-4],[0,-2],[1,0],[2,2],[3,4],[4,6],[5,8],[6,10],[7,12],[8,14],[9,16]]]);
gf.newLabel(80, 30, function () { return gf.data[0].data[0].x });
gf.snapToPoints = false;//true or false whether for the mouse changing features to have it snap to specific points or not
gf.showGrid = false;

*/
//after modification 'compile' this to ../complete.js with the command:
//     " browserify test.js -o ../complete.js "
//in terminal assuming you have browserify installed with npm.
//you can get node and then use NPM from any command line (on windows anyway)
//or i think you can download NPM directly idk. regardless it works. 
//to install browserify globally (command accessible everywhere: )
//     " npm install -g browserify "
},{"./graph.js":2}],6:[function(require,module,exports){
/*
Object Discription:
Utility functions for use elsewhere
*/

function createCanvas(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.border = "1px solid black";
    document.body.appendChild(canvas);
    canvas.oncontextmenu = function (e) {
        e.preventDefault();
    };
    return canvas;
}


//image loader 
function loadImage(path) {
    var image = new Image();
    image.src = path;
    return image;
}


//printing coloured highlighted text
function boldPrint (text, x, y, c, ctx) {
    if (c != null) {
        //ctx.fillStyle = c;
    }
    ctx.fillStyle = 'green';
    ctx.font = "20px Verdana";
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
}

function getXPoint(p,obj) {
    if (p != undefined && obj != undefined) {
        //should return a point 
        //var ix = (p.x * obj.xUnits) + obj.xOffset;
        return (p * obj.xUnits) + obj.xOffset + ((obj.originPoint.x * obj.xUnits));
    }
}

function getYPoint(p,obj) {
    if (p != undefined && obj != undefined) {
        //should return a point
        //var iy = -(p.y * obj.yUnits) + obj.yOffset;
        return -(p * obj.yUnits) + obj.yOffset + obj.originPoint.y;
    }
}

//export:
module.exports.createCanvas = createCanvas;
module.exports.loadImage = loadImage;
module.exports.boldPrint = boldPrint;
//end
},{}]},{},[5]);
