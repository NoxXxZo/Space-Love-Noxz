import * as THREE from "./libs/three.module.js";
console.log("THREE is working:");
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

  // Planeta brillante central
  const planetGeometry = new THREE.SphereGeometry(5, 64, 64);
  const planetMaterial = new THREE.MeshPhongMaterial({
    color: 0xf5401b,
    emissive: 0xf5ac1b,
    shininess: 100,
  });
  const planet = new THREE.Mesh(planetGeometry, planetMaterial);
  scene.add(planet);

  // Luz envolvente para hacer que brille más
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const loader = new THREE.TextureLoader();
  const totalPhotos = 12;
  const orbitRadius = 25;
  const photos = [];

  for (let i = 0; i < totalPhotos; i++) {
    const angle = (i / totalPhotos) * Math.PI * 2;
    const textureIndex = (i % 6) + 1; // Reutiliza las 6 imágenes
    const texture = loader.load(`assets/images/foto${textureIndex}.jpeg`);

    const geometry = new THREE.PlaneGeometry(5, 3.5); // Más pequeño que antes
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      orbitRadius * Math.cos(angle),
      (Math.random() - 0.5) * 2, // pequeña variación vertical
      orbitRadius * Math.sin(angle)
    );
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
    photos.push(mesh);
  }

  const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let i = 0; i < 100; i++) {
    const star = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 6, 6),
      starMaterial
    );
    star.position.set(
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 100
    );
    scene.add(star);
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
      const angle = t + i * 0.5;
      const yOffset = mesh.position.y;

      mesh.position.x = orbitRadius * Math.cos(angle);
      mesh.position.z = orbitRadius * Math.sin(angle);
      mesh.position.y = yOffset;
      mesh.lookAt(0, 0, 0);
    });

    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}
