document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('global-background-canvas');
  const glow = document.getElementById('global-ambient-glow');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationFrameId;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const particles = [];
  const maxParticles = Math.min(90, Math.floor((width * height) / 14000));
  const connectionDist = 130;
  const mouse = { x: null, y: null, radius: 140 };

  const isProfilePage = window.location.pathname.includes('profile.html');
  const isLoggedIn = !!localStorage.getItem('token');

  // Theme colors:
  // - Profile page: violet/purple (rgba(139, 92, 246, alpha))
  // - Logged in dashboard/feed: cyan (rgba(6, 182, 212, alpha))
  // - Logged out: blue (rgba(29, 161, 242, alpha))
  const getThemeColor = (alpha = 1) => {
    if (isProfilePage) {
      return `rgba(139, 92, 246, ${alpha})`;
    } else if (isLoggedIn) {
      return `rgba(6, 182, 212, ${alpha})`;
    }
    return `rgba(29, 161, 242, ${alpha})`;
  };

  // Set ambient glow gradient color
  if (glow) {
    let glowColor;
    if (isProfilePage) {
      glowColor = 'rgba(139, 92, 246, 0.08)';
    } else if (isLoggedIn) {
      glowColor = 'rgba(6, 182, 212, 0.08)';
    } else {
      glowColor = 'rgba(29, 161, 242, 0.08)';
    }
    glow.style.background = `radial-gradient(circle, ${glowColor} 0%, rgba(0,0,0,0) 70%)`;
  }

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.radius = Math.random() * 2 + 1;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          this.x -= (dx / dist) * force * 1.8;
          this.y -= (dy / dist) * force * 1.8;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = getThemeColor(0.75);
      ctx.fill();
    }
  }

  for (let i = 0; i < maxParticles; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];
      p1.update();
      p1.draw();

      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDist) {
          const alpha = (1 - dist / connectionDist) * 0.16;
          ctx.strokeStyle = getThemeColor(alpha);
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }
    animationFrameId = requestAnimationFrame(animate);
  }

  const handleMouseMove = (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  };
  const handleMouseLeave = () => {
    mouse.x = null;
    mouse.y = null;
  };
  const handleResize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseleave', handleMouseLeave);
  window.addEventListener('resize', handleResize);
  animate();

  // Cleanup on unload/navigation
  window.addEventListener('unload', () => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseleave', handleMouseLeave);
    window.removeEventListener('resize', handleResize);
  });
});
