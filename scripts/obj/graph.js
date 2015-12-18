/*
This is the graph object that will handle all the drawing and rendering of data.
Create this object, feed the data and provide sizes, etc; and see it drawn and whatnot.
This takes advantage of browserify.js to compile the multiple files into one complete.js
@author William Owers 03/12/2016
*/

//REQUIREMENTS used with browserify stuff.
var _ = {};//keeps required elements out of global scope and stuff; better memory management.
_.point = require("./point.js");
_.util = require("./util.js");

function graph() {
    this.originPoint = new _.point.Point(0, 0);//point where it is all drawn from on the canvas
    this.mousePoint = new _.point.Point(0, 0);//mouse point
    this.limits = { xLeft: -10, xRight: 10, yTop: 10, yBottom: -10, xLen: (this.xRight - this.xLeft), yLen: (this.yTop - this.yBot) };//the values on the axis limits. initialised in the Load function 
    this.showGrid = true;//draw a grid (or not)
    this.drawAxis = true;//draw the axis (or not)
    this.showLabels = true;//whether to put labels on the graph
    this.fillArea = true;
    this.drawLines = true;
    
    this.canvas = _.util.createCanvas(800, 600);
    this.context = this.canvas.getContext("2d");
    this.data = [];//a list of points of x and y values to be drawn. 
}

//these methods are protyped so they are used by All instances of this object. 
graph.prototype.load = function (limits, data) {
    var that = this;
    initialiseAxis(this, limits);
    loadData(this, data);
    this.canvas.addEventListener("mousedown", function (event) { getMouse(event, that); }, false);
    initDrawLoop(this);
    this.context.font = "14px Georgia";
    this.context.textAlign = "center";
}

graph.prototype.update = function () {
    //getMouse(this);
    
    dataUpdate(this);
}

graph.prototype.draw = function () {
    drawAxis(this);
    drawGrid(this);
    drawLabels(this);
    drawData(this);
    drawTooltips(this);
}




//functions used by the graph object:
//draws at the FPS rate (taking into account the overhead from other functions)
//this is the FPS control and other drawing shit that can kinda be pushed to the side for now.
//Essentially it creates the update/draw looping on that objects canvas at that set FPS rate.
//This means any updates to data or mouse or anything placed in the objects update state will automatically show. 
//It can also be interrupted/paused so that it will only update on events for example (if performance becomes an issue)
var fps = 30;//controls the number of times a second this is refreshed; high for lower performance but smoother operation
var now;
var then = Date.now();//current time
var interval = 1000 / fps;//interval time
var delta;//delta time
function initDrawLoop(obj) {
    requestAnimationFrame(function () { initDrawLoop(obj); });//requests the browser to draw a frame before the next repaint.
    now = Date.now();
    delta = now - then;
    if (delta > interval) {//for FPS setting
        then = now - (delta % interval);
        obj.context.clearRect(0, 0, obj.canvas.width, obj.canvas.height);//wipe the display
        //---------- add the actual content to be drawn:
        obj.draw();

        //call update
        obj.update();

    }
}

//delete this later
var g = new graph();
g.load([-10, 10, -10, 10], [new _.point.Point(-2, 1), new _.point.Point(3, 4), new _.point.Point(6, -3), new _.point.Point(5, 1)]);


//takes a reference to the object being modified and the limits of the graph. 
function initialiseAxis(obj, lims) {
    //lims to be an array 4 items long corresponding to the xLeft, xRight, yTop, yBottom values
    //modify the obj.limits if necessary
    //obj.limits = { xLeft: lims[0], xRight: lims[1], yTop: lims[3], yBottom: lims[2] };
    obj.limits.xLeft = lims[0];
    obj.limits.xRight = lims[1];
    obj.limits.yTop = lims[3];
    obj.limits.yBottom = lims[2];
    obj.limits.xLen = lims[1] - lims[0];
    obj.limits.yLen = lims[3] - lims[2];
}


//takes data and feeds it into the objects data list;
function loadData(obj, data) {
    //data should be a lsit of Points to be drawn. (Coordinates of the graph)
    obj.data = data;
}


//mousePosition event makes sure the mouse values aren't affected by the movement of the window and updates the objects mouse coordinates
function getMouse(event,obj) {//updates mouse x and y
    var rect = obj.canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    obj.mousePoint.x = x;
    obj.mousePoint.y = y;
    //debugged and successfully works 18/12
}


//function moves data along or updates the origin point for movement or whatever
function dataUpdate(obj) {
    //obj.data = [];
}


