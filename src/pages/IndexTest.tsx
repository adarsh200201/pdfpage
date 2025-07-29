import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";

const IndexTest: React.FC = () => {
  const { isAuthenticated, user, loginWithGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      console.log("Testing Google OAuth...");
      await loginWithGoogle();
    } catch (error) {
      console.error("OAuth Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            PdfPage - Test Mode
          </h1>
          <p className="text-xl text-gray-600">
            Testing Google OAuth Integration
          </p>
        </div>

        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Authentication Status</h2>
          
          {isAuthenticated ? (
            <div className="text-green-600">
              <p className="mb-2">✅ Authenticated</p>
              <p>Name: {user?.name}</p>
              <p>Email: {user?.email}</p>
              <p>Premium: {user?.isPremium ? 'Yes' : 'No'}</p>
            </div>
          ) : (
            <div className="text-red-600">
              <p className="mb-4">❌ Not Authenticated</p>
              <button
                onClick={handleGoogleLogin}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Sign in with Google
              </button>
            </div>
          )}
          
          <div className="mt-6 text-sm text-gray-500">
            <h3 className="font-semibold mb-2">Configuration:</h3>
            <p>Client ID: 935131444417-s5i4mpl0...</p>
            <p>Environment: {import.meta.env.DEV ? 'Development' : 'Production'}</p>
            <p>Backend: {import.meta.env.DEV ? 'Local (5000)' : 'Google Cloud'}</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a 
            href="/debug.html" 
            className="text-blue-600 hover:underline"
            target="_blank"
          >
            Open Debug Page
          </a>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default IndexTest;
