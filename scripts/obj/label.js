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