/*
    OpenRacer, 
    Copyright (C) 2015 Chris Barnard

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
 * Telemetry.js
 * 
 * Author: Chris Barnard
 * Description: A simple helper function designed to give real-time information
 *              about the operation of a car. Structure is subject to change.
 *              
 */

OpenRacer.Telemetry = function(parameters) {
    this.car = parameters.car;
    console.log(car);
    console.log(this.car);
    this.domElement = parameters.domElement;
    this.visible = false;
    this.carDiv = document.createElement("div");
    this.carDiv.className = "telemetry-wheels";
    this.domElement.appendChild(this.carDiv);
    this.wheelDivs = [];
    
    for(var i = 0; i < 4; i++) {
        var wDiv = document.createElement("div");
        //wDiv.style.float = "right";
        wDiv.className = "telemetry-wheels";
        this.domElement.appendChild(wDiv);
        this.wheelDivs[i] = wDiv;
    }
    
    this.update = function() {
        if(this.visible) {
            //this.domElement.innerHTML = "";
            //console.log(this.car);
            this.outputData(this.car, this.carDiv);
            if(this.car) {
                if(this.car.wheels) {
                    for(var i = 0; i < this.car.wheels.length; i++) {
                        //this.wheelDivs[i].innerHTML = "";
                        this.outputData(this.car.wheels[i], this.wheelDivs[i]);
                    }
                }
            }
        }
    };
    
    this.outputData = function(object, domElement) {
        domElement.innerHTML = "";
        for(var obj in object) {
            if(object.hasOwnProperty(obj)) {
                if(typeof object[obj] != "function" && typeof object[obj] != "object") {
                    domElement.innerHTML += obj + ": " + object[obj] + "<br />";
                }
            }
        }
    };
    
    this.setVisible = function(vis) {
        this.visible = vis;
        if(this.visible) {
            this.domElement.style.visibility = "visible";
        } else {
            this.domElement.style.visibility = "hidden";
        }
        window.onresize();
    };
    
    window.onresize();
};