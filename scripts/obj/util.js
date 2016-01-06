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