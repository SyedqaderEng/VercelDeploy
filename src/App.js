import React, { useState } from 'react';
import { LucideZap, LucideSparkles, LucideLoader2, LucideCheckCircle, LucideAlertCircle, LucideDownload, LucideCode } from 'lucide-react';

// --- Configuration & Constants ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// ..Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYULcYAA-fuugA3QLsGw5_uhDT3-vd9wQ",
  authDomain: "aidemo-5aac9.firebaseapp.com",
  projectId: "aidemo-5aac9",
  storageBucket: "aidemo-5aac9.firebasestorage.app",
  messagingSenderId: "760932009750",
  appId: "1:760932009750:web:39ef5614140e1378627237",
  measurementId: "G-TJ2TG78PZL"
};

const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : undefined;
const GEMINI_API_KEY = "AIzaSyC3aRcnYp5NpQ0lwYns1VzlvMcdbNVDDy4";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export default function App() {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState('preview'); // 'preview' or 'code'

    const generateContent = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt');
            return;
        }

        setLoading(true);
        setError('');
        setResponse('');

        try {
            const res = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            const data = await res.json();

            if (res.ok && data.candidates && data.candidates.length > 0) {
                const generatedText = data.candidates[0]?.content?.parts[0]?.text;
                setResponse(generatedText || 'No response generated');
            } else {
                setError(`API Error: ${JSON.stringify(data.error || data)}`);
            }
        } catch (err) {
            setError(`Connection Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const downloadCode = () => {
        const blob = new Blob([response], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated-code.html';
        a.click();
        URL.revokeObjectURL(url);
    };

    const isHTMLResponse = response.trim().startsWith('<!DOCTYPE') || response.trim().startsWith('<html');

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <LucideZap size={24} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">AI Builder</h1>
                                <p className="text-sm text-gray-500">Powered by Gemini AI</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                <LucideCheckCircle size={16} />
                                <span>API Ready</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                            <div className="flex items-center space-x-2 mb-4">
                                <LucideSparkles className="text-indigo-600" size={24} />
                                <h2 className="text-xl font-bold text-gray-900">Your Prompt</h2>
                            </div>

                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Enter your prompt here...

Examples:
• Build a landing page for a coffee shop
• Create a to-do list app
• Design a pricing page for a SaaS product
• Write a blog post about AI
• Explain quantum computing"
                                className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-700 placeholder-gray-400"
                                disabled={loading}
                            />

                            <div className="mt-4 flex space-x-3">
                                <button
                                    onClick={generateContent}
                                    disabled={loading || !prompt.trim()}
                                    className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                                >
                                    {loading ? (
                                        <>
                                            <LucideLoader2 size={20} className="animate-spin" />
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LucideSparkles size={20} />
                                            <span>Generate with AI</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {error && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
                                    <LucideAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-red-900">Error</p>
                                        <p className="text-sm text-red-700 mt-1">{error}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Example Prompts */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                            <h3 className="font-bold text-gray-900 mb-3">Try these examples:</h3>
                            <div className="space-y-2">
                                {[
                                    'Build a modern landing page for a fitness app',
                                    'Create a contact form with validation',
                                    'Design a pricing table with 3 tiers',
                                    'Write a product description for smart headphones'
                                ].map((example, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setPrompt(example)}
                                        className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-indigo-50 rounded-lg text-sm text-gray-700 hover:text-indigo-700 transition-colors border border-gray-200 hover:border-indigo-300"
                                    >
                                        {example}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Output Section */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <LucideCheckCircle className="text-green-600" size={24} />
                                        <h2 className="text-xl font-bold text-gray-900">AI Response</h2>
                                    </div>

                                    {response && (
                                        <div className="flex items-center space-x-2">
                                            {isHTMLResponse && (
                                                <div className="flex items-center space-x-1 bg-gray-200 rounded-lg p-1">
                                                    <button
                                                        onClick={() => setViewMode('preview')}
                                                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                                            viewMode === 'preview' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:text-gray-900'
                                                        }`}
                                                    >
                                                        Preview
                                                    </button>
                                                    <button
                                                        onClick={() => setViewMode('code')}
                                                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                                            viewMode === 'code' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:text-gray-900'
                                                        }`}
                                                    >
                                                        Code
                                                    </button>
                                                </div>
                                            )}

                                            {isHTMLResponse && (
                                                <button
                                                    onClick={downloadCode}
                                                    className="flex items-center space-x-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                                                >
                                                    <LucideDownload size={16} />
                                                    <span>Download</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="relative">
                                {!response && !loading && (
                                    <div className="h-96 flex flex-col items-center justify-center text-gray-400 p-8">
                                        <LucideSparkles size={64} className="mb-4 opacity-20" />
                                        <p className="text-center">Your AI-generated content will appear here</p>
                                        <p className="text-sm text-center mt-2">Enter a prompt and click "Generate with AI" to start</p>
                                    </div>
                                )}

                                {loading && (
                                    <div className="h-96 flex flex-col items-center justify-center">
                                        <LucideLoader2 size={48} className="text-indigo-600 animate-spin mb-4" />
                                        <p className="text-gray-600 font-medium">AI is thinking...</p>
                                        <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
                                    </div>
                                )}

                                {response && !loading && (
                                    <>
                                        {isHTMLResponse && viewMode === 'preview' ? (
                                            <div className="h-[600px] overflow-auto">
                                                <iframe
                                                    srcDoc={response}
                                                    title="preview"
                                                    className="w-full h-full border-0"
                                                    sandbox="allow-scripts"
                                                />
                                            </div>
                                        ) : (
                                            <div className="p-6 max-h-[600px] overflow-auto">
                                                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-lg">
                                                    {response}
                                                </pre>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* API Status */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                            <h3 className="font-bold text-gray-900 mb-3">API Status</h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Model:</span>
                                    <span className="text-sm font-mono text-gray-900">gemini-1.5-flash</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Status:</span>
                                    <span className="flex items-center space-x-1 text-sm font-medium text-green-600">
                                        <LucideCheckCircle size={14} />
                                        <span>Connected</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12 border-t border-gray-200">
                <p className="text-center text-sm text-gray-500">
                    Powered by Google Gemini AI • Test your AI generation capabilities
                </p>
            </footer>
        </div>
    );
}
