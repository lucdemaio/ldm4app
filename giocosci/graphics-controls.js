// graphics-controls.js - Pannello controlli grafici
'use strict';

(function() {
  // Elementi DOM
  const graphicsPanel = document.getElementById('graphicsPanel');
  const toggleBtn = document.getElementById('toggleGraphicsPanel');
  const lightingPreset = document.getElementById('lightingPreset');
  const snowType = document.getElementById('snowType');
  const mountainPreset = document.getElementById('mountainPreset');
  const snowParticlesCheckbox = document.getElementById('snowParticles');
  const applyBtn = document.getElementById('applyGraphics');
  
  function init() {
    if (!graphicsPanel) return;
    
    // Mostra pannello
    graphicsPanel.hidden = false;
    
    // Toggle pannello
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        graphicsPanel.classList.toggle('expanded');
      });
    }
    
    // Applica grafica
    if (applyBtn) {
      applyBtn.addEventListener('click', applyGraphicsSettings);
    }
  }
  
  function applyGraphicsSettings() {
    if (!window.GraphicsEngine || !window.THREE) {
      alert('GraphicsEngine non disponibile');
      return;
    }
    
    const scene = window.Ski3D?.scene;
    const lights = window._sceneLights;
    
    if (!scene || !lights) {
      alert('Scena 3D non inizializzata');
      return;
    }
    
    // Applica lighting
    if (lightingPreset) {
      const preset = lightingPreset.value;
      GraphicsEngine.applyLightingPreset(scene, lights, preset, THREE);
      console.log(`✓ Lighting preset applicato: ${preset}`);
    }
    
    // Aggiorna materiale neve
    if (snowType && window.planeMaterial) {
      const type = snowType.value;
      const snowMat = GraphicsEngine.createSnowMaterial(type, THREE);
      
      if (snowMat && planeMaterial) {
        planeMaterial.color = snowMat.color;
        planeMaterial.roughness = snowMat.roughness;
        planeMaterial.metalness = snowMat.metalness;
        planeMaterial.emissive = snowMat.emissive;
        planeMaterial.emissiveIntensity = snowMat.emissiveIntensity;
        planeMaterial.needsUpdate = true;
        console.log(`✓ Materiale neve aggiornato: ${type}`);
      }
    }
    
    // Rigenera montagne
    if (mountainPreset && window.distantMountains) {
      // Rimuovi montagne esistenti
      for (const m of distantMountains) {
        scene.remove(m);
      }
      
      const preset = mountainPreset.value;
      window.distantMountains = GraphicsEngine.createMountainBackground(scene, THREE, preset);
      console.log(`✓ Montagne rigenerate: ${preset}`);
    }
    
    // Particelle neve
    if (snowParticlesCheckbox) {
      if (snowParticlesCheckbox.checked && !window._snowParticles) {
        window._snowParticles = GraphicsEngine.createSnowParticles(scene, THREE);
        console.log('✓ Particelle neve attivate');
      } else if (!snowParticlesCheckbox.checked && window._snowParticles) {
        scene.remove(window._snowParticles);
        window._snowParticles = null;
        console.log('✗ Particelle neve disattivate');
      }
    }
    
    // Feedback visivo
    applyBtn.textContent = '✓ Applicato!';
    applyBtn.style.background = 'linear-gradient(90deg, rgba(76,175,80,0.3), rgba(76,175,80,0.2))';
    
    setTimeout(() => {
      applyBtn.textContent = 'Applica';
      applyBtn.style.background = '';
    }, 1500);
  }
  
  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  window.GraphicsControls = { init, applyGraphicsSettings };
})();
