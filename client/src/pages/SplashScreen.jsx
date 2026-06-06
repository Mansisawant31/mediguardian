import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const SplashScreen = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(isAuthenticated ? '/dashboard' : '/login');
    }, 2500);
    return () => clearTimeout(timer);
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col items-center justify-center">
      <div className="text-center animate-pulse">
        <div className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/50">
          <span className="text-5xl">🏥</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">MediGuardian</h1>
        <p className="text-emerald-400 text-lg">Your Smart Health Companion</p>
      </div>
      <div className="absolute bottom-16 flex gap-2">
        {[0, 150, 300].map(delay => (
          <div key={delay} className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </div>
    </div>
  );
};

export default SplashScreen;