var mouseDown = false;
var mdX = 0;
var mdY = 0;
var mX = 0;
var mY = 0;
var mLocation;

window.onmousedown = function(e) {
    mouseDown = true;
    //console.log("mouseDown " + e.screenX + ", " + e.screenY);
    mdX = e.screenX;
    mdY = e.screenY;
    
    mLocation = document.createElement("div");
    mLocation.id = "mLocation";
    mLocation.className = "mouseStart";
    mLocation.style.left = e.clientX + "px";
    mLocation.style.top = e.clientY + "px";
    document.body.appendChild(mLocation);
};

window.onmouseup = function() {
    mouseDown = false;
    car.throttle = 0;
    car.brakePedal = 0;
    document.body.removeChild(mLocation);
};

window.onmousemove = function(e) {
    if(mouseDown) {
        mX = e.screenX;
        mY = e.screenY;
        
        var yDiff = (mdY - mY) / 200;
        if(yDiff > 1) yDiff = 1;
        if(yDiff < -1) yDiff = -1;
        if(yDiff > 0) {
            car.throttle = yDiff;
            car.brakePedal = 0;
        } else {
            car.throttle = 0;
            car.brakePedal = -yDiff;
        }
        
        var xDiff = (mX - mdX) / 200;
        if (xDiff > 1)
            xDiff = 1;
        if (xDiff < -1)
            xDiff = -1;
        car.turnAngle = car.maxTurn * Math.pow(xDiff, 2) * getSign(xDiff);
    }
};