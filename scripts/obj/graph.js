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

function graph() {
    this.originPoint = new _.point.Point(0, 0);//point where it is all drawn from on the canvas
    this.mousePoint = new _.point.Point(0, 0);//mouse point
    this.mousePointIndex = null;
    this.mousePointClick = null;
    this.limits = { xLeft: -10, xRight: 10, yTop: 10, yBottom: -10, xLen: (this.xRight - this.xLeft), yLen: (this.yTop - this.yBot) };//the values on the axis limits. initialised in the Load function 
    this.showGrid = true;//draw a grid (or not)
    this.drawAxis = true;//draw the axis (or not)
    this.showLabels = true;//whether to put labels on the graph
    this.fillArea = true;
    this.drawLines = true;
    this.snapToPoints = true;
    this.lineColour = "#0000ff";
    this.fillColour = "#ff8333";
    this.pointColour = "#ff0000";
    
    this.canvas = _.util.createCanvas(800, 600);
    this.context = this.canvas.getContext("2d");
    this.data = [];//a list of points of x and y values to be drawn. 
    this.labels = [];

    //maybe timing events need to be local?
    this.now;
    this.then = Date.now();
    this.delta;
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
    //getMouse(this);
    
    dataUpdate(this);
    //this.mousePointIndex = null;
}

graph.prototype.draw = function () {
    drawAxis(this);
    drawGrid(this);
    drawLabels(this);
    drawData(this);
    //testing here anyway
    //moveData(this);
    drawTooltips(this);
    drawTextBox(this);
}

graph.prototype.newLabel = function (x,y,text) {
    //this functino should produce a label with given inputs x,y,and text. (or like text item)
    this.labels.push(new _.label.Label(x, y, text));
}



//UPDATE TIMING ITEMS ARE NOW LOCAL TO THE OBJECT
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
    obj.now = Date.now();
    obj.delta = obj.now - obj.then;
    if (obj.delta > interval) {//for FPS setting
        obj.then = obj.now - (obj.delta % interval);
        obj.context.clearRect(0, 0, obj.canvas.width, obj.canvas.height);//wipe the display
        //---------- add the actual content to be drawn:
        obj.draw();

        //call update
        obj.update();

    }
}




//takes a reference to the object being modified and the limits of the graph. 
function initialiseAxis(obj, lims) {
    //lims to be an array 4 items long corresponding to the xLeft, xRight, yTop, yBottom values
    //modify the obj.limits if necessary
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
    for (var i = 0; i < data.length; i++) {
        obj.data.push(new _.point.Point(data[i][0],data[i][1]));
    }
}


function moveData(obj) {
    if (obj.mousePointClick) {//assume mousePointIndex is set to NOT null
        /*
        var xOffset = obj.canvas.width / 2;//the x and y offset to make the starting point (0,0) (so it is drawn from the middle)
        var yOffset = obj.canvas.height / 2;
        var xUnits = obj.canvas.width / obj.limits.xLen;//these are the pixels per unit on the graph.
        var yUnits = obj.canvas.height / obj.limits.yLen;
        */
        //super inneficient to calculate them every call but works for this beta version anyway
        //console.log(obj.mousePointClick);
        obj.data[obj.mousePointIndex].x = (obj.mousePoint.x - obj.xOffset) / obj.xUnits;
        obj.data[obj.mousePointIndex].y = -(obj.mousePoint.y - obj.yOffset) / obj.yUnits;
    }
}


//mousePosition event makes sure the mouse values aren't affected by the movement of the window and updates the objects mouse coordinates
function getMouse(event,obj) {//updates mouse x and y
    var rect = obj.canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    obj.mousePoint.x = x;
    obj.mousePoint.y = y;
    //console.log(obj);
    //debugged and successfully works 18/12
    //additional functionality added for mouse clicking:
    //console.log(event.buttons);
    
    if (event.buttons == 1 && obj.mousePointIndex != null) {
        //assuming the user is clicking and holding, and is over a point on the graph:
        /*
        var xOffset = obj.canvas.width / 2;//the x and y offset to make the starting point (0,0) (so it is drawn from the middle)
        var yOffset = obj.canvas.height / 2;
        var xUnits = obj.canvas.width / obj.limits.xLen;//these are the pixels per unit on the graph.
        var yUnits = obj.canvas.height / obj.limits.yLen;
        */
        //super inneficient to calculate them every call but works for this beta version anyway
        //console.log(obj.mousePointClick);
        if (obj.snapToPoints) {//will snap to rounded points
            obj.data[obj.mousePointIndex].x = Math.round((x - obj.xOffset) / obj.xUnits);
            obj.data[obj.mousePointIndex].y = Math.round(-(y - obj.yOffset) / obj.yUnits);
        } else {
            obj.data[obj.mousePointIndex].x = (x - obj.xOffset) / obj.xUnits;
            obj.data[obj.mousePointIndex].y = -(y - obj.yOffset) / obj.yUnits;
        }


        
        //console.log("MOVEMENMT");
        //this.mousePointClick = null;
    }
    else {
        //this seems a bit hacky but it acutally does hte job perfectly?
        obj.mousePointIndex = null;
    }
}


