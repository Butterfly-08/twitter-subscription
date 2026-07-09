import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import PasswordInput from '../components/PasswordInput';
import { apiRequest, getToken } from '../lib/api';

export default function Home() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const [activeTab, setActiveTab] = useState('login');

  // Interactive input states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMsg, setLoginMsg] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [registerMsg, setRegisterMsg] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    // Skip straight to control dashboard if already logged in
    if (getToken()) {
      router.push('/dashboard');
    }
  }, [router]);

  // --- High Fidelity Dynamic Interactive Constellation Neural Network Graphics Engine ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = [];
    const maxParticles = Math.min(110, Math.floor((width * height) / 10000));
    const connectionDistance = 120;
    const mouse = { x: null, y: null, radius: 150 };

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 1;
        
        // Premium cyber-theme palette (Cyan, Purple, Electric Indigo)
        const colors = [
          'rgba(0, 240, 255, 0.75)', // Cyber Neon Cyan
          'rgba(29, 161, 242, 0.75)',  // Brand Blue
          'rgba(139, 92, 246, 0.75)'   // Electric Purple
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce walls elegantly
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Organic mouse grav-pull warp
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x -= dx * force * 0.03;
            this.y -= dy * force * 0.03;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      // Render, update and connect active nodes
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update();
        p1.draw();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.18;
            ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(animate);
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
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', handleResize);

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMsg('');
    setIsLoggingIn(true);
    try {
      const data = await apiRequest('/auth/login', 'POST', {
        email: loginEmail,
        password: loginPassword,
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user || data));
      router.push('/dashboard');
    } catch (err) {
      setLoginMsg(err.message || 'Decryption verification handshake failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterMsg('');
    setIsRegistering(true);
    try {
      const data = await apiRequest('/auth/register', 'POST', {
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user || data));
      router.push('/dashboard');
    } catch (err) {
      setRegisterMsg(err.message || 'Identity registration node mapping failed.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <>
      <Head>
        <title>TweetBox Premium</title>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      {/* Local Ambient Backdrop Structures */}
      <div className="glowing-orb-1" style={{ position: 'absolute', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(29, 161, 242, 0.1) 0%, transparent 70%)', top: '-100px', left: '-100px', pointerEvents: 'none', zIndex: 1 }} />
      <div className="glowing-orb-2" style={{ position: 'absolute', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)', bottom: '-150px', right: '-150px', pointerEvents: 'none', zIndex: 1 }} />

      <canvas 
        ref={canvasRef} 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none'
        }} 
      />

      <Navbar user={null} />

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        <div className="auth-box">
          
          {/* Futuristic Header Identity */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(29, 161, 242, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
              border: '1.5px dashed rgba(0, 240, 255, 0.4)',
              width: '65px',
              height: '65px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 0 15px rgba(0, 240, 255, 0.1)'
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.643 2.9c-.85.39-1.764.65-2.723.77a4.796 4.796 0 0 0 2.084-2.64 9.53 9.53 0 0 1-3.033 1.17 4.773 4.773 0 0 0-8.14 4.36 13.553 13.553 0 0 1-9.84-5 4.8 4.8 0 0 0 1.48 6.4 4.72 4.72 0 0 1-2.17-.6v.06a4.78 4.78 0 0 0 3.83 4.69 4.79 4.79 0 0 1-2.15.08 4.8 4.8 0 0 0 4.47 3.33 9.593 9.593 0 0 1-5.94 2.05c-.38 0-.76-.02-1.14-.07a13.525 13.525 0 0 0 7.33 2.15c8.8 0 13.61-7.3 13.61-13.6 0-.21 0-.41-.02-.62A9.748 9.748 0 0 0 24 3c-.83.37-1.72.62-2.65.73A4.814 4.814 0 0 0 23.64 2.9z" fill="#00f0ff" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 700, margin: 0, background: 'linear-gradient(90deg, #ffffff 0%, #00f0ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TweetBox Premium</h2>
            <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0.25rem 0 0 0', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>Quant-Scale Identity Node</p>
          </div>

          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('login');
                setLoginMsg('');
                setRegisterMsg('');
              }}
            >
              Login
            </button>
            <button
              className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('register');
                setLoginMsg('');
                setRegisterMsg('');
              }}
            >
              Registration
            </button>
          </div>

          {/* Login Module */}
          {activeTab === 'login' && (
            <form className="auth-form" onSubmit={handleLogin}>
              <input
                type="email"
                placeholder="Login Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
              <PasswordInput
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
              <div className="forgot-link">
                <Link href="/forgot-password">Forgot password?</Link>
              </div>
              <button type="submit" disabled={isLoggingIn} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {isLoggingIn ? (
                  <div style={{ width: '18px', height: '18px', border: '2px solid rgba(6, 9, 19, 0.2)', borderTop: '2px solid #060913', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : 'Login'}
              </button>
              {loginMsg && <p className="msg">⚠️ {loginMsg}</p>}
            </form>
          )}

          {/* Register Module */}
          {activeTab === 'register' && (
            <form className="auth-form" onSubmit={handleRegister}>
              <input
                type="text"
                placeholder="Enter Your Name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Enter Your Email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
              <input
                type="tel"
                placeholder="Recovery Phone Number"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
              />
              <PasswordInput
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
              />
              <button type="submit" disabled={isRegistering} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {isRegistering ? (
                  <div style={{ width: '18px', height: '18px', border: '2px solid rgba(6, 9, 19, 0.2)', borderTop: '2px solid #060913', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : 'Register & Login'}
              </button>
              {registerMsg && <p className="msg">⚠️ {registerMsg}</p>}
            </form>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}