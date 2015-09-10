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
 * Engine.js
 * 
 * Author: Chris Barnard
 * Description: Gives us a structure for holding information about a car's engine.
 * Notes: Obviously, this is currently a massive mess. First job is to tidy up,
 *        remove hard-coded elements, follow some sort of style guide and
 *        restructure coherently.
 */

OpenRacer.Engine = function( parameters, domElement ) {
    this.power_curve = [
        { "rpm" : 3000, "bhp" : 237.5 },
        { "rpm" : 3500, "bhp" : 280 },
        { "rpm" : 4000, "bhp" : 327 },
        { "rpm" : 4500, "bhp" : 360 },
        { "rpm" : 5000, "bhp" : 370 },
        { "rpm" : 5300, "bhp" : 379 },
        { "rpm" : 5500, "bhp" : 375 },
        { "rpm" : 6000, "bhp" : 350 }
    ];

    this.torque_curve = [];
    var lastTorqueNm = 1;
    var lastRPM = 0;
    for(var i = 0; i < this.power_curve.length; i++) {
        var nextRPM = this.power_curve[i].rpm;
        var nextTorque = this.power_curve[i].bhp * 5252 / nextRPM;
        var nextTorqueNm = nextTorque * 1.35581795;
        //console.log(nextRPM + " " + nextTorqueNm);
        var rpmRange = nextRPM - lastRPM;
        for(var r = lastRPM; r < nextRPM; r++) {
            //console.log(r + ": " + (((nextTorqueNm - lastTorqueNm) / rpmRange) + lastTorqueNm));
            this.torque_curve.push((((nextTorqueNm - lastTorqueNm) / rpmRange) * (r - lastRPM)) + lastTorqueNm);
        }
        lastRPM = nextRPM;
        lastTorqueNm = nextTorqueNm;
    }
    
    this.getTorque = function(engineRPM) {
        engineRPM = Math.round(engineRPM);
        if(engineRPM >= this.torque_curve.length) {
            return 0;
        } else {
            return this.torque_curve[engineRPM];
        }
    };
};