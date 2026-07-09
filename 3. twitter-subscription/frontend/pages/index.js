
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import PasswordInput from '../components/PasswordInput';
import { apiRequest, getToken } from '../lib/api';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMsg, setLoginMsg] = useState(false);

  // Chrome OTP Interception Route Handlers
  const [otpStep, setOtpStep] = useState(false);
  const [otpUserId, setOtpUserId] = useState(null);
  const [otpValue, setOtpValue] = useState('');
  const [otpMsg, setOtpMsg] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [registerMsg, setRegisterMsg] = useState('');

  useEffect(() => {
    if (getToken()) {
      router.push('/dashboard');
    }
  }, [router]);



  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMsg('');
    try {
      const data = await apiRequest('/auth/login', 'POST', {
        email: loginEmail,
        password: loginPassword,
      });

      if (data.otpRequired) {
        setOtpUserId(data.userId);
        setOtpStep(true);
        setLoginMsg('');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      router.push('/dashboard');
    } catch (err) {
      setLoginMsg(err.message || 'Verification handoff failed.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpMsg('');
    setVerifyingOtp(true);
    try {
      const data = await apiRequest('/auth/verify-login-otp', 'POST', {
        userId: otpUserId,
        otp: otpValue,
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      router.push('/dashboard');
    } catch (err) {
      setOtpMsg(err.message || 'Invalid Secure Key Phrase Identification.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterMsg('');
    try {
      const data = await apiRequest('/auth/register', 'POST', {
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      router.push('/dashboard');
    } catch (err) {
      setRegisterMsg(err.message || 'Database target node registration failed.');
    }
  };

  return (
    <>
      <Head>
        <title>TweetBox Premium</title>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style jsx>{`
        .viewport-wrapper {
          position: relative;
          min-height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          z-index: 2;
        }

        .hero-layout-grid {
          flex: 1;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          max-width: 1250px;
          margin: 0 auto;
          padding: 2rem;
          gap: 5rem;
          align-items: center;
          z-index: 10;
        }

        @media (max-width: 968px) {
          .hero-layout-grid {
            grid-template-columns: 1fr;
            padding: 1.5rem;
            gap: 2.5rem;
          }
          .marketing-pane { text-align: center; }
        }

        .marketing-pane {
          display: flex;
          flex-direction: column;
        }

        .premium-tag {
          align-self: flex-start;
          background: ${otpStep ? 'rgba(245,158,11,0.15)' : activeTab === 'login' ? 'rgba(29,161,242,0.15)' : 'rgba(168,85,247,0.15)'};
          border: 1px solid ${otpStep ? '#f59e0b' : activeTab === 'login' ? '#1da1f2' : '#a855f7'};
          color: ${otpStep ? '#fbbf24' : activeTab === 'login' ? '#00f0ff' : '#c084fc'};
          padding: 0.4rem 1rem;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
          transition: all 0.5s ease;
        }

        @media (max-width: 968px) { .premium-tag { align-self: center; } }

        .headline {
          font-size: clamp(2.3rem, 4vw, 3.8rem);
          font-weight: 700;
          line-height: 1.15;
          margin-bottom: 1.5rem;
          background: linear-gradient(135deg, #ffffff 30%, #94a3b8 70%, ${activeTab === 'login' ? '#00f0ff' : '#a855f7'} 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          transition: all 0.5s ease;
        }

        .subtext {
          font-size: 1.1rem;
          color: #94a3b8;
          line-height: 1.6;
          max-width: 480px;
        }

        .glass-auth-container {
          background: rgba(8, 12, 24, 0.65);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
          position: relative;
          overflow: hidden;
        }

        .glass-auth-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: ${otpStep
          ? 'linear-gradient(90deg, #f59e0b, #d97706)'
          : activeTab === 'login'
            ? 'linear-gradient(90deg, #1da1f2, #00f0ff)'
            : 'linear-gradient(90deg, #a855f7, #6366f1)'};
          transition: background 0.5s ease;
        }

        .brand-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2rem;
        }

        .brand-header h2 {
          font-size: 1.65rem;
          font-weight: 700;
          margin: 0.5rem 0 0 0;
          background: linear-gradient(90deg, #ffffff, #e2e8f0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .brand-header p {
          color: #475569;
          font-size: 0.8rem;
          margin: 0.2rem 0 0 0;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .tab-box {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 0.3rem;
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .tab-trigger {
          background: transparent;
          border: none;
          color: #64748b;
          padding: 0.7rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .tab-trigger.active {
          background: ${activeTab === 'login' ? 'rgba(29, 161, 242, 0.1)' : 'rgba(168, 85, 247, 0.1)'};
          border: 1px solid ${activeTab === 'login' ? 'rgba(29, 161, 242, 0.25)' : 'rgba(168, 85, 247, 0.25)'};
          color: ${activeTab === 'login' ? '#00f0ff' : '#d8b4fe'};
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        .input-wrapper { 
          position: relative;
        }

        :global(.form-input-node) {
          width: 100%;
          background: rgba(255, 255, 255, 0.02);
          border: 1.5px solid rgba(255, 255, 255, 0.06);
          padding: 1rem 1rem 1rem 1.2rem;
          border-radius: 12px;
          color: #00ffff;
          font-family: inherit;
          font-size: 0.95rem;
          box-sizing: border-box;
          transition: all 0.3s ease;
        }

        :global(.form-input-node:focus) {
          outline: none;
          border-color: ${activeTab === 'login' ? '#00f0ff' : '#a855f7'};
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 15px ${activeTab === 'login' ? 'rgba(0, 240, 255, 0.12)' : 'rgba(168, 85, 247, 0.12)'};
        }

        .forgot-link-node {
          align-self: flex-end;
          font-size: 0.85rem;
        }
        .forgot-link-node :global(a) {
          color: #64748b;
          text-decoration: none;
          transition: color 0.2s;
        }
        .forgot-link-node :global(a:hover) { color: #1da1f2; }

        .submit-btn-node {
          background: ${otpStep
          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
          : activeTab === 'login'
            ? 'linear-gradient(135deg, #1da1f2 0%, #00f0ff 100%)'
            : 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)'};
          border: none;
          color: #040711;
          padding: 1rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .submit-btn-node:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 10px 25px ${otpStep ? 'rgba(245,158,11,0.3)' : activeTab === 'login' ? 'rgba(29,161,242,0.35)' : 'rgba(168,85,247,0.35)'};
        }

        .notification-banner {
          background: rgba(239, 68, 68, 0.06);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #fca5a5;
          padding: 0.8rem;
          border-radius: 10px;
          font-size: 0.85rem;
          text-align: center;
        }

        .back-link-action {
          color: ${otpStep ? '#f59e0b' : '#1da1f2'};
          cursor: pointer;
          text-decoration: none;
          font-size: 0.85rem;
          display: block;
          text-align: center;
          margin-top: 1rem;
          transition: opacity 0.2s;
        }
        .back-link-action:hover { opacity: 0.8; }
      `}</style>

      <div className="viewport-wrapper">
        <Navbar user={null} />

        <div className="hero-layout-grid">
          {/* Spatial Left Panel */}
          <div className="marketing-pane">
            <span className="premium-tag">
              {otpStep ? '🔒 Multi-Factor Layer' : activeTab === 'login' ? '⚡ Secure Access Node' : '🌌 Core Identity Build'}
            </span>
            <h1 className="headline">
              {otpStep ? 'Confirm Entry Security.' : activeTab === 'login' ? 'Secure your digital feed.' : 'Join the secure channel.'}
            </h1>
            <p className="subtext">
              Route workspace insights, orchestrate audience streams, and process digital assets inside an encrypted environment optimized for low latency.
            </p>
          </div>

          {/* Core Right Auth Module Shield */}
          <div className="glass-auth-container">
            <div className="brand-header">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path d="M23.643 2.9c-.85.39-1.764.65-2.723.77a4.796 4.796 0 0 0 2.084-2.64 9.53 9.53 0 0 1-3.033 1.17 4.773 4.773 0 0 0-8.14 4.36 13.553 13.553 0 0 1-9.84-5 4.8 4.8 0 0 0 1.48 6.4 4.72 4.72 0 0 1-2.17-.6v.06a4.78 4.78 0 0 0 3.83 4.69 4.79 4.79 0 0 1-2.15.08 4.8 4.8 0 0 0 4.47 3.33 9.593 9.593 0 0 1-5.94 2.05c-.38 0-.76-.02-1.14-.07a13.525 13.525 0 0 0 7.33 2.15c8.8 0 13.61-7.3 13.61-13.6 0-.21 0-.41-.02-.62A9.748 9.748 0 0 0 24 3c-.83.37-1.72.62-2.65.73A4.814 4.814 0 0 0 23.64 2.9z" fill={otpStep ? '#f59e0b' : activeTab === 'login' ? '#00f0ff' : '#c084fc'} style={{ transition: 'fill 0.5s' }} />
              </svg>
              <h2>TweetBox Premium</h2>
              <p>Cryptographic Node Hub</p>
            </div>

            {otpStep ? (
              <>
                <div className="form-group">
                  <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.5, textAlign: 'center', margin: '0 0 0.5rem 0' }}>
                    Chrome Browser detected. A 6-digit keyphrase token has been transmitted to your secure email matrix.
                  </p>

                  {otpMsg && <div className="notification-banner">{otpMsg}</div>}

                  <form className="form-group" onSubmit={handleVerifyOtp}>
                    <div className="input-wrapper">
                      <input
                        className="form-input-node"
                        type="text"
                        placeholder="Enter 6-digit token"
                        value={otpValue}
                        onChange={(e) => setOtpValue(e.target.value)}
                        maxLength={6}
                        required
                      />
                    </div>
                    <button className="submit-btn-node" type="submit" disabled={verifyingOtp}>
                      {verifyingOtp ? 'Decrypting Token...' : 'Verify Token & Bind'}
                    </button>
                  </form>
                  <a className="back-link-action" onClick={() => { setOtpStep(false); setOtpValue(''); setOtpMsg(''); }}>
                    ← Terminate & Return to Login
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className="tab-box">
                  <button className={`tab-trigger ${activeTab === 'login' ? 'active' : ''}`} onClick={() => { setActiveTab('login'); setLoginMsg(''); }}>
                    Login
                  </button>
                  <button className={`tab-trigger ${activeTab === 'register' ? 'active' : ''}`} onClick={() => { setActiveTab('register'); setRegisterMsg(''); }}>
                    Registration
                  </button>
                </div>

                {activeTab === 'login' && (
                  <form className="form-group" onSubmit={handleLogin}>
                    {loginMsg && <div className="notification-banner">{loginMsg}</div>}

                    <div className="input-wrapper">
                      <input
                        className="form-input-node"
                        type="email"
                        placeholder="Secure Identity Email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>


                    <div className="input-wrapper">
                      <PasswordInput
                        className="form-input-node"
                        type="password"
                        placeholder="Password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>

                    <div className="forgot-link-node">
                      <Link href="/forgot-password">Forgot password?</Link>
                    </div>

                    <button className="submit-btn-node" type="submit">
                      Login
                    </button>
                  </form>
                )}

                {activeTab === 'register' && (
                  <form className="form-group" onSubmit={handleRegister}>
                    {registerMsg && <div className="notification-banner">{registerMsg}</div>}

                    <div className="input-wrapper">
                      <input
                        className="form-input-node"
                        type="text"
                        placeholder="Enter Your Name"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="input-wrapper">
                      <input
                        className="form-input-node"
                        type="email"
                        placeholder="Enter Your Email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="input-wrapper">
                      <input
                        className="form-input-node"
                        type="tel"
                        placeholder="Phone Number"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                      />
                    </div>

                    <div className="input-wrapper">
                      <PasswordInput
                        className="form-input-node"
                        placeholder="Enter Your Password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                      />
                    </div>

                    <button className="submit-btn-node" type="submit">
                      Register
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
