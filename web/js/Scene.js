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
 * Scene.js
 * 
 * Author: Chris Barnard
 * Description: Sets up the ThreeJS scene.
 * Notes: Obviously, this is currently a massive mess. There is a lack of
 *        structure in this file and the majority of it will need to be
 *        abstracted into a class.
 */

var scene;
var container;
var renderer;
var composer;
var camera;
var cubeCamera;
var cubeUpdate = 2;
var cubeCount = 0;
var cubeTarget;
var shadowLight;
var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;

var useComposer = true;
var enableCubeCamera = true;
var composer;
var renderTarget;
var depthTarget;
var depthMaterial;
var effectFXAA;
var effectSSAO;

window.onresize = function() {
    console.log("resizing - " + telemetry);
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;
    if(telemetry) {
        if(telemetry.visible) {
            SCREEN_HEIGHT *= 0.5;
            SCREEN_HEIGHT = Math.floor(SCREEN_HEIGHT);
        }
    }

    renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();
    
    var renderTargetParametersRGBA = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };
    depthTarget = new THREE.WebGLRenderTarget( SCREEN_WIDTH, SCREEN_HEIGHT, renderTargetParametersRGBA );
    renderTargetParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };
    renderTarget = new THREE.WebGLRenderTarget( SCREEN_WIDTH, SCREEN_HEIGHT, renderTargetParameters );
    renderTarget.generateMipmaps = false;
    
    if(useComposer) {
        effectSSAO.uniforms[ 'size' ].value.set( SCREEN_WIDTH, SCREEN_HEIGHT );
        effectFXAA.uniforms[ 'resolution' ].value.set( 1 / ( SCREEN_WIDTH ), 1 / ( SCREEN_HEIGHT ) );
        composer.reset(renderTarget);
        effectSSAO.uniforms[ 'tDepth' ].value = depthTarget;
    }
    console.log(SCREEN_WIDTH + " x " + SCREEN_HEIGHT);
};

