import React, { useState } from 'react';
import { UserData } from '../types';
import { UNIVERSITIES } from '../constants';
import { UniversityIcon } from './icons';

interface Props {
  onNext: () => void;
  updateUserData: (data: Partial<UserData>) => void;
}

const StepUniversity: React.FC<Props> = ({ onNext, updateUserData }) => {
  const [university, setUniversity] = useState(UNIVERSITIES[0]);

  const handleNext = () => {
    updateUserData({ university });
    onNext();
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg animate-fade-in text-center">
       <div className="mb-6">
        <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">🏛</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Universitet</h2>
        <p className="text-gray-500 mt-1">O'qiyotgan universitetingizni tanlang.</p>
      </div>
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <UniversityIcon className="h-5 w-5 text-gray-400" />
        </div>
        <select
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl appearance-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 outline-none"
        >
          {UNIVERSITIES.map((uni) => (
            <option key={uni} value={uni}>
              {uni}
            </option>
          ))}
        </select>
         <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </div>
      </div>
      <button
        onClick={handleNext}
        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 active:scale-95 transition-transform duration-150"
      >
        Davom etish
      </button>
    </div>
  );
};

export default StepUniversity;
