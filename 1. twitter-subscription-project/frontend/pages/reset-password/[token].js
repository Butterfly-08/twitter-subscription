import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import PasswordInput from '../../components/PasswordInput';
import { apiRequest } from '../../lib/api';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');

    if (password !== confirmPassword) {
      setMsg('Passwords do not match');
      setSuccess(false);
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiRequest(`/auth/reset-password/${token}`, 'POST', { password });
      setMsg(data.message + ' Redirecting to login...');
      setSuccess(true);
      setTimeout(() => router.push('/'), 2000);
    } catch (err) {
      setMsg(err.message);
      setSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>TweetBox - Reset Password</title>
      </Head>
      <Navbar user={null} />
      <div className="container">
        <div className="auth-box">
          <h2 style={{ marginBottom: 16 }}>Set a New Password</h2>
          <form className="auth-form" onSubmit={handleSubmit}>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              required
            />
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
            <button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Reset Password'}
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