RACER.Scene = function (parameters, domElement) {
    this.init = function() {
        container = document.createElement( 'div' );
        document.body.appendChild( container );

        renderer = new THREE.WebGLRenderer( { antialias: true, logarithmicDepthBuffer: false } );
        renderer.shadowMapEnabled = true;
        renderer.shadowMapSoft = true;
        renderer.shadowMapType = THREE.PCFSoftShadowMap;
        renderer.shadowMapCullFace = THREE.CullFaceBack;

        renderer.gammaInput = true;
        renderer.gammaOutput = true;
        renderer.physicallyBasedShading = true;

        camera = new THREE.PerspectiveCamera( 35, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 5000 );

        //camera.position.x = -36.77731522287426;
        //camera.position.y = -14.842332522928999;
        //camera.position.z = 430.97136850461845;
        
        camera.position.x = -130.38620930679173;
        camera.position.y = 5.1395574378241913;
        camera.position.z = 11.5269260973467418;
        
        scene = new THREE.Scene();
        
        if(enableCubeCamera) {
            cubeCamera = new THREE.CubeCamera(1, 1500, 128);
            cubeTarget = cubeCamera.renderTarget;
            scene.add(cubeCamera);
        }

        //scene.fog = new THREE.Fog( 0x000000, 10, 400 );

        var light = new THREE.DirectionalLight( 0xffffff, 0.7 );
        light.position.set( 350, 75, 250 );
        light.target.position.copy( scene.position );
        scene.add( light );

        var light = new THREE.PointLight( 0xffffff, 1, 0 );
        light.position.set( 500, 1000, 0 );
        //light.castShadow = true;
        scene.add(light);
        
        var light = new THREE.AmbientLight( 0x576777 );
        scene.add(light);

        shadowLight = new THREE.SpotLight( 0xffffff );
        shadowLight.position.set(250, 500, 0);
        shadowLight.target.lookAt(0,0,0);
        shadowLight.castShadow = true;
        shadowLight.onlyShadow = true;
        shadowLight.shadowCameraVisible = false;
        shadowLight.shadowMapWidth = 512;
        shadowLight.shadowMapHeight = 512;
        shadowLight.shadowCameraNear = 20;
        shadowLight.shadowCameraFar = 180;
        shadowLight.shadowCameraFov = 4;
        shadowLight.shadowBias = 0;
        shadowLight.shadowDarkness = 0.8;

        scene.add(shadowLight);

        // RENDERER
        renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
        renderer.setClearColor( 0xf2f7ff, 1 );
        //renderer.autoClear = false;

        renderer.domElement.style.position = "relative";
        container.appendChild( renderer.domElement );
        
        if(useComposer) {
            var depthShader = THREE.ShaderLib["depthRGBA"];
            var depthUniforms = THREE.UniformsUtils.clone(depthShader.uniforms);
            depthMaterial = new THREE.ShaderMaterial({
                fragmentShader : depthShader.fragmentShader,
                vertexShader : depthShader.vertexShader,
                uniforms : depthUniforms
            });
            depthMaterial.blending = THREE.NoBlending;
            var SCALE = 1;
            var renderTargetParametersRGBA = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };
            depthTarget = new THREE.WebGLRenderTarget( SCALE * SCREEN_WIDTH, SCALE * SCREEN_HEIGHT, renderTargetParametersRGBA );

            renderTargetParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };
            renderTarget = new THREE.WebGLRenderTarget( SCREEN_WIDTH, SCREEN_HEIGHT, renderTargetParameters );
            renderTarget.generateMipmaps = false;
            composer = new THREE.EffectComposer( renderer, renderTarget );
            
            var renderModel = new THREE.RenderPass( scene, camera );
            composer.addPass(renderModel);
            
            //var bokehSettings = {
            //    focus : 0.995, aperture : 0.2,  maxblur : 5.0,
            //    width: window.innerWidth, height : window.innerHeight
            //};
            //var bokehPass = new THREE.BokehPass( scene, camera, bokehSettings );
            //bokehPass.renderToScreen = true;
            //composer.addPass(bokehPass);
            
            //var copyPass = new THREE.ShaderPass(THREE.CopyShader);
            //composer.addPass(copyPass);
            
            var effectColor = new THREE.ShaderPass( THREE.ColorCorrectionShader );
            effectColor.uniforms[ 'mulRGB' ].value.set( 1.2, 1.2, 1.2 );
            effectColor.uniforms[ 'powRGB' ].value.set( 1.1, 1.1, 1.1 );
            composer.addPass(effectColor);
            
            effectSSAO = new THREE.ShaderPass( THREE.SSAOShader );
            effectSSAO.uniforms[ 'tDepth' ].value = depthTarget;
            effectSSAO.uniforms[ 'size' ].value.set( SCREEN_WIDTH, SCREEN_HEIGHT );
            effectSSAO.uniforms[ 'cameraNear' ].value = camera.near;
            effectSSAO.uniforms[ 'cameraFar' ].value = camera.far / 10;
            //effectSSAO.uniforms[ 'fogNear' ].value = scene.fog.near;
            //effectSSAO.uniforms[ 'fogFar' ].value = scene.fog.far;
            //effectSSAO.uniforms[ 'fogEnabled' ].value = 0;
            //effectSSAO.uniforms[ 'aoClamp' ].value = 10;
            effectSSAO.uniforms.onlyAO.value = 0;
            //effectSSAO.material.defines = { "RGBA_DEPTH": true, "ONLY_AO_COLOR": "1.0, 0.7, 0.5" };
            effectSSAO.renderToScreen = false;
            effectSSAO.enabled = false;
            composer.addPass(effectSSAO);

            var effectVignette = new THREE.ShaderPass( THREE.VignetteShader );
            effectVignette.uniforms[ "darkness" ].value = 1.2;
            composer.addPass(effectVignette);
            
            effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );
            effectFXAA.renderToScreen = true;
            effectFXAA.uniforms[ 'resolution' ].value.set( 1 / ( SCREEN_WIDTH ), 1 / ( SCREEN_HEIGHT ) );
            composer.addPass(effectFXAA);

        }
        
        animate();
    };
};


function animate() {
    requestAnimationFrame( animate );
    this.render();
};

var frameCount = 0;
var countStart = 0;
var fps = 0;
var processingSplit = "";

function render() {
    if(Date.now() - countStart > 1000) {
        fps = frameCount;
        frameCount = 0;
        countStart = Date.now();
        //console.log(fps);
    }
    frameCount++;
    var timeStart = Date.now();
    onEnterFrame();
    var afterCalc = Date.now();
    if(enableCubeCamera && car) {
        if(cubeCount > cubeUpdate) {
            //console.log("cub");
            cubeCamera.position.copy(car.body.position);

            car.body.visible = false;

            //renderer.autoClear = true;
            cubeCamera.updateCubeMap( renderer, scene );
            //renderer.autoClear = false;

            car.body.visible = true;
            cubeCount = 0;
        }
        cubeCount++;
    }
    
    if(useComposer) {
        if(effectSSAO.enabled) {
            scene.overrideMaterial = depthMaterial;
            renderer.render(scene, camera, depthTarget, true);
            scene.overrideMaterial = null;
        }
        composer.render(0.1);
    } else {
        renderer.render(scene, camera);
    }
    var afterRender = Date.now();
    var renderTime = afterRender - afterCalc;
    var calcTime = afterCalc - timeStart;
    var totalTime = afterRender - timeStart;
    processingSplit = Math.round((calcTime / totalTime).toFixed(2) * 100) + "/" + Math.round((renderTime / totalTime).toFixed(2) * 100);
    
    if(fps > 0) {
        debugOut("FPS: " + fps + " (" + processingSplit + ")");
    }
    //camera.position.z += 0.1;
};