import '../styles/globals.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated on protected routes
    const token = Cookies.get('accessToken');
    const isAuthPage = router.pathname === '/login' || router.pathname === '/register';
    const isPublicPage = router.pathname === '/' || isAuthPage;

    if (!token && !isPublicPage) {
      router.push('/login');
    }
  }, [router.pathname]);

  return <Component {...pageProps} />;
}
