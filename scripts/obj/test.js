/*
This is to demonstrate the capabilities of the graph currently
*/

//require the graph class
var graph = require("./graph.js");



//delete this later
var g = new graph.graph();
//the first array input is the graph limits on the x axis and the y axis.
g.load([-10, 10, -10, 10], [[-2, 1], [3, 4], [6, -3], [9, 1]]);
g.fillArea = false;//shows how to modify some options for different results:
//g.drawGrid = false; would work if i had a grid draw-able (WIP)
//g.drawAxis = false;
//g.showLabels = false;
//g.drawLines = false;


var gf = new graph.graph();
gf.load([-5, 7, -10, 5], [[-2, 1], [1, 2], [2, -3], [3, 1]]);
gf.newLabel(80, 30, function () { return gf.data[0].x });


//after modification 'compile' this to ../complete.js with the command:
//     " browserify test.js -o ../complete.js "
//in terminal assuming you have browserify installed with npm.
//you can get node and then use NPM from any command line (on windows anyway)
//or i think you can download NPM directly idk. regardless it works. 
//to install browserify globally (command accessible everywhere: )
//     " npm install -g browserify "