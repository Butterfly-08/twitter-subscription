import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import { apiRequest, getToken, getStoredUser } from '../lib/api';

export default function LoginHistory() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.push('/');
      return;
    }
    setUser(getStoredUser());
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/auth/login-history', 'GET', null, true);
      setHistory(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deviceIcon = (deviceType) => {
    if (deviceType === 'mobile') return '📱';
    if (deviceType === 'tablet') return '📱';
    return '🖥️';
  };

  return (
    <>
      <Head>
        <title>TweetBox - Login History</title>
      </Head>
      <Navbar user={user} />
      <div className="container">
        <div className="card">
          <h2>Login History</h2>
          <p className="note" style={{ marginBottom: 16 }}>
            A record of every login attempt on your account, including device and browser details. If you
            see something unfamiliar here, change your password right away.
          </p>

          {loading && <p className="loading-text">Loading login history...</p>}
          {errorMsg && <p className="msg">{errorMsg}</p>}

          {!loading && history.length === 0 && (
            <p className="note">No login history recorded yet.</p>
          )}

          {!loading &&
            history.map((entry) => (
              <div className="payment-item" key={entry._id}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong>
                      {deviceIcon(entry.deviceType)} {entry.browser} on {entry.os}
                    </strong>
                    <div className="tweet-date">
                      Device: {entry.deviceType} &middot; IP: {entry.ipAddress}
                    </div>
                    {entry.otpRequired && (
                      <div className="tweet-date" style={{ color: '#1da1f2' }}>
                        Email OTP verification was required for this login
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: '#657786' }}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
