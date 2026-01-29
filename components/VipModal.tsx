import React, { useRef } from 'react';

interface Props {
  onReceiptUpload: (base64Image: string) => void;
  onClose: () => void;
}

const VipModal: React.FC<Props> = ({ onReceiptUpload, onClose }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onReceiptUpload(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm animate-fade-in text-center">
        <div className="flex justify-end">
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        <div className="w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4 -mt-4">
          <span className="text-4xl">⭐️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800">VIP Yordam Olish</h2>
        <p className="text-gray-600 mt-2 mb-4">
          Test davomida yordam olish uchun VIP statusini oling. <br />
          Narxi: <strong>5000 so'm</strong>
        </p>
        <div className="bg-blue-50 p-3 rounded-lg text-left text-sm text-blue-800">
            <p><strong>To'lovni amalga oshiring:</strong></p>
            <p>Karta raqami: <code className="font-mono">8600 1234 5678 9012</code></p>
            <p>Ism: Aliyev V.</p>
        </div>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
            onClick={handleUploadClick}
            className="w-full mt-6 bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 active:scale-95 transition-transform duration-150"
        >
          Chekni Yuklash
        </button>
      </div>
    </div>
  );
};

export default VipModal;
