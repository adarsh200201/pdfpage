import React from "react";
import "./index.css"; // Import Tailwind CSS

const AppMinimal: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🔧 PdfPage - Minimal Mode
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          React app is working! Basic functionality confirmed.
        </p>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">System Status</h2>
          <div className="space-y-2">
            <p className="text-green-600">✅ React rendering working</p>
            <p className="text-green-600">✅ TypeScript compilation working</p>
            <p className="text-green-600">✅ Tailwind CSS working</p>
            <p className="text-green-600">✅ Vite dev server working</p>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Quick Tests</h3>
            <button 
              onClick={() => alert('JavaScript events working!')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-4"
            >
              Test Click Event
            </button>
            <button 
              onClick={() => console.log('Console logging working!')}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Test Console Log
            </button>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Environment Info</h3>
            <ul className="text-sm text-gray-600">
              <li>Timestamp: {new Date().toLocaleString()}</li>
              <li>URL: {window.location.href}</li>
              <li>Mode: {import.meta.env.MODE}</li>
              <li>Dev: {import.meta.env.DEV ? 'Yes' : 'No'}</li>
            </ul>
          </div>

          <div className="mt-6">
            <a 
              href="/health.html" 
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              Open Health Check Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppMinimal;
