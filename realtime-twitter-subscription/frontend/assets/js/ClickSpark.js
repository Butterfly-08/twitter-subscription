class ClickSpark {
  constructor(options = {}) {
    this.options = {
      sparkColor: '#fff',
      sparkSize: 10,
      sparkRadius: 15,
      sparkCount: 8,
      duration: 400,
      easing: 'ease-out',
      extraScale: 1.0,
      ...options
    };

    this.sparks = [];
    this.initCanvas();
    this.bindEvents();
  }

  initCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '9999';
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  easeFunc(t) {
    switch (this.options.easing) {
      case 'linear': return t;
      case 'ease-in': return t * t;
      case 'ease-in-out': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default: return t * (2 - t);
    }
  }

  draw = (timestamp) => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.sparks = this.sparks.filter(spark => {
      const elapsed = timestamp - spark.startTime;
      if (elapsed >= this.options.duration) return false;

      const progress = elapsed / this.options.duration;
      const eased = this.easeFunc(progress);

      const distance = eased * this.options.sparkRadius * this.options.extraScale;
      const lineLength = this.options.sparkSize * (1 - eased);

      const x1 = spark.x + distance * Math.cos(spark.angle);
      const y1 = spark.y + distance * Math.sin(spark.angle);
      const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
      const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

      this.ctx.strokeStyle = spark.color;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();

      return true;
    });

    if (this.sparks.length > 0) {
      this.animationId = requestAnimationFrame(this.draw);
    } else {
      this.animationId = null;
    }
  }

  handleClick = (e) => {
    // Only trigger on buttons, links, or specific elements
    const target = e.target.closest('button, a, .click-spark, .tab-trigger, .sidebar-btn');
    if (!target) return;

    // Allow overriding color per-element via data-spark-color
    const color = target.dataset.sparkColor || this.options.sparkColor;

    // Use global client coordinates
    const x = e.clientX;
    const y = e.clientY;

    const now = performance.now();
    const newSparks = Array.from({ length: this.options.sparkCount }, (_, i) => ({
      x,
      y,
      angle: (2 * Math.PI * i) / this.options.sparkCount,
      startTime: now,
      color: color
    }));

    this.sparks.push(...newSparks);

    if (!this.animationId) {
      this.animationId = requestAnimationFrame(this.draw);
    }
  }

  bindEvents() {
    document.addEventListener('click', this.handleClick);
  }
}

// Auto-initialize global spark effect
document.addEventListener('DOMContentLoaded', () => {
  window.clickSparkInstance = new ClickSpark({
    sparkColor: '#00f0ff', // matches TweetBox accent cyan
    sparkSize: 15,
    sparkRadius: 25,
    sparkCount: 8,
    duration: 500
  });
});
