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
 * TrackLoader.js
 * 
 * Author: Chris Barnard
 * Description: Loads a track from a JSON file.
 * Notes: Currently, I followed the file format set out by HelloEnjoy's
 *        HelloRacer demo (http://helloracer.com/racer-s/). The intention would
 *        be to build our own track format, but since we don't currently have
 *        any track creation tools, it seems sensible to start with a
 *        pre-existing format.
 */

var xmlhttp = new XMLHttpRequest();
var url = "scene/circuit.json";
var circuitObjects;
//var trackObjects = [];
//var groundObjects = [];
//var otherObjects = [];
var trackObjects = { track: [], grass: [], ground: [], other: [] };
var searchOrder = ["track", "grass", "ground", "other"];
var trackCheckPoints = ["r9","r8","r7","r6","r5","r4","r3","r2","r1","r0"];

var trackLoadedCallback;

function loadTrack(tlCallback) {
    trackLoadedCallback = tlCallback;
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            console.log("circuit loaded");
            var myArr = JSON.parse(xmlhttp.responseText);
            circuitObjects = myArr;
            loadScene();
        }
    }
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

function loadScene() {
    var xmlhttp = new XMLHttpRequest();
    var url = "scene/circuitScene.json";

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            //console.log("scene loaded");
            var myArr = JSON.parse(xmlhttp.responseText);

            for(var obj in myArr) {
                //console.log(obj);
                if(obj == "transforms") {
                    for(var oIndex = 0; oIndex < myArr[obj].length; oIndex++) {
                        var objName = myArr[obj][oIndex].name;
                        //console.log("    " + objName);
                        //console.log(circuitObjects[objName]);
                        if(circuitObjects[objName]) {
                            //console.log("    Found " + objName);
                            var geometry = new THREE.Geometry();
                            var gotVerts = false;
                            var gotTris = false;
                            for(var thing in circuitObjects[objName]) {
                                //console.log("        " + thing);
                                if(thing == "vertices") {
                                    //console.log("        got verts");
                                    gotVerts = true;
                                    for(var i = 0; i < circuitObjects[objName][thing].length; i = i + 3) {
                                        //console.log("[" + myArr[obj][thing][i] + ", " + myArr[obj][thing][i + 1] + ", " + myArr[obj][thing][i + 2] + "]" );
                                        geometry.vertices.push(new THREE.Vector3(circuitObjects[objName][thing][i], circuitObjects[objName][thing][i + 1], circuitObjects[objName][thing][i + 2]));
                                    }
                                } else if (thing == "tris") {
                                    //console.log("        got tris");
                                    gotTris = true;
                                    for(var i = 0; i < circuitObjects[objName][thing].length; i = i + 3) {
                                        var i0 = circuitObjects[objName][thing][i];
                                        var i1 = circuitObjects[objName][thing][i + 1];
                                        var i2 = circuitObjects[objName][thing][i + 2];

                                        if(geometry.vertices.length < i0) {
                                            console.log("warning - " + i0 + " doesn't exist.");
                                        }
                                        if(geometry.vertices.length < i1) {
                                            console.log("warning - " + i1 + " doesn't exist.");
                                        }
                                        if(geometry.vertices.length < i2) {
                                            console.log("warning - " + i2 + " doesn't exist.");
                                        }

                                        geometry.faces.push(new THREE.Face3(i2, i1, i0));

                                        // now get uvs
                                        var uv0 = new THREE.Vector2(circuitObjects[objName].uv1[i0 * 2], circuitObjects[objName].uv1[(i0 * 2) + 1]);
                                        var uv1 = new THREE.Vector2(circuitObjects[objName].uv1[i1 * 2], circuitObjects[objName].uv1[(i1 * 2) + 1]);
                                        var uv2 = new THREE.Vector2(circuitObjects[objName].uv1[i2 * 2], circuitObjects[objName].uv1[(i2 * 2) + 1]);
                                        geometry.faceVertexUvs[0].push([uv2, uv1, uv0]);

                                        uv0 = new THREE.Vector2(circuitObjects[objName].uv2[i0 * 2], circuitObjects[objName].uv2[(i0 * 2) + 1]);
                                        uv1 = new THREE.Vector2(circuitObjects[objName].uv2[i1 * 2], circuitObjects[objName].uv2[(i1 * 2) + 1]);
                                        uv2 = new THREE.Vector2(circuitObjects[objName].uv2[i2 * 2], circuitObjects[objName].uv2[(i2 * 2) + 1]);
                                        if(!geometry.faceVertexUvs[1]) {
                                            geometry.faceVertexUvs[1] = [];
                                        }
                                        geometry.faceVertexUvs[1].push([uv2, uv1, uv0]);
                                    }                                        
                                }
                            }
                            if(gotVerts && gotTris) {
                                geometry.computeBoundingSphere();
                                var red = Math.round(Math.random() * 256);
                                var green = Math.round(Math.random() * 256);
                                var blue = Math.round(Math.random() * 256);
                                var mat = new THREE.MeshBasicMaterial( { color: red + 256 * green + 65536 * blue } )
                                if(myArr[obj][oIndex].renderer) {
                                    var matName = myArr[obj][oIndex].renderer;
                                    var textureName = myArr.materials[matName].colorTexture;
                                    console.log(textureName);
                                    var textureType = myArr.materials[matName].type;
                                    var shine = myArr.materials[matName].shininess;
                                    var specIntensity = myArr.materials[matName].specularIntensity;
                                    var textureOffset = myArr.materials[matName].textureOffset;
                                    var textureTile = myArr.materials[matName].textureTile;
                                    var textureFile = myArr.textures[textureName].file;
                                    //console.log("            material name: " + matName);
                                    //console.log("            texture name: " + textureName);
                                    //console.log("            texture file: " + textureFile);
                                    var texture = THREE.ImageUtils.loadTexture( "images/" + textureFile );
                                    var bumpTexture;
                                    if(textureName === "road") {
                                        //console.log(myArr.textures[textureName]);
                                        //console.log(myArr.textures[textureName + "-specular"]);
                                        //console.log(myArr.textures["road-specular"]);
                                    }
                                    if(myArr.textures[textureName + "-bump"]) {
                                        //console.log("BUMP: " + myArr.textures[textureName + "-bump"].file);
                                        bumpTexture = THREE.ImageUtils.loadTexture( "images/" + myArr.textures[textureName + "-bump"].file );
                                    }
                                    //console.log("            textureTile: " + textureTile);
                                    if(textureTile) {
                                        //console.log("            setting wrapping " + textureTile[0] + " " + textureTile[1]);
                                        texture.wrapS = THREE.RepeatWrapping;
                                        texture.wrapT = THREE.RepeatWrapping;
                                        texture.repeat.set(textureTile[0], textureTile[1]);
                                        texture.offset.x = textureOffset[0];
                                        texture.offset.y = textureOffset[1];
                                        
                                        if(bumpTexture) {
                                            bumpTexture.wrapS = THREE.RepeatWrapping;
                                            bumpTexture.wrapT = THREE.RepeatWrapping;
                                            bumpTexture.repeat.set(textureTile[0], textureTile[1]);
                                            bumpTexture.offset.x = textureOffset[0];
                                            bumpTexture.offset.y = textureOffset[1];                                            
                                        }
                                    }

                                    var maxAnisotropy = renderer.getMaxAnisotropy();
                                    texture.anisotropy = maxAnisotropy;

                                    if(textureName === "road") {
                                        mat = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture, bumpMap: bumpTexture, bumpScale: 1 } );
                                    } else {
                                        mat = new THREE.MeshLambertMaterial( { color: 0xffffff, map: texture } );
                                    }
                                    mat.name = matName;
                                    texture.name = textureName;
                                    mat.shininess = shine;
                                    if(endsWith(textureFile, ".png")) {
                                        mat.transparent = true;
                                    }

                                    //console.log("vert count = " + geometry.vertices.length);
                                    //console.log("uv1 count = " + geometry.faceVertexUvs[0].length);
                                    //console.log("uv2 count = " + geometry.faceVertexUvs[1].length);

                                    geometry.computeFaceNormals();
                                    geometry.computeVertexNormals();

                                    var mesh = new THREE.Mesh( geometry, mat );

                                    //console.log("adding mesh");
                                    mesh.name = objName;
                                    mesh.position.x = myArr[obj][oIndex].position[0];
                                    mesh.position.y = myArr[obj][oIndex].position[1];
                                    mesh.position.z = myArr[obj][oIndex].position[2];
                                    mesh.castShadow = false;
                                    mesh.receiveShadow = true;
                                    if(textureName === "road") {
                                        trackObjects["track"].push( mesh );
                                        scene.add( mesh );
                                    } else if(textureName === "grass") {
                                        trackObjects["grass"].push( mesh );
                                        scene.add( mesh );
                                    } else if(textureName === "ground" || textureName === "track01") {
                                        trackObjects["ground"].push( mesh );
                                        scene.add( mesh );
                                    } else {
                                        if(textureName !== "alpha") {
                                            trackObjects["other"].push( mesh );
                                            scene.add( mesh );
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            console.log("track loaded");
            trackLoadedCallback();
        }
    };
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}