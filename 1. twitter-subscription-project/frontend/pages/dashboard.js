import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import { apiRequest, getToken, getStoredUser } from '../lib/api';

export default function Dashboard() {
  const router = useRouter();
  const canvasRef = useRef(null);
  
  const [user, setUser] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);

  const [tweetContent, setTweetContent] = useState('');
  const [tweetMsg, setTweetMsg] = useState('');
  const [tweetMsgSuccess, setTweetMsgSuccess] = useState(false);
  const [posting, setPosting] = useState(false);
  const [myTweets, setMyTweets] = useState([]);

  const [plans, setPlans] = useState({});
  const [myPlan, setMyPlan] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);

  // Custom premium Toast notification system to completely eliminate alert() window blocks
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/');
      return;
    }
    setUser(getStoredUser());
    loadEverything();
  }, []);

  const showNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const orbs = [];
    for (let i = 0; i < 25; i++) {
      orbs.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
      orbs.forEach((o) => {
        o.x += o.dx;
        o.y += o.dy;
        if (o.x < 0 || o.x > w) o.dx *= -1;
        if (o.y < 0 || o.y > h) o.dy *= -1;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    }
    draw();

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [loadingPage]);

  const loadEverything = async () => {
    setLoadingPage(true);
    await Promise.all([loadPlans(), loadMyTweets(), loadPaymentHistory()]);
    setLoadingPage(false);
  };

  const loadPlans = async () => {
    try {
      const allPlans = await apiRequest('/plans');
      const mine = await apiRequest('/plans/my-plan', 'GET', null, true);
      setPlans(allPlans);
      setMyPlan(mine);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMyTweets = async () => {
    try {
      const tweets = await apiRequest('/tweets', 'GET', null, true);
      setMyTweets(tweets);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPaymentHistory = async () => {
    try {
      const payments = await apiRequest('/payments/history', 'GET', null, true);
      setPaymentHistory(payments);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostTweet = async () => {
    const content = tweetContent.trim();
    if (!content) {
      setTweetMsg('Tweet cannot be empty');
      setTweetMsgSuccess(false);
      return;
    }

    setPosting(true);
    try {
      const data = await apiRequest('/tweets', 'POST', { content }, true);
      setTweetMsg(`Tweet posted! Remaining tweets: ${data.remainingTweets}`);
      setTweetMsgSuccess(true);
      setTweetContent('');
      await loadMyTweets();
      await loadPlans();
    } catch (err) {
      setTweetMsg(err.message || 'Transmission failed.');
      setTweetMsgSuccess(false);
    } finally {
      setPosting(false);
    }
  };

  const startPayment = async (planKey) => {
    try {
      const orderData = await apiRequest('/payments/create-order', 'POST', { plan: planKey }, true);

      if (orderData.demoMode) {
        try {
          const verifyData = await apiRequest(
            '/payments/verify',
            'POST',
            { razorpay_order_id: orderData.orderId, plan: planKey },
            true
          );
          showNotification(`Demo upgrade verified successfully! License active: ${verifyData.plan.toUpperCase()}`, 'success');
          await loadPlans();
          await loadPaymentHistory();
        } catch (err) {
          showNotification('Demo checkout handshake failed: ' + err.message, 'error');
        }
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'TweetBox Premium',
        description: orderData.planName,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            const verifyData = await apiRequest(
              '/payments/verify',
              'POST',
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: planKey,
              },
              true
            );
            showNotification(`Payment verified! System license updated: ${verifyData.plan.toUpperCase()}`, 'success');
            await loadPlans();
            await loadPaymentHistory();
          } catch (err) {
            showNotification('Transaction validation failure: ' + err.message, 'error');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: '#00f0ff' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      showNotification(err.message || 'Could not instantiate premium checkout gateway.', 'error');
    }
  };

  if (loadingPage) {
    return (
      <>
        <Navbar user={user} />
        <div className="loading-text">Syncing secure workspace nodes...</div>
      </>
    );
  }

  // Calculate limits percentage for our new premium visual metering ring
  const limitPercent = myPlan && myPlan.tweetLimit > 0 
    ? Math.min(100, Math.round((myPlan.tweetCount / myPlan.tweetLimit) * 100))
    : 0;

  return (
    <>
      <Head>
        <title>TweetBox Premium - Control Dashboard</title>
      </Head>

      <Navbar user={user} />

      {/* Interactive Canvas Grid Backdrop */}
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

      {/* Custom Non-blocking Toast Overlays */}
      {toast.show && (
        <div className={`custom-toast ${toast.type}`}>
          <div className="toast-icon">
            {toast.type === 'success' ? '⚡' : '⚠️'}
          </div>
          <div className="toast-body">{toast.message}</div>
        </div>
      )}

      {}
      <div className="container scroll-lock-container">
        <div className="grid-layout">
          
          {/* Left Column Feed Panel */}
          <div className="left-panel scrollable-column">
            <div className="card">
              <h2>What's happening?</h2>
              <textarea
                className="tweet-box"
                maxLength={280}
                placeholder="Broadcast your node intelligence to the social workspace..."
                value={tweetContent}
                onChange={(e) => setTweetContent(e.target.value)}
              />
              <div className="tweet-actions">
                <span className="char-count">{tweetContent.length} / 280</span>
                <button onClick={handlePostTweet} disabled={posting}>
                  {posting ? 'Broadcasting...' : 'Broadcast'}
                </button>
              </div>
              {tweetMsg && (
                <p className={`msg ${tweetMsgSuccess ? 'success' : ''}`}>
                  {tweetMsg}
                </p>
              )}
            </div>

            <div className="card">
              <h2>Broadcast History</h2>
              {myTweets.length === 0 ? (
                <p className="note">No transmissions logged yet. Use the composer above to broadcast.</p>
              ) : (
                myTweets.map((t) => (
                  <div className="tweet-item" key={t._id}>
                    <p>{t.content}</p>
                    <div className="tweet-date">{new Date(t.createdAt).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column Subscriptions Panel */}
          <div className="right-panel scrollable-column">
            <div className="card">
              <h2>License Node Details</h2>
              {myPlan && (
                <div className="current-plan-box">
                  <p>
                    <strong>System Tier:</strong> {myPlan.planName}
                  </p>
                  <p>
                    <strong>Usage Limits:</strong> {myPlan.tweetLimit === -1 ? 'Unlimited logs' : `${myPlan.tweetLimit} monthly logs`}
                  </p>
                  <p>
                    <strong>Logs Registered:</strong> {myPlan.tweetCount}
                  </p>
                  
                  {/* Premium interactive limits visual bar */}
                  {myPlan.tweetLimit > 0 && (
                    <div className="progress-wrapper">
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${limitPercent}%` }}></div>
                      </div>
                      <span className="progress-label">{limitPercent}% of allotment active</span>
                    </div>
                  )}

                  <p>
                    <strong>Expiry Node:</strong> {myPlan.planExpiry ? new Date(myPlan.planExpiry).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              )}
            </div>

            <div className="card">
              <h2>Subscription Modules</h2>
              <div className="plans-list">
                {Object.keys(plans).map((key) => {
                  const plan = plans[key];
                  const isCurrent = myPlan && myPlan.plan === key;
                  const limitText = plan.tweetLimit === -1 ? 'Unlimited logs' : `${plan.tweetLimit} monthly logs`;

                  return (
                    <div className="plan-card" key={key}>
                      <h3>{plan.name}</h3>
                      <div className="price">
                        ₹{plan.price} / mo - {limitText}
                      </div>
                      <button
                        className={isCurrent ? 'current' : ''}
                        disabled={isCurrent || plan.price === 0}
                        onClick={() => startPayment(key)}
                      >
                        {isCurrent ? 'Current Plan' : plan.price === 0 ? 'Default Active' : 'Upgrade License'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <h2>Transaction Audit Trail</h2>
              {paymentHistory.length === 0 ? (
                <p className="note">No previous invoices found.</p>
              ) : (
                paymentHistory.map((p) => (
                  <div className="payment-item" key={p._id}>
                    <strong>Invoice: {p.plan.toUpperCase()}</strong> - ₹{p.amount} -{' '}
                    <span className={p.status === 'paid' ? 'success' : ''}>{p.status}</span>
                    <div className="tweet-date">{new Date(p.createdAt).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Embedded CSS styles to isolate and perfectly guarantee page heights and scrolls */}
      <style jsx>{`
        /* Standard desktop viewport constraint overrides */
        @media (min-width: 769px) {
          .scroll-lock-container {
            max-height: calc(100vh - 70px) !important;
            overflow: hidden !important;
            padding-top: 20px;
            padding-bottom: 20px;
          }
          .scrollable-column {
            height: calc(100vh - 110px) !important;
            overflow-y: auto !important;
          }
        }

        /* Seamless mobile fallback handling */
        @media (max-width: 768px) {
          .scroll-lock-container {
            max-height: none !important;
            overflow: visible !important;
          }
          .scrollable-column {
            height: auto !important;
            overflow-y: visible !important;
          }
        }

        /* Premium Visual Progress Bar Styling */
        .progress-wrapper {
          margin: 12px 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .progress-bar-bg {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 999px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #1da1f2, #00f0ff);
          border-radius: 999px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .progress-label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        /* custom beautiful glassmorphic toasts */
        .custom-toast {
          position: fixed;
          top: 90px;
          right: 30px;
          background: rgba(10, 15, 30, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1.5px solid rgba(0, 240, 255, 0.3);
          border-radius: 14px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 30px rgba(0, 240, 255, 0.15);
          z-index: 9999;
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          max-width: 380px;
        }
        .custom-toast.error {
          border-color: rgba(239, 68, 68, 0.4);
          box-shadow: 0 10px 30px rgba(239, 68, 68, 0.15);
        }
        .toast-icon {
          font-size: 18px;
        }
        .toast-body {
          font-size: 13px;
          font-weight: 500;
          color: #f8fafc;
          line-height: 1.4;
        }

        @keyframes slideInRight {
          from { transform: translateX(50px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}