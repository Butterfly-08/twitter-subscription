class BorderGlow {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      edgeSensitivity: 30,
      glowColor: '40 80 80',
      backgroundColor: 'rgba(11, 15, 25, 0.7)', // matches our glass panels
      borderRadius: 16, // matches .glass-auth-container roughly
      glowRadius: 40,
      glowIntensity: 1.0,
      coneSpread: 25,
      animated: true,
      colors: ['#00f0ff', '#f472b6', '#38bdf8'], // using our accent cyan #00f0ff
      fillOpacity: 0.3,
      ...options
    };

    // Override with data attributes if present
    const dataOpts = element.dataset;
    if (dataOpts.edgeSensitivity) this.options.edgeSensitivity = parseFloat(dataOpts.edgeSensitivity);
    if (dataOpts.glowColor) this.options.glowColor = dataOpts.glowColor;
    if (dataOpts.backgroundColor) this.options.backgroundColor = dataOpts.backgroundColor;
    if (dataOpts.borderRadius) this.options.borderRadius = parseFloat(dataOpts.borderRadius);
    if (dataOpts.glowRadius) this.options.glowRadius = parseFloat(dataOpts.glowRadius);
    if (dataOpts.glowIntensity) this.options.glowIntensity = parseFloat(dataOpts.glowIntensity);
    if (dataOpts.coneSpread) this.options.coneSpread = parseFloat(dataOpts.coneSpread);
    if (dataOpts.animated) this.options.animated = dataOpts.animated === 'true';
    if (dataOpts.fillOpacity) this.options.fillOpacity = parseFloat(dataOpts.fillOpacity);
    if (dataOpts.colors) this.options.colors = dataOpts.colors.split(',');

    this.init();
  }

  parseHSL(hslStr) {
    const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
    if (!match) return { h: 40, s: 80, l: 80 };
    return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
  }

  buildGlowVars() {
    const { h, s, l } = this.parseHSL(this.options.glowColor);
    const base = `${h}deg ${s}% ${l}%`;
    const opacities = [100, 60, 50, 40, 30, 20, 10];
    const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
    const vars = {};
    for (let i = 0; i < opacities.length; i++) {
      vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(opacities[i] * this.options.glowIntensity, 100)}%)`;
    }
    return vars;
  }

  buildGradientVars() {
    const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
    const GRADIENT_KEYS = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven'];
    const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];
    const vars = {};
    for (let i = 0; i < 7; i++) {
      const c = this.options.colors[Math.min(COLOR_MAP[i], this.options.colors.length - 1)];
      vars[GRADIENT_KEYS[i]] = `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`;
    }
    vars['--gradient-base'] = `linear-gradient(${this.options.colors[0]} 0 100%)`;
    return vars;
  }

  getCenterOfElement() {
    const { width, height } = this.element.getBoundingClientRect();
    return [width / 2, height / 2];
  }

  getEdgeProximity(x, y) {
    const [cx, cy] = this.getCenterOfElement();
    const dx = x - cx;
    const dy = y - cy;
    let kx = Infinity;
    let ky = Infinity;
    if (dx !== 0) kx = cx / Math.abs(dx);
    if (dy !== 0) ky = cy / Math.abs(dy);
    return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  }

  getCursorAngle(x, y) {
    const [cx, cy] = this.getCenterOfElement();
    const dx = x - cx;
    const dy = y - cy;
    if (dx === 0 && dy === 0) return 0;
    const radians = Math.atan2(dy, dx);
    let degrees = radians * (180 / Math.PI) + 90;
    if (degrees < 0) degrees += 360;
    return degrees;
  }

  handlePointerMove = (e) => {
    const rect = this.element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const edge = this.getEdgeProximity(x, y);
    const angle = this.getCursorAngle(x, y);

    this.element.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(3)}`);
    this.element.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
  };

  easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
  easeInCubic(x) { return x * x * x; }

  animateValue({ start = 0, end = 100, duration = 1000, delay = 0, ease = this.easeOutCubic.bind(this), onUpdate, onEnd }) {
    const t0 = performance.now() + delay;
    const tick = () => {
      const elapsed = performance.now() - t0;
      if (elapsed < 0) {
        requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(elapsed / duration, 1);
      onUpdate(start + (end - start) * ease(t));
      if (t < 1) requestAnimationFrame(tick);
      else if (onEnd) onEnd();
    };
    requestAnimationFrame(tick);
  }

  init() {
    // Apply static styles
    const styles = {
      '--card-bg': this.options.backgroundColor,
      '--edge-sensitivity': this.options.edgeSensitivity,
      '--border-radius': `${this.options.borderRadius}px`,
      '--glow-padding': `${this.options.glowRadius}px`,
      '--cone-spread': this.options.coneSpread,
      '--fill-opacity': this.options.fillOpacity,
      ...this.buildGlowVars(),
      ...this.buildGradientVars(),
    };
    
    Object.entries(styles).forEach(([key, value]) => {
      this.element.style.setProperty(key, value);
    });

    this.element.addEventListener('pointermove', this.handlePointerMove);

    if (this.options.animated) {
      const angleStart = 110;
      const angleEnd = 465;
      this.element.classList.add('sweep-active');
      this.element.style.setProperty('--cursor-angle', `${angleStart}deg`);

      this.animateValue({ duration: 500, onUpdate: v => this.element.style.setProperty('--edge-proximity', v) });
      
      this.animateValue({ 
        ease: this.easeInCubic.bind(this), 
        duration: 1500, 
        end: 50, 
        onUpdate: v => this.element.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (v / 100) + angleStart}deg`)
      });
      
      this.animateValue({ 
        ease: this.easeOutCubic.bind(this), 
        delay: 1500, 
        duration: 2250, 
        start: 50, 
        end: 100, 
        onUpdate: v => this.element.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (v / 100) + angleStart}deg`)
      });
      
      this.animateValue({ 
        ease: this.easeInCubic.bind(this), 
        delay: 2500, 
        duration: 1500, 
        start: 100, 
        end: 0,
        onUpdate: v => this.element.style.setProperty('--edge-proximity', v),
        onEnd: () => this.element.classList.remove('sweep-active'),
      });
    }
  }
}

// Auto-initialize all .border-glow-card elements on DOM load
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.border-glow-card').forEach(el => {
    new BorderGlow(el);
  });
});
