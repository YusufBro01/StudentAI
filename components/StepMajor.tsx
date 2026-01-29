import React, { useState, useMemo } from 'react';
import { UserData } from '../types';
import { COURSE_MAJORS } from '../constants';
import { AcademicCapIcon, BookOpenIcon } from './icons';

interface Props {
  onNext: () => void;
  updateUserData: (data: Partial<UserData>) => void;
}

const StepMajor: React.FC<Props> = ({ onNext, updateUserData }) => {
  const [course, setCourse] = useState('');
  const [major, setMajor] = useState('');
  const [error, setError] = useState('');

  const availableMajors = useMemo(() => {
    return course ? COURSE_MAJORS[course] : [];
  }, [course]);

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCourse = e.target.value;
    setCourse(newCourse);
    setMajor(''); 
    updateUserData({ course: newCourse, major: '' });
    if (error) setError('');
  };
  
  const handleMajorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newMajor = e.target.value;
      setMajor(newMajor);
      updateUserData({ major: newMajor });
      if (error) setError('');
  };

  const handleNext = () => {
    if (!course || !major) {
      setError("Iltimos, kurs va yo'nalishni tanlang.");
      return;
    }
    setError('');
    onNext();
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg animate-fade-in text-center">
        <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl">🎓</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Kurs va Yo'nalish</h2>
            <p className="text-gray-500 mt-1">Ma'lumotlaringizni tanlang.</p>
        </div>
      
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <AcademicCapIcon className="h-5 w-5 text-gray-400" />
        </div>
        <select
          value={course}
          onChange={handleCourseChange}
          className="w-full pl-11 pr-10 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl appearance-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 outline-none"
        >
          <option value="">Kursni tanlang</option>
          <option value="1">1-kurs</option>
          <option value="2">2-kurs</option>
          <option value="3">3-kurs</option>
          <option value="4">4-kurs</option>
        </select>
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </div>
      </div>
      
      <div className="relative mb-2">
         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <BookOpenIcon className="h-5 w-5 text-gray-400" />
        </div>
        <select
          value={major}
          onChange={handleMajorChange}
          disabled={!course}
          className="w-full pl-11 pr-10 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl appearance-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">{course ? "Yo'nalishni tanlang" : "Avval kursni tanlang"}</option>
          {availableMajors.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </div>
      </div>
      
       {error && <p className="text-red-500 text-sm text-left ml-2 mb-4">{error}</p>}

      <button
        onClick={handleNext}
        disabled={!course || !major}
        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 active:scale-95 transition-all duration-150 mt-4 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Fanlarni Ko'rish
      </button>
    </div>
  );
};

export default StepMajor;
