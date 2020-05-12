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
 * Car.js
 * 
 * Author: Chris Barnard
 * Description: Gives us a structure for holding information about a car.
 * Notes: Obviously, this is currently a massive mess. First job is to tidy up,
 *        follow some sort of style guide and restructure coherently.
 */

OpenRacer.Car = function( parameters, domElement ) {
    this.bodyMeshFile = parameters.body;
    this.wheelMeshFile = parameters.wheel;
    this.wheels = [];
    this.wheelbase = parameters.wheelbase;
    this.front_track = parameters.front_track;
    this.rear_track = parameters.rear_track;
    this.weight_distribution = parameters.weight_distribution;
    //console.log(this.weight_distribution);
    this.tire_diameter = parameters.tire_diameter;
    this.position = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z - 10);
    this.body = new THREE.Object3D();
    this.carCentre = new THREE.Object3D();
    this.carCentre.position.x = camera.position.x;
    this.carCentre.position.y = camera.position.y;
    this.carCentre.position.z = camera.position.z - 10;
    this.mass = parameters.mass;
    this.throttle = 0;
    this.brakePedal = 0;
    this.velocity = new THREE.Vector3( 0, 0, 0 );
    this.width = parameters.width;
    this.height = parameters.height;
    this.length = parameters.length;
    this.frontal_area = this.width * this.height * 0.85;
    this.Cd = 0.4;
    this.Cdrag = 0.5 * this.Cd * this.frontal_area * air_density;
    this.reset = false;
    this.cameraAngle = 0;
    
    this.lapsCompleted = 0;
    this.lapStartTime;
    this.laps = [];
    this.checkPointsCompleted = [false, false, false, false, false, false, false, false, false, false];
    this.currentCheckPoint = "";
    
    var frontSpring = {
        type: "coilover",
        //wire_diameter: 0.015494,
        wire_diameter: 0.0142875, // OEM springs
        outer_diameter: 0.127,
        free_length: 0.428625,
        active_coils: 7,
        //shear_modulus: 79241245136.187 // music wire ASTM A228
        shear_modulus: 68599221789.883, // stainless steel 302 A313
        dist_to_balljoint: 0.2413, // control arm pivot point to balljoint
        dist_to_spring: 0.17, // control arm pivot point to centre of spring
        spring_angle: Math.PI / 2
    };
    
    var rearSpring = {
        type: "leaf",
        shear_modulus: 68599221789.883, // stainless steel 302 A313
        leaves: 5,
        leaf_length: 1.3462,
        leaf_thickness: 0.008,
        leaf_width: 0.0635,
        perch_distance: 1.08585 //distance from centre of left leaf to centre of right leaf
    };
    
    this.engine = new OpenRacer.Engine();
    
    //this.gear_ratios = [ 2.99, 1.75, 1 ]; // Standard Mach 1 351 transmission, code RAT-AM (3.03)
    //this.gear_ratios = [ 2.78, 1.93, 1.36, 1 ]; // Toploader four speed, wide-ratio 351 RUG-E3
    this.gear_ratios = [ 2.32, 1.69, 1.29, 1 ]; // Toploader close-ratio, 351 RUG-AG
    this.final_drive = 3.5; // 3.25, 3.5 or 4.3
    this.current_gear = 0;
    
    this.accelerate = false;
    this.brake = false;
    this.reverse = false;
    this.turnLeft = false;
    this.turnRight = false;
    this.turnDir = 0;
    this.maxTurn = Math.PI / 6;
    this.turnLimit = this.maxTurn;
    this.turnSpeed = 2; // radians per second
    this.turnAngle = 0;
    this.turnAmt = 0;

    
    this.carAngle = 0;
    
    var tobj = this;
    
    
    
    var material = new THREE.MeshBasicMaterial({
            color: 0xff0000
    });
    
    var radius = 0.2;
    var segments = 32;

    /*
    var circleGeometry = new THREE.CircleGeometry( radius, segments );				
    this.circle = new THREE.Mesh( circleGeometry, material );
    scene.add( this.circle );
    this.circle1 = new THREE.Mesh( circleGeometry, material );
    scene.add( this.circle1 );
    this.circle2 = new THREE.Mesh( circleGeometry, material );
    scene.add( this.circle2 );
    this.circle3 = new THREE.Mesh( circleGeometry, material );
    scene.add( this.circle3 );
    */

    
    function bodyLoaded(geometry) {
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        var material = new THREE.MeshFaceMaterial();
        material.materials[0] = mlib["Black metal"]; /* windows */ //new THREE.MeshPhongMaterial ( { color: 0x000000 } );
        material.materials[1] = new THREE.MeshLambertMaterial ( { color: 0x000000 } ); /* front grille */
        material.materials[2] = mlib["Black metal"];/* rear lights */ //new THREE.MeshLambertMaterial ( { color: 0x858585, shading: THREE.FlatShading } );
        material.materials[3] = mlib["Chrome"]; /* bumpers */ //new THREE.MeshPhongMaterial ( { color: 0xffffff, shininess: 10 } );
        material.materials[4] = mlib.body["Orange"]; /* car body */ //new THREE.MeshPhongMaterial ( { emissive: 0x000000, color: 0xff0000, specular: 0xff0000, shininess: 40, shading: THREE.SmoothShading } );
        material.materials[5] = mlib["Chrome"]; /* chrome trim */ //new THREE.MeshPhongMaterial ( { color: 0xffff00, shininess: 10 } );
        material.materials[6] = new THREE.MeshBasicMaterial ( { color: 0x0000ff, shininess: 10 } );

        var mesh = new THREE.Mesh( geometry, material );
        mesh.scale.set(0.5, 0.5, 0.5);
        mesh.castShadow = true;
        mesh.receiveShadow = false;
        tobj.body.add(mesh);
        //carBody.position.x = -36.77731522287426;
        //carBody.position.y = -14.842332522928999;
        //carBody.position.z = 430.97136850461845;

        scene.add(tobj.body);

        shadowLight.target = tobj.body;
    }
    
    function wheelLoaded(geometry) {
        console.log("wheel loaded " + tobj.wheels);
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        var material = new THREE.MeshFaceMaterial();
        material.materials[0] = new THREE.MeshPhongMaterial ( { color: 0x878787 } );
        material.materials[1] = mlib["Chrome"]; /* alloys */ //new THREE.MeshPhongMaterial ( { color: 0xc2c2c2 } );
        material.materials[2] = new THREE.MeshBasicMaterial ( { color: 0x000000, shininess: 10, emissive: 0x000000, specular: 0xffffff } );
        var mesh = new THREE.Mesh( geometry, material );
        mesh.castShadow = true;
        mesh.scale.set(0.5, 0.5, 0.5);

        var wFrontLeft = new THREE.Object3D();
        var wFrontRight = new THREE.Object3D();
        var wRearLeft = new THREE.Object3D();
        var wRearRight = new THREE.Object3D();
        
        var frontMass = tobj.mass * tobj.weight_distribution;
        var rearMass = tobj.mass * (1 - tobj.weight_distribution);
        
        console.log("front mass: " + frontMass);
        console.log("rear mass: " + rearMass);
        console.log("wD: " + this.weight_distribution);
        
        var wFrontL = new THREE.Object3D();
        //wFrontL.rotation.x = -Math.PI / 2;
        wFrontL.add(mesh.clone());
        wFrontLeft.add(wFrontL);
        var wFL = new THREE.Object3D();
        wFL.add(wFrontLeft);
        tobj.wheels.push(new OpenRacer.Wheel({ name: "FL", object: wFL, diameter: tobj.tire_diameter, car: tobj, mass: frontMass / 2, spring: frontSpring }));

        var wFrontR = new THREE.Object3D();
        wFrontR.add(mesh.clone());
        //wFrontR.rotation.x = -Math.PI / 2;
        wFrontRight.add(wFrontR);
        var wFR = new THREE.Object3D();
        wFR.add(wFrontRight);
        tobj.wheels.push(new OpenRacer.Wheel({ name: "FR", object: wFR, diameter: tobj.tire_diameter, right: true, car: tobj, mass: frontMass / 2, spring: frontSpring }));

        // NOTE: This appears to the be the rear-right wheel?
        wRearLeft.add(mesh.clone());
        //wRearLeft.children[0].rotation.y = -Math.PI;
        var wRL = new THREE.Object3D();
        wRL.add(wRearLeft);
        tobj.wheels.push(new OpenRacer.Wheel({ name: "RL", object: wRL, diameter: tobj.tire_diameter, car: tobj, mass: rearMass / 2, spring: rearSpring }));

        wRearRight.add(mesh);
        var wRR = new THREE.Object3D();
        wRR.add(wRearRight);
        tobj.wheels.push(new OpenRacer.Wheel({ name: "RR", object: wRR, diameter: tobj.tire_diameter, right: true, car: tobj, mass: rearMass / 2, spring: rearSpring }));

        scene.add( wFL );
        scene.add( wFR );
        scene.add( wRL );
        scene.add( wRR );

        console.log("wheel loaded " + tobj.wheels);
        
        tobj.checkWheels();
    }
    
    this.getWheelTorque = function (engineRPM) {
        if(this.reverse) {
            return this.engine.getTorque(engineRPM) * this.throttle * -this.gear_ratios[0] * this.final_drive;
        } else {
            return this.engine.getTorque(engineRPM) * this.throttle * this.gear_ratios[this.current_gear] * this.final_drive;
        }
    };
        
    this.update = function( delta, showDebug ) {
        //gamepadUpdate();
        
        if(this.reset) {
            for(var i = 0; i < this.wheels.length; i++) {
                this.wheels[i].position.x = -36.77731522287426;
                this.wheels[i].position.y = -14.842332522928999;
                this.wheels[i].position.z = 430.97136850461845;
            }
        }
        
        if(this.cameraLeft) {
            this.cameraAngle += 2  * delta;
        }
        if(this.cameraRight) {
            this.cameraAngle -= 2 * delta;
        }
        if(showDebug) { debugClear(); }
        if(this.accelerate) {
            this.throttle += (1 - this.throttle) * delta * 4;
        }
        if(this.throttle > 1) this.throttle = 1;
        if(this.brake) {
            this.brakePedal += (1 - this.brakePedal) * delta * 6;
        }
        if(delta > 0.1) {
            if(showDebug) { debugOut("DELTA WARN - " + delta); }
            delta = 0.1;
        }
        this.turnDir = 0;
        if(this.turnLeft) this.turnDir = -1;
        if(this.turnRight) this.turnDir = 1;
        if(this.turnLeft && this.turnRight) this.turnDir = 0;
        //this.checkWheels();
        var mult = 1 - (this.wheels[3].forwardMPH / 120);
        if(mult < 0.3) mult = 0.3;
        var tSpeed = this.turnSpeed * 0.3;
        //debugOut(mult);
        
        //this.turnAmt += (this.turnDir - this.turnAmt) * (delta / 0.5) * mult;
        //debugOut("turn: " + Math.pow(this.turnAmt, 2));
        
        if(this.turnDir === 0) {
            //this.turnAmt -= this.turnAmt * (delta / 0.5);
            if(!mouseDown /* && !usingGamepad */)
                this.turnAngle -= this.turnAngle * 0.25;
        } else if(this.turnDir < 0 && this.turnAngle > 0) {
            this.turnAngle += this.turnDir * ((tSpeed * 3) / Math.max(this.wheels[0].getWheelVelocity() / 4, 1)) * delta;
        } else if(this.turnDir > 0 && this.turnAngle < 0) {
            this.turnAngle += this.turnDir * ((tSpeed * 3) / Math.max(this.wheels[0].getWheelVelocity() / 4, 1)) * delta;
        } else {
            this.turnAngle += this.turnDir * (tSpeed / Math.max(this.wheels[0].getWheelVelocity() / 4, 1)) * delta;
            var mTurn = this.maxTurn;
            if(this.turnLimit < mTurn) {
                mTurn = this.turnLimit;
            }
            if(Math.abs(this.turnAngle) > this.turnLimit) {
                this.turnAngle = this.turnDir * this.turnLimit;
            }
        }
        
        //if(!mouseDown) {
        //    this.turnAngle = Math.pow(this.turnAmt, 2) * this.turnLimit * getSign(this.turnAmt);
        //}
        
        for(var i = 0; i < this.wheels.length; i++) {
            if(this.brakePedal > 0) {
                //console.log("brake");
                if(i > 1) {
                    this.wheels[i].applyBrakingForce(3000 * this.brakePedal);
                } else {
                    this.wheels[i].applyBrakingForce(7500 * this.brakePedal);
                }
            } else {
                //this.wheels[i].brakingForce = 0;
            }
            if(i < 2) {
                this.wheels[i].turn(this.turnAngle);
            }
            //var eRPM = Math.round(this.wheels[i].RPM * (this.gear_ratios[this.current_gear] / this.final_drive));
            if(i > 1) {
                var eRPM = Math.round(this.wheels[i].RPM * this.gear_ratios[this.current_gear] * this.final_drive);
                if(eRPM < 0) eRPM = 0;
                if(i === 3 && showDebug) debugOut(this.wheels[i].forwardMPH + " mph | Gear: " + (this.current_gear + 1) + " | RPM: " + eRPM + " | Throttle: " + this.throttle.toFixed(2) + " | Brake: " + this.brakePedal.toFixed(2));

                if(eRPM < 1000) eRPM = 1000;
                if(eRPM > 6000 && this.current_gear < this.gear_ratios.length - 1) {
                    this.current_gear++;
                } else if(eRPM < 2000 && this.current_gear > 0) {
                    this.current_gear--;
                }

                if(this.throttle > 0) {
                    //console.log(this.getWheelTorque(1500));
                    this.wheels[i].applyForce((this.getWheelTorque(eRPM) / 2) / this.wheels[i].diameter);
                } else {
                    // engine braking (rough calculation of 10% of the vehicles weight, split over both rear wheels)
                    this.wheels[i].applyBrakingForce(0.1 * this.mass * gravity * 0.5);
                }
            }
            this.wheels[i].update( delta );
            //this.wheels[i].updatePosition( delta );
        }
        
        //this.checkWheels(delta);
        this.checkWheels2(delta);
        
        //this.balanceWheelVelocity(delta);
        
        this.wheels[0].incline = this.wheels[2].incline = Math.tan((this.wheels[0].position.y - this.wheels[2].position.y) / this.wheelbase) + (piOver2);
        this.wheels[1].incline = this.wheels[3].incline = Math.tan((this.wheels[1].position.y - this.wheels[3].position.y) / this.wheelbase) + (piOver2);
        
        // get the car's velocity for air resistance
        var avgDirX = (this.wheels[0].velocity.x + this.wheels[1].velocity.x + this.wheels[2].velocity.x + this.wheels[3].velocity.x) / 4;
        var avgDirY = (this.wheels[0].velocity.y + this.wheels[1].velocity.y + this.wheels[2].velocity.y + this.wheels[3].velocity.y) / 4;
        var avgDirZ = (this.wheels[0].velocity.z + this.wheels[1].velocity.z + this.wheels[2].velocity.z + this.wheels[3].velocity.z) / 4;
        var spd = Math.sqrt(Math.pow(avgDirX, 2) + Math.pow(avgDirZ, 2));
        var fDragX = -this.Cdrag * avgDirX * spd * 0.25; // multiply by 0.25 to get force per wheel
        var fDragZ = -this.Cdrag * avgDirZ * spd * 0.25; // multiply by 0.25 to get force per wheel
        //debugOut("wind resistance: " + fDragX + ", " + fDragZ);
        for(var i = 0; i < this.wheels.length; i++) {
            this.wheels[i].applyRigidForce(fDragX, 0, fDragZ);
        }
        var accX = (avgDirX - this.velocity.x) / delta;
        var accZ = (avgDirZ - this.velocity.z) / delta;
        var fA = (accX * Math.cos(-this.carAngle)) - (accZ * Math.sin(-this.carAngle));
        var sA = (accX * Math.sin(-this.carAngle)) + (accZ * Math.cos(-this.carAngle));
        //debugOut("forward acceleration: " + fA);
        var wTransfer = fA * ((this.height * 0.3) / this.wheelbase) * this.mass;
        var fAxleWeight = (this.weight_distribution * this.mass * gravity) - wTransfer;
        var rAxleWeight = ((1 - this.weight_distribution) * this.mass * gravity) + wTransfer;
        var fTransfer = sA * ((this.height * 0.3) / this.front_track) * (fAxleWeight / gravity);
        var rTransfer = sA * ((this.height * 0.3) / this.rear_track) * (rAxleWeight / gravity);
        this.wheels[0].weight = (fAxleWeight / 2) + fTransfer;
        this.wheels[1].weight = (fAxleWeight / 2) - fTransfer;
        this.wheels[2].weight = (rAxleWeight / 2) + rTransfer;
        this.wheels[3].weight = (rAxleWeight / 2) - rTransfer;
        
        //for(var i = 0; i < this.wheels.length; i++) {
        //    debugOut(this.wheels[i].name + ": " + this.wheels[i].weight + " " + (this.wheels[i].mass * gravity));
        //}
        
        //debugOut("front axle: " + fAxleWeight);
        //debugOut("rear axle: " + rAxleWeight);
        
        this.velocity.set(avgDirX, avgDirY, avgDirZ);
        
        shadowLight.position.x = this.body.position.x + 40;
        shadowLight.position.y = this.body.position.y + 70;
        shadowLight.position.z = this.body.position.z + 40;
        
        /*
        for(var i = 0; i < this.wheels.length; i++) {
            for(var obj in this.wheels[i]) {
                if(this.wheels[i].hasOwnProperty(obj)) {
                    if(typeof this.wheels[i][obj] != "function" && typeof this.wheels[i][obj] != "object") {
                        debugOut(obj + ": " + this.wheels[i][obj]);
                    }
                }
            }
        }
        */
       
        if(lastTerrain !== this.currentCheckPoint) {
            this.currentCheckPoint = lastTerrain;
            if(lastTerrain === trackCheckPoints[0]) {
                this.checkPointsCompleted[0] = true;
                var checkpointsPassed = true;
                for(var i = 1; i < this.checkPointsCompleted.length; i++) {
                    if(checkpointsPassed) checkpointsPassed = this.checkPointsCompleted[i];
                    this.checkPointsCompleted[i] = false;
                }
                if(checkpointsPassed) {
                    // we passed all checkpoints
                    if(this.lapStartTime > 0) {
                        var elapsedTime = Date.now() - this.lapStartTime;
                        var min = (elapsedTime / 1000 / 60) << 0;
                        var sec = (elapsedTime / 1000) % 60;
                        var milli = elapsedTime % 1000;
                        this.laps.push(min + ":" + sec + "." + milli.toFixed(3));
                        console.log("lap time: " + this.laps[this.laps.length - 1]);
                    }
                    this.lapsCompleted++;
                }
                this.lapStartTime = Date.now();
            } else {
                for(var i = 1; i < this.checkPointsCompleted.length; i++) {
                    if(lastTerrain === trackCheckPoints[i]) {
                        this.checkPointsCompleted[i] = true;
                        break;
                    }
                }
            }
        }
        //console.log("Checkpoints: " + this.checkPointsCompleted);
        if(showDebug) { debugOut("Laps: " + this.lapsCompleted); }
        var lCount = 0;
        for(var i = this.laps.length - 1; i >= 0; i--) {
            if(showDebug) { debugOut("[" + this.laps[i] + "]"); }
            
            lCount++;
            if(lCount === 3) {
                break;
            }
        }
        
        //if(telemetry) {
        //    telemetry.update();
        //}
    };

    
    var loader = new THREE.JSONLoader();
    loader.load("models/mustang_wheel.json", wheelLoaded);
    loader.load("models/mustang.json", bodyLoaded);
    
    /*
    var modelLoader = new XMLHttpRequest();
    var url = "models/vanq.json";

    modelLoader.onreadystatechange = function() {
        if (modelLoader.readyState == 4 && modelLoader.status == 200) {
            var obj = JSON.parse(modelLoader.responseText);
            for(var i = 0; i < obj.objects.length; i++) {
                console.log(obj.objects[i].name);
                var l = new THREE.JSONLoader();
                console.log(obj.objects[i]);
                var geom = l.parse(obj.objects[i]).geometry;
                var mesh = new THREE.Mesh( geom, mlib.body["Orange"] );
                mesh.position.x = -130.38620930679173;
                mesh.position.y = 2.1395574378241913;
                mesh.position.z = 11;
                scene.add(mesh);
            }
        }
    };
    modelLoader.open("GET", url, true);
    modelLoader.send();
    */
    
    this.checkWheels = function( delta ) {
        var avgX = (this.wheels[0].position.x + this.wheels[1].position.x + this.wheels[2].position.x + this.wheels[3].position.x) / 4;
        var avgY = (this.wheels[0].position.y + this.wheels[1].position.y + this.wheels[2].position.y + this.wheels[3].position.y) / 4;
        var avgZ = (this.wheels[0].position.z + this.wheels[1].position.z + this.wheels[2].position.z + this.wheels[3].position.z) / 4;
        
        this.carAngle = Math.atan2( this.wheels[0].position.z - this.wheels[2].position.z , this.wheels[0].position.x - this.wheels[2].position.x );
        
        var position = new THREE.Vector3 ( avgX, avgY, avgZ );

        this.phi = this.wheels[0].incline;// piOver2;//(this.wheels[0].incline);// + this.wheels[1].incline) / 2;
        //this.theta = this.carAngle;

        var targetPosition = new THREE.Vector3 (0, 0, 0);
        targetPosition.x = this.position.x + (100 * Math.cos( this.carAngle ));
        targetPosition.y = this.position.y;// + (100 * Math.cos( this.phi ));
        targetPosition.z = this.position.z + (100 * Math.sin( this.carAngle ));

        this.carCentre.lookAt(targetPosition);
        
        this.body.position.set (position.x, position.y, position.z);
        
        var avgSpringLength = (this.wheels[0].springLength() + this.wheels[1].springLength() + this.wheels[2].springLength() + this.wheels[3].springLength()) / 4;
        this.body.position.y += avgSpringLength + (this.wheels[0].diameter / 2);
        //debugOut(avgSpringLength);
        
        //this.body.position.y += this.wheels[0].spring.free_length;
        
        // angle front-to-back
        var heightDiffLeft = (this.wheels[1].position.y) - (this.wheels[2].position.y);
        var springDiffLeft = this.wheels[1].springLength() - this.wheels[2].springLength();
        
        var heightDiffRight = (this.wheels[0].position.y) - (this.wheels[3].position.y);
        var springDiffRight = this.wheels[0].springLength() - this.wheels[3].springLength();
        
        var heightDiff = (heightDiffLeft + heightDiffRight) / 2;
        var springDiff = (springDiffLeft + springDiffRight) / 2;

        //var heightDiffRight = (this.wheels[1].position.y - this.wheels[1].springLength()) - (this.wheels[3].position.y - this.wheels[3].springLength());
        //var distLeft = this.wheels[0].position.z - this.wheels[2].position.z;
        //if(isNaN(heightDiff)) console.log("warning heightDiff");
        var carPitch = -Math.asin(heightDiff / this.wheelbase);
        /*if(isNaN(carPitch)) {
            console.log("warning carPitch 2");
            console.log(heightDiff);
            console.log(heightDiff / this.wheelbase);
            console.log("0: " + this.wheels[0].position.y + ", 1: "+ this.wheels[1].position.y + ", 2: "+ this.wheels[2].position.y + ", 3: "+ this.wheels[3].position.y)
            carPitch = 0;
        }*/
        var springPitch = Math.asin(springDiff / this.wheelbase);
        //if(isNaN(this.wheelbase)) console.log("warning wheelbase");
        
        var heightDiffFront = (this.wheels[0].position.y) - (this.wheels[1].position.y);
        var heightDiffRear = (this.wheels[0].position.y) - (this.wheels[1].position.y);
        var springDiffFront = this.wheels[0].springLength() - this.wheels[1].springLength();
        var springDiffRear = this.wheels[2].springLength() - this.wheels[3].springLength();
        var heightDiff2 = (heightDiffFront + heightDiffRear) / 2;
        var springDiff2 = (springDiffFront + springDiffRear) / 2;
        
        //if(isNaN(heightDiff2)) console.log("warning heightDiff2");
        var carRoll = -Math.asin(heightDiff2 / ((this.front_track + this.rear_track) / 2));
        /*if(isNaN(carRoll)) {
            console.log("warning carRoll 2");
            console.log(heightDiff2);
            console.log(heightDiff2 / ((this.front_track + this.rear_track) / 2));
            console.log("0: " + this.wheels[0].position.y + ", 1: "+ this.wheels[1].position.y + ", 2: "+ this.wheels[2].position.y + ", 3: "+ this.wheels[3].position.y)
            console.log("0: " + this.wheels[0].onGround + ", 1: "+ this.wheels[1].onGround + ", 2: "+ this.wheels[2].onGround + ", 3: "+ this.wheels[3].onGround)
            carRoll = 0;
        }*/
        var springRoll = -Math.asin(springDiff2 / ((this.front_track + this.rear_track) / 2));
        //var carRoll = -Math.asin((heightDiffLeft - heightDiffRight) + ((this.front_track + this.rear_track) / 2));
        
        //var carPitch = -Math.atan( (((this.wheels[0].position.y - this.wheels[0].springLength()) - (this.wheels[2].position.y - this.wheels[2].springLength())) + ((this.wheels[1].position.y - this.wheels[1].springLength()) - (this.wheels[3].position.y - this.wheels[3].springLength()))) / 2, ((this.wheels[0].position.z - this.wheels[2].position.z) + (this.wheels[1].position.z - this.wheels[3].position.z)) / 2 ) / 2;
        //var carRoll = -Math.atan( (((this.wheels[0].position.y + this.wheels[0].springLength()) - (this.wheels[1].position.y + this.wheels[1].springLength())) + ((this.wheels[2].position.y + this.wheels[2].springLength()) - (this.wheels[3].position.y + this.wheels[3].springLength()))) / 2, ((this.wheels[0].position.z - this.wheels[1].position.z) + (this.wheels[2].position.z - this.wheels[3].position.z)) / 2 ) / 2;
        if(this.body.children[0]) {
            this.body.children[0].rotation.x = carPitch + springPitch;
            this.body.children[0].rotation.z = carRoll + springRoll;
            //this.body.children[0].rotation.x += (carPitch - this.body.children[0].rotation.x) * 0.25;
            //this.body.children[0].rotation.z += (carRoll - this.body.children[0].rotation.z) * 0.25;
        }
        
        camera.position.x = position.x;
        camera.position.y = position.y;
        camera.position.z = position.z;
        camera.rotation.x = this.carCentre.rotation.x;
        
        if(this.carAngle < 0) {
            //camera.rotation.y += Math.PI;// - (Math.PI / 2);
            camera.rotation.y = this.carCentre.rotation.y + Math.PI - this.cameraAngle;
        } else {
            camera.rotation.y = this.carCentre.rotation.y + Math.PI + this.cameraAngle;
        }
        //debugOut(this.carAngle);
        camera.rotation.z = this.carCentre.rotation.z;
        camera.translateZ(10);
        camera.translateY(2);
        
        this.body.rotation.x = this.carCentre.rotation.x;
        this.body.rotation.y = this.carCentre.rotation.y;
        this.body.rotation.z = this.carCentre.rotation.z;

        //var oWheel = new THREE.Vector3();
        //oWheel.copy(this.wheels[0].position);

        var oX = [this.wheels[0].position.x, this.wheels[1].position.x, this.wheels[2].position.x, this.wheels[3].position.x];
        var oY = [this.wheels[0].position.y, this.wheels[1].position.y, this.wheels[2].position.y, this.wheels[3].position.y];
        var oZ = [this.wheels[0].position.z, this.wheels[1].position.z, this.wheels[2].position.z, this.wheels[3].position.z];
        
        this.wheels[0].setRotation(this.carCentre.rotation);
        this.wheels[1].setRotation(this.carCentre.rotation);
        this.wheels[2].setRotation(this.carCentre.rotation);
        this.wheels[3].setRotation(this.carCentre.rotation);

        //this.setWheelPositionOldMethod(position);
        this.setWheelPosition(position, carPitch, springPitch, carRoll, springRoll);
        
        
        //this.wheels[0].object.visible = false;
        
        //this.setWheelPosition(position, carPitch, springPitch, carRoll, springRoll);
        
        var aX = [this.wheels[0].position.x, this.wheels[1].position.x, this.wheels[2].position.x, this.wheels[3].position.x];
        var aY = [this.wheels[0].position.y, this.wheels[1].position.y, this.wheels[2].position.y, this.wheels[3].position.y];
        var aZ = [this.wheels[0].position.z, this.wheels[1].position.z, this.wheels[2].position.z, this.wheels[3].position.z];
        
        //this.wheels[0].position.x = ((Math.cos(-this.carAngle) * (-this.front_track / 2)) - (Math.sin(-this.carAngle) * (this.wheelbase / 2))) + position.x;
        //this.wheels[0].position.z = (Math.sin(-this.carAngle) * (-this.front_track / 2)) + (Math.cos(-this.carAngle) * (this.wheelbase / 2)) + position.z;
        
        // Treat car like a rigid body - after the car has moved, it will want
        // to bring all the wheels back to their correct positions under the
        // wheel arches. The code above moves them, now we can calculate how
        // much force was required to 'hold' them where they are, and we can
        // apply this force to the wheel to use it in the next render loop.
        dash_tc.className = "dash-tc-off";
        dash_abs.className = "dash-abs-off";
        for(var i = 0; i < this.wheels.length; i++) {
            //debugOut((oX[i] - aX[i]) + ", " + (oZ[i] - aZ[i]));
            var accX = (((oX[i] - aX[i]) / delta) / 2) / delta;// / delta;
            var accY = (((oY[i] - aY[i]) / delta) / 2) / delta;// / delta;
            var accZ = (((oZ[i] - aZ[i]) / delta) / 2) / delta;// / delta;
            var fX = accX * this.wheels[i].apparentMass;
            var fY = accY * this.wheels[i].apparentMass;
            var fZ = accZ * this.wheels[i].apparentMass;
            //debugOut(fX + ", " + fZ);
            //if(isNaN(fX)) fX = 0;
            //if(isNaN(fY)) fY = 0;
            //if(isNaN(fZ)) fZ = 0;
            if(!isNaN(fX) && !isNaN(fZ) && !isNaN(fY)) {
                this.wheels[i].applyRigidForce(-fX, -fY, -fZ);
            }
            //debugOut(this.wheels[i].name + ": " + Math.round(fX) + ", " + Math.round(fY) + ", " + Math.round(fZ) + " - " + accY);
            //debugOut((oX[i] - aX[i]) + ", " + (oY[i] - aY[i]) + ", " + (oZ[i] - aZ[i]));
            //debugOut(this.wheels[i].name + " slip: " + this.wheels[i].slip + " | TC: " + this.wheels[i].tc);
            if(this.wheels[i].tc) {
                dash_tc.className = "dash-tc-on";
            }
            if(this.wheels[i].abs) {
                dash_abs.className = "dash-abs-on";
            }
        }
    };

    this.checkWheels2 = function( delta ) {
        var avgX = (this.wheels[0].position.x + this.wheels[1].position.x + this.wheels[2].position.x + this.wheels[3].position.x) / 4;
        var avgY = (this.wheels[0].position.y + this.wheels[1].position.y + this.wheels[2].position.y + this.wheels[3].position.y) / 4;
        var avgZ = (this.wheels[0].position.z + this.wheels[1].position.z + this.wheels[2].position.z + this.wheels[3].position.z) / 4;
        
        this.carAngle = Math.atan2( this.wheels[0].position.z - this.wheels[2].position.z , this.wheels[0].position.x - this.wheels[2].position.x );
        
        var position = new THREE.Vector3 ( avgX, avgY, avgZ );

        this.phi = this.wheels[0].incline;// piOver2;//(this.wheels[0].incline);// + this.wheels[1].incline) / 2;
        //this.theta = this.carAngle;

        var targetPosition = new THREE.Vector3 (0, 0, 0);
        targetPosition.x = this.position.x + (100 * Math.cos( this.carAngle ));
        targetPosition.y = this.position.y;// + (100 * Math.cos( this.phi ));
        targetPosition.z = this.position.z + (100 * Math.sin( this.carAngle ));

        this.carCentre.lookAt(targetPosition);
        
        this.body.position.set (position.x, position.y, position.z);
        
        var avgSpringLength = (this.wheels[0].springLength() + this.wheels[1].springLength() + this.wheels[2].springLength() + this.wheels[3].springLength()) / 4;
        this.body.position.y += avgSpringLength + (this.wheels[0].diameter / 2);

        // angle front-to-back
        var heightDiffLeft = (this.wheels[1].position.y) - (this.wheels[2].position.y);
        var springDiffLeft = this.wheels[1].springLength() - this.wheels[2].springLength();
        
        var heightDiffRight = (this.wheels[0].position.y) - (this.wheels[3].position.y);
        var springDiffRight = this.wheels[0].springLength() - this.wheels[3].springLength();
        
        var heightDiff = (heightDiffLeft + heightDiffRight) / 2;
        var springDiff = (springDiffLeft + springDiffRight) / 2;

        var carPitch = -Math.asin(heightDiff / this.wheelbase);
        var springPitch = Math.asin(springDiff / this.wheelbase);
        
        var heightDiffFront = (this.wheels[0].position.y) - (this.wheels[1].position.y);
        var heightDiffRear = (this.wheels[0].position.y) - (this.wheels[1].position.y);
        var springDiffFront = this.wheels[0].springLength() - this.wheels[1].springLength();
        var springDiffRear = this.wheels[2].springLength() - this.wheels[3].springLength();
        var heightDiff2 = (heightDiffFront + heightDiffRear) / 2;
        var springDiff2 = (springDiffFront + springDiffRear) / 2;
        
        var carRoll = -Math.asin(heightDiff2 / ((this.front_track + this.rear_track) / 2));
        var springRoll = -Math.asin(springDiff2 / ((this.front_track + this.rear_track) / 2));

        if(this.body.children[0]) {
            this.body.children[0].rotation.x = carPitch + springPitch;
            this.body.children[0].rotation.z = carRoll + springRoll;
        }
        
        camera.position.x = position.x;
        camera.position.y = position.y;
        camera.position.z = position.z;
        camera.rotation.x = this.carCentre.rotation.x;
        
        if(this.carAngle < 0) {
            camera.rotation.y = this.carCentre.rotation.y + Math.PI - this.cameraAngle;
        } else {
            camera.rotation.y = this.carCentre.rotation.y + Math.PI + this.cameraAngle;
        }
        camera.rotation.z = this.carCentre.rotation.z;
        camera.translateZ(10);
        camera.translateY(2);
        
        this.body.rotation.x = this.carCentre.rotation.x;
        this.body.rotation.y = this.carCentre.rotation.y;
        this.body.rotation.z = this.carCentre.rotation.z;

        //var oWheel = new THREE.Vector3();
        //oWheel.copy(this.wheels[0].position);

        var oX = [this.wheels[0].position.x, this.wheels[1].position.x, this.wheels[2].position.x, this.wheels[3].position.x];
        var oY = [this.wheels[0].position.y, this.wheels[1].position.y, this.wheels[2].position.y, this.wheels[3].position.y];
        var oZ = [this.wheels[0].position.z, this.wheels[1].position.z, this.wheels[2].position.z, this.wheels[3].position.z];
        
        this.wheels[0].setRotation(this.carCentre.rotation);
        this.wheels[1].setRotation(this.carCentre.rotation);
        this.wheels[2].setRotation(this.carCentre.rotation);
        this.wheels[3].setRotation(this.carCentre.rotation);

        //this.setWheelPositionOldMethod(position);
        //this.setWheelPosition(position, carPitch, springPitch, carRoll, springRoll);
        var newWheelPos = this.getWheelPosition(position, carPitch, springPitch, carRoll, springRoll);
        
        
        //this.wheels[0].object.visible = false;
        
        //this.setWheelPosition(position, carPitch, springPitch, carRoll, springRoll);
        
        var aX = [this.wheels[0].position.x, this.wheels[1].position.x, this.wheels[2].position.x, this.wheels[3].position.x];
        var aY = [this.wheels[0].position.y, this.wheels[1].position.y, this.wheels[2].position.y, this.wheels[3].position.y];
        var aZ = [this.wheels[0].position.z, this.wheels[1].position.z, this.wheels[2].position.z, this.wheels[3].position.z];
        
        //this.wheels[0].position.x = ((Math.cos(-this.carAngle) * (-this.front_track / 2)) - (Math.sin(-this.carAngle) * (this.wheelbase / 2))) + position.x;
        //this.wheels[0].position.z = (Math.sin(-this.carAngle) * (-this.front_track / 2)) + (Math.cos(-this.carAngle) * (this.wheelbase / 2)) + position.z;
        
        // Treat car like a rigid body - after the car has moved, it will want
        // to bring all the wheels back to their correct positions under the
        // wheel arches. The code above moves them, now we can calculate how
        // much force was required to 'hold' them where they are, and we can
        // apply this force to the wheel to use it in the next render loop.
        dash_tc.className = "dash-tc-off";
        dash_abs.className = "dash-abs-off";
        for(var i = 0; i < this.wheels.length; i++) {
            //debugOut((oX[i] - aX[i]) + ", " + (oZ[i] - aZ[i]));
            var accX = (((oX[i] - newWheelPos[i].x) / delta) / 2) / delta;// / delta;
            var accY = (((oY[i] - newWheelPos[i].y) / delta) / 2) / delta;// / delta;
            var accZ = (((oZ[i] - newWheelPos[i].z) / delta) / 2) / delta;// / delta;
            var fX = accX * this.wheels[i].apparentMass;
            var fY = accY * this.wheels[i].apparentMass;
            var fZ = accZ * this.wheels[i].apparentMass;
            
            //debugOut(fX + ", " + fZ);
            //if(isNaN(fX)) fX = 0;
            //if(isNaN(fY)) fY = 0;
            //if(isNaN(fZ)) fZ = 0;
            if(!isNaN(fX) && !isNaN(fZ) && !isNaN(fY)) {
                //this.wheels[i].applyRigidForce(-fX, -fY, -fZ);
                var acc = new THREE.Vector3(-accX, -accY, -accZ);
                this.wheels[i].updatePosition(delta, acc, true);
            }
            //debugOut(this.wheels[i].name + ": " + Math.round(fX) + ", " + Math.round(fY) + ", " + Math.round(fZ) + " - " + accY);
            //debugOut((oX[i] - aX[i]) + ", " + (oY[i] - aY[i]) + ", " + (oZ[i] - aZ[i]));
            //debugOut(this.wheels[i].name + " slip: " + this.wheels[i].slip + " | TC: " + this.wheels[i].tc);
            if(this.wheels[i].tc) {
                dash_tc.className = "dash-tc-on";
            }
            if(this.wheels[i].abs) {
                dash_abs.className = "dash-abs-on";
            }
            
            this.wheels[i].position.copy(newWheelPos[i]);
            
            //this.wheels[i].object.position.x = newWheelPos[i].x;
            //this.wheels[i].object.position.y = newWheelPos[i].y;
            //this.wheels[i].object.position.z = newWheelPos[i].z;
        }
        
        var carX = (this.wheels[0].position.x + this.wheels[1].position.x + this.wheels[2].position.x + this.wheels[3].position.x) / 4;
        var carY = (this.wheels[0].position.y + this.wheels[1].position.y + this.wheels[2].position.y + this.wheels[3].position.y) / 4;
        var carZ = (this.wheels[0].position.z + this.wheels[1].position.z + this.wheels[2].position.z + this.wheels[3].position.z) / 4;

        //this.body.position.set(carX, carY, carZ);
        //this.body.position.y += avgSpringLength + (this.wheels[0].diameter / 2);
    };
    
    this.setWheelPositionOldMethod = function(position) {
        this.wheels[0].position.x = position.x;// + (this.front_track / 2) * Math.sin( this.phi ) * Math.cos( this.theta );
        //this.wheels[0].position.y = position.y;
        //this.wheels[0].object.rotation.y = this.wheels[0].incline;
        this.wheels[0].position.z = position.z;// + (this.wheelbase / 2) * Math.sin( this.phi ) * Math.sin( this.theta );
        //this.wheels[0].position.x += (-this.front_track / 2) * Math.sin(this.phi) * Math.cos(this.theta);
        //this.wheels[0].position.y += (-this.front_track / 2) * Math.cos(this.phi);
        //this.wheels[0].position.z += (-this.front_track / 2) * Math.sin(this.phi) * Math.sin(this.theta);
        //this.wheels[0].position.y = position.y;

        this.wheels[1].position.x = position.x;// + 3 * Math.sin( this.phi ) * Math.cos( this.theta );
        //this.wheels[1].position.y = position.y;
        this.wheels[1].position.z = position.z;// + 3 * Math.sin( this.phi ) * Math.sin( this.theta );

        this.wheels[2].position.x = position.x;// + 3 * Math.sin( this.phi ) * Math.cos( this.theta );
        //this.wheels[2].position.y = position.y;
        this.wheels[2].position.z = position.z;// + 3 * Math.sin( this.phi ) * Math.sin( this.theta );

        this.wheels[3].position.x = position.x;// + 3 * Math.sin( this.phi ) * Math.cos( this.theta );
        //this.wheels[3].position.y = position.y;
        this.wheels[3].position.z = position.z;// + 3 * Math.sin( this.phi ) * Math.sin( this.theta );        
        
        //this.wheels[0].setWheelAngle(this.carAngle);
        //this.wheels[1].setWheelAngle(this.carAngle);
        //this.wheels[2].setWheelAngle(this.carAngle);
        //this.wheels[3].setWheelAngle(this.carAngle);

        this.wheels[0].translateX ( -this.front_track / 2 );
        //this.wheels[0].translateY ((this.wheelbase / 2) * Math.sin(this.wheels[0].incline));
        this.wheels[0].translateZ ( this.wheelbase / 2 );
        this.wheels[1].translateX ( this.front_track / 2 );
        //this.wheels[1].translateY ((this.wheelbase / 2) * Math.sin(this.wheels[1].incline));
        this.wheels[1].translateZ ( this.wheelbase / 2 );
        this.wheels[2].translateX ( -this.rear_track / 2 );
        //this.wheels[2].translateY ((this.wheelbase / 2) * Math.sin(-this.wheels[2].incline));
        this.wheels[2].translateZ ( -this.wheelbase / 2 );
        this.wheels[3].translateX ( this.rear_track / 2 );
        //this.wheels[3].translateY ((this.wheelbase / 2) * Math.sin(-this.wheels[3].incline));
        this.wheels[3].translateZ ( -this.wheelbase / 2 );
    };
    
    this.setWheelPosition = function(position, carPitch, springPitch, carRoll, springRoll) {
        var pitch = carPitch + springPitch;
        var roll = carRoll + springRoll;
        //if(isNaN(position.x)) console.log("warning setWheelPosition position x");
        //if(isNaN(position.y)) console.log("warning setWheelPosition position y");
        //if(isNaN(position.z)) console.log("warning setWheelPosition position z");
        
        //if(isNaN(carRoll)) console.log("warning carRoll");
        //if(isNaN(springRoll)) console.log("warning springRoll");
        //if(isNaN(carPitch)) console.log("warning carPitch");
        //if(isNaN(springPitch)) console.log("warning springPitch");
        //if(isNaN(this.theta)) console.log("warning theta");
        //if(isNaN(roll)) console.log("warning roll");
        //if(isNaN(pitch)) console.log("warning pitch");
        
        this.wheels[0].position.x = position.x + ((this.wheelbase / 2) * Math.sin(pitch + piOver2) * Math.cos(this.carAngle));
        this.wheels[0].position.y = position.y + ((this.wheelbase / 2) * Math.cos(pitch + piOver2));
        this.wheels[0].position.z = position.z + ((this.wheelbase / 2) * Math.sin(pitch + piOver2) * Math.sin(this.carAngle));// * (-this.front_track / 2) * Math.sin(this.wheels[0].incline) * Math.cos(this.theta);
        //if(isNaN(this.wheels[0].position.x)) console.log("warning setWheelPosition wheels 0 position x");
        
        this.wheels[0].position.x += ((this.front_track / 2) * Math.sin(-roll + piOver2) * Math.cos(this.carAngle + piOver2));
        this.wheels[0].position.y += ((this.front_track / 2) * Math.cos(-roll + piOver2));
        this.wheels[0].position.z += ((this.front_track / 2) * Math.sin(-roll + piOver2)  * Math.sin(this.carAngle + piOver2));


        this.wheels[1].position.x = position.x + ((this.wheelbase / 2) * Math.sin(pitch + piOver2) * Math.cos(this.carAngle));
        this.wheels[1].position.y = position.y + ((this.wheelbase / 2) * Math.cos(pitch + piOver2));
        this.wheels[1].position.z = position.z + ((this.wheelbase / 2) * Math.sin(pitch + piOver2) * Math.sin(this.carAngle));// * (-this.front_track / 2) * Math.sin(this.wheels[0].incline) * Math.cos(this.theta);
        
        this.wheels[1].position.x += ((this.front_track / 2) * Math.sin(-roll + piOver2) * Math.cos(this.carAngle - piOver2));
        this.wheels[1].position.y += ((this.front_track / 2) * Math.cos(-roll + piOver2));
        this.wheels[1].position.z += ((this.front_track / 2) * Math.sin(-roll + piOver2)  * Math.sin(this.carAngle - piOver2));


        this.wheels[3].position.x = position.x + ((this.wheelbase / 2) * Math.sin(pitch - piOver2) * Math.cos(this.carAngle));
        this.wheels[3].position.y = position.y + ((this.wheelbase / 2) * Math.cos(pitch - piOver2));
        this.wheels[3].position.z = position.z + ((this.wheelbase / 2) * Math.sin(pitch - piOver2) * Math.sin(this.carAngle));// * (-this.front_track / 2) * Math.sin(this.wheels[0].incline) * Math.cos(this.theta);
        
        this.wheels[3].position.x += ((this.rear_track / 2) * Math.sin(roll - piOver2) * Math.cos(this.carAngle + piOver2));
        this.wheels[3].position.y += ((this.rear_track / 2) * Math.cos(roll - piOver2));
        this.wheels[3].position.z += ((this.rear_track / 2) * Math.sin(roll - piOver2)  * Math.sin(this.carAngle + piOver2));

        this.wheels[2].position.x = position.x + ((this.wheelbase / 2) * Math.sin(pitch - piOver2) * Math.cos(this.carAngle));
        this.wheels[2].position.y = position.y + ((this.wheelbase / 2) * Math.cos(pitch - piOver2));
        this.wheels[2].position.z = position.z + ((this.wheelbase / 2) * Math.sin(pitch - piOver2) * Math.sin(this.carAngle));// * (-this.front_track / 2) * Math.sin(this.wheels[0].incline) * Math.cos(this.theta);
        
        this.wheels[2].position.x += ((this.rear_track / 2) * Math.sin(roll - piOver2) * Math.cos(this.carAngle - piOver2));
        this.wheels[2].position.y += ((this.rear_track / 2) * Math.cos(roll - piOver2));
        this.wheels[2].position.z += ((this.rear_track / 2) * Math.sin(roll - piOver2)  * Math.sin(this.carAngle - piOver2));
        
        for(var i = 0; i < this.wheels.length; i++) {
            //this.wheels[i].position.y -= this.wheels[i].springExtension;
            //this.wheels[i].position.x += -this.wheels[i].springExtension * Math.sin(pitch) * Math.cos(this.theta);// * Math.cos(carPitch + springPitch - (Math.PI / 2)));
            this.wheels[i].position.y += -this.wheels[i].springExtension * Math.cos(pitch);
            
            if(i < 2) {
                this.wheels[i].position.x += this.wheels[i].springExtension * Math.sin(pitch) * Math.cos(this.carAngle);// * Math.cos(carPitch + springPitch - (Math.PI / 2)));
                this.wheels[i].position.z += this.wheels[i].springExtension * Math.sin(pitch) * Math.sin(this.carAngle);// * Math.sin(carPitch + springPitch - (Math.PI / 2)));
            } else {
                this.wheels[i].position.x -= this.wheels[i].springExtension * Math.sin(pitch) * Math.cos(this.carAngle);// * Math.cos(carPitch + springPitch - (Math.PI / 2)));
                this.wheels[i].position.z -= this.wheels[i].springExtension * Math.sin(pitch) * Math.sin(this.carAngle);// * Math.sin(carPitch + springPitch - (Math.PI / 2)));                
            }
            //this.wheels[i].position.z += -this.wheels[i].springExtension * Math.sin(pitch) * Math.sin(this.theta);// * Math.sin(carPitch + springPitch - (Math.PI / 2)));
        }
        
    };
    
    this.getWheelPosition = function(position, carPitch, springPitch, carRoll, springRoll) {
        var pitch = carPitch + springPitch;
        var roll = carRoll + springRoll;
        
        var wheels = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
        
        wheels[0].x = position.x + ((this.wheelbase / 2) * Math.sin(pitch + piOver2) * Math.cos(this.carAngle));
        wheels[0].y = position.y + ((this.wheelbase / 2) * Math.cos(pitch + piOver2));
        wheels[0].z = position.z + ((this.wheelbase / 2) * Math.sin(pitch + piOver2) * Math.sin(this.carAngle));// * (-this.front_track / 2) * Math.sin(this.wheels[0].incline) * Math.cos(this.theta);
        
        wheels[0].x += ((this.front_track / 2) * Math.sin(-roll + piOver2) * Math.cos(this.carAngle + piOver2));
        wheels[0].y += ((this.front_track / 2) * Math.cos(-roll + piOver2));
        wheels[0].z += ((this.front_track / 2) * Math.sin(-roll + piOver2)  * Math.sin(this.carAngle + piOver2));

        wheels[1].x = position.x + ((this.wheelbase / 2) * Math.sin(pitch + piOver2) * Math.cos(this.carAngle));
        wheels[1].y = position.y + ((this.wheelbase / 2) * Math.cos(pitch + piOver2));
        wheels[1].z = position.z + ((this.wheelbase / 2) * Math.sin(pitch + piOver2) * Math.sin(this.carAngle));// * (-this.front_track / 2) * Math.sin(this.wheels[0].incline) * Math.cos(this.theta);
        
        wheels[1].x += ((this.front_track / 2) * Math.sin(-roll + piOver2) * Math.cos(this.carAngle - piOver2));
        wheels[1].y += ((this.front_track / 2) * Math.cos(-roll + piOver2));
        wheels[1].z += ((this.front_track / 2) * Math.sin(-roll + piOver2)  * Math.sin(this.carAngle - piOver2));

        wheels[3].x = position.x + ((this.wheelbase / 2) * Math.sin(pitch - piOver2) * Math.cos(this.carAngle));
        wheels[3].y = position.y + ((this.wheelbase / 2) * Math.cos(pitch - piOver2));
        wheels[3].z = position.z + ((this.wheelbase / 2) * Math.sin(pitch - piOver2) * Math.sin(this.carAngle));// * (-this.front_track / 2) * Math.sin(this.wheels[0].incline) * Math.cos(this.theta);
        
        wheels[3].x += ((this.rear_track / 2) * Math.sin(roll - piOver2) * Math.cos(this.carAngle + piOver2));
        wheels[3].y += ((this.rear_track / 2) * Math.cos(roll - piOver2));
        wheels[3].z += ((this.rear_track / 2) * Math.sin(roll - piOver2)  * Math.sin(this.carAngle + piOver2));

        wheels[2].x = position.x + ((this.wheelbase / 2) * Math.sin(pitch - piOver2) * Math.cos(this.carAngle));
        wheels[2].y = position.y + ((this.wheelbase / 2) * Math.cos(pitch - piOver2));
        wheels[2].z = position.z + ((this.wheelbase / 2) * Math.sin(pitch - piOver2) * Math.sin(this.carAngle));// * (-this.front_track / 2) * Math.sin(this.wheels[0].incline) * Math.cos(this.theta);
        
        wheels[2].x += ((this.rear_track / 2) * Math.sin(roll - piOver2) * Math.cos(this.carAngle - piOver2));
        wheels[2].y += ((this.rear_track / 2) * Math.cos(roll - piOver2));
        wheels[2].z += ((this.rear_track / 2) * Math.sin(roll - piOver2)  * Math.sin(this.carAngle - piOver2));
        
        for(var i = 0; i < wheels.length; i++) {
            //this.wheels[i].position.y -= this.wheels[i].springExtension;
            //this.wheels[i].position.x += -this.wheels[i].springExtension * Math.sin(pitch) * Math.cos(this.theta);// * Math.cos(carPitch + springPitch - (Math.PI / 2)));
            wheels[i].y += -this.wheels[i].springExtension * Math.cos(pitch);
            
            if(i < 2) {
                wheels[i].x += this.wheels[i].springExtension * Math.sin(pitch) * Math.cos(this.carAngle);// * Math.cos(carPitch + springPitch - (Math.PI / 2)));
                wheels[i].z += this.wheels[i].springExtension * Math.sin(pitch) * Math.sin(this.carAngle);// * Math.sin(carPitch + springPitch - (Math.PI / 2)));
            } else {
                wheels[i].x -= this.wheels[i].springExtension * Math.sin(pitch) * Math.cos(this.carAngle);// * Math.cos(carPitch + springPitch - (Math.PI / 2)));
                wheels[i].z -= this.wheels[i].springExtension * Math.sin(pitch) * Math.sin(this.carAngle);// * Math.sin(carPitch + springPitch - (Math.PI / 2)));                
            }
            //this.wheels[i].position.z += -this.wheels[i].springExtension * Math.sin(pitch) * Math.sin(this.theta);// * Math.sin(carPitch + springPitch - (Math.PI / 2)));
        }

        return wheels;
    };

    
    this.balanceWheelVelocity = function (delta) {
        
        var avgDirX = (this.wheels[0].velocity.x + this.wheels[1].velocity.x + this.wheels[2].velocity.x + this.wheels[3].velocity.x) / 4;
        var avgDirY = (this.wheels[0].velocity.y + this.wheels[1].velocity.y + this.wheels[2].velocity.y + this.wheels[3].velocity.y) / 4;
        var avgDirZ = (this.wheels[0].velocity.z + this.wheels[1].velocity.z + this.wheels[2].velocity.z + this.wheels[3].velocity.z) / 4;
        
        for(var i = 0; i < this.wheels.length; i++) {
            this.wheels[i].velocity.x += (avgDirX - this.wheels[i].velocity.x) * delta * 4;
            this.wheels[i].velocity.y += (avgDirY - this.wheels[i].velocity.y) * delta * 4;
            this.wheels[i].velocity.z += (avgDirZ - this.wheels[i].velocity.z) * delta * 4;
        }
        
        
        /*
        // the avgDir is the new velocity for the car - we know the previous velocity, so we can work out how the car's acceleration
        var aX = (avgDirX - this.velocity.x) / delta;
        var aY = (avgDirY - this.velocity.y) / delta;
        var aZ = (avgDirZ - this.velocity.z) / delta;
        
        // now we can work out the forces to apply to each wheel
        var fX = (this.mass * aX) / 4;
        var fY = (this.mass * aY) / 4;
        var fZ = (this.mass * aZ) / 4;
        
        for(var i = 0; i < this.wheels.length; i++) {
            this.wheels[i].applyInertia(new THREE.Vector3(fX, fY, fZ));
        }
        
        this.velocity.set(avgDirX, avgDirY, avgDirZ);
        */
        /*
        var maxVel = 0;
        var avgVel = 0;
        for(var i = 0; i < this.wheels.length; i++) {
            var wheelVel = this.wheels[i].getWheelVelocity();
            avgVel += wheelVel;
            if(wheelVel > maxVel) maxVel = wheelVel;
        }
        avgVel *= 0.25;
       
        for(var i = 0; i < this.wheels.length; i++) {
            //this.wheels[i].speed = avgSpeed;
            this.wheels[i].setWheelVelocity(avgVel);
        }
        */
    };
    
    this.onKeyDown = function ( event ) {

        //event.preventDefault();

        switch ( event.keyCode ) {

            case 32: /*space*/ this.handbrake = true; break;

            case 38: /*up*/
            case 87: /*W*/ this.accelerate = true; break;

            case 37: /*left*/
            case 65: /*A*/ this.turnLeft = true; break;

            case 40: /*down*/
            case 83: /*S*/ this.brake = true; break;
            
            case 190: /*.*/ this.reverse = true; break;

            case 39: /*right*/
            case 68: /*D*/ this.turnRight = true; break;

            case 82: /*R*/ this.reset = true; break;
            case 70: /*F*/ this.moveDown = true; break;

            case 219: /*[*/ this.cameraLeft = true; break;
            case 221: /*]*/ this.cameraRight = true; break;
            case 192: /*@*/ this.cameraAngle = 0; break;
            
            case 84: /*t*/ telemetry.setVisible(!telemetry.visible);

            default: console.log(event.keyCode + " pressed."); break;

        }

    };

    this.onKeyUp = function ( event ) {

        switch( event.keyCode ) {

            case 32: /*space*/ this.handbrake = false; break;

            case 38: /*up*/
            case 87: /*W*/ this.accelerate = false; this.throttle = 0; break;

            case 37: /*left*/
            case 65: /*A*/ this.turnLeft = false; break;

            case 40: /*down*/
            case 83: /*S*/ this.brake = false; this.brakePedal = 0; break;
            
            case 190: /*.*/ this.reverse = false; break;

            case 39: /*right*/
            case 68: /*D*/ this.turnRight = false; break;

            case 82: /*R*/ this.reset = false; break;
            case 70: /*F*/ this.moveDown = false; break;

            case 219: /*[*/ this.cameraLeft = false; break;
            case 221: /*]*/ this.cameraRight = false; break;
        }

    };

    
    window.addEventListener( 'keydown', bind( this, this.onKeyDown ), false );
    window.addEventListener( 'keyup', bind( this, this.onKeyUp ), false );

    function bind( scope, fn ) {

            return function () {

                    fn.apply( scope, arguments );

            };

    };

};