import React from 'react';
import { useNavigate } from 'react-router-dom';

const SOSButton = () => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/sos')}
      className="fixed right-5 bottom-24 z-50 w-14 h-14 bg-red-500 hover:bg-red-600 active:scale-95 text-white rounded-full shadow-2xl shadow-red-500/50 flex items-center justify-center transition-all"
      title="Emergency SOS"
    >
      <div className="text-center">
        <div className="text-lg leading-none">🚨</div>
        <div className="text-[9px] font-bold leading-none mt-0.5">SOS</div>
      </div>
    </button>
  );
};

export default SOSButton;