function getMouseClick(event, obj) {//can this be depricated?
    var rect = obj.canvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    /*
    var xOffset = obj.canvas.width / 2;//the x and y offset to make the starting point (0,0) (so it is drawn from the middle)
    var yOffset = obj.canvas.height / 2;
    var xUnits = obj.canvas.width / obj.limits.xLen;//these are the pixels per unit on the graph.
    var yUnits = obj.canvas.height / obj.limits.yLen;
    */
    //console.log("mousedown");
    //console.log(obj.mousePointIndex);
    //obj.mousePointClick = new _.point.Point((x - xOffset) / xUnits, -(y - yOffset) / yUnits);

    //.mousePointClick = obj.mousePointIndex;
    //obj.mousePointClick = true;
}

function getMouseUp(event, obj) {
    //console.log("mouseup");
    obj.mousePointIndex = null;
}


//function moves data along or updates the origin point for movement or whatever
function dataUpdate(obj) {
    //obj.data = [];
    //this function probably isn't necessary as all variables are publically accessible so can modify them directly and they will be updated.
}


//draw the axis on the canvas. 
//CHECK FIRST should be irrespective of the objects origin point; this is so the function can be moved.
//this is just the Lines on the canvas not the graph values itself. (?) maybe it should be drawn from origin too......
function drawAxis(obj) {
    if (obj.drawAxis) {
        //var top = obj.canvas.width / 2;//use xOffset
        //var left = obj.canvas.height / 2;//use yOffset
        var ctx = obj.context;
        ctx.strokeStyle = "#000000";
        ctx.beginPath();
        ctx.moveTo(obj.xOffset, 0);
        ctx.lineTo(obj.xOffset, obj.canvas.height);
        //ctx.stroke();
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
        //on the x axis we want vertical 'ticks' and on the y axis we want horizontal 'ticks' say 9 pixels long (?)
        for (var i = obj.limits.xLeft; i < obj.limits.xRight; i++) {
            //loops through each unit on the x axis
            //fill a rect (1 pix thin so a line) just above the point on the line till just below it
            //fillRect xPoint, y + 4, 1, 9)
            ctx.fillRect((obj.xUnits * i) + obj.xOffset, 0, 1, obj.canvas.height);//negative - value so it is the right side of the axis
        }
        //now same for yAxis
        for (var i = obj.limits.yBottom; i < obj.limits.yTop; i++) {
            //loops through each unit on the y axis
            //fill a rect (1 pix thin so a line) just left of the point on the line till just right of it
            //fillRect( xOffset - 4, (yUnits * i) + yOffset, 9, 1)
            ctx.fillRect(0, (obj.yUnits * i) + obj.yOffset, obj.canvas.width, 1);//negative - value so it is the right side of the axis
        }
    }


    
}


//draw the tooltips like if mosue is over a point print its value. or the T value, whatever. 
function drawTooltips(obj) {
    //do laters only if mouse is over a point or whatever
    //if obj.mousePointIndex not equal to null then the mouse is over that index at that point so draw the thing:
    //console.log(obj.mousePointIndex);
    /*
    var xOffset = obj.canvas.width / 2;//the x and y offset to make the starting point (0,0) (so it is drawn from the middle)
    var yOffset = obj.canvas.height / 2;
    var xUnits = obj.canvas.width / obj.limits.xLen;//these are the pixels per unit on the graph.
    var yUnits = obj.canvas.height / obj.limits.yLen;
    */
    if (obj.mousePointIndex != null) {
        var p = obj.data[obj.mousePointIndex];
        obj.context.strokeStyle = "#000000";
        obj.context.beginPath();//remove this line if i want to highlight the lines (redrawing them or whatever) when mouse overing
        obj.context.rect((p.x * obj.xUnits) + obj.xOffset - 15, -(p.y * obj.yUnits) + obj.yOffset - 20, 30, 16);
        obj.context.fillStyle = "#000000";
        obj.context.fillText(p.x + ", " + p.y, (p.x * obj.xUnits) + obj.xOffset, -(p.y * obj.yUnits) + obj.yOffset - 10)
        //TODO: 
        //check if it is a NEGATIVE y value and if so draw this tooltip thing Below the line instead of above (is neater)
        obj.context.stroke();
    }
}


