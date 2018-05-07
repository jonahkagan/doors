import React from "react";
import * as THREE from "three";

const container = document.getElementById("container");

//const scene = new THREE.Scene();
//const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

//const renderer = new THREE.WebGLRenderer();
//renderer.setSize(window.innerWidth, window.innerHeight);
//container.appendChild(renderer.domElement);

const webcamVid = document.getElementById("webcam");

async function startRecording(stream) {
  const recorder = new MediaRecorder(stream);
  const data = [];
 
  recorder.ondataavailable = event => data.push(event.data);
  recorder.start();
 
  await new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = event => reject(event.name);
  });

  const recordedBlob = new Blob(data, { type: "video/webm" });
	const newVid = document.createElement("video");
  newVid.autoplay = true;
  newVid.loop = true;
  newVid.muted = true;
  newVid.src = URL.createObjectURL(recordedBlob);
	container.appendChild(newVid);

  return () => {
    if (recorder.state == "recording") {
      recorder.stop()
    }
  };
}

function wait(delayInMS) {
  return new Promise(resolve => setTimeout(resolve, delayInMS));
}

async function init() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });
	webcamVid.srcObject = stream;
	await new Promise(resolve => webcamVid.onplaying = resolve);
}).then(() => 
  document.onclick = () => startRecording(webcamVid.captureStream(), 3000)
);



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
