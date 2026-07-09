import { useRouter } from 'next/router';
import { logout } from '../lib/api';

export default function Navbar({ user }) {
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="navbar">
      <h1 className="logo" onClick={() => router.push('/')}>
        TweetBox
      </h1>
      {user && (
        <div className="nav-user">
          <span>Hi, {user.name}</span>
          <button onClick={() => router.push('/login-history')} style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.5)' }}>
            Login History
          </button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </nav>
  );
}
