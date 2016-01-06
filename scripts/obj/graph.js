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


//license:
/*
Copyright (c) <2016> <William Owers>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/