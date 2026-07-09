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
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </nav>
  );
}
