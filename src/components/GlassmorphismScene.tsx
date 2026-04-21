import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function GlassmorphismScene() {
  return <GlassmorphismSceneInner />;
}

function GlassmorphismSceneInner() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Scene
    const scene = new THREE.Scene();
    const fogColor = new THREE.Color(0xCCE2FF);
    const fog = new THREE.Fog(fogColor, 10, 30);
    scene.fog = fog;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.5, 5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.maxPolarAngle = Math.PI / 1.8;
    controls.minPolarAngle = Math.PI / 3;
    controls.enablePan = false;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 5, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 20;
    scene.add(dirLight);

    // Sky Dome
    const skyGeo = new THREE.SphereGeometry(20, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0xB0D4FF) },
        bottomColor: { value: new THREE.Color(0xCCE2FF) },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPos;
        void main() {
          float h = normalize(vWorldPos).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
        }
      `,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);

    // Clouds
    function createCloud(x: number, y: number, z: number, scale: number) {
      const cloud = new THREE.Group();
      const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.7,
        roughness: 1,
        depthWrite: false,
      });
      const pos: [number, number, number, number][] = [[0, 0, 0, 0.6], [0.5, 0.1, 0, 0.5], [-0.4, -0.05, 0.1, 0.45]];
      pos.forEach(([px, py, pz, r]) => {
        const geo = new THREE.SphereGeometry(r, 16, 16);
        const mesh = new THREE.Mesh(geo, cloudMat);
        mesh.position.set(px, py, pz);
        cloud.add(mesh);
      });
      cloud.position.set(x, y, z);
      cloud.scale.setScalar(scale);
      return cloud;
    }

    for (let i = 0; i < 8; i++) {
      const x = (Math.random() - 0.5) * 14;
      const y = Math.random() * 2 + 1;
      const z = (Math.random() - 0.5) * 8 - 3;
      const s = Math.random() * 0.5 + 0.5;
      scene.add(createCloud(x, y, z, s));
    }

    // Banking Card
    const cardGroup = new THREE.Group();

    const cardGeo = new THREE.BoxGeometry(2.2, 1.4, 0.08);
    const cardMat = new THREE.MeshPhysicalMaterial({
      color: 0x0C1222,
      metalness: 0.8,
      roughness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const cardMesh = new THREE.Mesh(cardGeo, cardMat);
    cardMesh.castShadow = true;
    cardGroup.add(cardMesh);

    const glassGeo = new THREE.BoxGeometry(2.22, 1.42, 0.06);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x1B2132,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.95,
      thickness: 0.5,
      transparent: true,
      opacity: 0.3,
      ior: 1.5,
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    cardGroup.add(glassMesh);

    const bandGeo = new THREE.BoxGeometry(2.22, 0.4, 0.065);
    const bandMat = new THREE.MeshPhysicalMaterial({
      color: 0xC0C8D8,
      metalness: 1.0,
      roughness: 0.05,
      emissive: 0x2A3454,
      emissiveIntensity: 0.2,
    });
    const bandMesh = new THREE.Mesh(bandGeo, bandMat);
    bandMesh.position.set(0, 0.2, 0);
    cardGroup.add(bandMesh);

    const logoGeo = new THREE.CircleGeometry(0.12, 32);
    const logoMat = new THREE.MeshPhysicalMaterial({
      color: 0xD4A853,
      metalness: 0.3,
      roughness: 0.2,
      transparent: true,
      opacity: 0.9,
    });
    const logoMesh = new THREE.Mesh(logoGeo, logoMat);
    logoMesh.position.set(-0.85, -0.35, 0.04);
    logoMesh.rotation.z = Math.PI / 4;
    cardGroup.add(logoMesh);

    cardGroup.position.set(1.2, 0, 0);
    cardGroup.rotation.z = Math.PI / 12;
    scene.add(cardGroup);

    // Frosted Glass Panels
    function createFrostedPanel(x: number, w: number, h: number) {
      const geo = new THREE.BoxGeometry(w, h, 0.05);
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0xCCE2FF,
        metalness: 0.0,
        roughness: 0.6,
        transmission: 0.7,
        thickness: 0.1,
        transparent: true,
        opacity: 0.15,
        ior: 1.3,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, 0, -3);
      mesh.castShadow = true;
      return mesh;
    }

    scene.add(createFrostedPanel(-3, 4, 7));
    scene.add(createFrostedPanel(0, 4, 7));
    scene.add(createFrostedPanel(3, 4, 7));

    // Terrain
    const terrainGeo = new THREE.PlaneGeometry(30, 30, 64, 64);
    terrainGeo.rotateX(-Math.PI / 2);
    terrainGeo.translate(0, -2, 0);

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x6B8FC0,
      roughness: 0.9,
      metalness: 0.1,
    });

    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const y = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.3
        + Math.sin(x * 1.2 + z * 0.8) * 0.15
        + Math.cos(x * 0.3 - z * 1.1) * 0.2;
      posAttr.setY(i, y);
    }
    terrainGeo.computeVertexNormals();

    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Golden Particles
    const particleCount = 50;
    const particlesGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 12;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xD4A853,
      size: 0.04,
      transparent: true,
      opacity: 0.8,
    });
    const particles = new THREE.Points(particlesGeo, particleMat);
    scene.add(particles);

    // Mouse parallax
    const mouse = new THREE.Vector2();
    const targetCameraPos = new THREE.Vector3(0, 0.5, 5);

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      targetCameraPos.x = mouse.x * 0.5;
      targetCameraPos.y = 0.5 + mouse.y * 0.2;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Animation loop
    const clock = new THREE.Clock();
    let animId: number;

    function animate() {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      cardGroup.position.y = Math.sin(elapsedTime * 0.5) * 0.15;
      cardGroup.rotation.y = Math.sin(elapsedTime * 0.2) * 0.1;
      particles.rotation.y = elapsedTime * 0.02;

      camera.position.lerp(targetCameraPos, 0.05);
      camera.lookAt(0, 0, 0);

      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Resize
    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  );
}
