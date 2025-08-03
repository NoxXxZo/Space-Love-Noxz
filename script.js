import * as THREE from "./libs/three.module.js";
import { OrbitControls } from "./libs/OrbitControls.js";

const canvas = document.getElementById("galaxy-canvas");
const music = document.getElementById("bg-music");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let angle = 0;
let radius = 100;
let centerX = canvas.width / 2;
let centerY = canvas.height / 2;
let expanding = false;
let animationId;

function drawGalaxy() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 360; i += 10) {
    const rad = (angle + i) * (Math.PI / 180);
    const x = centerX + radius * Math.cos(rad);
    const y = centerY + radius * Math.sin(rad);
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${i}, 100%, 70%)`;
    ctx.fill();
  }
  angle += 0.5;
  animationId = requestAnimationFrame(drawGalaxy);
}

drawGalaxy();

canvas.addEventListener("click", () => {
  if (expanding) return;
  expanding = true;
  cancelAnimationFrame(animationId);
  canvas.remove();
  music.play();
  start3DScene();
});

function start3DScene() {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 40;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.PointLight(0xffffff, 1);
  light.position.set(0, 0, 50);
  scene.add(light);

  const loader = new THREE.TextureLoader();
  const totalPhotos = 6;
  const orbitRadius = 25;
  const photos = [];

  for (let i = 0; i < totalPhotos; i++) {
    const angle = (i / totalPhotos) * Math.PI * 2;
    const texture = loader.load(`assets/images/foto${i + 1}.jpeg`);
    const geometry = new THREE.PlaneGeometry(8, 6);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(
      orbitRadius * Math.cos(angle),
      0,
      orbitRadius * Math.sin(angle)
    );
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
    photos.push(mesh);
  }

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 10;
  controls.maxDistance = 100;

  function animate() {
    requestAnimationFrame(animate);

    const t = performance.now() * 0.0002;
    photos.forEach((mesh, i) => {
      const angle = t + i;
      mesh.position.x = orbitRadius * Math.cos(angle);
      mesh.position.z = orbitRadius * Math.sin(angle);
      mesh.lookAt(0, 0, 0);
    });

    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}
