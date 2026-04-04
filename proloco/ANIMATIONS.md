# 🎨 Modern Animations 2026 - Pro Loco Gestionale

## Animazioni Implementate

### 🔘 Button Animations

#### Primary Buttons
- **Pulse Effect**: Glow pulsante continuo
- **Hover Lift**: Salita di 3px al hover
- **Ripple Effect**: Effetto ondata al click
- **Gradient**: Gradiente 135deg
- **Shadow Glow**: Ombra glowing dinamica

#### Secondary Buttons
- **Slide Animation**: Animazione di scorrimento interno
- **Smooth Fade**: Fade-in/out al hover
- **Border Color Change**: Cambio colore bordo
- **Soft Shadow**: Ombra morbida al hover

#### Danger Buttons
- **Throb Effect**: Effetto pulsante "che batte"
- **Red Glow**: Aura rossa pulsante
- **Press Animation**: Pressione visiva al click

#### Success Buttons
- **Bounce Animation**: Effetto rimbalzo al hover
- **Green Glow**: Aura verde
- **Lift Effect**: Sollevamento dinamico

### 📇 Card Animations

#### Entrance
- **Staggered Slide-in**: Ogni card arriva sequenzialmente
- **Scale Effect**: Scala da 0.95 a 1 (soft pop)
- **Opacity Fade**: Fade in smooth da 0 a 1
- **Delays**: 80ms tra ogni card

#### Hover Effects
- **Lift**: Card sale di 8px
- **Shadow Increase**: Ombra passa da 4px a 20px
- **Scale**: Leggero scaling
- **Smooth Transition**: Tutte le transizioni cubic-bezier

### 🖼️ Modal Animations

#### Backdrop
- **Blur Effect**: Backdrop blur da 0 a 5px
- **Fade In**: Opacity da 0 a 1
- **Duration**: 300ms

#### Content
- **Slide In**: Entra da -50px con scale 0.95
- **Pop Effect**: Scale da 0.95 a 1
- **Smooth Curve**: cubic-bezier(0.34, 1.56, 0.64, 1)
- **Duration**: 400ms

#### Close Button
- **Spin Animation**: Rotazione 90deg al hover

### 📱 Sidebar Navigation

#### Hover Effects
- **Background Slide**: Animazione left 400ms
- **Scale**: Scale to 1.05
- **Transform**: TranslateX(4px)
- **Shadow**: 0 4px 12px rgba(0, 0, 0, 0.2)
- **Smooth Curve**: cubic-bezier

#### Active State
- **Pulse Animation**: Pulsazione box-shadow infinita
- **Border Left**: Linea bianca 4px
- **Inset Shadow**: Ombra interna per profondità

### 📊 Stat Box Animations

#### Entrance
- **Slide from Left**: TranslateX(-30px) → 0
- **Staggered**: Ritardo progressivo
- **3D Rotation**: rotateY(-20deg) initial
- **Opacity**: 0 → 1

#### Shimmer Effect
- **Shine Animation**: Movimento gradiente 45deg
- **Duration**: 3s infinite
- **Performance**: Usa transform (GPU accelerated)

### 📝 Input Animations

#### Focus State
- **Glow Pulse**: Box-shadow 0 0 0 0 → 0 0 0 8px
- **Smooth**: ease-out animation
- **Color**: Primary color glow
- **Duration**: 400ms

### ⚡ Additional Effects

#### Page Transitions
- **Fade In**: Opacity 0 → 1
- **Smooth**: All elements fade in sequentially
- **No Stutter**: Hardware accelerated

#### Table Hover
- **Background Change**: rgba(99, 102, 241, 0.1)
- **Scale**: 1.01x
- **Inset Shadow**: 0 0 10px rgba
- **Smooth**: All 0.3s ease

#### Scroll Behavior
- **Smooth Scroll**: HTML scroll-behavior smooth
- **Easy Navigation**: Tutte le sezioni
- **Browser Native**: Performance ottima

#### Loading Spinner
- **Spin Animation**: 360deg rotation
- **Duration**: 0.8s
- **Icon**: Border-based design
- **Infinite**: Continuous rotation

