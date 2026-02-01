// Minimal PMREMGenerator shim used when CDN/modules are unavailable.
// This provides a very small, safe API so code can call PMREMGenerator without failing.
export class PMREMGenerator {
  constructor(renderer) {
    this.renderer = renderer;
    // warn only once
    if (!window.__pmremShimWarned) {
      console.warn('PMREMGenerator shim in uso: l\'environment map non sarà generato.');
      window.__pmremShimWarned = true;
    }
  }
  fromEquirectangular(tex) {
    // return an object with a texture property (null) to avoid crashes
    return { texture: null };
  }
  dispose() {}
}
