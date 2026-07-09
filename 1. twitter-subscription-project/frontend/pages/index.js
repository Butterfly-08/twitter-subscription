import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import { apiRequest, getToken } from '../lib/api';

export default function Home() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const [activeTab, setActiveTab] = useState('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMsg, setLoginMsg] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [registerMsg, setRegisterMsg] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.push('/dashboard');
    }
  }, [router]);

  // --- High Level Constellation Background Graphics Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = [];
    const maxParticles = Math.min(100, Math.floor((width * height) / 12000));
    const connectionDist = 120;

    const mouse = { x: null, y: null, radius: 150 };

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.radius = Math.random() * 2 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off walls
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Mouse attraction
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
        ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
        ctx.fill();
      }
    }

    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      // Render & connect particles
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
            const alpha = (1 - dist / connectionDist) * 0.18;
            ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
            ctx.lineWidth = 1;
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

    return () => {
      cancelAnimationFrame(animationFrameId);
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
      setLoginMsg(err.message || 'Verification handoff failed.');
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
        password: regPassword,
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user || data));
      router.push('/dashboard');
    } catch (err) {
      setRegisterMsg(err.message || 'Database registration handoff failed.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <>
      <Head>
        <title>TweetBox Premium - Access Portal</title>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      {/* Embedded High Graphics System Engine */}
      <style jsx global>{`
        body {
          margin: 0;
          font-family: 'Space Grotesk', sans-serif;
          background-color: #060913;
          color: #f8fafc;
          overflow-x: hidden;
        }

        /* Ambient background glow points */
        .glowing-orb-1 {
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(29, 161, 242, 0.12) 0%, rgba(0,0,0,0) 70%);
          top: -100px;
          left: -100px;
          pointer-events: none;
          z-index: 1;
        }

        .glowing-orb-2 {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(0,0,0,0) 70%);
          bottom: -150px;
          right: -150px;
          pointer-events: none;
          z-index: 1;
        }
      `}</style>

      <style jsx>{`
        .viewport-wrapper {
          position: relative;
          min-height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          z-index: 2;
        }

        .background-canvas {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
        }

        .hero-layout-grid {
          flex: 1;
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          max-width: 1300px;
          margin: 0 auto;
          padding: 2rem;
          gap: 4rem;
          align-items: center;
          z-index: 10;
        }

        @media (max-width: 968px) {
          .hero-layout-grid {
            grid-template-columns: 1fr;
            padding: 1.5rem;
            gap: 2rem;
            margin-top: 1rem;
          }
          .marketing-pane {
            text-align: center;
          }
        }

        /* Left Side Pitch Card Styling */
        .marketing-pane {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .premium-tag {
          align-self: flex-start;
          background: linear-gradient(90deg, rgba(29, 161, 242, 0.2) 0%, rgba(0, 240, 255, 0.2) 100%);
          border: 1px solid rgba(29, 161, 242, 0.4);
          color: #00f0ff;
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.15);
          animation: pulseGlow 3s infinite alternate;
        }

        @media (max-width: 968px) {
          .premium-tag {
            align-self: center;
          }
        }

        .headline {
          font-size: clamp(2.5rem, 4vw, 4rem);
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 50%, #00f0ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtext {
          font-size: 1.15rem;
          color: #94a3b8;
          line-height: 1.6;
          margin-bottom: 2rem;
          max-width: 500px;
        }

        /* Right Side Glassmorphic Card Styling */
        .glass-auth-container {
          background: rgba(10, 15, 30, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), 
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
          transition: border-color 0.5s ease;
        }

        .glass-auth-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, #1da1f2, #00f0ff, #8b5cf6);
        }

        /* Premium Bird Graphic Header */
        .brand-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2rem;
        }

        .pulsing-logo-wrapper {
          background: linear-gradient(135deg, rgba(29, 161, 242, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
          border: 1.5px dashed rgba(29, 161, 242, 0.4);
          width: 70px;
          height: 70px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          animation: logoPulse 4s infinite ease-in-out;
        }

        .brand-header h2 {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(90deg, #ffffff 0%, #00f0ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .brand-header p {
          color: #64748b;
          font-size: 0.85rem;
          margin: 0.25rem 0 0 0;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        /* Tab Switch Controls */
        .tab-box {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 0.35rem;
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .tab-trigger {
          background: transparent;
          border: none;
          color: #64748b;
          padding: 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tab-trigger.active {
          background: rgba(29, 161, 242, 0.12);
          border: 1px solid rgba(29, 161, 242, 0.3);
          color: #00f0ff;
          box-shadow: 0 0 15px rgba(29, 161, 242, 0.1);
        }

        /* Input Controls */
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #475569;
          transition: color 0.3s ease;
        }

        .form-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          padding: 1rem 1rem 1rem 2.8rem;
          border-radius: 12px;
          color: #f8fafc;
          font-family: inherit;
          font-size: 0.95rem;
          box-sizing: border-box;
          transition: all 0.3s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #00f0ff;
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 0 15px rgba(0, 240, 255, 0.15);
        }

        .form-input:focus + .input-icon {
          color: #00f0ff;
        }

        /* Submission System */
        .submit-btn {
          background: linear-gradient(135deg, #1da1f2 0%, #00f0ff 100%);
          border: none;
          color: #060913;
          padding: 1.1rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 8px 25px rgba(29, 161, 242, 0.3);
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(0, 240, 255, 0.5);
        }

        .submit-btn:active {
          transform: translateY(0);
        }

        /* Custom Status Messages */
        .notification-banner {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 0.85rem 1rem;
          border-radius: 10px;
          font-size: 0.88rem;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          animation: slideIn 0.3s ease;
        }

        /* Animations */
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 10px rgba(0, 240, 255, 0.1); }
          100% { box-shadow: 0 0 25px rgba(0, 240, 255, 0.3); }
        }

        @keyframes logoPulse {
          0%, 100% { transform: scale(1) rotate(0deg); border-color: rgba(29, 161, 242, 0.4); }
          50% { transform: scale(1.05) rotate(5deg); border-color: rgba(0, 240, 255, 0.8); }
        }

        @keyframes slideIn {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* Loader Icon CSS */
        .loading-spinner {
          border: 2px solid rgba(6, 9, 19, 0.2);
          border-top: 2px solid #060913;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div className="viewport-wrapper">
        <canvas className="background-canvas" ref={canvasRef} />
        
        {/* Ambient background orbs */}
        <div className="glowing-orb-1" />
        <div className="glowing-orb-2" />

        <Navbar user={null} />

        <div className="hero-layout-grid">
          
          {/* Left Side Sales Presentation Box */}
          <div className="marketing-pane">
            <span className="premium-tag">🔑 Quant-Scale Social Nodes</span>
            <h1 className="headline">Secure your digital feed.</h1>
            <p className="subtext">
              Welcome to the upgraded workspace. Route subscription engines, scale audience insights, and build workspaces with secure blockchain-grade identity parameters.
            </p>
          </div>

          {/* Right Side Glass Card Auth Module */}
          <div className="glass-auth-container">
            <div className="brand-header">
              <div className="pulsing-logo-wrapper">
                {/* SVG Vector Twitter-like Premium Bird */}
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.643 2.9c-.85.39-1.764.65-2.723.77a4.796 4.796 0 0 0 2.084-2.64 9.53 9.53 0 0 1-3.033 1.17 4.773 4.773 0 0 0-8.14 4.36 13.553 13.553 0 0 1-9.84-5 4.8 4.8 0 0 0 1.48 6.4 4.72 4.72 0 0 1-2.17-.6v.06a4.78 4.78 0 0 0 3.83 4.69 4.79 4.79 0 0 1-2.15.08 4.8 4.8 0 0 0 4.47 3.33 9.593 9.593 0 0 1-5.94 2.05c-.38 0-.76-.02-1.14-.07a13.525 13.525 0 0 0 7.33 2.15c8.8 0 13.61-7.3 13.61-13.6 0-.21 0-.41-.02-.62A9.748 9.748 0 0 0 24 3c-.83.37-1.72.62-2.65.73A4.814 4.814 0 0 0 23.64 2.9z" fill="#00f0ff" />
                </svg>
              </div>
              <h2>TweetBox Premium</h2>
              <p>Quant-Scale Workspace</p>
            </div>

            {/* Premium Selector Tabs */}
            <div className="tab-box">
              <button
                className={`tab-trigger ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('login');
                  setLoginMsg('');
                  setRegisterMsg('');
                }}
              >
                Access Account
              </button>
              <button
                className={`tab-trigger ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('register');
                  setLoginMsg('');
                  setRegisterMsg('');
                }}
              >
                Register Node
              </button>
            </div>

            {/* Login Tab Content */}
            {activeTab === 'login' && (
              <form className="form-group" onSubmit={handleLogin}>
                {loginMsg && (
                  <div className="notification-banner">
                    ⚠️ {loginMsg}
                  </div>
                )}

                <div className="input-wrapper">
                  <input
                    className="form-input"
                    type="email"
                    placeholder="Premium Access Email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                  <span className="input-icon">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <path d="m22 6-10 7L2 6" />
                    </svg>
                  </span>
                </div>

                <div className="input-wrapper">
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Node Keyphrase (Password)"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <span className="input-icon">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                </div>

                <button className="submit-btn" type="submit" disabled={isLoggingIn}>
                  {isLoggingIn ? <div className="loading-spinner" /> : 'Decrypt & Authenticate'}
                </button>
              </form>
            )}

            {/* Register Tab Content */}
            {activeTab === 'register' && (
              <form className="form-group" onSubmit={handleRegister}>
                {registerMsg && (
                  <div className="notification-banner">
                    ⚠️ {registerMsg}
                  </div>
                )}

                <div className="input-wrapper">
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Full Identity Signature (Name)"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                  />
                  <span className="input-icon">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                </div>

                <div className="input-wrapper">
                  <input
                    className="form-input"
                    type="email"
                    placeholder="Secure Email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                  <span className="input-icon">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <path d="m22 6-10 7L2 6" />
                    </svg>
                  </span>
                </div>

                <div className="input-wrapper">
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Set Node Keyphrase"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                  <span className="input-icon">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                </div>

                <button className="submit-btn" type="submit" disabled={isRegistering}>
                  {isRegistering ? <div className="loading-spinner" /> : 'Register Digital Identity'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </>
  );
}