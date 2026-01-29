import React from 'react';
import { Receipt } from '../types';

interface Props {
  receipts: Receipt[];
  onLogout: () => void;
}

const AdminDashboard: React.FC<Props> = ({ receipts, onLogout }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-lg animate-fade-in">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Admin Paneli</h2>
        <button 
          onClick={onLogout}
          className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
        >
          Chiqish
        </button>
      </div>

      <h3 className="text-lg font-semibold text-gray-700 mb-4">VIP arizalar ({receipts.length})</h3>
      
      {receipts.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Hozircha arizalar yo'q.</p>
      ) : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {receipts.map((receipt, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="font-semibold text-gray-800">{receipt.user.name}</p>
              <p className="text-sm text-gray-600">{receipt.user.university} - {receipt.user.major} ({receipt.user.course}-kurs)</p>
              <a 
                href={receipt.image} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-2 inline-block text-blue-600 hover:underline"
              >
                Chekni ko'rish
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
