import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { apiRequest } from '../lib/api';

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState('');
  const [msg, setMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setSending(true);
    try {
      const data = await apiRequest('/auth/forgot-password', 'POST', { identifier });
      setMsg(data.message);
      setSuccess(true);
    } catch (err) {
      // backend sends a 429 with "You can use this option only one time per day."
      // when the daily limit is hit - that just flows through here as err.message
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
            Enter your registered email address or phone number. A new password will be generated and
            emailed to your registered email. This can only be used once per day.
          </p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Registered email or phone number"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
            <button type="submit" disabled={sending}>
              {sending ? 'Sending...' : 'Reset Password'}
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
