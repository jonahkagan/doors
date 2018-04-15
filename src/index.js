import * as THREE from "three";

const container = document.getElementById("container");

//const scene = new THREE.Scene();
//const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

//const renderer = new THREE.WebGLRenderer();
//renderer.setSize(window.innerWidth, window.innerHeight);
//container.appendChild(renderer.domElement);

const webcamVid = document.getElementById("webcam");

function startRecording(stream, lengthInMS) {
	const recordingVid = document.createElement("video");
	container.appendChild(recordingVid);

  let recorder = new MediaRecorder(stream);
  let data = [];
 
  recorder.ondataavailable = event => data.push(event.data);
  recorder.start();
  console.log(recorder.state + " for " + (lengthInMS/1000) + " seconds...");
 
  let stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = event => reject(event.name);
  });

  let recorded = wait(lengthInMS).then(
    () => recorder.state == "recording" && recorder.stop()
  );
 
  return Promise.all([
    stopped,
    recorded
  ])
  .then(() => {
    let recordedBlob = new Blob(data, { type: "video/webm" });
    recordingVid.src = URL.createObjectURL(recordedBlob);
	});
}

function wait(delayInMS) {
  return new Promise(resolve => setTimeout(resolve, delayInMS));
}

navigator.mediaDevices.getUserMedia({
	video: true,
	audio: true
}).then(stream => {
	webcamVid.srcObject = stream;
	return new Promise(resolve => webcamVid.onplaying = resolve);
}).then(() => startRecording(webcamVid.captureStream(), 3000));

//const geometry = new THREE.BoxGeometry( 1, 1, 1 );
//const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
//const cube = new THREE.Mesh( geometry, material );
//scene.add( cube );

//camera.position.z = 5;

//function animate() {
//  requestAnimationFrame(animate);
//  renderer.render(scene, camera);
//}
//animate();
