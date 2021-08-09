
var buildUrl = "Build";
var loaderUrl = buildUrl + "/docs.loader.js";
var config = {
  dataUrl: buildUrl + "/docs.data.unityweb",
  frameworkUrl: buildUrl + "/docs.framework.js.unityweb",
  codeUrl: buildUrl + "/docs.wasm.unityweb",
  streamingAssetsUrl: "StreamingAssets",
  companyName: "DefaultCompany",
  productName: "ARWT",
  productVersion: "0.1",
};
var container = document.querySelector("#unity-container");
var canvas = document.querySelector("#unity-canvas");
var loadingBar = document.querySelector("#unity-loading-bar");
var progressBarFull = document.querySelector("#unity-progress-bar-full");
const unityInstanceM=null;
// var fullscreenButton = document.querySelector("#unity-fullscreen-button");
// var mobileWarning = document.querySelector("#unity-mobile-warning");
var mywidth = innerWidth;
var myheight = innerHeight;
var script = document.createElement("script");
      script.src = loaderUrl;
      script.onload = () => {
        createUnityInstance(canvas, config, (progress) => {
          progressBarFull.style.width = 100 * progress + "%";
        }).then((unityInstance) => {
          loadingBar.style.display = "none";
        //   fullscreenButton.onclick = () => {
        //     unityInstance.SetFullscreen(1);
        //     console.log("Full Screen click");
        //   };
        unityInstanceM=unityInstance;
        }).catch((message) => {
          alert(message);
        });
      };
     // document.body.appendChild(script);
//const unityInstance = UnityLoader.instantiate("unityContainer", "https://poppod.github.io/ARWT/"); 

// const unityInstance= createUnityInstance(document.querySelector("#unityContainer"), {
//     dataUrl: buildUrl + "/docs.data",
//     frameworkUrl: buildUrl + "/docs.framework.js",
//     codeUrl: buildUrl + "/docs.wasm",
//     streamingAssetsUrl: "StreamingAssets",
//     companyName: "DefaultCompany",
//     productName: "ARWT",
//     productVersion: "0.1",
//     // matchWebGLToCanvasSize: false, // Uncomment this to separately control WebGL canvas render size and DOM element size.
//     // devicePixelRatio: 1, // Uncomment this to override low DPI rendering on high DPI displays.
//   });
let isCameraReady = false;
let isDetectionManagerReady = false;
let gl = null;

function cameraReady(){
    isCameraReady = true;
    gl = unityInstanceM.Module.ctx;
}

function detectionManagerReady(){
    isDetectionManagerReady = true;
}

function createUnityMatrix(el){
    const m = el.matrix.clone();
    const zFlipped = new THREE.Matrix4().makeScale(1, 1, -1).multiply(m);
    const rotated = zFlipped.multiply(new THREE.Matrix4().makeRotationX(-Math.PI/2));
    return rotated;
}

AFRAME.registerComponent('markercontroller', {
    schema: {
        name : {type: 'string'}
    },
    tock: function(time, timeDelta){

        let position = new THREE.Vector3();
        let rotation = new THREE.Quaternion();
        let scale = new THREE.Vector3();

        createUnityMatrix(this.el.object3D).decompose(position, rotation, scale);

        const serializedInfos = `${this.data.name},${this.el.object3D.visible},${position.toArray()},${rotation.toArray()},${scale.toArray()}`;

        if(isDetectionManagerReady){
          unityInstanceM.SendMessage("DetectionManager", "markerInfos", serializedInfos);
        }
    } 
});

AFRAME.registerComponent('cameratransform', {
    tock: function(time, timeDelta){

        let camtr = new THREE.Vector3();
        let camro = new THREE.Quaternion();
        let camsc = new THREE.Vector3();

        this.el.object3D.matrix.clone().decompose(camtr, camro, camsc);

        const projection = this.el.components.camera.camera.projectionMatrix.clone();
        const serializedProj = `${[...projection.elements]}`

        const posCam = `${[...camtr.toArray()]}`
        const rotCam = `${[...camro.toArray()]}`
 
        if(isCameraReady){
            unityInstanceM.SendMessage("Main Camera", "setProjection", serializedProj);
            unityInstanceM.SendMessage("Main Camera", "setPosition", posCam);
            unityInstanceM.SendMessage("Main Camera", "setRotation", rotCam);

            let w = window.innerWidth;
            let h = window.innerHeight; 

            const unityCanvas = document.getElementsByTagName('canvas')[0];

            const ratio = unityCanvas.height / h;

            w *= ratio
            h *= ratio

            const size = `${w},${h}`

            unityInstanceM.SendMessage("Canvas", "setSize", size);
        }

        if(gl != null){
            gl.dontClearOnFrameStart = true;
        }
    } 
});

AFRAME.registerComponent('copycanvas', {
    tick: function(time, timeDelta){
        const unityCanvas = document.getElementsByTagName('canvas')[0];
        unityCanvas.width = this.el.canvas.width
        unityCanvas.height = this.el.canvas.height
    } 
});
