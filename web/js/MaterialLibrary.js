var mlib;
var cubeCamera;

function initialiseMaterials() {
    cubeCamera = new THREE.CubeCamera(1, 10000, 128);
    var cubeTarget = cubeCamera.renderTarget;

    mlib = {
        body: {
            "Orange": new THREE.MeshLambertMaterial( { color: 0x883300, ambient: 0x883300, envMap: cubeTarget, combine: THREE.MixOperation, reflectivity: 0.1 } ),
            "Red": new THREE.MeshLambertMaterial( { color: 0x660000, envMap: cubeTarget, combine: THREE.MixOperation, reflectivity: 0.1 } ),
            "Blue": new THREE.MeshLambertMaterial( { color: 0x113355, envMap: cubeTarget, combine: THREE.MixOperation, reflectivity: 0.1 } ),
            "Black": new THREE.MeshLambertMaterial( { color: 0x000000, envMap: cubeTarget, combine: THREE.MixOperation, reflectivity: 0.2 } ),
            "White": new THREE.MeshLambertMaterial( { color: 0xffffff, envMap: cubeTarget, combine: THREE.MixOperation, reflectivity: 0.2 } )
        },
        "Chrome": new THREE.MeshLambertMaterial( { color: 0xffffff, ambient: 0xffffff, envMap: cubeTarget  } ),

        "Dark chrome": new THREE.MeshLambertMaterial( { color: 0x444444, ambient: 0x444444, envMap: cubeTarget } ),

        "Black rough": new THREE.MeshLambertMaterial( { color: 0x050505, ambient: 0x050505 } ),

        "Dark glass": new THREE.MeshLambertMaterial( { color: 0x101020, ambient: 0x101020, envMap: cubeTarget, opacity: 0.5, transparent: true } ),
        "Orange glass": new THREE.MeshLambertMaterial( { color: 0xffbb00, ambient: 0xffbb00, opacity: 0.5, transparent: true } ),
        "Red glass": new THREE.MeshLambertMaterial( { color: 0xff0000, ambient: 0xff0000, opacity: 0.5, transparent: true } ),

        "Black metal": new THREE.MeshLambertMaterial( { color: 0x222222, ambient: 0x222222, envMap: cubeTarget, combine: THREE.MultiplyOperation } ),
        "Orange metal": new THREE.MeshLambertMaterial( { color: 0xff6600, ambient: 0xff6600, envMap: cubeTarget, combine: THREE.MultiplyOperation } )
    };
    
    scene.add(cubeCamera);
}
/*
mlib.body.push( [ "Carmine", new THREE.MeshPhongMaterial( { color: 0x770000, specular: 0xffaaaa, envMap: cubeTarget, combine: THREE.MultiplyOperation } ) ] );
mlib.body.push( [ "Gold", new THREE.MeshPhongMaterial( { color: 0xaa9944, specular: 0xbbaa99, shininess: 50, envMap: cubeTarget, combine: THREE.MultiplyOperation } ) ] );
mlib.body.push( [ "Bronze", new THREE.MeshPhongMaterial( { color: 0x150505, specular: 0xee6600, shininess: 10, envMap: cubeTarget, combine: THREE.MixOperation, reflectivity: 0.2 } ) ] );
mlib.body.push( [ "Chrome", new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0xffffff, envMap: cubeTarget, combine: THREE.MultiplyOperation } ) ] );
*/