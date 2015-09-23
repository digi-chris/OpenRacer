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
 * Helpers.js
 * 
 * Author: Chris Barnard
 * Description: Helper functions that do not have a home at present.
 * Notes: It should be considered that the majority of what ends up here is
 *        only here temporarily until it is worked into the main structure.
 *        However, in the case of often-called variables and functions, having
 *        them available statically without instantiating a class can be useful.
 */

var gravity = 9.81;
var air_density = 1.29;
var piOver2 = Math.PI / 2;
var lastTerrain;

function getSign(x) {
    return x > 0 ? 1 : x === 0 ? 0 : -1;
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function checkOnGround(object, offsetHeight, returnMaterial) {
    //debugOut(offsetHeight);
    var foundGround = false;
    var ray = new THREE.Raycaster();
    ray.set(object.position, new THREE.Vector3(0, -1, 0));
    var objs = ray.intersectObjects(trackObjects, true);
    //console.log(objs);
    //var meshName = objs[0].object.name;
    //var matName = objs[0].object.material.name;
    if(objs.length > 0) {
        var textName = objs[0].object.material.map.name;
        //console.log("mesh: " + meshName + " matName: " + matName + " texture: " + textName);
        debugOut(object.name + " is above \"" + textName + "\".");
        if(textName === "road" || textName === "grass" || textName === "ground" || textName === "track01") {
            var dist = objs[0].distance;
            var correctedDistance = offsetHeight - dist;
            foundGround = true;
            object.position.y += correctedDistance;
            if(returnMaterial) {
                return objs[0].object.name;
            } else {
                return textName;
            }
        } else {
            console.log("unknown texture - " + textName);
        }
    }
    if(!foundGround) {
        // we haven't found the ground! make sure we're not underneath it
        var position = new THREE.Vector3(object.position.x, object.position.y + 20, object.position.z);
        ray.set(position, new THREE.Vector3(0, -1, 0));
        var objs = ray.intersectObjects(trackObjects, true);
        //console.log(objs);
        if(objs.length > 0) {
            //console.log(objs);
            for(var i = 0; i < objs.length; i++) {
                var textName = objs[i].object.material.map.name;
                debugOut(object.name + " is below \"" + textName + "\".");
                if(textName === "road" || textName === "grass" || textName === "ground" || textName === "track01") {
                    var dist = objs[i].distance;
                    var correctedDistance = offsetHeight - (dist - 20);
                    object.position.y += correctedDistance;
                    if(returnMaterial) {
                        return objs[i].object.name;
                    } else {
                        return textName;
                    }
                }
            }
        }
    }
}

var lastGround;

/*
function checkUnderGround(object, offsetHeight) {
    //debugOut(offsetHeight);
    var foundGround = false;
    var ray = new THREE.Raycaster();
    var pos = new THREE.Vector3(object.position.x, object.position.y - offsetHeight, object.position.z);
    ray.set(pos, new THREE.Vector3(0, -1, 0));
    var objs = ray.intersectObjects(trackObjects, true);
    var bestGuess;
    var guessName;
    //console.log(objs);
    //var meshName = objs[0].object.name;
    //var matName = objs[0].object.material.name;
    
    
    if(objs.length > 0) {
        var textName = objs[0].object.material.map.name;
        //console.log("mesh: " + meshName + " matName: " + matName + " texture: " + textName);
        //debugOut(object.name + " is above \"" + textName + "\".");
        if(textName === "road" || textName === "grass" || textName === "ground" || textName === "track01") {
            //var dist = objs[0].distance;
            //var correctedDistance = offsetHeight - dist;
            //foundGround = true;
            //object.position.y += correctedDistance;
            //if(returnMaterial) {
            //    return objs[0].object.name;
            //} else {
            //    return textName;
            //}
            lastTerrain = objs[0].object.name;
            return false;
        } else {
            debugOut("unknown texture - " + textName);
        }
    }
    
    var searchDist = 1;
    while(searchDist < 2000) {
        // we haven't found the ground! make sure we're not underneath it
        var position = new THREE.Vector3(object.position.x, object.position.y + searchDist, object.position.z);
        ray.set(position, new THREE.Vector3(0, -1, 0));
        var objs = ray.intersectObjects(trackObjects, true);
        //console.log(objs);
        if(objs.length > 0) {
            //console.log(objs);
            //for(var i = objs.length - 1; i > -1; i--) {
            for(var i = 0; i < objs.length; i++) {
                var textName = objs[i].object.material.map.name;
                //debugOut(object.name + " is below \"" + textName + "\".");
                if(textName === "road" || textName === "grass" || textName === "ground" || textName === "track01") {
                    var dist = objs[i].distance;
                    var correctedDistance = offsetHeight - (dist - searchDist);
                    object.position.y += correctedDistance;
                    //if(returnMaterial) {
                    //    return objs[i].object.name;
                    //} else {
                    //    return textName;
                    //}
                    lastTerrain = objs[i].object.name;
                    lastGround = textName;
                    //foundGround = true;
                    return true;
                } else {
                    if(!bestGuess) {
                        bestGuess = offsetHeight - (objs[i].distance - searchDist);
                        guessName = objs[i].object.material.map.name;
                    }
                }
            }
        }
        //debugOut("can't find ground!");
        searchDist *= 2;
    }
    
    if(bestGuess) {
        //debugOut("using best guess - " + bestGuess);
        debugOut("WARNING: using best guess for ground! (" + guessName + ")");
        object.position.y += bestGuess;
        return true;
    }
    
    debugOut("WARNING: can't find ground!");
    return false;
}
*/

function checkUnderGround(object, offsetHeight) {
    var ret;// = checkUnderSurface(object, offsetHeight, trackObjects);
    //return ret;
    if(object.lastFoundAt > 0) {
        ret = checkUnderSurface(object, offsetHeight, trackObjects[searchOrder[object.lastFoundAt]]);
        //debugOut("last found at " + object.lastFoundAt + " (" + trackObjects[searchOrder[object.lastFoundAt]].length + ")");
        if(ret !== null)
            return ret;
    }
    for(var i = 0; i < searchOrder.length; i++) {
//        if(i !== object.lastFoundAt) {
            ret = checkUnderSurface(object, offsetHeight, trackObjects[searchOrder[i]]);
            if(ret !== null) {
                object.lastFoundAt = i;
                return ret;
            }
//        }
    }
    //var ret = checkUnderSurface(object, offsetHeight, trackObjects);
    //if(ret === null) {
    //    ret = checkUnderSurface(object, offsetHeight, groundObjects);
    //    if(ret === null) {
    //        ret = cheSckUnderSurface(object, offsetHeight, otherObjects);
    //    }
    //}
    return ret;
}

var collisionDetected = false;

function checkUnderSurface(object, offsetHeight, objArray) {
    collisionDetected = false;
    //debugOut(offsetHeight);
    var oArr = [];
    for(var i = 0; i < objArray.length; i++) {
        if(object.position.x >= objArray[i].position.x - objArray[i].geometry.boundingSphere.radius && object.position.x <= objArray[i].position.x + objArray[i].geometry.boundingSphere.radius) {
            if(object.position.z >= objArray[i].position.z - objArray[i].geometry.boundingSphere.radius && object.position.z <= objArray[i].position.z + objArray[i].geometry.boundingSphere.radius) {
                oArr.push(objArray[i]);
            }
        }
    }
    
    var foundGround = false;
    var ray = new THREE.Raycaster();
    var pos = new THREE.Vector3(object.position.x, object.position.y - offsetHeight, object.position.z);
    ray.set(pos, new THREE.Vector3(0, -1, 0));
    var objs = ray.intersectObjects(oArr, false);
    var bestGuess;
    var guessName;
    //console.log(objs);
    //var meshName = objs[0].object.name;
    //var matName = objs[0].object.material.name;
    
    
    if(objs.length > 0) {
        var textName = objs[0].object.material.map.name;
        //console.log("mesh: " + meshName + " matName: " + matName + " texture: " + textName);
        //debugOut(object.name + " is above \"" + textName + "\".");
        if(textName === "road" || textName === "grass" || textName === "ground" || textName === "track01") {
            //var dist = objs[0].distance;
            //var correctedDistance = offsetHeight - dist;
            //foundGround = true;
            //object.position.y += correctedDistance;
            //if(returnMaterial) {
            //    return objs[0].object.name;
            //} else {
            //    return textName;
            //}
            lastTerrain = objs[0].object.name;
            return false;
        } else {
            debugOut("unknown texture - " + textName);
        }
    }
    
    var searchDist = 1;
    while(searchDist < 2000) {
        // we haven't found the ground! make sure we're not underneath it
        var position = new THREE.Vector3(object.position.x, object.position.y + searchDist, object.position.z);
        ray.set(position, new THREE.Vector3(0, -1, 0));
        var objs = ray.intersectObjects(oArr, false);
        //console.log(objs);
        if(objs.length > 0) {
            //console.log(objs);
            //for(var i = objs.length - 1; i > -1; i--) {
            for(var i = 0; i < objs.length; i++) {
                var textName = objs[i].object.material.map.name;
                //debugOut(object.name + " is below \"" + textName + "\".");
                if(textName === "road" || textName === "grass" || textName === "ground" || textName === "track01") {
                    var dist = objs[i].distance;
                    var correctedDistance = offsetHeight - (dist - searchDist);
                    
                    //if(object.position.y < car.body.position.y) {
                    //    console.log("Possible collision?");
                    //}

                    //var newY = object.position.y + correctedDistance;
                    ////debugOut(newY - object.prevY);
                    //if(newY - object.prevY > offsetHeight / 2) {
                    //    //console.log("Possible collision?");
                    //    collisionDetected = true;
                    //    object.position.x = object.prevX;
                    //    object.position.y = object.prevY;
                    //    object.position.z = object.prevZ;
                    //} else {
                    object.position.y += correctedDistance;
                    //}
                    //object.prevX = object.position.x;
                    //object.prevY = object.position.y;
                    //object.prevZ = object.position.z;

                    //if(returnMaterial) {
                    //    return objs[i].object.name;
                    //} else {
                    //    return textName;
                    //}
                    lastTerrain = objs[i].object.name;
                    lastGround = textName;
                    //foundGround = true;
                    return true;
                } else {
                    if(!bestGuess) {
                        bestGuess = offsetHeight - (objs[i].distance - searchDist);
                        guessName = objs[i].object.material.map.name;
                    }
                }
            }
        }
        //debugOut("can't find ground!");
        searchDist *= 2;
    }
    
    if(bestGuess) {
        //debugOut("using best guess - " + bestGuess);
        debugOut("WARNING: using best guess for ground! (" + guessName + ")");
        object.position.y += bestGuess;
        return true;
    }
    
    //debugOut("WARNING: can't find ground!");
    return null;
}


var uCoeff = {
    "road": { static: 0.9, kinetic: 0.68 },
    "track01": { static: 0.8, kinetic: 0.67 },
    "grass": { static: 0.35, kinetic: 0.3, bumpStatic: 0.5, bumpKinetic: 0.4, bumpChance: 0.1 },
    "ground": { static: 0.35, kinetic: 0.3 }
};


var dO = document.getElementById("debugOut");
var debugText = "";
//var debugCount = 0;

function debugOut(text) {
    debugText += text + "\r\n";
    //console.log(text);
    //dO.innerText += text + "\r\n";
}

function debugClear() {
    //debugCount++;
    //if(debugCount > 10) {
        dO.innerText = debugText;
    //    debugCount = 0;
    //}
    //var dO = document.getElementById("debugOut");
    //dO.innerText = "";
    debugText = "";
}


function hackMaterials( materials ) {

        for ( var i = 0; i < materials.length; i ++ ) {

                var m = materials[ i ];

                if ( m.name.indexOf( "Body" ) !== -1 ) {

                        var mm = new THREE.MeshPhongMaterial( { map: m.map } );

                        //mm.envMap = textureCube;
                        mm.combine = THREE.MixOperation;
                        mm.reflectivity = 0.75;

                        materials[ i ] = mm;

                } else if ( m.name.indexOf( "mirror" ) !== -1 ) {

                        var mm = new THREE.MeshPhongMaterial( { map: m.map } );

                        //mm.envMap = textureCube;
                        mm.combine = THREE.MultiplyOperation;

                        materials[ i ] = mm;

                } else if ( m.name.indexOf( "glass" ) !== -1 ) {

                        var mm = new THREE.MeshPhongMaterial( { map: m.map } );

                        //mm.envMap = textureCube;
                        mm.color.copy( m.color );
                        mm.combine = THREE.MixOperation;
                        mm.reflectivity = 0.25;
                        mm.opacity = m.opacity;
                        mm.transparent = true;

                        materials[ i ] = mm;

                } else if ( m.name.indexOf( "Material.001" ) !== -1 ) {

                        var mm = new THREE.MeshPhongMaterial( { map: m.map } );

                        mm.shininess = 30;
                        mm.color.setHex( 0x404040 );
                        mm.metal = true;

                        materials[ i ] = mm;

                }

                materials[ i ].side = THREE.DoubleSide;

        }

}

function loadCTM(filename) {
    loaderCTM = new THREE.CTMLoader( true );
    document.body.appendChild( loaderCTM.statusDomElement );

    var position = new THREE.Vector3( -130.38620930679173, 5.1395574378241913, 11 );
    var scale = new THREE.Vector3( 1, 1, 1 );

    loaderCTM.loadParts( filename, function( geometries, materials ) {

            hackMaterials( materials );

            for ( var i = 0; i < geometries.length; i ++ ) {
            //var i = ;
//console.log(geometries[i].name);
                    var mesh = new THREE.Mesh( geometries[ i ], materials[ i ] );
                    mesh.position = position;
                    mesh.scale = scale;
                    scene.add( mesh );

            }

            loaderCTM.statusDomElement.style.display = "none";

            //var end = Date.now();

            //console.log( "load time:", end - start, "ms" );

    }, { useWorker: true } );
}