import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { apiRequest } from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setSending(true);
    try {
      const data = await apiRequest('/auth/forgot-password', 'POST', { email });
      setMsg(data.message);
      setSuccess(true);
    } catch (err) {
      setMsg(err.message);
      setSuccess(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Head>
        <title>TweetBox - Forgot Password</title>
      </Head>
      <Navbar user={null} />
      <div className="container">
        <div className="auth-box">
          <h2 style={{ marginBottom: 16 }}>Forgot Password</h2>
          <p className="note" style={{ marginBottom: 16 }}>
            Enter your account email. If it exists, we&apos;ll send you a link to reset your password.
          </p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={sending}>
              {sending ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p className={`msg ${success ? 'success' : ''}`}>{msg}</p>
          </form>
          <p style={{ marginTop: 12, fontSize: 13, textAlign: 'center' }}>
            <Link href="/">Back to login</Link>
          </p>
        </div>
      </div>
    </>
  );
}
