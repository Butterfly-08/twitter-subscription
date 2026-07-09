import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import { apiRequest, getToken, getStoredUser } from '../lib/api';

export default function Dashboard() {
  const router = useRouter();
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

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/');
      return;
    }
    setUser(getStoredUser());
    loadEverything();
  }, []);

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
      console.log(err);
    }
  };

  const loadMyTweets = async () => {
    try {
      const tweets = await apiRequest('/tweets', 'GET', null, true);
      setMyTweets(tweets);
    } catch (err) {
      console.log(err);
    }
  };

  const loadPaymentHistory = async () => {
    try {
      const payments = await apiRequest('/payments/history', 'GET', null, true);
      setPaymentHistory(payments);
    } catch (err) {
      console.log(err);
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
      setTweetMsg(err.message);
      setTweetMsgSuccess(false);
    } finally {
      setPosting(false);
    }
  };

  const startPayment = async (planKey) => {
    try {
      const orderData = await apiRequest('/payments/create-order', 'POST', { plan: planKey }, true);

      // demo mode - backend skips razorpay entirely, just simulate success
      if (orderData.demoMode) {
        try {
          const verifyData = await apiRequest(
            '/payments/verify',
            'POST',
            { razorpay_order_id: orderData.orderId, plan: planKey },
            true
          );
          alert(`(Demo) Payment successful! Invoice: ${verifyData.invoiceNumber}. Plan upgraded to ${verifyData.plan}.`);
          await loadPlans();
          await loadPaymentHistory();
        } catch (err) {
          alert('Demo payment failed: ' + err.message);
        }
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'TweetBox Subscription',
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
            alert(`Payment successful! Invoice: ${verifyData.invoiceNumber}. Check your email for details.`);
            await loadPlans();
            await loadPaymentHistory();
          } catch (err) {
            alert('Payment verification failed: ' + err.message);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: '#1da1f2' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loadingPage) {
    return (
      <>
        <Navbar user={user} />
        <p className="loading-text">Loading your dashboard...</p>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>TweetBox - Dashboard</title>
      </Head>
      <Navbar user={user} />
      <div className="container">
        <div className="grid-layout">
          <div className="left-panel">
            <div className="card">
              <h2>What&apos;s happening?</h2>
              <textarea
                className="tweet-box"
                maxLength={280}
                placeholder="Write your tweet..."
                value={tweetContent}
                onChange={(e) => setTweetContent(e.target.value)}
              />
              <div className="tweet-actions">
                <span className="char-count">{tweetContent.length}/280</span>
                <button onClick={handlePostTweet} disabled={posting}>
                  Post Tweet
                </button>
              </div>
              <p className={`msg ${tweetMsgSuccess ? 'success' : ''}`}>{tweetMsg}</p>
            </div>

            <div className="card">
              <h2>My Tweets</h2>
              {myTweets.length === 0 ? (
                <p className="note">No tweets yet. Post your first one above.</p>
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

          <div className="right-panel">
            <div className="card">
              <h2>Current Plan</h2>
              {myPlan && (
                <div className="current-plan-box">
                  <p>
                    <strong>Plan:</strong> {myPlan.planName}
                  </p>
                  <p>
                    <strong>Tweet Limit:</strong> {myPlan.tweetLimit === -1 ? 'Unlimited' : myPlan.tweetLimit}
                  </p>
                  <p>
                    <strong>Tweets Used This Month:</strong> {myPlan.tweetCount}
                  </p>
                  <p>
                    <strong>Expires On:</strong>{' '}
                    {myPlan.planExpiry ? new Date(myPlan.planExpiry).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              )}
            </div>

            <div className="card">
              <h2>Subscription Plans</h2>
              <p className="note">Payments are accepted only between 10:00 AM - 11:00 AM IST.</p>
              <div className="plans-list">
                {Object.keys(plans).map((key) => {
                  const plan = plans[key];
                  const isCurrent = myPlan && myPlan.plan === key;
                  const limitText = plan.tweetLimit === -1 ? 'Unlimited tweets' : `${plan.tweetLimit} tweets / month`;

                  return (
                    <div className="plan-card" key={key}>
                      <h3>{plan.name}</h3>
                      <div className="price">
                        ₹{plan.price} / month - {limitText}
                      </div>
                      <button
                        className={isCurrent ? 'current' : ''}
                        disabled={isCurrent || plan.price === 0}
                        onClick={() => startPayment(key)}
                      >
                        {isCurrent ? 'Current Plan' : plan.price === 0 ? 'Default Plan' : 'Subscribe'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <h2>Payment History</h2>
              {paymentHistory.length === 0 ? (
                <p className="note">No payments made yet.</p>
              ) : (
                paymentHistory.map((p) => (
                  <div className="payment-item" key={p._id}>
                    <strong>{p.plan.toUpperCase()}</strong> - ₹{p.amount} -{' '}
                    <span style={{ color: p.status === 'paid' ? '#17bf63' : '#e0245e' }}>{p.status}</span>
                    <div className="tweet-date">{new Date(p.createdAt).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
