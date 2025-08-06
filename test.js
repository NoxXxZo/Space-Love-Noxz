// OPTIMIZED GALAXY SCENE (Performance Boost without Losing Visual Quality)
// Includes: InstancedMesh for comets/rocks, mipmapped textures, reduced draw calls

import * as THREE from "./libs/three.module.js";
import { OrbitControls } from "./libs/OrbitControls.js";
import { FontLoader } from "./libs/FontLoader.js";
import { TextGeometry } from "./libs/TextGeometry.js";

const canvas = document.getElementById("galaxy-canvas");
const music = document.getElementById("bg-music");
const ctx = canvas.getContext("2d");

const cometMessages = ["TE AMO", "ERES LA MEJOR", "SIEMPRE JUNTOS", "MI VIDA"];
let loadedFont = null;

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
  scene.fog = new THREE.FogExp2(0x110022, 0.005);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 60;

  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x110022, 1);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.PointLight(0xffffff, 1);
  light.position.set(0, 0, 50);
  scene.add(light);

  const planetGeometry = new THREE.SphereGeometry(8, 32, 32);
  const planetMaterial = new THREE.MeshPhongMaterial({
    color: 0xf5401b,
    emissive: 0xf5ac1b,
    shininess: 100,
  });
  const planet = new THREE.Mesh(planetGeometry, planetMaterial);
  scene.add(planet);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const loader = new THREE.TextureLoader();
  loader.minFilter = THREE.LinearMipMapLinearFilter;

  const photos = [];
  const totalRings = 5;
  const photosPerRing = 10;
  const orbitBaseRadius = 22;

  for (let ring = 0; ring < totalRings; ring++) {
    const ringRadius = orbitBaseRadius + ring * 4;
    const yOffset = (Math.random() - 0.5) * 3;
    for (let i = 0; i < photosPerRing; i++) {
      const textureIndex = Math.floor(Math.random() * 6) + 1;
      const texture = loader.load(`assets/images/foto${textureIndex}.jpeg`);
      const geometry = new THREE.PlaneGeometry(5, 3.5);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
      });
      const mesh = new THREE.Mesh(geometry, material);

      const angle = (i / photosPerRing) * Math.PI * 2 + Math.random() * 0.2;
      const actualRadius = ringRadius + (Math.random() - 0.5) * 4;
      const x = actualRadius * Math.cos(angle);
      const z = actualRadius * Math.sin(angle);
      const y = yOffset + (Math.random() - 0.5) * 2;

      mesh.position.set(x, y, z);
      mesh.userData = { angle, ringRadius: actualRadius, yOffset };

      photos.push(mesh);
      scene.add(mesh);
    }
  }

  const instancedRockGeometry = new THREE.SphereGeometry(1, 16, 16);
  const instancedRockMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });
  const rocks = new THREE.InstancedMesh(
    instancedRockGeometry,
    instancedRockMaterial,
    30
  );

  for (let i = 0; i < 30; i++) {
    const dummy = new THREE.Object3D();
    const radius = orbitBaseRadius + Math.random() * (totalRings * 4);
    const angle = Math.random() * Math.PI * 2;
    const yOffset = (Math.random() - 0.5) * 6;

    dummy.position.set(
      radius * Math.cos(angle),
      yOffset,
      radius * Math.sin(angle)
    );
    dummy.scale.setScalar(Math.random() * 1.5 + 0.5);
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
  }
  scene.add(rocks);

  const cometGeometry = new THREE.ConeGeometry(0.3, 5, 8);
  cometGeometry.rotateX(-Math.PI / 2);
  const cometMaterial = new THREE.MeshBasicMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  const comets = new THREE.InstancedMesh(cometGeometry, cometMaterial, 10);

  const cometData = [];
  for (let i = 0; i < 10; i++) {
    const dummy = new THREE.Object3D();
    const direction = new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1,
      1
    ).normalize();
    const speed = 0.3 + Math.random() * 0.2;

    dummy.position.set(
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 60,
      -100 - Math.random() * 100
    );
    dummy.lookAt(dummy.position.clone().add(direction));
    dummy.updateMatrix();
    comets.setMatrixAt(i, dummy.matrix);

    cometData.push({ position: dummy.position.clone(), direction, speed });
  }
  scene.add(comets);

  const fontLoader = new FontLoader();
  let textMesh = null;
  fontLoader.load("./assets/fonts/helvetiker_bold.typeface.json", (font) => {
    loadedFont = font;
    const textGeometry = new TextGeometry("TE AMO", {
      font: font,
      size: 4,
      height: 0.5,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 5,
    });
    textGeometry.center();
    const textMaterial = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.9,
    });
    textMesh = new THREE.Mesh(textGeometry, textMaterial);
    scene.add(textMesh);
  });

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 10;
  controls.maxDistance = 100;
  controls.enableZoom = false;

  function animate() {
    requestAnimationFrame(animate);

    const t = performance.now() * 0.0002;
    photos.forEach((mesh) => {
      const { angle, ringRadius, yOffset } = mesh.userData;
      const time = t + angle;
      mesh.position.x = ringRadius * Math.cos(time);
      mesh.position.z = ringRadius * Math.sin(time);
      mesh.lookAt(0, 0, 0);
    });

    cometData.forEach((comet, i) => {
      comet.position.addScaledVector(comet.direction, comet.speed);
      if (comet.position.z > 50) {
        comet.position.set(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 60,
          -100 - Math.random() * 100
        );
      }
      const dummy = new THREE.Object3D();
      dummy.position.copy(comet.position);
      dummy.lookAt(dummy.position.clone().add(comet.direction));
      dummy.updateMatrix();
      comets.setMatrixAt(i, dummy.matrix);
    });
    comets.instanceMatrix.needsUpdate = true;

    if (textMesh) {
      const textRadius = 21;
      const textAngle = t * -5;
      const x = textRadius * Math.cos(textAngle);
      const z = textRadius * Math.sin(textAngle);
      textMesh.position.set(x, 6, z);
      textMesh.lookAt(camera.position);
    }

    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}