//draw the axis on the canvas. 
//CHECK FIRST should be irrespective of the objects origin point; this is so the function can be moved.
//this is just the Lines on the canvas not the graph values itself. (?) maybe it should be drawn from origin too......
function drawAxis(obj) {
    if (obj.drawAxis) {
        var top = obj.canvas.width / 2;
        var left = obj.canvas.height / 2;
        var ctx = obj.context;
        ctx.beginPath();
        ctx.moveTo(top, 0);
        ctx.lineTo(top, obj.canvas.height);
        ctx.stroke();
        ctx.moveTo(0, left);
        ctx.lineTo(obj.canvas.width, left);
        ctx.stroke();
    }
}


//draw the grid along each x and y value. 
function drawGrid(obj) {
    //do laters lololol
}


//draw the tooltips like if mosue is over a point print its value. or the T value, whatever. 
function drawTooltips(obj) {
    //do laters only if mouse is over a point or whatever
}


function drawLabels(obj) {
    //this function should draw the labels on the axises and whatnot
    //first init some like measurements like number of points (one per unit) and whatnot
    var xOffset = obj.canvas.width / 2;//the x and y offset to make the starting point (0,0) (so it is drawn from the middle)
    var yOffset = obj.canvas.height / 2;
    var xUnits = obj.canvas.width / obj.limits.xLen;//these are the pixels per unit on the graph.
    var yUnits = obj.canvas.height / obj.limits.yLen;
    var ctx = obj.context;
    ctx.fillStyle = "#000000"
    //now need to loop through the units we need to print items for:
    //on the x axis we want vertical 'ticks' and on the y axis we want horizontal 'ticks' say 9 pixels long (?)
    for (var i = obj.limits.xLeft; i < obj.limits.xRight; i++) {
        //loops through each unit on the x axis
        //fill a rect (1 pix thin so a line) just above the point on the line till just below it
        //fillRect xPoint, y + 4, 1, 9)
        ctx.fillRect((xUnits * i) + xOffset, -4 + yOffset, 1, 9);//negative - value so it is the right side of the axis
        ctx.fillText(i, (xUnits * i) + xOffset, 15 + yOffset);
    }
    //now same for yAxis
    for (var i = obj.limits.yBottom; i < obj.limits.yTop; i++) {
        //loops through each unit on the y axis
        //fill a rect (1 pix thin so a line) just left of the point on the line till just right of it
        //fillRect( xOffset - 4, (yUnits * i) + yOffset, 9, 1)
        ctx.fillRect(xOffset - 4, (yUnits * i) + yOffset, 9, 1);//negative - value so it is the right side of the axis
        ctx.fillText(-i, xOffset + 15, (yUnits * i) + yOffset + 4);
    }
}



//draw the data points on the thing
function drawData(obj) {
    var xOffset = obj.canvas.width/2;//the x and y offset to make the starting point (0,0) (so it is drawn from the middle)
    var yOffset = obj.canvas.height/2;
    var xUnits = obj.canvas.width / obj.limits.xLen;//these are the pixels per unit on the graph.
    var yUnits = obj.canvas.height / obj.limits.yLen;
    var ctx = obj.context;
    //with these: to draw a point, place a dot at 0,1 units it would be drawn on pixels:
    //x = (xOffset + (0 * xUnits);   y = yOffset + (1 * yUnits)

    //loop through the data in the obj
    var d = obj.data;
    ctx.fillStyle = "#FF0000";
    for (var i = 0; i < d.length; i++) {
        //for each data item, draw it to the canvas as a point
        var p = d[i];//point = the item at d's index
        //FOR DOT POINT
        ctx.fillRect((p.x * xUnits) + xOffset - 2, -(p.y * yUnits) + yOffset - 2, 4, 4);//draws a rect at point t,t of size 4,4
        //the -2 are just so the point is centered around that position
    }

    
    if (obj.drawLines) {
        //FOR LINES: this assumes left most point on the graph is hte first in the array, and right most point is the last in the array
        ctx.beginPath();
        var p = d[0];
        ctx.moveTo((d[0].x * xUnits) + xOffset, 0 + yOffset);//need to start under the line to draw the invisible box thing so we can fill the area in...
        ctx.fillStyle = "rgba(250,0,0,0.5)";

        for (var i = 0; i < d.length; i++) {
            var p = d[i];//point = the item at d's index
            //var p2 = d[i + 1];
            ctx.lineTo((p.x * xUnits) + xOffset, -(p.y * yUnits) + yOffset);
        }
        //move from the last point of the array to the x axis and complete the shape then fill it if necessary
        ctx.lineTo((d[d.length - 1].x * xUnits) + xOffset, 0 + yOffset);
        //ctx.lineTo((d[0].x * xUnits) + xOffset, 0)
        ctx.closePath();
        ctx.fill();
    }


}