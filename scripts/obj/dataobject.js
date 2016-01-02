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
    this.colour = c;
    this.mousePointIndex = null;
}
//add prototype methods:
FDO.prototype.getX = function (i) { return (this.data[i].x + this.origin.x); };//asusming they are both POINT type objects
FDO.prototype.getY = function (i) { return (this.data[i].y + this.origin.y); };
FDO.prototype.getP = function (i) { return this.data[i]; };

//add other utility functions:



//export:
module.exports.FDO = FDO;
//end