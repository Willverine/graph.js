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
	this.fillColour = "rgba(255,150,0,0.4)";
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