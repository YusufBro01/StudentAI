import React from 'react';
import { TestResult } from '../types';

interface Props {
  result: TestResult;
  onRestart: () => void;
}

const StepResults: React.FC<Props> = ({ result, onRestart }) => {
  const percentage = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
  let message = '';
  let emoji = '';

  if (percentage >= 80) {
    message = "Ajoyib Natija!";
    emoji = '🎉';
  } else if (percentage >= 50) {
    message = "Yaxshi, harakatni to'xtatmang!";
    emoji = '👍';
  } else {
    message = "Qayta urinib ko'rish kerak.";
    emoji = '🤔';
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg animate-fade-in text-center">
      <div className="mb-6">
        <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-5xl">{emoji}</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">{message}</h2>
        <p className="text-gray-500 mt-2">Sizning natijangiz:</p>
        <p className="text-5xl font-bold text-blue-600 my-4">
          {result.score} / {result.total}
        </p>
         <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
                className="bg-blue-500 h-4 rounded-full text-white text-xs flex items-center justify-center transition-all duration-1000 ease-out" 
                style={{ width: `${percentage}%` }}>
                {percentage > 10 && `${percentage}%`}
            </div>
        </div>
      </div>
      <button
        onClick={onRestart}
        className="w-full bg-gray-700 text-white font-bold py-3 px-4 rounded-xl hover:bg-gray-800 active:scale-95 transition-transform duration-150"
      >
        Qayta Boshlash
      </button>
    </div>
  );
};

export default StepResults;