#### Confetti Effect
- **Color Variations**: 7 emoji diversi
- **Random Rotation**: 360deg+ random
- **Fall Animation**: Gravity simulated
- **Auto-cleanup**: Rimozione dopo 2-4s

### 🎯 Microinteractions

#### Click Particles
- 8 particelle per click
- Radial gradient colors
- Fade out animation
- Auto-cleanup

#### Toast Notifications
- **Slide In**: Da destra verso sinistra
- **Auto-disappear**: Dopo 2.5s
- **Colors**: Success/Danger/Warning/Info
- **Position**: Bottom-right fisso

#### 3D Card Hover
- **Perspective**: 1000px
- **Rotation**: rotateX/Y basato su mouse
- **Smooth**: Tutte le transizioni smooth
- **Reset**: Al mouse leave

#### Counter Animation
- **Number Increment**: Animazione numerica
- **Entry Animation**: TranslateY + Opacity
- **Duration**: 2s ease-out

## 🎓 Come Usare le Animazioni

### Nel File CSS
Tutte le animazioni sono definite con `@keyframes` e applicate via classi CSS.

### Nel File JavaScript (animations.js)
```javascript
// Inizializza animator
const animator = new AnimationsManager();
animator.init();

// Trigger confetti
animationsManager.triggerConfetti(x, y);

// Toast notifiche
animationsManager.showAnimatedToast('Messaggio!', 'success');

// Pulse attenzione
animationsManager.pulseAttention(element, 2000);

// Animare contatori
animationsManager.animateCounters();

// Typing effect
animationsManager.typeText(element, 'Testo animato', 50);
```

## 🌐 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## ⌚ Performance

- **GPU Accelerated**: Usa transform e opacity
- **No Layout Thrashing**: Batch queries
- **Smooth 60fps**: Cubic-bezier curves
- **Lazy Loading**: Animazioni on-demand

## 🎨 Customization

### Modifica durate
Nel CSS, cambia i valori tempo:
```css
/* 400ms → 600ms */
.btn {
  transition: all 0.6s cubic-bezier(...);
}
```

### Cambia colori glow
```css
.btn-primary:hover {
  box-shadow: 0 8px 30px rgba(YOUR_COLOR, 0.4);
}
```

### Disabilita animazioni specifiche
Aggiungi classe `.no-animate`:
```css
.no-animate {
  animation: none !important;
}
```

## 🔧 Troubleshooting

**Le animazioni sono lente?**
- Controlla: GPU rendering abilitato
- Soluzione: Abilita hardware acceleration nel browser

**Le particelle non appaiono?**
- Controlla: Z-index non coperto da altri elementi
- Soluzione: Aumenta z-index a 10000+

**Modal non esce?**
- Controlla: Backdrop-filter supportato
- Soluzione: Fallback a box-shadow in browser vecchi

## 📊 Animation List Summary

| Animation | Duration | Type | Element |
|-----------|----------|------|---------|
| Button Pulse | 2s | infinite | .btn-primary |
| Button Throb | 1.5s | infinite | .btn-danger |
| Button Bounce | 0.6s | on-hover | .btn-success |
| Card Slide-In | 0.6s | on-load | .card |
| Card Hover | - | continuous | .card:hover |
| Modal Backdrop | 0.3s | on-open | .modal |
| Modal Content | 0.4s | on-open | .modal-content |
| Nav Hover | 0.4s | on-hover | .nav-item |
| Stat Box | 0.7s | on-load | .stat-box |
| Shimmer | 3s | infinite | .stat-box::after |
| Input Glow | 0.4s | on-focus | input:focus |
| Page Fade | 0.5s | on-load | .page |
| Spinner | 0.8s | infinite | .loading |
| Confetti | 2-4s | on-trigger | dynamic |
| Toast | 0.4s | on-show | dynamic |

---

**Nota**: Tutte le animazioni sono ottimizzate per performance e accessibilità. Usa `prefers-reduced-motion` per rispettare preferenze utente.

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```
