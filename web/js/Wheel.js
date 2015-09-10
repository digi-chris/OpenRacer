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
 * Wheel.js
 * 
 * Author: Chris Barnard
 * Description: Gives us a structure for holding information about each wheel on a car.
 * Notes: Obviously, this is currently a massive mess. First job is to tidy up,
 *        remove hard-coded elements, follow some sort of style guide and
 *        restructure coherently.
 */

OpenRacer.Wheel = function (parameters, domElement) {
    this.name = parameters.name;
    this.diameter = parameters.diameter;
    this.diameterOver2 = this.diameter / 2;
    this.object = parameters.object;
    this.velocity = new THREE.Vector3(0,0,0);
    this.speed = 0;
    this.turningForce = 0;
    this.position = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z - 10);
    this.right = parameters.right;
    this.car = parameters.car;
    this.mass = parameters.mass;
    this.apparentMass = parameters.mass;
    this.weight = this.mass * gravity;
    this.RPM = 0;
    this.brakingForce = 0;
    this.rollingResistance = 0.015;
    this.pressure = 30; // PSI
    this.pBar = this.pressure * 0.0689475729; // tyre pressure in bar
    this.unsprungMass = 45.3592; // the mass not supported by the spring
    this.springExtension = 0;
    this.springVelocity = 0;
    this.onGround = false;
    this.slip = false; // is the wheel slipping?
    this.tc = false; // traction control enabled?
    this.forwardSpeed = 0;
    this.forwardMPH = 0;
    
    this.lastDelta = 0;
    this.lastPosition = new THREE.Vector3(this.position.x, this.position.y, this.position.z);
    this.lastVelocity = new THREE.Vector3(0, 0, 0);
    this.lastAcceleration = new THREE.Vector3(0, 0, 0);
    /*
    this.spring = {
        type: "coilover",
        //wire_diameter: 0.015494,
        wire_diameter: 0.0142875, // OEM springs
        outer_diameter: 0.127,
        free_length: 0.428625,
        active_coils: 7,
        //shear_modulus: 79241245136.187 // music wire ASTM A228
        shear_modulus: 68599221789.883 // stainless steel 302 A313
    };
    */
   
    this.spring = parameters.spring;
    
    switch(this.spring.type) {
    case "coilover":
        this.spring_rate = (this.spring.shear_modulus * Math.pow(this.spring.wire_diameter, 4)) / (8 * Math.pow(this.spring.outer_diameter - this.spring.wire_diameter, 3) * this.spring.active_coils);
        if(this.spring.dist_to_balljoint > 0 && this.spring.dist_to_spring > 0) {
            this.motion_ratio = (this.spring.dist_to_spring / this.spring.dist_to_balljoint) * Math.sin(this.spring.spring_angle);
            //this.motion_ratio = 1;
        } else {
            this.motion_ratio = 1;
        }
        if(!this.spring.minimum_spring_length) {
            this.spring.minimum_spring_length = this.spring.wire_diameter * (this.spring.active_coils + 2); // assume one additional coil top and bottom
        }
        this.spring_maxCompression = this.spring.minimum_spring_length - this.free_length;
        break;
    case "leaf":
        // Poisson's ratio for steel is 0.27 - 0.30
        var pR = 0.28;
        var E = 2 * this.spring.shear_modulus * (1 + pR);
        this.spring_rate = (8 * E * this.spring.leaves * this.spring.leaf_width * Math.pow(this.spring.leaf_thickness, 3)) / (3 * Math.pow(this.spring.leaf_length, 3));
        if(this.spring.perch_distance > 0) {
            this.motion_ratio = this.spring.perch_distance / this.car.rear_track; // TODO: Assumes the leaf is on the rear (always is?)
        } else {
            this.motion_ratio = 1;
        }
        // TODO: max compression is hard coded for leaf springs
        this.spring_maxCompression = -0.2;
        break;
    }
    //console.log(this.name + " MOTION RATIO: " + this.motion_ratio);
    
    if(!this.spring.free_length) {
        this.spring.free_length = 0;
    }
    
    //console.log("Mass: " + this.mass);
    //console.log("Weight: " + this.weight);
    //console.log("SPRING RATE: " + this.spring_rate);
    //console.log("calculated free length: " + )
    //console.log("spring compression at rest: " + ((this.mass * gravity) / this.spring_rate));
    this.springLength = function() {
        return this.springExtension;// + this.spring.free_length;
        //return (this.weight / this.motion_ratio) / this.spring_rate;
        // length = force / k
        // force = length * k
        // force = (free length + extension) * k
    };
    
    //this.getSpringFreeLength = function() {
    //    console.log(this.name);
    //    console.log(1000 / this.spring_rate);
    //    console.log(10 / this.spring_rate);
    //    console.log(1 / this.spring_rate);
    //    console.log(0.001 / this.spring_rate);
    //};
    
    //this.getSpringFreeLength();
    
    if(!this.right) this.object.children[0].children[0].rotation.z = Math.PI;
    //this.object.position.z = 10;
    //this.object.position.y = 2;
    this.domElement = ( domElement !== undefined ) ? domElement : document;
    this.turnAngle = 0;
    this.incline = 0;
    this.force3 = new THREE.Vector3( 0, 0, 0 );
    
    this.applyForce = function (wForce) {
        this.turningForce = wForce;// / 1000;
    };
    
    this.applyRigidForce = function (x, y, z) {
        this.force3.set(this.force3.x + x, this.force3.y + y, this.force3.z + z);
    };
    
    this.applyBrakingForce = function (bForce) {
        this.brakingForce = +bForce;
    };
    
    this.turn = function (turnAngle) {
        this.turnAngle = turnAngle;
        this.object.children[0].rotation.y = -turnAngle;
    };
    
    var piOver2 = Math.PI / 2;
    
    this.getWheelVelocity = function () {
        return Math.sqrt(Math.pow(this.velocity.x, 2) + Math.pow(this.velocity.z, 2));
    };
    
    this.setWheelVelocity = function (wheelVel) {
        var wheelAngle = this.car.carAngle + this.turnAngle;
        this.velocity.x += ((Math.cos(wheelAngle) * wheelVel) - this.velocity.x) * 0.5;
        this.velocity.z += ((Math.sin(wheelAngle) * wheelVel) - this.velocity.z) * 0.5;
    };
    
    this.update = function( delta ) {
        this.slip = false;
        this.tc = false;
        this.abs = false;
        var forces = new THREE.Vector3(0,0,0);
        var friction = uCoeff[lastGround];
        if(!friction) friction = uCoeff["track01"];
        if(friction.bumpChance > 0) {
            if(Math.random() < friction.bumpChance) {
                // we hit a bump!
                //debugOut(this.name + " bump!");
                friction.static = friction.bumpStatic;
                friction.kinetic = friction.bumpKinetic;
                //this.force3.y += this.weight + (this.weight * 14);//Math.abs(this.forwardSpeed * 10000 * Math.random());
            }
        }
        var coeff = friction.static; // coefficient of friction
        var forceLoss = 1;
        var Ff = coeff * this.weight;
        var apparentMass;
        
        //if(this.onGround) {
            apparentMass = this.weight / gravity;
        //} else {
        //    apparentMass = this.unsprungMass;
        //}
        
        this.apparentMass = apparentMass;
        
        /*
        if(this.turningForce > Ff) {
            //this.turningForce = Ff;
            // the force in this wheel is making the wheel slip
            coeff = friction.kinetic;
            forceLoss = Ff / this.turningForce;
            Ff = coeff * this.mass * gravity;
            if(Math.abs(forceLoss) < this.car.throttle) {
                this.car.throttle = Math.abs(forceLoss);
            }
        }
        */
        var wheelAngle = this.car.carAngle + this.turnAngle; //this.object.rotation.y - this.turnAngle;
        /*
        var wheelAccel = (this.turningForce * forceLoss) / this.mass;
        
        //this.object.children[0].rotation.y = this.turnAngle;
        //console.log(this.turnAngle + " = " + this.object.children[0].rotation.y);
        //this.object.children[0].rotation.y = Math.random();
        
        //this.velocity.x = Math.cos(wheelAngle) * this.speed * delta;
        //this.velocity.z = Math.sin(wheelAngle) * this.speed * delta;
        this.velocity.x += (this.force3.x / this.mass) * delta;
        this.velocity.z += (this.force3.z / this.mass) * delta;
        this.force3.set(0,0,0);
        
        this.velocity.y -= gravity * delta;
        //this.velocity.x += this.turningForce * delta;
        this.velocity.x += Math.cos(wheelAngle) * wheelAccel * delta;
        this.velocity.z += Math.sin(wheelAngle) * wheelAccel * delta;
        */
       
        //if(this.onGround) {
            //var currentMass = this.weight / gravity;
            var forceDown = apparentMass * gravity; // force pushing down on top of spring
            var springForce = (-this.spring_rate * this.springExtension) * this.motion_ratio; // force exerted by spring at current extension

            var springAcc = (forceDown + (springForce)) / apparentMass;
            this.springVelocity += springAcc * delta;
            
            // TODO: Damping coeffiecient hard coded
            this.springVelocity *= 0.8;
            
            this.springExtension += this.springVelocity * delta;
            
            // TODO: Here we are preventing the extension going past a certain sensible range
            //       (thinking this should be roughly half the equilibrium length when
            //        compressed, and equal to equilibrium length when stretched.)
            if(this.springExtension < this.spring_maxCompression) this.springExtension = this.spring_maxCompression;
            if(this.springExtension > 0.5) this.springExtension = 0.5;
        //}
       
        this.force3.y += -gravity * apparentMass;
        if(!this.onGround) {
            //forces.y -= springForce;
        }
        //forces.x += Math.cos(wheelAngle) * this.turningForce;
        //forces.z += Math.sin(wheelAngle) * this.turningForce;
        
        forces.x += this.turningForce * Math.sin( this.incline ) * Math.cos( wheelAngle );
        forces.y += this.turningForce * Math.cos( this.incline );
        forces.z += this.turningForce * Math.sin( this.incline ) * Math.sin( wheelAngle );
        //debugOut(this.name + ": " + this.incline + " x: " + this.force3.x + " y: " + this.force3.y + " z: " + this.force3.z);

        
        // rotate the velocity vector so the forward (X) vector is the forward velocity of the car
        var rotX = (this.velocity.x * Math.cos(-wheelAngle)) - (this.velocity.z * Math.sin(-wheelAngle));
        
        //this.RPM = (((rotX / (this.diameter / 2)) / delta) * 60) / (Math.PI * 2);
        //rotX = Math.PI * 2 * this.diameter * this.RPM * 60;
        var wheelCirc = Math.PI * this.diameter;
        this.RPM = (rotX * 60) / wheelCirc;
        //debugOut("forward: " + rotX + " m/s circ: " + wheelCirc);

        //debugOut("forward: " + rotX + " side: " + rotZ + "\r\n" + this.velocity.z + ", " + this.velocity.x);
        this.forwardSpeed = rotX;
        this.forwardMPH = Math.round(rotX * 2.2369362920544);
        //var rR = 0.005 + (1 / this.pBar) * (0.01 + (0.0095 * Math.pow(rotX, 2)));
        //debugOut((rR * this.mass * gravity) + " " + (this.rollingResistance * this.mass * gravity));
        this.brakingForce += this.rollingResistance * this.weight;
        this.brakingForce = -this.brakingForce * getSign(rotX);
        var wheelDecel;
        //if(rotX > 0) {
            wheelDecel = -this.brakingForce / apparentMass;
            if(Math.abs(wheelDecel) > Math.abs(rotX / delta)) {
                wheelDecel = -rotX / delta;
                this.brakingForce = wheelDecel * apparentMass;
                //debugOut("limiting braking on " + this.name + " (" + this.brakingForce + ")");
            }
            
        //} else {
        //    wheelDecel = (this.brakingForce * forceLoss) / this.mass;
        //    if(Math.abs(wheelDecel) > rotX) wheelDecel = rotX;
        //}
        //this.velocity.x += Math.cos(wheelAngle) * wheelDecel * delta;
        //this.velocity.z += Math.sin(wheelAngle) * wheelDecel * delta;
        
        forces.x += Math.sin(this.incline) * Math.cos(wheelAngle) * this.brakingForce;
        forces.y += Math.cos(this.incline);
        forces.z += Math.sin(this.incline) * Math.sin(wheelAngle) * this.brakingForce;
        
        // scrub side movement??
        //debugOut("Velocity: " + this.velocity.x + ", " + this.velocity.y + ", " + this.velocity.z);
        var rotZ = (this.velocity.x * Math.sin(-wheelAngle)) + (this.velocity.z * Math.cos(-wheelAngle));
        var sideDecel = (rotZ / delta);
        var sideForce = apparentMass * sideDecel; // the force exerted on the tyre sideways
        //debugOut(sideForce);
        //this.car.turnLimit += 2 * delta;
        /*
        if(Math.abs(sideForce) > Ff) {
            coeff = friction.kinetic;
            Ff = coeff * this.mass * gravity;
            var sign = sideForce > 0 ? 1 : sideForce === 0 ? 0 : -1;
            sideForce = Ff * sign;
            //this.car.turnLimit -= 10 * delta;//this.car.maxTurn * Ff / Math.abs(sideForce);
            //if(this.car.turnLimit < 0.1) this.car.turnLimit = 0.1;
            sideDecel = sideForce / this.mass;
        }
        //if(this.car.turnLimit > this.car.maxTurn) {
        //    this.car.turnLimit = this.car.maxTurn;
        //}
        this.velocity.x += Math.cos(wheelAngle - piOver2) * sideDecel * delta;
        this.velocity.z += Math.sin(wheelAngle - piOver2) * sideDecel * delta;
        */
        forces.x += Math.sin(this.incline) * Math.cos(wheelAngle - piOver2) * sideForce;
        forces.y += Math.cos(this.incline) * sideForce;
        forces.z += Math.sin(this.incline) * Math.sin(wheelAngle - piOver2) * sideForce;

        //console.log(this.velocity.x);
        
        var forceMag = Math.abs(Math.sqrt(Math.pow(forces.x, 2) + Math.pow(forces.y, 2) + Math.pow(forces.z, 2)));
        if(forceMag > Math.abs(Ff)) {
            // the forces in one direction exceed the frictional force exerted by the tyre
            this.slip = true;
            coeff = friction.kinetic;
            Ff = coeff * this.weight;
            forces.x = Ff * (forces.x / forceMag);
            forces.y = Ff * (forces.y / forceMag);
            forces.z = Ff * (forces.z / forceMag);
        }
        
        /*
        if(Math.max(Math.abs(forces.x), Math.abs(forces.z)) > Ff) {
        //if(forceMag > Math.abs(Ff)) {
            // the forces in one direction exceed the frictional force exerted by the tyre
            this.slip = true;
            coeff = friction.kinetic;
            Ff = coeff * this.weight;
            if(Math.abs(forces.x) > Ff) {
                var sign = forces.x > 0 ? 1 : forces.x === 0 ? 0 : -1;
                forces.x = sign * Ff;
            }
            //if(Math.abs(forces.y) > Ff) {
            //    var sign = forces.y > 0 ? 1 : forces.y === 0 ? 0 : -1;
            //    forces.y = sign * Ff;
            //}
            if(Math.abs(forces.z) > Ff) {
                var sign = forces.z > 0 ? 1 : forces.z === 0 ? 0 : -1;
                forces.z = sign * Ff;
            }
        }
        */
        
        if(this.turningForce > Ff) {
            this.tc = true;
            var nThrottle = Math.abs((Ff * 0.9) / this.turningForce);
            if(nThrottle < this.car.throttle) {
                this.car.throttle = nThrottle;
            }
            //this.car.throttle = 0;
        }
        if(this.brakingForce > Ff) {
            this.abs = true;
            var nBrake = Math.abs((Ff * 0.9) / this.brakingForce);
            if(nBrake < this.car.brakePedal) {
                this.car.brakePedal = nBrake;
            }
        }
        
        forces.x += this.force3.x;
        forces.y += this.force3.y;
        forces.z += this.force3.z;        
            
        this.force3.x = 0;
        this.force3.y = 0;
        this.force3.z = 0;
        this.turningForce = 0;
        this.brakingForce = 0;
        
        //this.velocity.x += (forces.x / apparentMass) * delta;
        //this.velocity.y += (forces.y / apparentMass) * delta;
        //this.velocity.z += (forces.z / apparentMass) * delta;
        var acceleration = new THREE.Vector3(forces.x / apparentMass, forces.y / apparentMass, forces.z / apparentMass);
        this.updatePosition(delta, acceleration);
        
        // wheelVel is the velocity of the wheel without its downward (y) vector (assumed to be caused by gravity)
        //var wheelVel = Math.sqrt(Math.pow(this.velocity.x, 2) + Math.pow(this.velocity.z, 2));
        // rotate the wheel on it's x-axis to simulate turning
        this.object.children[0].children[0].rotation.x += (rotX / this.diameter) * delta;
        // calculate the direction the wheel would like to travel in if it were rolling and drag it towards its ideal vector
        //this.velocity.x += ((Math.cos(wheelAngle) * wheelVel) - this.velocity.x);// * 0.7;// * delta;
        //this.velocity.z += ((Math.sin(wheelAngle) * wheelVel) - this.velocity.z);// * 0.7;// * delta;
        //
        // try to calculate the force the tyre will exert to push the wheel in the right direction
        /*
        var finalVelX = Math.cos(wheelAngle) * wheelVel;
        var finalVelZ = Math.sin(wheelAngle) * wheelVel;
        var velDiffX = finalVelX - this.velocity.x;
        var velDiffZ = finalVelZ - this.velocity.z;
        // we know the difference in velocities between the current direction of the wheel, and the direction it wants to go in
        var accelX = velDiffX / delta;
        var accelZ = velDiffZ / delta;
        var forceX = accelX * this.mass;
        var forceZ = accelZ * this.mass;
        // calculate the total force acting on the wheel's contact patch
        var forceC = Math.sqrt(Math.pow(forceX, 2), Math.pow(forceZ, 2));
        this.car.turnLimit += 2 * delta;
        if(Math.abs(forceC) > Ff) {
            this.car.turnLimit = this.car.maxTurn * (Ff / Math.abs(forceC)) * 2;
        }
        if(this.car.turnLimit > this.car.maxTurn) {
            this.car.turnLimit = this.car.maxTurn;
        }
        if(Math.abs(forceX) > Ff) {
            //console.log(this.name + " should skid. (forceC = " + forceC + ", Ff = " + Ff + ", mass = " + this.mass + ", gravity = " + gravity + ")");
            //coeff *= 0.5;
            forceX *= (Ff / Math.abs(forceX));
        }
        if(Math.abs(forceZ) > Ff) {
            forceZ *= (Ff / Math.abs(forceZ));
        }
        
        //if(this.brakingForce > 0) {
        //    //console.log(this.brakingForce);
        //    forceX -= (Math.cos(this.brakingForce));
        //    forceZ -= (Math.sin(this.brakingForce));
        //}
        
        //forceX *= forceLoss;
        //forceZ *= forceLoss;
        accelX = forceX / this.mass;
        accelZ = forceZ / this.mass;
        
        this.velocity.x += accelX * delta;
        this.velocity.z += accelZ * delta;
        */
       
        /*
        this.position.x += this.velocity.x * delta;
        this.position.y += this.velocity.y * delta;
        this.position.z += this.velocity.z * delta;

        //this.speed = wheelVel;
        //console.log(this.speed);

        //this.position.z -= 0.1;
        this.object.position.x = this.position.x;
        this.object.position.y = this.position.y;
        this.object.position.z = this.position.z;
        
        if(checkUnderGround(this.object, this.diameter)) {
            // if true, we need to bounce the wheel
            this.velocity.y = 0;//-this.velocity.y;
            this.position.y = this.object.position.y;
        }
        */
        // scrub velocities
        //var wheelAngle = this.object.rotation.y + this.turnAngle;
        //var wheelVel = this.velocity.length();
        //var coeff = new THREE.Vector3(0.7, 0, 0);
        //coeff.applyAxisAngle(new THREE.Vector3(0, 1, 0), wheelAngle);
        //console.log(coeff.x + ", " + coeff.z);
        //this.velocity.x = (1 - Math.min(coeff.x, 1) * this.velocity.z) + (Math.min(coeff.x, 1) * this.velocity.x);
        //this.velocity.y *= Math.min(coeff.y, 1);
        //this.velocity.z = (1 - Math.min(coeff.z, 1) * this.velocity.x) + (Math.min(coeff.z, 1) * this.velocity.z);
        //var newWVel = new THREE.Vector3(wheelVel, 0, 0);
        //newWVel.applyAxisAngle(new THREE.Vector3(0, 1, 0), wheelAngle);
        //this.velocity.z = Math.sin(wheelAngle) * wheelVel;
        //this.velocity.x = Math.cos(wheelAngle) * wheelVel;
        //this.velocity.x = newWVel.x;
        //this.velocity.z = newWVel.z;
    };
    
    this.updatePosition = function (delta, acceleration, dontCheckGround) {
        
        //this.onGround = false;
        //var newPos = new THREE.Vector3(this.position.x + (this.velocity.x * delta), this.position.y + (this.velocity.y * delta), this.position.z + (this.velocity.z * delta));
        
        //var finalX, finalZ;
        //var forwardVel = new THREE.Vector3(this.velocity.x, 0, this.velocity.z);
        //var downVel = new THREE.Vector3(0, -1, 0);
        //var ray = new THREE.Raycaster(this.position, forwardVel, 0, (Math.abs(forwardVel.length()) * delta) + this.diameterOver2);
        //var objs = ray.intersectObjects(trackObjects["ground"], false);
        
        //var ray2 = new THREE.Raycaster(this.position, downVel, 0, Math.abs(this.velocity.y * delta) + this.diameterOver2);//, 0, (Math.abs(downVel.length()) * delta) + this.diameterOver2 + 5);
        //var dObjs = ray2.intersectObjects(trackObjects["track"], false);
        //console.log(dObjs);
        /*
        //if(this.name === "FL") {
            if(objs.length > 0) {
                for(var i = 0; i < objs.length; i++) {
                    //this.lastIntersection = objs[i];
                    //console.log("INTERSECT:");
                    //console.log(objs[i]);
                    console.log(this.name + " INTERSECT: " + objs[i].object.name);
                    console.log(objs[i].face);
                    console.log(objs[i].object.geometry.vertices[objs[i].face.a]);
                    //this.onGround = true;
                    //finalX = (objs[i].object.geometry.vertices[objs[i].face.a].x + objs[i].object.geometry.vertices[objs[i].face.b].x + objs[i].object.geometry.vertices[objs[i].face.c].x) / 3;
                    //finalX -= Math.sin(this.car.carAngle + this.turnAngle) * this.diameterOver2;
                    //finalZ = (objs[i].object.geometry.vertices[objs[i].face.a].z + objs[i].object.geometry.vertices[objs[i].face.b].z + objs[i].object.geometry.vertices[objs[i].face.c].z) / 3;
                    //finalZ -= Math.cos(this.car.carAngle + this.turnAngle) * this.diameterOver2;
                    //this.velocity.x = -this.velocity.x;
                    //this.velocity.z = -this.velocity.z;
                    finalX = this.position.x;
                    finalZ = this.position.z;
                    //console.log(finalX + ", " + finalZ);
                    //var finalY = (objs[i].object.geometry.vertices[objs[i].face.a].y + objs[i].object.geometry.vertices[objs[i].face.b].y + objs[i].object.geometry.vertices[objs[i].face.c].y) / 3;
                    //this.position.y = finalY + this.diameterOver2;
                    //this.velocity.y = 0;
                    //this.velocity.y = -this.velocity.y;
                }
            }
        //}
        
        //ray.set(this.position, new THREE.Vector3(this.velocity.x * delta, this.velocity.y * delta, this.velocity.z * delta));
        */
        
        //if(this.lastDelta === 0) {
        //    this.position.x += this.velocity.x * delta;
        //    this.position.y += this.velocity.y * delta;
        //    this.position.z += this.velocity.z * delta;
        //} else {
            //xi+1 = xi + (xi - xi-1) * (dti / dti-1) + a * dti * dti
            //var accX = (this.velocity.x - this.lastVelocity.x) / delta;
            //var accY = (this.velocity.y - this.lastVelocity.y) / delta;
            //var accZ = (this.velocity.z - this.lastVelocity.z) / delta;
            
            //this.position.x = this.position.x + (this.position.x - this.lastPosition.x) * (delta / this.lastDelta) + accX * delta * delta;
            //this.position.x = this.position.y + (this.position.y - this.lastPosition.y) * (delta / this.lastDelta) + accY * delta * delta;
            //this.position.z = this.position.z + (this.position.z - this.lastPosition.z) * (delta / this.lastDelta) + accZ * delta * delta;
            
            // improved euler
            //x = x + v * dt + 0.5 * a * dt * dt
            //this.position.x = this.position.x + this.lastVelocity.x * delta + 0.5 * accX * delta * delta;
            //this.position.y = this.position.y + this.lastVelocity.y * delta + 0.5 * accY * delta * delta;
            //this.position.z = this.position.z + this.lastVelocity.z * delta + 0.5 * accZ * delta * delta;
            
            
            //acceleration = force(time, position, velocity) / mass;
            //time += timestep;
            //position += timestep * (velocity + timestep * acceleration / 2);
            //velocity += timestep * acceleration;
            //newAcceleration = force(time, position, velocity) / mass;
            //velocity += timestep * (newAcceleration - acceleration) / 2;
            this.position.x += delta * (this.velocity.x + delta * this.lastAcceleration.x / 2);
            this.position.y += delta * (this.velocity.y + delta * this.lastAcceleration.y / 2);
            this.position.z += delta * (this.velocity.z + delta * this.lastAcceleration.z / 2);
            this.velocity.x += delta * this.lastAcceleration.x;
            this.velocity.y += delta * this.lastAcceleration.y;
            this.velocity.z += delta * this.lastAcceleration.z;
            var newAccX = acceleration.x;
            var newAccY = acceleration.y;
            var newAccZ = acceleration.z;
            this.velocity.x += delta * (newAccX - acceleration.x) / 2;
            this.velocity.y += delta * (newAccY - acceleration.y) / 2;
            this.velocity.z += delta * (newAccZ - acceleration.z) / 2;
        //}

        this.lastAcceleration.x = newAccX;
        this.lastAcceleration.y = newAccY;
        this.lastAcceleration.z = newAccZ;
        
        this.lastVelocity.copy(this.velocity);
        this.lastPosition.copy(this.position);
        this.lastDelta = delta;
        //this.speed = wheelVel;
        //console.log(this.speed);
        //if(finalX)
        //    this.position.x = finalX;
        
        //if(finalZ)
        //    this.position.z = finalZ;

        //this.position.z -= 0.1;
        
        this.object.position.x = this.position.x;
        this.object.position.y = this.position.y;
        this.object.position.z = this.position.z;
        
        if(!dontCheckGround) {
            this.onGround = false;        

            if(checkUnderGround(this.object, this.diameterOver2)) {
                // if true, we need to bounce the wheel
                this.velocity.y = 0;//-this.velocity.y;
                //this.object.position.y += this.diameter / 2;
                this.position.y = this.object.position.y;
                this.onGround = true;
            }
        }
        
        /*
        if(dObjs.length > 0) {
            //console.log(this.name + " Ground intersect " + dObjs[0].distance + " (" + (this.velocity.y * delta) + ")");
            var finalY = (dObjs[0].object.geometry.vertices[dObjs[0].face.a].y + dObjs[0].object.geometry.vertices[dObjs[0].face.b].y + dObjs[0].object.geometry.vertices[dObjs[0].face.c].y) / 3;
            finalY += this.diameterOver2;
            this.position.y = finalY;
            this.object.position.y = finalY;
            this.onGround = true;
        }
        */
        
        /*
        if(collisionDetected) {
            this.position.x = this.object.position.x;
            this.position.y = this.object.position.y;
            this.position.z = this.object.position.z;
            //this.velocity.x = -this.velocity.x;
            //this.velocity.z = -this.velocity.z;

            //var accX = this.velocity.x / delta;
            //var accY = this.velocity.y / delta;
            //var accZ = this.velocity.z / delta;
            //var fX = accX / this.apparentMass;
            //var fY = accY / this.apparentMass;
            //var fZ = accZ / this.apparentMass;
            //this.applyRigidForce(fX, fY, fZ);
        }
        */
        
    };
    
    
    this.updatePositionF = function (delta, acceleration) {
        
        var finalX, finalZ;
        var forwardVel = new THREE.Vector3(this.velocity.x, 0, this.velocity.z);
        var downVel = new THREE.Vector3(0, -1, 0);
        var ray = new THREE.Raycaster(this.position, forwardVel, 0, (Math.abs(forwardVel.length()) * delta) + this.diameterOver2);
        var objs = ray.intersectObjects(trackObjects["ground"], false);
        
        this.position.x += delta * (this.velocity.x + delta * this.lastAcceleration.x / 2);
        this.position.y += delta * (this.velocity.y + delta * this.lastAcceleration.y / 2);
        this.position.z += delta * (this.velocity.z + delta * this.lastAcceleration.z / 2);
        this.velocity.x += delta * this.lastAcceleration.x;
        this.velocity.y += delta * this.lastAcceleration.y;
        this.velocity.z += delta * this.lastAcceleration.z;
        var newAccX = acceleration.x;
        var newAccY = acceleration.y;
        var newAccZ = acceleration.z;
        this.velocity.x += delta * (newAccX - acceleration.x) / 2;
        this.velocity.y += delta * (newAccY - acceleration.y) / 2;
        this.velocity.z += delta * (newAccZ - acceleration.z) / 2;

        this.lastAcceleration.x = newAccX;
        this.lastAcceleration.y = newAccY;
        this.lastAcceleration.z = newAccZ;
        
        this.lastVelocity.copy(this.velocity);
        this.lastPosition.copy(this.position);
        this.lastDelta = delta;

        this.object.position.x = this.position.x;
        this.object.position.y = this.position.y;
        this.object.position.z = this.position.z;        
        
        this.onGround = false;
        
        if(checkUnderGround(this.object, this.diameterOver2)) {
            // if true, we need to bounce the wheel
            this.velocity.y = 0;//-this.velocity.y;
            this.position.y = this.object.position.y;
            this.onGround = true;
        }        
    };

    this.setRotation = function (rot) {
        if(this.object) {
            this.object.rotation.x = rot.x;
            this.object.rotation.y = rot.y;
            this.object.rotation.z = rot.z;
        }
    };
    
    this.setWheelAngle = function (rot) {
        if(this.object) {
            this.object.rotation.y = rot;
        }
    };
    
    this.translateX = function (t) {
        this.object.position.x = this.position.x;
        this.object.position.y = this.position.y;
        this.object.position.z = this.position.z;
        this.object.translateX(t);
        this.position.x = this.object.position.x;
        this.position.y = this.object.position.y;
        this.position.z = this.object.position.z;
    };
    
    this.translateY = function (t) {
        this.object.position.x = this.position.x;
        this.object.position.y = this.position.y;
        this.object.position.z = this.position.z;
        this.object.translateY(t);
        this.position.x = this.object.position.x;
        this.position.y = this.object.position.y;
        this.position.z = this.object.position.z;
    };
    
    this.translateZ = function (t) {
        this.object.position.x = this.position.x;
        this.object.position.y = this.position.y;
        this.object.position.z = this.position.z;
        this.object.translateZ(t);
        this.position.x = this.object.position.x;
        this.position.y = this.object.position.y;
        this.position.z = this.object.position.z;
    };  
};