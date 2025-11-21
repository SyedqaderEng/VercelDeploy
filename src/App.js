import React, { useState, useEffect } from 'react';
import {
    LucideZap, LucideSparkles, LucideLoader2, LucideCheckCircle, LucideAlertCircle,
    LucideDownload, LucideCode, LucideCopy, LucideCheck, LucideTrash2, LucideHistory,
    LucideGlobe, LucideMail, LucideFileText, LucideTerminal, LucideStar, LucideX,
    LucideChevronRight, LucideBookmark
} from 'lucide-react';

// --- Configuration ---
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || "";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// --- Generation Modes ---
const MODES = [
    { id: 'website', name: 'Website', icon: LucideGlobe, color: 'indigo', prompt: 'Create a complete, responsive HTML website with Tailwind CSS. Output only valid HTML starting with <!DOCTYPE html>.' },
    { id: 'email', name: 'Email', icon: LucideMail, color: 'blue', prompt: 'Write a professional email.' },
    { id: 'blog', name: 'Blog Post', icon: LucideFileText, color: 'green', prompt: 'Write a detailed, engaging blog post with proper formatting.' },
    { id: 'code', name: 'Code', icon: LucideTerminal, color: 'purple', prompt: 'Write clean, well-commented code.' },
];

export default function App() {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState('preview');
    const [genMode, setGenMode] = useState('website');
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [copied, setCopied] = useState(false);
    const [savedPrompts, setSavedPrompts] = useState([]);

    // Load history and saved prompts from localStorage
    useEffect(() => {
        const savedHistory = localStorage.getItem('ai-builder-history');
        const savedFavorites = localStorage.getItem('ai-builder-favorites');
        if (savedHistory) setHistory(JSON.parse(savedHistory));
        if (savedFavorites) setSavedPrompts(JSON.parse(savedFavorites));
    }, []);

    // Save history to localStorage
    const saveToHistory = (promptText, responseText, mode) => {
        const newItem = {
            id: Date.now(),
            prompt: promptText,
            response: responseText,
            mode: mode,
            timestamp: new Date().toISOString()
        };
        const newHistory = [newItem, ...history].slice(0, 20); // Keep last 20
        setHistory(newHistory);
        localStorage.setItem('ai-builder-history', JSON.stringify(newHistory));
    };

    const generateContent = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt');
            return;
        }

        setLoading(true);
        setError('');
        setResponse('');

        const currentMode = MODES.find(m => m.id === genMode);
        const systemPrompt = currentMode?.prompt || '';

        try {
            const res = await fetch(OPENAI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 4096
                })
            });

            const data = await res.json();

            if (res.ok && data.choices && data.choices.length > 0) {
                const generatedText = data.choices[0]?.message?.content;
                setResponse(generatedText || 'No response generated');
                saveToHistory(prompt, generatedText, genMode);
            } else {
                setError(`API Error: ${JSON.stringify(data.error || data)}`);
            }
        } catch (err) {
            setError(`Connection Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(response);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadCode = () => {
        const ext = genMode === 'website' ? 'html' : genMode === 'code' ? 'txt' : 'md';
        const blob = new Blob([response], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `generated-${genMode}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const savePrompt = () => {
        if (!prompt.trim()) return;
        const newFavorites = [...savedPrompts, { id: Date.now(), text: prompt, mode: genMode }].slice(0, 10);
        setSavedPrompts(newFavorites);
        localStorage.setItem('ai-builder-favorites', JSON.stringify(newFavorites));
    };

    const loadFromHistory = (item) => {
        setPrompt(item.prompt);
        setResponse(item.response);
        setGenMode(item.mode);
        setShowHistory(false);
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem('ai-builder-history');
    };

    const isHTMLResponse = response.trim().startsWith('<!DOCTYPE') || response.trim().startsWith('<html');
    const currentMode = MODES.find(m => m.id === genMode);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                                <LucideZap size={20} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">AI Builder</h1>
                                <p className="text-xs text-purple-300">Powered by GPT-4o</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-all"
                            >
                                <LucideHistory size={16} />
                                <span className="hidden sm:inline">History</span>
                                {history.length > 0 && (
                                    <span className="bg-purple-500 text-xs px-2 py-0.5 rounded-full">{history.length}</span>
                                )}
                            </button>
                            <div className="flex items-center space-x-1 bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full text-sm font-medium">
                                <LucideCheckCircle size={14} />
                                <span className="hidden sm:inline">Ready</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* History Sidebar */}
            {showHistory && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
                    <div className="relative w-full max-w-md bg-slate-900 border-l border-white/10 h-full overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Generation History</h2>
                                <div className="flex items-center space-x-2">
                                    {history.length > 0 && (
                                        <button onClick={clearHistory} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                                            <LucideTrash2 size={18} />
                                        </button>
                                    )}
                                    <button onClick={() => setShowHistory(false)} className="p-2 text-gray-400 hover:bg-white/10 rounded-lg">
                                        <LucideX size={18} />
                                    </button>
                                </div>
                            </div>
                            {history.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No history yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {history.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => loadFromHistory(item)}
                                            className="w-full text-left p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded capitalize">{item.mode}</span>
                                                <span className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm text-gray-300 line-clamp-2">{item.prompt}</p>
                                            <div className="flex items-center text-purple-400 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <LucideChevronRight size={14} />
                                                <span>Load this</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Mode Selector */}
                <div className="flex flex-wrap gap-3 mb-8 justify-center">
                    {MODES.map((mode) => {
                        const Icon = mode.icon;
                        const isActive = genMode === mode.id;
                        return (
                            <button
                                key={mode.id}
                                onClick={() => setGenMode(mode.id)}
                                className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-medium transition-all ${
                                    isActive
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-500/25 scale-105'
                                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                                }`}
                            >
                                <Icon size={18} />
                                <span>{mode.name}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Input Section */}
                    <div className="space-y-4">
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <LucideSparkles className="text-purple-400" size={20} />
                                    <h2 className="text-lg font-bold text-white">Your Prompt</h2>
                                </div>
                                <span className="text-xs text-gray-500">{prompt.length} chars</span>
                            </div>

                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={`Describe what you want to create...\n\nExample: "${genMode === 'website' ? 'A modern portfolio website for a photographer' : genMode === 'email' ? 'A follow-up email after a job interview' : genMode === 'blog' ? 'An article about the future of AI' : 'A Python function to sort a list'}"`}
                                className="w-full h-48 p-4 bg-black/30 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-200 placeholder-gray-500"
                                disabled={loading}
                            />

                            <div className="mt-4 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={generateContent}
                                    disabled={loading || !prompt.trim()}
                                    className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <>
                                            <LucideLoader2 size={20} className="animate-spin" />
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LucideSparkles size={20} />
                                            <span>Generate</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={savePrompt}
                                    disabled={!prompt.trim()}
                                    className="px-4 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all disabled:opacity-50"
                                    title="Save prompt"
                                >
                                    <LucideBookmark size={20} />
                                </button>
                            </div>

                            {error && (
                                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3">
                                    <LucideAlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                                    <p className="text-sm text-red-300">{error}</p>
                                </div>
                            )}
                        </div>

                        {/* Saved Prompts */}
                        {savedPrompts.length > 0 && (
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                                <h3 className="font-bold text-white mb-3 flex items-center space-x-2">
                                    <LucideStar size={16} className="text-yellow-400" />
                                    <span>Saved Prompts</span>
                                </h3>
                                <div className="space-y-2">
                                    {savedPrompts.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => { setPrompt(item.text); setGenMode(item.mode); }}
                                            className="w-full text-left px-4 py-3 bg-black/20 hover:bg-black/40 rounded-lg text-sm text-gray-300 hover:text-white transition-colors border border-white/5 truncate"
                                        >
                                            {item.text}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Examples */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                            <h3 className="font-bold text-white mb-3">Quick Examples</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { text: 'A SaaS landing page with pricing', mode: 'website' },
                                    { text: 'Professional thank you email', mode: 'email' },
                                    { text: 'How AI is changing healthcare', mode: 'blog' },
                                    { text: 'React hook for API calls', mode: 'code' },
                                ].map((example, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => { setPrompt(example.text); setGenMode(example.mode); }}
                                        className="flex items-center justify-between px-4 py-3 bg-black/20 hover:bg-purple-500/20 rounded-lg text-sm text-gray-300 hover:text-white transition-all border border-white/5 hover:border-purple-500/30 group"
                                    >
                                        <span>{example.text}</span>
                                        <span className="text-xs px-2 py-1 bg-white/10 rounded capitalize opacity-50 group-hover:opacity-100">{example.mode}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Output Section */}
                    <div className="space-y-4">
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                            <div className="p-4 border-b border-white/10 bg-black/20">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-white">Output</h2>
                                    {response && (
                                        <div className="flex items-center space-x-2">
                                            {isHTMLResponse && (
                                                <div className="flex items-center space-x-1 bg-black/30 rounded-lg p-1">
                                                    <button
                                                        onClick={() => setViewMode('preview')}
                                                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                                            viewMode === 'preview' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                                                        }`}
                                                    >
                                                        Preview
                                                    </button>
                                                    <button
                                                        onClick={() => setViewMode('code')}
                                                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                                            viewMode === 'code' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                                                        }`}
                                                    >
                                                        Code
                                                    </button>
                                                </div>
                                            )}
                                            <button
                                                onClick={copyToClipboard}
                                                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all"
                                                title="Copy to clipboard"
                                            >
                                                {copied ? <LucideCheck size={18} className="text-green-400" /> : <LucideCopy size={18} />}
                                            </button>
                                            <button
                                                onClick={downloadCode}
                                                className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-all"
                                                title="Download"
                                            >
                                                <LucideDownload size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="relative min-h-[500px]">
                                {!response && !loading && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-8">
                                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                            <LucideSparkles size={32} className="opacity-50" />
                                        </div>
                                        <p className="text-center">Your AI-generated content will appear here</p>
                                    </div>
                                )}

                                {loading && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="relative">
                                            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                                            <LucideZap size={24} className="absolute inset-0 m-auto text-purple-400" />
                                        </div>
                                        <p className="text-gray-400 font-medium mt-4">AI is creating...</p>
                                        <p className="text-sm text-gray-600 mt-1">This may take a few seconds</p>
                                    </div>
                                )}

                                {response && !loading && (
                                    <>
                                        {isHTMLResponse && viewMode === 'preview' ? (
                                            <iframe
                                                srcDoc={response}
                                                title="preview"
                                                className="w-full h-[500px] bg-white"
                                                sandbox="allow-scripts"
                                            />
                                        ) : (
                                            <div className="p-6 h-[500px] overflow-auto">
                                                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                                                    {response}
                                                </pre>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Stats Card */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-white">{history.length}</p>
                                    <p className="text-xs text-gray-500">Generations</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{savedPrompts.length}</p>
                                    <p className="text-xs text-gray-500">Saved</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-purple-400">GPT-4o</p>
                                    <p className="text-xs text-gray-500">Model</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-8 border-t border-white/10">
                <p className="text-center text-sm text-gray-500">
                    AI Builder • Powered by OpenAI GPT-4o-mini • Build anything with AI
                </p>
            </footer>
        </div>
    );
}
