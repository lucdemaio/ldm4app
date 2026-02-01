// graphics-engine.js - Sistema grafica 3D avanzato
'use strict';

const GraphicsEngine = (function() {
  
  // Configurazioni lighting per diverse condizioni
  const LIGHTING_PRESETS = {
    sunrise: {
      name: 'Alba',
      skyColor: 0xFFB6C1,
      fogColor: 0xFFC8D4,
      sunColor: 0xFFD4A3,
      sunIntensity: 1.2,
      ambientColor: 0xFFE8D8,
      ambientIntensity: 0.6,
      hemisphereTop: 0xFFD4C8,
      hemisphereBottom: 0x8B9DC3,
      sunPosition: { x: 50, y: 15, z: 30 },
      fogNear: 80,
      fogFar: 200
    },
    
    morning: {
      name: 'Mattino',
      skyColor: 0x87CEEB,
      fogColor: 0xB0D8F0,
      sunColor: 0xFFFAF0,
      sunIntensity: 1.5,
      ambientColor: 0xE8F4F8,
      ambientIntensity: 0.7,
      hemisphereTop: 0xB8E6FF,
      hemisphereBottom: 0xA0C8E0,
      sunPosition: { x: 60, y: 40, z: 20 },
      fogNear: 100,
      fogFar: 250
    },
    
    midday: {
      name: 'Mezzogiorno',
      skyColor: 0x4A90E2,
      fogColor: 0xB8D8F0,
      sunColor: 0xFFFFF0,
      sunIntensity: 1.8,
      ambientColor: 0xF0F8FF,
      ambientIntensity: 0.85,
      hemisphereTop: 0xD0E8FF,
      hemisphereBottom: 0xB0D0E8,
      sunPosition: { x: 40, y: 80, z: 10 },
      fogNear: 120,
      fogFar: 300
    },
    
    afternoon: {
      name: 'Pomeriggio',
      skyColor: 0x6BA3D8,
      fogColor: 0xC8D8E8,
      sunColor: 0xFFF8DC,
      sunIntensity: 1.4,
      ambientColor: 0xE8F0F8,
      ambientIntensity: 0.75,
      hemisphereTop: 0xC8E0F8,
      hemisphereBottom: 0xA8C8E0,
      sunPosition: { x: -50, y: 35, z: 20 },
      fogNear: 90,
      fogFar: 240
    },
    
    sunset: {
      name: 'Tramonto',
      skyColor: 0xFF8C69,
      fogColor: 0xFFB4A0,
      sunColor: 0xFF6B4A,
      sunIntensity: 1.3,
      ambientColor: 0xFFD8C8,
      ambientIntensity: 0.65,
      hemisphereTop: 0xFFB8A0,
      hemisphereBottom: 0x8B6878,
      sunPosition: { x: -60, y: 12, z: 35 },
      fogNear: 70,
      fogFar: 180
    },
    
    night: {
      name: 'Notte',
      skyColor: 0x0A1929,
      fogColor: 0x1A2535,
      sunColor: 0x6B8CAE,  // Moonlight
      sunIntensity: 0.4,
      ambientColor: 0x2B3D50,
      ambientIntensity: 0.3,
      hemisphereTop: 0x1E3A5F,
      hemisphereBottom: 0x0D1821,
      sunPosition: { x: 30, y: 50, z: -20 },
      fogNear: 40,
      fogFar: 120,
      stars: true
    },
    
    cloudy: {
      name: 'Nuvoloso',
      skyColor: 0x8B9DB0,
      fogColor: 0xA8B8C8,
      sunColor: 0xD8E0E8,
      sunIntensity: 0.9,
      ambientColor: 0xC8D4E0,
      ambientIntensity: 0.75,
      hemisphereTop: 0xB8C8D8,
      hemisphereBottom: 0x98A8B8,
      sunPosition: { x: 40, y: 50, z: 20 },
      fogNear: 60,
      fogFar: 160
    },
    
    snowing: {
      name: 'Nevicata',
      skyColor: 0xD0D8E0,
      fogColor: 0xE0E8F0,
      sunColor: 0xF0F4F8,
      sunIntensity: 0.7,
      ambientColor: 0xE8F0F8,
      ambientIntensity: 0.85,
      hemisphereTop: 0xF0F4F8,
      hemisphereBottom: 0xD0D8E0,
      sunPosition: { x: 30, y: 45, z: 15 },
      fogNear: 30,
      fogFar: 100,
      particles: 'snow'
    }
  };
  
  // Materiali neve avanzati
  const SNOW_MATERIALS = {
    fresh: {
      name: 'Neve Fresca',
      color: 0xFFFFFF,
      roughness: 0.8,
      metalness: 0.1,
      emissive: 0xF0F8FF,
      emissiveIntensity: 0.1
    },
    
    packed: {
      name: 'Neve Battuta',
      color: 0xF8FBFF,
      roughness: 0.6,
      metalness: 0.15,
      emissive: 0xE8F0F8,
      emissiveIntensity: 0.05
    },
    
    icy: {
      name: 'Neve Ghiacciata',
      color: 0xE0F0FF,
      roughness: 0.3,
      metalness: 0.4,
      emissive: 0xD0E8FF,
      emissiveIntensity: 0.08
    },
    
    wet: {
      name: 'Neve Bagnata',
      color: 0xE8F4FA,
      roughness: 0.4,
      metalness: 0.2,
      emissive: 0xD8E8F0,
      emissiveIntensity: 0.03
    }
  };
  
  // Sfondi montani procedurali per ogni location
  const MOUNTAIN_BACKGROUNDS = {
    alpine: {
      name: 'Alpi',
      peaks: [
        { x: -80, y: 0, z: -150, height: 60, width: 40, color: 0x8B9DA8 },
        { x: -40, y: 0, z: -180, height: 80, width: 50, color: 0x7A8B98 },
        { x: 0, y: 0, z: -160, height: 70, width: 45, color: 0x8A9AA8 },
        { x: 50, y: 0, z: -190, height: 90, width: 55, color: 0x6A7A88 },
        { x: 100, y: 0, z: -170, height: 65, width: 42, color: 0x8B9BA8 }
      ],
      snowLine: 0.4,
      treeLine: 0.6
    },
    
    dolomites: {
      name: 'Dolomiti',
      peaks: [
        { x: -90, y: 0, z: -140, height: 75, width: 35, color: 0xC8B8A8, rocky: true },
        { x: -30, y: 0, z: -170, height: 95, width: 40, color: 0xD0C0B0, rocky: true },
        { x: 20, y: 0, z: -155, height: 85, width: 38, color: 0xC0B0A0, rocky: true },
        { x: 70, y: 0, z: -185, height: 100, width: 45, color: 0xB8A898, rocky: true },
        { x: 110, y: 0, z: -160, height: 70, width: 33, color: 0xC8B8A8, rocky: true }
      ],
      snowLine: 0.5,
      treeLine: 0.7
    },
    
    pyrenees: {
      name: 'Pirenei',
      peaks: [
        { x: -70, y: 0, z: -145, height: 55, width: 45, color: 0x7A8A78 },
        { x: -20, y: 0, z: -165, height: 65, width: 48, color: 0x8A9A88 },
        { x: 30, y: 0, z: -150, height: 60, width: 42, color: 0x7A8A78 },
        { x: 80, y: 0, z: -175, height: 70, width: 50, color: 0x6A7A68 },
        { x: 120, y: 0, z: -155, height: 58, width: 40, color: 0x8A9A88 }
      ],
      snowLine: 0.45,
      treeLine: 0.65
    },
    
    scandinavian: {
      name: 'Scandinavia',
      peaks: [
        { x: -60, y: 0, z: -135, height: 50, width: 50, color: 0x6A7A8A, gentle: true },
        { x: 0, y: 0, z: -160, height: 58, width: 55, color: 0x7A8A9A, gentle: true },
        { x: 60, y: 0, z: -145, height: 52, width: 48, color: 0x6A7A8A, gentle: true },
        { x: 100, y: 0, z: -170, height: 60, width: 52, color: 0x5A6A7A, gentle: true }
      ],
      snowLine: 0.3,
      treeLine: 0.8
    }
  };
  
  // Sistema particelle
  let particleSystem = null;
  
  // Crea sistema particelle neve
  function createSnowParticles(scene, THREE) {
    if (!THREE) return null;
    
    const particleCount = 2000;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = Math.random() * 80;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.5;
      velocities[i * 3 + 1] = -Math.random() * 2 - 1;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.3,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const system = new THREE.Points(particles, material);
    scene.add(system);
    
    return system;
  }
  
  // Aggiorna particelle neve
  function updateSnowParticles(system, dt) {
    if (!system || !system.geometry) return;
    
    const positions = system.geometry.attributes.position.array;
    const velocities = system.geometry.attributes.velocity.array;
    
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += velocities[i] * dt;
      positions[i + 1] += velocities[i + 1] * dt;
      positions[i + 2] += velocities[i + 2] * dt;
      
      // Reset se fuori bounds
      if (positions[i + 1] < 0) {
        positions[i + 1] = 80;
        positions[i] = (Math.random() - 0.5) * 100;
        positions[i + 2] = (Math.random() - 0.5) * 100;
      }
    }
    
    system.geometry.attributes.position.needsUpdate = true;
  }
  
  // Crea montagne di sfondo
  function createMountainBackground(scene, THREE, preset = 'alpine') {
    if (!THREE || !scene) return [];
    
    const mountains = [];
    const config = MOUNTAIN_BACKGROUNDS[preset] || MOUNTAIN_BACKGROUNDS.alpine;
    
    for (const peak of config.peaks) {
      const geometry = new THREE.ConeGeometry(peak.width, peak.height, 8);
      
      // Materiale montagna
      const material = new THREE.MeshStandardMaterial({
        color: peak.color,
        roughness: peak.rocky ? 0.9 : 0.7,
        metalness: 0.1,
        flatShading: peak.rocky
      });
      
      const mountain = new THREE.Mesh(geometry, material);
      mountain.position.set(peak.x, peak.height / 2, peak.z);
      mountain.rotation.y = Math.random() * Math.PI * 2;
      
      // Aggiungi neve sulla cima
      if (config.snowLine) {
        const snowHeight = peak.height * (1 - config.snowLine);
        const snowGeometry = new THREE.ConeGeometry(
          peak.width * (1 - config.snowLine), 
          snowHeight, 
          8
        );
        const snowMaterial = new THREE.MeshStandardMaterial({
          color: 0xFFFFFF,
          roughness: 0.8,
          metalness: 0.1,
          emissive: 0xF0F8FF,
          emissiveIntensity: 0.1
        });
        const snowCap = new THREE.Mesh(snowGeometry, snowMaterial);
        snowCap.position.y = peak.height - snowHeight / 2;
        mountain.add(snowCap);
      }
      
      scene.add(mountain);
      mountains.push(mountain);
    }
    
    return mountains;
  }
  
  // Crea cielo stellato
  function createStarfield(scene, THREE) {
    if (!THREE) return null;
    
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1000;
    const positions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 1] = Math.random() * 200 + 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const starMaterial = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.5,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    return stars;
  }
  
  // Applica preset lighting
  function applyLightingPreset(scene, lights, preset = 'midday', THREE) {
    if (!THREE || !scene) return;
    
    const config = LIGHTING_PRESETS[preset] || LIGHTING_PRESETS.midday;
    
    // Aggiorna background
    scene.background = new THREE.Color(config.skyColor);
    
    // Aggiorna fog
    if (scene.fog) {
      scene.fog.color = new THREE.Color(config.fogColor);
      scene.fog.near = config.fogNear;
      scene.fog.far = config.fogFar;
    } else {
      scene.fog = new THREE.Fog(config.fogColor, config.fogNear, config.fogFar);
    }
    
    // Aggiorna directional light (sun/moon)
    if (lights.sun) {
      lights.sun.color = new THREE.Color(config.sunColor);
      lights.sun.intensity = config.sunIntensity;
      lights.sun.position.set(config.sunPosition.x, config.sunPosition.y, config.sunPosition.z);
    }
    
    // Aggiorna ambient light
    if (lights.ambient) {
      lights.ambient.color = new THREE.Color(config.ambientColor);
      lights.ambient.intensity = config.ambientIntensity;
    }
    
    // Aggiorna hemisphere light
    if (lights.hemisphere) {
      lights.hemisphere.color = new THREE.Color(config.hemisphereTop);
      lights.hemisphere.groundColor = new THREE.Color(config.hemisphereBottom);
      lights.hemisphere.intensity = 0.6;
    }
    
    return config;
  }
  
  // Crea materiale neve avanzato
  function createSnowMaterial(type = 'fresh', THREE) {
    if (!THREE) return null;
    
    const config = SNOW_MATERIALS[type] || SNOW_MATERIALS.fresh;
    
    return new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: config.roughness,
      metalness: config.metalness,
      emissive: config.emissive,
      emissiveIntensity: config.emissiveIntensity
    });
  }
  
  // Ottieni preset da condizione meteo
  function getPresetFromWeather(weather, time = 'day') {
    const weatherMap = {
      sunny: time === 'night' ? 'night' : 'midday',
      cloudy: 'cloudy',
      snowing: 'snowing',
      night: 'night'
    };
    
    return weatherMap[weather] || 'midday';
  }
  
  // Ottieni montagne da location
  function getMountainPresetFromLocation(location) {
    const locationMap = {
      'austria': 'alpine',
      'italia': 'dolomites',
      'svizzera': 'alpine',
      'germania': 'alpine',
      'francia': 'alpine',
      'slovenia': 'alpine',
      'svezia': 'scandinavian',
      'bulgaria': 'alpine',
      'andorra': 'pyrenees'
    };
    
    const key = Object.keys(locationMap).find(k => 
      location.toLowerCase().includes(k)
    );
    
    return locationMap[key] || 'alpine';
  }
  
  // API pubblica
  return {
    LIGHTING_PRESETS,
    SNOW_MATERIALS,
    MOUNTAIN_BACKGROUNDS,
    createSnowParticles,
    updateSnowParticles,
    createMountainBackground,
    createStarfield,
    applyLightingPreset,
    createSnowMaterial,
    getPresetFromWeather,
    getMountainPresetFromLocation
  };
})();

// Esponi globalmente
window.GraphicsEngine = GraphicsEngine;
