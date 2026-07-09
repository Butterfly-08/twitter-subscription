import '../styles/globals.css';
import Script from 'next/script';
import Head from 'next/head';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }) {
  const canvasRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = [];
    const maxParticles = Math.min(90, Math.floor((width * height) / 14000));
    const connectionDist = 130;
    const mouse = { x: null, y: null, radius: 140 };

    const getThemeColor = (alpha = 1) => {
      if (router.pathname === '/') {
        return `rgba(29, 161, 242, ${alpha})`;
      } else if (router.pathname === '/dashboard') {
        return `rgba(0, 240, 255, ${alpha})`;
      }
      return `rgba(168, 85, 247, ${alpha})`;
    };

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

    const handleMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const handleMouseLeave = () => { mouse.x = null; mouse.y = null; };
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [router.pathname]);

  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="beforeInteractive" />
      <div className="app-viewport-wrapper">
        <canvas className="global-background-canvas" ref={canvasRef} />
        <div className="global-ambient-glow" style={{
          position: 'fixed',
          width: '600px',
          height: '600px',
          background: `radial-gradient(circle, ${router.pathname === '/'
              ? 'rgba(29,161,242,0.08)'
              : router.pathname === '/dashboard'
                ? 'rgba(0,240,255,0.08)'
                : 'rgba(168,85,247,0.08)'
            } 0%, rgba(0,0,0,0) 70%)`,
          top: '-150px',
          left: '-150px',
          pointerEvents: 'none',
          zIndex: 1,
          transition: 'background 0.8s ease'
        }} />
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Component {...pageProps} />
        </div>
      </div>
    </>
  );
}
