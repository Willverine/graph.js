/*
This is to demonstrate the capabilities of the graph currently
*/

//require the graph class
var graph = require("./graph.js");

var mygraphs = [];
for (var i = 0; i < 5; i++) {
    mygraphs[i] = new graph.graph();
}

mygraphs[0].load([-5, 5, -5, 5], [[[-4, 0], [-1, 0], [-1, 3], [2, 3], [2, -3], [5, -3], [5, 0], [7, 0]]]);



mygraphs[1].load([-5, 5, -5, 5], [[[-4, 0], [-1, 0], [-1, -3], [2, -3], [2, 3], [5, 3], [5, 0], [7, 0]]]);
mygraphs[1].data[0].colour = "#00FF00";


mygraphs[2].load([-5, 5, -5, 5], [[]]);
mygraphs[2].data[0] = mygraphs[0].data[0];
mygraphs[2].data[1] = mygraphs[1].data[0];



mygraphs[3].load([-5, 5, -5, 5], [[]]);
mygraphs[3].data = mygraphs[1].data;



mygraphs[4].load([-5, 5, -5, 5], [mygraphs[3].data[0].getData()]);
doThings(mygraphs[4]);

mygraphs[4].data[0].colour = "#0000FF";


function doThings(inp) {
    //like gets the thing of the data and does magic to it to make convolutions:
    for (var i = 0; i < inp.data[0].data.length; i++) {
        inp.data[0].data[i].y = 1;
    }
    /*
    for (var i = 0; i < inp.data[1].data.length; i++) {
        inp.data[1].data[i].y = -1;
    }
    */
}


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