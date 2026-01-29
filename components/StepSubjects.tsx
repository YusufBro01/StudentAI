import React from 'react';
import { SUBJECTS } from '../constants';

interface Props {
  onStartTest: (subject: string) => void;
}

const StepSubjects: React.FC<Props> = ({ onStartTest }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg animate-fade-in text-center">
      <div className="mb-6">
        <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">📚</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Fan Tanlash</h2>
        <p className="text-gray-500 mt-1">Testni boshlash uchun fanni tanlang.</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {SUBJECTS.map(({ name, emoji }, index) => (
          <button
            key={name}
            onClick={() => onStartTest(name)}
            className="group flex flex-col items-center justify-center text-center p-4 bg-gray-50 text-gray-800 font-semibold rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 transform hover:-translate-y-1"
            style={{ animation: `fade-in 0.5s ease-out ${index * 0.1}s both` }}
          >
            <span className="text-4xl mb-2 transition-transform duration-300 group-hover:scale-110">{emoji}</span>
            <span>{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StepSubjects;
