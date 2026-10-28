import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const host = document.querySelector('#three-hero');
const canvas = document.querySelector('#focal-scene');
const loader = document.querySelector('#scene-loader');

if (host && canvas) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#080706');
  scene.fog = new THREE.FogExp2('#080706', 0.035);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 12.8);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  scene.add(new THREE.HemisphereLight(0xffd7c1, 0x171014, 1.8));
  const key = new THREE.PointLight(0xff6338, 115, 22, 1.8);
  key.position.set(3.5, 3.2, 3.2);
  scene.add(key);
  const rim = new THREE.PointLight(0xffa16f, 90, 18, 1.8);
  rim.position.set(-4.2, 1.3, -1.2);
  scene.add(rim);
  const coolFill = new THREE.PointLight(0x536d8b, 32, 16, 2);
  coolFill.position.set(-1.5, -3.8, 2.5);
  scene.add(coolFill);

  const world = new THREE.Group();
  scene.add(world);

  // The founder's existing portrait is loaded as a texture on a plane inside the 3D scene.
  // A shader softly dissolves its rectangular edges into the scene lighting.
  const photoGeometry = new THREE.PlaneGeometry(4.65, 6.25, 1, 1);
  const photoMaterial = new THREE.ShaderMaterial({
    uniforms: { portrait: { value: null }, tint: { value: new THREE.Color('#fff1e7') } },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vViewPosition;
      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D portrait;
      uniform vec3 tint;
      varying vec2 vUv;
      varying vec3 vViewPosition;
      void main() {
        vec4 photo = texture2D(portrait, vUv);
        float edgeX = smoothstep(0.0, 0.19, vUv.x) * (1.0 - smoothstep(0.81, 1.0, vUv.x));
        float edgeY = smoothstep(0.0, 0.09, vUv.y) * (1.0 - smoothstep(0.79, 1.0, vUv.y));
        float fade = edgeX * edgeY;
        float vignette = smoothstep(0.0, 0.8, length((vUv - 0.5) * vec2(0.75, 0.8)));
        vec3 color = photo.rgb * tint * (1.0 - vignette * 0.13);
        gl_FragColor = vec4(color, photo.a * fade);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const photo = new THREE.Mesh(photoGeometry, photoMaterial);
  photo.position.set(0.65, -0.1, 0.2);
  photo.rotation.y = -0.055;
  world.add(photo);

  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(
    'retouch_2025072022312035.jpg',
    texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      // Cover crop tuned to portrait photography; use the full image without stretching.
      const imageAspect = texture.image.width / texture.image.height;
      const planeAspect = 4.65 / 6.25;
      if (imageAspect > planeAspect) {
        texture.repeat.x = planeAspect / imageAspect;
        texture.offset.x = (1 - texture.repeat.x) * 0.5;
      } else {
        texture.repeat.y = imageAspect / planeAspect;
        texture.offset.y = (1 - texture.repeat.y) * 0.42;
      }
      photoMaterial.uniforms.portrait.value = texture;
      photoMaterial.needsUpdate = true;
      loader?.classList.add('is-hidden');
    },
    undefined,
    () => {
      if (loader) loader.textContent = 'FOCAL FORGE / KAMPALA';
    }
  );

  // Interlocking 3D torus forms: actual tubular geometry, layered in depth and lit in-scene.
  const ringGroup = new THREE.Group();
  ringGroup.position.set(0.7, 0.12, -0.15);
  world.add(ringGroup);
  const ringSpecs = [
    { radius: 2.65, tube: 0.035, color: 0xff5a2d, metalness: 0.62, roughness: 0.24, rot: [1.12, 0.1, -0.25] },
    { radius: 2.95, tube: 0.012, color: 0xffc09a, metalness: 0.82, roughness: 0.2, rot: [0.76, 0.48, 0.58] },
    { radius: 2.35, tube: 0.018, color: 0x9c422b, metalness: 0.72, roughness: 0.3, rot: [1.38, -0.35, 0.8] },
    { radius: 3.28, tube: 0.009, color: 0xff7c49, metalness: 0.6, roughness: 0.22, rot: [0.35, 0.9, -0.65] }
  ];
  const rings = ringSpecs.map((spec, index) => {
    const geometry = new THREE.TorusGeometry(spec.radius, spec.tube, 12, 220);
    const material = new THREE.MeshStandardMaterial({
      color: spec.color, emissive: spec.color,
      emissiveIntensity: index === 0 ? 1.35 : 0.48,
      metalness: spec.metalness, roughness: spec.roughness
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.set(...spec.rot);
    mesh.userData.baseRotation = mesh.rotation.clone();
    ringGroup.add(mesh);
    return mesh;
  });

  // A real metallic sculptural object and a handful of floating machined forms.
  const sculptureGroup = new THREE.Group();
  sculptureGroup.position.set(2.65, -1.55, 0.9);
  world.add(sculptureGroup);
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.42, 1),
    new THREE.MeshPhysicalMaterial({
      color: 0x17191b, metalness: 0.9, roughness: 0.19,
      clearcoat: 1, clearcoatRoughness: 0.12,
      emissive: 0x6b1c0c, emissiveIntensity: 0.45
    })
  );
  sculptureGroup.add(core);
  const coreRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.65, 0.018, 10, 96),
    new THREE.MeshStandardMaterial({ color: 0xff7545, emissive: 0xff451f, emissiveIntensity: 1.4, metalness: 0.7, roughness: 0.24 })
  );
  coreRing.rotation.set(0.9, 0.3, 0.4);
  sculptureGroup.add(coreRing);

  const floatingForms = [];
  const formMaterial = new THREE.MeshStandardMaterial({
    color: 0x24201e, metalness: 0.88, roughness: 0.24,
    emissive: 0x401408, emissiveIntensity: 0.28
  });
  for (let i = 0; i < 9; i++) {
    const geometry = i % 3 === 0
      ? new THREE.OctahedronGeometry(0.11 + (i % 2) * 0.06, 1)
      : i % 3 === 1
        ? new THREE.BoxGeometry(0.12, 0.12, 0.12, 2, 2, 2)
        : new THREE.TetrahedronGeometry(0.13, 0);
    const mesh = new THREE.Mesh(geometry, formMaterial.clone());
    mesh.material = mesh.material.clone();
    mesh.material.color.setHSL(0.055 + Math.random() * 0.025, 0.32, 0.16 + Math.random() * 0.16);
    mesh.position.set((Math.random() - 0.5) * 7.4, (Math.random() - 0.5) * 6.2, -1.2 + Math.random() * 2.5);
    mesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    mesh.userData = {
      home: mesh.position.clone(),
      phase: Math.random() * Math.PI * 2,
      speed: 0.25 + Math.random() * 0.5
    };
    world.add(mesh);
    floatingForms.push(mesh);
  }

  // Fine, spatially distributed particles give the scene atmosphere and a sense of scale.
  const particleCount = 1250;
  const particlePositions = new Float32Array(particleCount * 3);
  const particleColors = new Float32Array(particleCount * 3);
  const orange = new THREE.Color('#ff663b');
  const warmWhite = new THREE.Color('#d7c4b7');
  for (let i = 0; i < particleCount; i++) {
    const spread = 13;
    particlePositions[i * 3] = (Math.random() - 0.5) * spread;
    particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 9;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1.5;
    const color = Math.random() > 0.82 ? orange : warmWhite;
    particleColors[i * 3] = color.r;
    particleColors[i * 3 + 1] = color.g;
    particleColors[i * 3 + 2] = color.b;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
  const particleMaterial = new THREE.PointsMaterial({
    size: 0.018, vertexColors: true, transparent: true, opacity: 0.66,
    sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  // Thin circular guide geometry at varying depths makes the scene legible in 3D.
  const guideMaterial = new THREE.MeshBasicMaterial({ color: 0xff754c, transparent: true, opacity: 0.25 });
  const guide = new THREE.Mesh(new THREE.TorusGeometry(3.85, 0.006, 6, 240), guideMaterial);
  guide.position.set(0.7, 0.1, -1.8);
  guide.rotation.set(1.05, 0.3, -0.4);
  scene.add(guide);

  const pointer = new THREE.Vector2(0, 0);
  const targetPointer = new THREE.Vector2(0, 0);
  const clock = new THREE.Clock();
  let frameId = 0;
  let disposed = false;

  function resize() {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Pull back on narrow screens so the 3D forms remain in frame.
    camera.position.z = width < 560 ? 14.8 : width < 900 ? 13.8 : 12.8;
    camera.fov = width < 560 ? 39 : 34;
    camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();

  function render() {
    if (disposed) return;
    frameId = requestAnimationFrame(render);
    const elapsed = clock.getElapsedTime();
    const delta = Math.min(clock.getDelta(), 0.04);
    pointer.lerp(targetPointer, 0.035);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.42, 0.035);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, pointer.y * 0.24, 0.035);
    camera.lookAt(0, 0, 0);

    if (!reducedMotion) {
      ringGroup.rotation.y = elapsed * 0.075 + pointer.x * 0.08;
      ringGroup.rotation.x = Math.sin(elapsed * 0.12) * 0.045 + pointer.y * 0.04;
      rings.forEach((ring, index) => {
        ring.rotation.z += delta * (index % 2 ? -0.018 : 0.025);
      });
      core.rotation.x = elapsed * 0.16;
      core.rotation.y = elapsed * 0.21;
      coreRing.rotation.z = elapsed * 0.14;
      sculptureGroup.position.y = -1.55 + Math.sin(elapsed * 0.65) * 0.09;
      floatingForms.forEach(mesh => {
        const { home, phase, speed } = mesh.userData;
        mesh.position.y = home.y + Math.sin(elapsed * speed + phase) * 0.13;
        mesh.rotation.x += delta * speed * 0.2;
        mesh.rotation.y += delta * speed * 0.27;
      });
      particles.rotation.y = elapsed * 0.006;
      particles.position.y = Math.sin(elapsed * 0.16) * 0.08;
      guide.rotation.z = -0.4 + elapsed * 0.018;
    }
    renderer.render(scene, camera);
  }

  host.addEventListener('pointermove', event => {
    const rect = host.getBoundingClientRect();
    targetPointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    targetPointer.y = -((event.clientY - rect.top) / rect.height - 0.5) * 2;
  }, { passive: true });
  host.addEventListener('pointerleave', () => targetPointer.set(0, 0), { passive: true });

  // Pause GPU work when the hero is off-screen or the tab is hidden.
  let inView = true;
  const visibilityObserver = new IntersectionObserver(entries => {
    inView = entries[0]?.isIntersecting ?? true;
    if (inView && !document.hidden && !disposed && !frameId) render();
    if (!inView && frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
  }, { threshold: 0.01 });
  visibilityObserver.observe(host);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    } else if (!document.hidden && inView && !disposed && !frameId) render();
  });

  window.addEventListener('pagehide', () => {
    disposed = true;
    cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    renderer.dispose();
    photoGeometry.dispose();
    photoMaterial.dispose();
    ringGroup.traverse(object => {
      object.geometry?.dispose?.();
      if (object.material) {
        if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
        else object.material.dispose();
      }
    });
    particleGeometry.dispose();
    particleMaterial.dispose();
    guide.geometry.dispose();
    guideMaterial.dispose();
  }, { once: true });

  render();
} else if (loader) {
  loader.classList.add('is-hidden');
}
