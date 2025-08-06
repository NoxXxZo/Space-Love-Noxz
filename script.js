import * as THREE from "./libs/three.module.js";
console.log("THREE is working:");
import { OrbitControls } from "./libs/OrbitControls.js";
//texto
import { FontLoader } from "./libs/FontLoader.js";
import { TextGeometry } from "./libs/TextGeometry.js";

const canvas = document.getElementById("galaxy-canvas");
const music = document.getElementById("bg-music");
const ctx = canvas.getContext("2d");
//electrones del planeta
const electronCount = 3;
const electrons = [];
//mensajes cometa
const cometMessages = ["TE AMO", "ERES LA MEJOR", "SIEMPRE JUNTOS", "MI VIDA"];
const cometTexts = [];
const cometSpawnInterval = 5000; // Cada 5 segundos aparecerá uno
let lastCometSpawnTime = 0;
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
  ctx.font = "bold 27px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🌷Tócame ❤️", centerX, centerY);
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
  let isCameraAnimating = false;
  let cameraAnimationStart = 0;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x110022, 0.005);

  //cometas texto
  function createCometText(message) {
    const group = new THREE.Group();

    const textGeometry = new TextGeometry(message, {
      font: loadedFont, // ← Necesitas tener la fuente cargada globalmente
      size: 2,
      height: 0.2,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 3,
    });
    textGeometry.center();

    const textMaterial = new THREE.MeshBasicMaterial({
      color: 0xf71b22,
      transparent: true,
      opacity: 0.9,
    });

    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    group.add(textMesh);

    // Cola del cometa (un cono estirado)
    const tailGeometry = new THREE.ConeGeometry(0.3, 6, 16);
    tailGeometry.rotateX(-Math.PI / 2);

    const tailMaterial = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });

    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.z = -3; // detrás del texto
    group.add(tail);

    // Posición inicial (aleatoria en X y Y, detrás de la cámara)
    group.position.set(
      (Math.random() - 0.5) * 60,
      (Math.random() - 0.5) * 40,
      -100
    );

    // Dirección de movimiento hacia la cámara con un poco de variación
    const direction = new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1,
      1
    ).normalize();

    cometTexts.push({ group, direction, speed: 0.5 });
    scene.add(group);
  }

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 60;

  //movimiento de camara
  camera.position.z = 10; // Empieza cerca
  isCameraAnimating = true;
  cameraAnimationStart = performance.now();

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x110022, 1); // A juego con la niebla
  document.body.appendChild(renderer.domElement);

  const light = new THREE.PointLight(0xffffff, 1);
  light.position.set(0, 0, 50);
  scene.add(light);

  // Planeta brillante central
  const planetGeometry = new THREE.SphereGeometry(8, 64, 64);
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

  //electrones
  for (let i = 0; i < electronCount; i++) {
    const group = new THREE.Group();

    // Esfera (electrón)
    const electron = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xf71b70 })
    );
    group.add(electron);

    // Estela (pequeña cola estilo cometa)
    const tailLength = 3;
    const tailGeometry = new THREE.ConeGeometry(0.1, tailLength, 12);
    tailGeometry.rotateX(-Math.PI / 2); // apuntar en Z

    const tail = new THREE.Mesh(
      tailGeometry,
      new THREE.MeshBasicMaterial({
        color: 0xf71b70,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      })
    );
    tail.position.z = -tailLength * 0.5; // posicionar detrás del electrón
    group.add(tail);

    // Parámetros de movimiento del electrón
    const radius = 10 + Math.random() * 5; // órbita alrededor del planeta
    const speed = 0.02 + Math.random() * 0.02; // velocidad de rotación
    const inclination = Math.random() * Math.PI; // inclinación orbital

    electrons.push({
      group,
      radius,
      angle: Math.random() * Math.PI * 2,
      speed,
      inclination,
    });
    scene.add(group);
  }

  const nebulas = [];

  const nebulaColors = [0xff66cc, 0x66ccff, 0xcc99ff, 0x99ffcc, 0xffff66];

  for (let i = 0; i < nebulaColors.length; i++) {
    const light = new THREE.PointLight(nebulaColors[i], 4, 200);
    light.castShadow = false;

    light.position.set(
      (Math.random() - 0.5) * 60,
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 60
    );
    scene.add(light);
    //test circulos de nebulosa
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 16, 16),
      new THREE.MeshBasicMaterial({
        color: nebulaColors[i],
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      })
    );
    sphere.position.copy(light.position);
    scene.add(sphere);

    nebulas.push({
      light,
      baseIntensity: Math.random() * 0.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
      phase: Math.random() * Math.PI * 2,
      sphere, // Añadimos la esfera para cambiar su color también
    });
  }

  const totalRings = 5; //numero de capas o anillos
  const photosPerRing = 10; // fotos por anillo
  const orbitBaseRadius = 22; // radio base para el primer anillo
  const photoGroups = [];
  const loader = new THREE.TextureLoader();
  const totalPhotos = 6;
  const orbitRadius = 25;
  const photos = [];

  for (let ring = 0; ring < totalRings; ring++) {
    const ringRadius = orbitBaseRadius + ring * 4;
    const yOffset = (Math.random() - 0.5) * 3; // variación vertical para cada anillo

    for (let i = 0; i < photosPerRing; i++) {
      const textureIndex = Math.floor(Math.random() * totalPhotos) + 1;
      const texture = loader.load(`assets/images/foto${textureIndex}.jpeg`);

      const geometry = new THREE.PlaneGeometry(5, 3.5);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
      });

      const mesh = new THREE.Mesh(geometry, material);

      // Rango de dispersión de radios más amplio para desordenar
      const baseRingRadius = orbitBaseRadius + ring * 4;
      const ringRadiusMin = baseRingRadius - 2;
      const ringRadiusMax = baseRingRadius + 2;
      const actualRadius =
        ringRadiusMin + Math.random() * (ringRadiusMax - ringRadiusMin);

      // Dispersión angular también
      const angle = (i / photosPerRing) * Math.PI * 2 + Math.random() * 0.2;
      const baseAngle = (i / photosPerRing) * Math.PI * 2;
      //const angle = baseAngle + (Math.random() - 0.5) * 0.2; // Variación angular

      const x = actualRadius * Math.cos(angle);
      const z = actualRadius * Math.sin(angle);
      const y = yOffset + (Math.random() - 0.5) * 2;

      mesh.position.set(x, y, z);
      mesh.userData = { angle, ringRadius: actualRadius, yOffset };

      scene.add(mesh);
      photos.push(mesh);
    }
  }
  //texto
  let textMesh = null;
  let textAngle = 0;
  const textRadius = 21;
  const textSpeed = -0.009; // Velocidad de giro (ajusta a gusto)

  //test
  const fontLoader = new FontLoader();
  fontLoader.load(
    "./assets/fonts/helvetiker_bold.typeface.json",
    function (font) {
      loadedFont = font; // Guardar la fuente cargada globalmente
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

      const neonMaterial = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0.9,
      });

      textGeometry.center();
      textMesh = new THREE.Mesh(textGeometry, neonMaterial);
      scene.add(textMesh);
    }
  );

  //rocas de colores
  for (let i = 0; i < 30; i++) {
    const color = new THREE.Color(`hsl(${Math.random() * 360}, 100%, 40%)`);

    const particleMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const size = Math.random() * 1.5 + 0.5;
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(size, 16, 16),
      particleMaterial.clone()
    );

    const angle = Math.random() * Math.PI * 2;
    const radius = orbitBaseRadius + Math.random() * (totalRings * 4);
    const yOffset = (Math.random() - 0.5) * 6;

    particle.position.set(
      radius * Math.cos(angle),
      yOffset,
      radius * Math.sin(angle)
    );
    particle.userData = { angle, ringRadius: radius, yOffset };
    particle.lookAt(0, 0, 0);
    scene.add(particle);
    photos.push(particle); // para que giren igual que las fotos
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

  //cometas
  const cometCount = 5;
  const comets = [];

  for (let i = 0; i < cometCount; i++) {
    // Dirección aleatoria
    const direction = new THREE.Vector3(
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.05,
      1
    ).normalize();

    // Grupo del cometa
    const cometGroup = new THREE.Group();

    // Cabeza
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    cometGroup.add(head);

    // Cola (geometría apuntando en eje Z en vez de Y)
    const tailLength = 40;
    const coneGeometry = new THREE.ConeGeometry(0.3, tailLength, 16);
    coneGeometry.rotateX(-Math.PI / 2); // ← gira el cono para que apunte en Z

    const tail = new THREE.Mesh(
      coneGeometry,
      new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      })
    );

    // Posicionamos la cola detrás de la cabeza en dirección opuesta al movimiento
    tail.position.z = -tailLength * 0.5;

    // Agrupamos cola y cabeza en una subunidad que podemos rotar completa
    const cometBody = new THREE.Group();
    cometBody.add(head);
    cometBody.add(tail);

    // Hacemos que la parte visual mire en dirección opuesta al movimiento
    cometBody.lookAt(cometBody.position.clone().add(direction));
    cometGroup.add(cometBody);

    // Posición inicial aleatoria
    cometGroup.position.set(
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 60,
      -100 - Math.random() * 100
    );

    scene.add(cometGroup);

    comets.push({
      group: cometGroup,
      direction,
      speed: 0.3 + Math.random() * 0.2,
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    //cometas texto
    const currentTime = performance.now();

    if (currentTime - lastCometSpawnTime > cometSpawnInterval && loadedFont) {
      const message =
        cometMessages[Math.floor(Math.random() * cometMessages.length)];
      createCometText(message);
      lastCometSpawnTime = currentTime;
    }

    const t = performance.now() * 0.0002;
    photos.forEach((mesh) => {
      const { angle, ringRadius, yOffset } = mesh.userData;
      const time = t + angle;
      mesh.position.x = ringRadius * Math.cos(time);
      mesh.position.z = ringRadius * Math.sin(time);
      mesh.position.y = yOffset;
      mesh.lookAt(0, 0, 0);
    });

    const time = performance.now() * 0.001;

    nebulas.forEach((nebula, i) => {
      const { light, baseIntensity, speed, phase } = nebula;
      const intensity = baseIntensity + 0.5 * Math.sin(time * speed + phase);
      light.intensity = intensity;

      // Cambio de color con HSL
      const hue = (time * 20) % 360;
      const color = new THREE.Color(`hsl(${hue}, 100%, 60%)`);
      light.color = color;

      planetMaterial.color = color;
      const emissiveIntensity = 0.5 + 0.5 * Math.sin(time * 2); // pulso lento
      planetMaterial.emissiveIntensity = emissiveIntensity;

      planetMaterial.emissive = new THREE.Color(
        `hsl(${(hue + 60) % 360}, 100%, 30%)`
      );

      // Cambiar la esfera nebulosa visual también
      if (nebula.sphere) {
        nebula.sphere.material.color = color;
        nebula.sphere.material.opacity =
          0.3 + 0.3 * Math.sin(time * speed + phase);
      }
    });

    comets.forEach((comet) => {
      comet.group.position.addScaledVector(comet.direction, comet.speed);

      // Si el cometa pasa de la cámara, lo reiniciamos
      if (comet.group.position.z > 50) {
        comet.group.position.set(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 60,
          -100 - Math.random() * 100
        );
      }
    });
    if (textMesh) {
      textAngle += textSpeed;
      const x = textRadius * Math.cos(textAngle);
      const z = textRadius * Math.sin(textAngle);
      const y = 6; // Altura fija sobre el planeta

      textMesh.position.set(x, y, z);
      textMesh.lookAt(camera.position); // Siempre mirando al centro
    }
    //texto cometa
    for (let i = cometTexts.length - 1; i >= 0; i--) {
      const comet = cometTexts[i];
      comet.group.position.addScaledVector(comet.direction, comet.speed);

      // Hacer que el texto mire siempre hacia la cámara
      comet.group.lookAt(camera.position);

      // Si ya pasó la cámara, eliminarlo
      if (comet.group.position.z > 50) {
        scene.remove(comet.group);
        cometTexts.splice(i, 1);
      }
    }

    //electrones
    electrons.forEach((e) => {
      e.angle += e.speed;

      // Calcular posición orbital inclinada
      const x = e.radius * Math.cos(e.angle);
      const y = Math.sin(e.inclination) * e.radius * Math.sin(e.angle);
      const z = Math.cos(e.inclination) * e.radius * Math.sin(e.angle);

      e.group.position.set(x, y, z);

      // Hacer que la estela siempre apunte en dirección opuesta al movimiento
      const tangent = new THREE.Vector3(
        -Math.sin(e.angle),
        0,
        Math.cos(e.angle)
      );
      e.group.lookAt(e.group.position.clone().add(tangent));
    });
    //camara
    if (isCameraAnimating) {
      const elapsed = (performance.now() - cameraAnimationStart) / 1000; // segundos

      if (elapsed < 2) {
        // Etapa 1: Alejamiento
        camera.position.z = 10 + (elapsed / 2) * 50; // Va de z=10 a z=60 en 2s
      } else if (elapsed < 4) {
        // Etapa 2: Movimiento vertical (hacia arriba)
        const progress = (elapsed - 2) / 2;
        camera.position.y = Math.sin(progress * Math.PI) * 40; // Sube hasta y=5 y baja
        camera.position.z = 60; // Mantiene z fijo en 60
      } else {
        // Finaliza la animación y activa controles normales
        isCameraAnimating = false;
        camera.position.set(0, 0, 60); // Posición final
      }
    }

    //cambio de color del planeta

    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}
