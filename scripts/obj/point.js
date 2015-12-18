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