function drawLabels(obj) {
    //this function should draw the labels on the axises and whatnot
    //first init some like measurements like number of points (one per unit) and whatnot
    if (obj.drawAxis) {
        /*
        var xOffset = obj.canvas.width / 2;//the x and y offset to make the starting point (0,0) (so it is drawn from the middle)
        var yOffset = obj.canvas.height / 2;
        var xUnits = obj.canvas.width / obj.limits.xLen;//these are the pixels per unit on the graph.
        var yUnits = obj.canvas.height / obj.limits.yLen;
        */
        var ctx = obj.context;
        ctx.fillStyle = "#000000"
        //now need to loop through the units we need to print items for:
        //on the x axis we want vertical 'ticks' and on the y axis we want horizontal 'ticks' say 9 pixels long (?)
        for (var i = obj.limits.xLeft; i < obj.limits.xRight; i++) {
            //loops through each unit on the x axis
            //fill a rect (1 pix thin so a line) just above the point on the line till just below it
            //fillRect xPoint, y + 4, 1, 9)
            ctx.fillRect((obj.xUnits * i) + obj.xOffset, -4 + obj.yOffset, 1, 9);//negative - value so it is the right side of the axis
            ctx.fillText(i, (obj.xUnits * i) + obj.xOffset, 15 + obj.yOffset);
            
        }
        //now same for yAxis
        for (var i = obj.limits.yBottom; i < obj.limits.yTop; i++) {
            //loops through each unit on the y axis
            //fill a rect (1 pix thin so a line) just left of the point on the line till just right of it
            //fillRect( xOffset - 4, (yUnits * i) + yOffset, 9, 1)
            ctx.fillRect(obj.xOffset - 4, (obj.yUnits * i) + obj.yOffset, 9, 1);//negative - value so it is the right side of the axis
            ctx.fillText(-i, obj.xOffset + 15, (obj.yUnits * i) + obj.yOffset + 4);
        }
    }
}



//draw the data points on the thing
function drawData(obj) {
    /*
    var xOffset = obj.canvas.width/2;//the x and y offset to make the starting point (0,0) (so it is drawn from the middle)
    var yOffset = obj.canvas.height/2;
    var xUnits = obj.canvas.width / obj.limits.xLen;//these are the pixels per unit on the graph.
    var yUnits = obj.canvas.height / obj.limits.yLen;
    */
    var ctx = obj.context;
    //with these: to draw a point, place a dot at 0,1 units it would be drawn on pixels:
    //x = (xOffset + (0 * xUnits);   y = yOffset + (1 * yUnits)

    //loop through the data in the obj
    var d = obj.data;
    

    
    if (obj.drawLines) {
        //FOR LINES: this assumes left most point on the graph is hte first in the array, and right most point is the last in the array
        ctx.beginPath();
        var p = d[0];
        ctx.moveTo((d[0].x * obj.xUnits) + obj.xOffset, 0 + obj.yOffset);//need to start under the line to draw the invisible box thing so we can fill the area in...
        ctx.strokeStyle = obj.lineColour;

        for (var i = 0; i < d.length; i++) {
            var p = d[i];//point = the item at d's index
            //var p2 = d[i + 1];
            ctx.lineTo((p.x * obj.xUnits) + obj.xOffset, -(p.y * obj.yUnits) + obj.yOffset);
            
        }
        ctx.stroke();
        //move from the last point of the array to the x axis and complete the shape then fill it if necessary
        ctx.lineTo((d[d.length - 1].x * obj.xUnits) + obj.xOffset, 0 + obj.yOffset);
        //ctx.lineTo((d[0].x * xUnits) + xOffset, 0)
        ctx.closePath();
        if (obj.fillArea) {
            ctx.fillStyle = obj.fillColour;
            ctx.fill();
        }
    }
    ctx.fillStyle = obj.pointColour;
    for (var i = 0; i < d.length; i++) {
        //for each data item, draw it to the canvas as a point
        var p = d[i];//point = the item at d's index
        //FOR DOT POINT
        ctx.fillRect((p.x * obj.xUnits) + obj.xOffset - 2, -(p.y * obj.yUnits) + obj.yOffset - 2, 4, 4);//draws a rect at point t,t of size 4,4
        //the -2 are just so the point is centered around that position

        //check if the mouse point is Near one of these particular points: if so set the mousePointIndex to this i value.
        var ix = (p.x * obj.xUnits) + obj.xOffset;
        var iy = -(p.y * obj.yUnits) + obj.yOffset;
        if (obj.mousePoint.x > (ix - 8) && obj.mousePoint.x < (ix + 8) && obj.mousePoint.y > (iy - 8) && obj.mousePoint.y < (iy + 8)) {
            //this means current point is within 10 units/pixels of a point:
            obj.mousePointIndex = i;
        }

    }
    //obj.data[0].x += 0.01;
}


function drawTextBox(obj) {
    //should draw each label in the labels list
    if (obj.labels.length > 0) {
        for (var i = 0; i < obj.labels.length; i++) {
            //obj.context.rect(obj.labels[i].point.x, obj.labels[i].point.y, 20, 30);
            obj.context.fillStyle = "#000000";
            obj.context.fillText(obj.labels[i].text(), obj.labels[i].point.x, obj.labels[i].point.y);
            
            //obj.context.rect(obj.labels[i].point.x, obj.labels[i].point.y, 20, 20);
            //obj.context.stroke();
        }
    }
    
}



module.exports.graph = graph;