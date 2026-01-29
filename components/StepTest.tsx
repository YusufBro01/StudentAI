import React, { useState, useEffect, useCallback } from 'react';
import { Question } from '../types';

interface Props {
  subject: string;
  questions: Question[];
  onFinish: (score: number) => void;
  onHintRequest: () => void;
}

const StepTest: React.FC<Props> = ({ subject, questions, onFinish, onHintRequest }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion.a;

  const handleNextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      onFinish(score);
    }
  }, [currentIndex, questions.length, score, onFinish]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isAnswered && isCorrect) {
      timer = setTimeout(() => {
        handleNextQuestion();
      }, 1200);
    }
    return () => clearTimeout(timer);
  }, [isAnswered, isCorrect, handleNextQuestion]);
  
  const handleAnswer = (answerIndex: number) => {
    if (isAnswered) return;

    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    if (answerIndex === currentQuestion.a) {
      setScore(prev => prev + 1);
    }
  };

  const getButtonClass = (index: number) => {
    if (!isAnswered) {
      return "bg-white border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-gray-700";
    }
    if (index === currentQuestion.a) {
      return "bg-green-100 border-green-500 text-green-800 scale-105";
    }
    if (index === selectedAnswer && index !== currentQuestion.a) {
      return "bg-red-100 border-red-500 text-red-800";
    }
    return "bg-gray-100 border-gray-200 text-gray-500 opacity-70";
  };
  
  return (
    <div className="bg-white p-5 rounded-2xl shadow-lg w-full animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm font-semibold bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
          Fan: <strong>{subject}</strong>
        </div>
        <div className="text-sm font-semibold bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full">
          <strong>{currentIndex + 1}</strong> / {questions.length}
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
        <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${((currentIndex) / questions.length) * 100}%` }}>
        </div>
      </div>

      <div className="flex items-start justify-between mb-6 min-h-[60px]">
        <h3 className="text-lg font-semibold text-gray-800 text-left flex-grow">
          {currentQuestion.q}
        </h3>
        <button 
            onClick={onHintRequest}
            className="flex-shrink-0 ml-4 p-2 rounded-full transition-all duration-300 transform active:scale-90 bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
            title="Yordam olish"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M12 21a9 9 0 110-18 9 9 0 010 18z" /></svg>
        </button>
      </div>
      
      <div className="space-y-3 mb-6">
        {currentQuestion.o.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            disabled={isAnswered}
            className={`w-full text-left p-4 border-2 rounded-xl transition-all duration-300 font-medium ${getButtonClass(index)}`}
          >
            {option}
          </button>
        ))}
      </div>

      {isAnswered && !isCorrect && (
        <div className="w-full mt-4 animate-fade-in">
           <div className="p-3 mb-4 text-center bg-red-50 border border-red-200 rounded-lg">
             <p className="text-red-700 font-medium">❌ Xato! To'g'ri javob: <span className="font-bold">{currentQuestion.o[currentQuestion.a]}</span></p>
           </div>
           <button
            onClick={handleNextQuestion}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 active:scale-95 transition-transform"
          >
            {currentIndex === questions.length - 1 ? 'Testni Yakunlash' : 'Keyingi Savol'}
          </button>
        </div>
      )}
    </div>
  );
};

export default StepTest;