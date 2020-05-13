var mouseDown = false;
var usingGamepad = false;
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

function gamepadUpdate() {
    var gpad = navigator.getGamepads()[0];
    //console.log(gpad);
    if(gpad) {
        var stickMovement = Math.abs(gpad.axes[0]);
        if(stickMovement > 0.1) {
            stickMovement = (stickMovement - 0.1) * (1 / 0.9);
        }// else if(stickMovement < 0.1) {
        //    stickMovement = (stickMovement + 0.1) * (1 / 0.9);
        //}
        car.turnAngle -= (car.turnAngle - (car.maxTurn * Math.pow(gpad.axes[0], 4) * getSign(gpad.axes[0]))) / 3;
        car.throttle = gpad.buttons[7].value;
        car.brakePedal = gpad.buttons[6].value;
                //console.log(gpad.buttons[6]);
        /*
        if(gpad.axes[1] < 0) {
            car.throttle = -gpad.axes[1];
            car.brakePedal = 0;
        } else {
            car.brakePedal = gpad.axes[1];
            car.throttle = 0;
        }
        */
        usingGamepad = true;
    } else {
        usingGamepad = false;
    }
}