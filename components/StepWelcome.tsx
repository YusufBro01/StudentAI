import React, { useState } from 'react';
import { UserData } from '../types';
import { UserIcon } from './icons';

interface Props {
  onNext: () => void;
  updateUserData: (data: Partial<UserData>) => void;
}

const StepWelcome: React.FC<Props> = ({ onNext, updateUserData }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    if (name.trim().length < 3) {
      setError("Iltimos, ism va familiyangizni to'liq kiriting.");
      return;
    }
    setError('');
    updateUserData({ name });
    onNext();
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg animate-fade-in text-center">
      <div className="mb-6">
        <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">👋</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Xush kelibsiz!</h2>
        <p className="text-gray-500 mt-1">Testni boshlash uchun ismingizni kiriting.</p>
      </div>
      <div className="relative mb-2">
         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <UserIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if(error) setError('');
          }}
          placeholder="Masalan: Ali Valiyev"
          className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 outline-none"
        />
      </div>
      {error && <p className="text-red-500 text-sm text-left ml-2 mb-4">{error}</p>}
      <button
        onClick={handleNext}
        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 active:scale-95 transition-transform duration-150 mt-4"
      >
        Davom etish
      </button>
    </div>
  );
};

export default StepWelcome;
