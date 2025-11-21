import React, { useState, useEffect, useCallback } from 'react';
import {
    LucideZap, LucideSparkles, LucideLoader2, LucideCheckCircle, LucideAlertCircle,
    LucideDownload, LucideCopy, LucideCheck, LucideTrash2, LucideHistory,
    LucideGlobe, LucideMail, LucideFileText, LucideTerminal, LucideStar, LucideX,
    LucideChevronRight, LucideBookmark, LucideSmartphone, LucideMonitor, LucideMaximize2,
    LucideMinimize2, LucideRefreshCw, LucideWand2, LucideLanguages, LucideSettings2,
    LucideKeyboard, LucideShare2, LucidePalette
} from 'lucide-react';

// --- Configuration ---
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || "";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// --- Generation Modes ---
const MODES = [
    { id: 'website', name: 'Website', icon: LucideGlobe, prompt: 'Create a complete, responsive HTML website with Tailwind CSS via CDN. Output only valid HTML starting with <!DOCTYPE html>. Include modern design with animations.' },
    { id: 'email', name: 'Email', icon: LucideMail, prompt: 'Write a professional email with proper greeting and signature.' },
    { id: 'blog', name: 'Blog Post', icon: LucideFileText, prompt: 'Write a detailed, engaging blog post with proper formatting, headings, and paragraphs.' },
    { id: 'code', name: 'Code', icon: LucideTerminal, prompt: 'Write clean, well-commented, production-ready code with best practices.' },
];

// --- Tone Options ---
const TONES = [
    { id: 'professional', name: 'Professional', emoji: '👔' },
    { id: 'casual', name: 'Casual', emoji: '😊' },
    { id: 'creative', name: 'Creative', emoji: '🎨' },
    { id: 'formal', name: 'Formal', emoji: '📜' },
    { id: 'friendly', name: 'Friendly', emoji: '🤗' },
];

// --- Language Options ---
const LANGUAGES = [
    { id: 'en', name: 'English', flag: '🇺🇸' },
    { id: 'es', name: 'Spanish', flag: '🇪🇸' },
    { id: 'fr', name: 'French', flag: '🇫🇷' },
    { id: 'de', name: 'German', flag: '🇩🇪' },
    { id: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { id: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { id: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { id: 'hi', name: 'Hindi', flag: '🇮🇳' },
];

// --- Templates ---
const TEMPLATES = {
    website: [
        { name: 'Landing Page', prompt: 'A modern SaaS landing page with hero section, features grid, pricing table, testimonials, and CTA' },
        { name: 'Portfolio', prompt: 'A creative portfolio website for a designer with project gallery, about section, and contact form' },
        { name: 'Restaurant', prompt: 'An elegant restaurant website with menu, reservation form, gallery, and location map' },
        { name: 'E-commerce', prompt: 'A product showcase page with product cards, filters, shopping cart UI, and checkout section' },
    ],
    email: [
        { name: 'Follow-up', prompt: 'A follow-up email after a job interview thanking them for their time' },
        { name: 'Sales Pitch', prompt: 'A compelling sales email introducing our new product to potential customers' },
        { name: 'Apology', prompt: 'A sincere apology email to a customer about a service issue' },
        { name: 'Newsletter', prompt: 'A monthly newsletter email with company updates and valuable content' },
    ],
    blog: [
        { name: 'How-to Guide', prompt: 'A comprehensive how-to guide about getting started with AI tools' },
        { name: 'Listicle', prompt: '10 productivity tips for remote workers in 2024' },
        { name: 'Opinion Piece', prompt: 'An opinion article about the future of artificial intelligence' },
        { name: 'Case Study', prompt: 'A case study about how a startup increased revenue by 200%' },
    ],
    code: [
        { name: 'React Component', prompt: 'A React component for a responsive navigation bar with mobile menu' },
        { name: 'API Endpoint', prompt: 'A Node.js Express API endpoint for user authentication with JWT' },
        { name: 'Python Script', prompt: 'A Python script to scrape and analyze data from a website' },
        { name: 'SQL Queries', prompt: 'SQL queries for an e-commerce database including joins and aggregations' },
    ],
};

export default function App() {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState('preview');
    const [genMode, setGenMode] = useState('website');
    const [tone, setTone] = useState('professional');
    const [language, setLanguage] = useState('en');
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [copied, setCopied] = useState(false);
    const [savedPrompts, setSavedPrompts] = useState([]);
    const [devicePreview, setDevicePreview] = useState('desktop');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);

    // Load from localStorage
    useEffect(() => {
        const savedHistory = localStorage.getItem('ai-builder-history');
        const savedFavorites = localStorage.getItem('ai-builder-favorites');
        const savedTone = localStorage.getItem('ai-builder-tone');
        const savedLang = localStorage.getItem('ai-builder-language');
        if (savedHistory) setHistory(JSON.parse(savedHistory));
        if (savedFavorites) setSavedPrompts(JSON.parse(savedFavorites));
        if (savedTone) setTone(savedTone);
        if (savedLang) setLanguage(savedLang);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (prompt.trim() && !loading) generateContent();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setShowTemplates(t => !t);
            }
            if (e.key === 'Escape') {
                setIsFullscreen(false);
                setShowHistory(false);
                setShowSettings(false);
                setShowTemplates(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [prompt, loading]);

    const saveToHistory = (promptText, responseText, mode) => {
        const newItem = {
            id: Date.now(),
            prompt: promptText,
            response: responseText,
            mode,
            tone,
            language,
            timestamp: new Date().toISOString()
        };
        const newHistory = [newItem, ...history].slice(0, 30);
        setHistory(newHistory);
        localStorage.setItem('ai-builder-history', JSON.stringify(newHistory));
    };

    const generateContent = async (customPrompt = null, isVariation = false) => {
        const userPrompt = customPrompt || prompt;
        if (!userPrompt.trim()) {
            setError('Please enter a prompt');
            return;
        }

        setLoading(true);
        setError('');
        if (!isVariation) setResponse('');

        const currentMode = MODES.find(m => m.id === genMode);
        const currentTone = TONES.find(t => t.id === tone);
        const currentLang = LANGUAGES.find(l => l.id === language);

        const systemPrompt = `${currentMode?.prompt}
Tone: ${currentTone?.name}.
Language: Write in ${currentLang?.name}.
${isVariation ? 'Create a different variation from the previous response.' : ''}`;

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
                        { role: 'user', content: userPrompt }
                    ],
                    max_tokens: 4096,
                    temperature: isVariation ? 0.9 : 0.7
                })
            });

            const data = await res.json();

            if (res.ok && data.choices?.length > 0) {
                const generatedText = data.choices[0]?.message?.content;
                setResponse(generatedText || 'No response generated');
                saveToHistory(userPrompt, generatedText, genMode);
            } else {
                setError(`API Error: ${JSON.stringify(data.error || data)}`);
            }
        } catch (err) {
            setError(`Connection Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const improveResponse = async () => {
        if (!response) return;
        setLoading(true);
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
                        { role: 'system', content: 'Improve and enhance the following content. Make it more professional, detailed, and polished while keeping the same format and structure.' },
                        { role: 'user', content: response }
                    ],
                    max_tokens: 4096
                })
            });
            const data = await res.json();
            if (res.ok && data.choices?.length > 0) {
                setResponse(data.choices[0]?.message?.content);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(response);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareContent = async () => {
        if (navigator.share) {
            await navigator.share({
                title: 'AI Generated Content',
                text: response.substring(0, 200) + '...',
            });
        } else {
            copyToClipboard();
        }
    };

    const downloadCode = () => {
        const ext = genMode === 'website' ? 'html' : genMode === 'code' ? 'txt' : 'md';
        const blob = new Blob([response], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `generated-${genMode}-${Date.now()}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const savePromptToFavorites = () => {
        if (!prompt.trim()) return;
        const newFavorites = [...savedPrompts, { id: Date.now(), text: prompt, mode: genMode }].slice(0, 10);
        setSavedPrompts(newFavorites);
        localStorage.setItem('ai-builder-favorites', JSON.stringify(newFavorites));
    };

    const updateTone = (newTone) => {
        setTone(newTone);
        localStorage.setItem('ai-builder-tone', newTone);
    };

    const updateLanguage = (newLang) => {
        setLanguage(newLang);
        localStorage.setItem('ai-builder-language', newLang);
    };

    const loadTemplate = (template) => {
        setPrompt(template.prompt);
        setShowTemplates(false);
    };

    const wordCount = response.split(/\s+/).filter(w => w).length;
    const readingTime = Math.ceil(wordCount / 200);
    const isHTMLResponse = response.trim().startsWith('<!DOCTYPE') || response.trim().startsWith('<html');
    const currentTemplates = TEMPLATES[genMode] || [];

    // Fullscreen Preview Modal
    if (isFullscreen && response) {
        return (
            <div className="fixed inset-0 bg-black z-50 flex flex-col">
                <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-white/10">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setIsFullscreen(false)}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                        >
                            <LucideMinimize2 size={20} />
                        </button>
                        <span className="text-white font-medium">Full Screen Preview</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setDevicePreview('mobile')}
                            className={`p-2 rounded-lg ${devicePreview === 'mobile' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400'}`}
                        >
                            <LucideSmartphone size={20} />
                        </button>
                        <button
                            onClick={() => setDevicePreview('desktop')}
                            className={`p-2 rounded-lg ${devicePreview === 'desktop' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400'}`}
                        >
                            <LucideMonitor size={20} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center bg-gray-800 p-4">
                    <div className={`bg-white transition-all duration-300 ${devicePreview === 'mobile' ? 'w-[375px] h-[667px] rounded-3xl border-8 border-gray-700' : 'w-full h-full'}`}>
                        <iframe srcDoc={response} title="preview" className="w-full h-full" sandbox="allow-scripts" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                                <LucideZap size={20} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">AI Builder Pro</h1>
                                <p className="text-xs text-purple-300">GPT-4o Powered</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setShowShortcuts(true)}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-gray-400 hover:text-white hidden sm:block"
                                title="Keyboard Shortcuts"
                            >
                                <LucideKeyboard size={18} />
                            </button>
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-gray-400 hover:text-white"
                            >
                                <LucideSettings2 size={18} />
                            </button>
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium"
                            >
                                <LucideHistory size={16} />
                                <span className="hidden sm:inline">History</span>
                                {history.length > 0 && (
                                    <span className="bg-purple-500 text-xs px-1.5 py-0.5 rounded-full">{history.length}</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Settings Panel */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
                    <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Settings</h2>
                            <button onClick={() => setShowSettings(false)} className="p-2 text-gray-400 hover:bg-white/10 rounded-lg">
                                <LucideX size={18} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Tone Selector */}
                            <div>
                                <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-3">
                                    <LucidePalette size={16} />
                                    <span>Writing Tone</span>
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {TONES.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => updateTone(t.id)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                tone === t.id ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                        >
                                            {t.emoji} {t.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Language Selector */}
                            <div>
                                <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-3">
                                    <LucideLanguages size={16} />
                                    <span>Output Language</span>
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {LANGUAGES.map(l => (
                                        <button
                                            key={l.id}
                                            onClick={() => updateLanguage(l.id)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                language === l.id ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                        >
                                            {l.flag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Keyboard Shortcuts Modal */}
            {showShortcuts && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowShortcuts(false)} />
                    <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4">
                        <h2 className="text-xl font-bold text-white mb-4">Keyboard Shortcuts</h2>
                        <div className="space-y-3">
                            {[
                                ['Ctrl + Enter', 'Generate content'],
                                ['Ctrl + K', 'Open templates'],
                                ['Escape', 'Close modals'],
                            ].map(([key, desc]) => (
                                <div key={key} className="flex items-center justify-between">
                                    <span className="text-gray-400">{desc}</span>
                                    <kbd className="px-2 py-1 bg-white/10 rounded text-sm text-white font-mono">{key}</kbd>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setShowShortcuts(false)} className="mt-6 w-full py-2 bg-purple-600 text-white rounded-lg">Got it</button>
                    </div>
                </div>
            )}

            {/* Templates Modal */}
            {showTemplates && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowTemplates(false)} />
                    <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Templates for {MODES.find(m => m.id === genMode)?.name}</h2>
                            <button onClick={() => setShowTemplates(false)} className="p-2 text-gray-400 hover:bg-white/10 rounded-lg">
                                <LucideX size={18} />
                            </button>
                        </div>
                        <div className="grid gap-3">
                            {currentTemplates.map((template, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => loadTemplate(template)}
                                    className="text-left p-4 bg-white/5 hover:bg-purple-500/20 rounded-xl border border-white/10 hover:border-purple-500/30 transition-all"
                                >
                                    <p className="font-medium text-white">{template.name}</p>
                                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{template.prompt}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* History Sidebar */}
            {showHistory && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
                    <div className="relative w-full max-w-md bg-slate-900 border-l border-white/10 h-full overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">History ({history.length})</h2>
                                <div className="flex items-center space-x-2">
                                    {history.length > 0 && (
                                        <button onClick={() => { setHistory([]); localStorage.removeItem('ai-builder-history'); }} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
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
                                            onClick={() => { setPrompt(item.prompt); setResponse(item.response); setGenMode(item.mode); setShowHistory(false); }}
                                            className="w-full text-left p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded capitalize">{item.mode}</span>
                                                <span className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm text-gray-300 line-clamp-2">{item.prompt}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Mode Selector */}
                <div className="flex flex-wrap gap-2 mb-6 justify-center">
                    {MODES.map((mode) => {
                        const Icon = mode.icon;
                        return (
                            <button
                                key={mode.id}
                                onClick={() => setGenMode(mode.id)}
                                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                                    genMode === mode.id
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                                }`}
                            >
                                <Icon size={18} />
                                <span>{mode.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Current Settings Display */}
                <div className="flex items-center justify-center gap-4 mb-6 text-sm">
                    <span className="text-gray-500">Tone: <span className="text-purple-400">{TONES.find(t => t.id === tone)?.emoji} {TONES.find(t => t.id === tone)?.name}</span></span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-500">Language: <span className="text-purple-400">{LANGUAGES.find(l => l.id === language)?.flag} {LANGUAGES.find(l => l.id === language)?.name}</span></span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Input Section */}
                    <div className="space-y-4">
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                    <LucideSparkles className="text-purple-400" size={18} />
                                    <h2 className="text-lg font-bold text-white">Your Prompt</h2>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500">{prompt.length} chars</span>
                                    <button
                                        onClick={() => setShowTemplates(true)}
                                        className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500/30"
                                    >
                                        Templates
                                    </button>
                                </div>
                            </div>

                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe what you want to create... (Ctrl+Enter to generate)"
                                className="w-full h-40 p-4 bg-black/30 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-200 placeholder-gray-500"
                                disabled={loading}
                            />

                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={() => generateContent()}
                                    disabled={loading || !prompt.trim()}
                                    className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {loading ? <LucideLoader2 size={18} className="animate-spin" /> : <LucideSparkles size={18} />}
                                    <span>{loading ? 'Generating...' : 'Generate'}</span>
                                </button>
                                <button onClick={savePromptToFavorites} disabled={!prompt.trim()} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl disabled:opacity-50" title="Save">
                                    <LucideBookmark size={18} />
                                </button>
                            </div>

                            {error && (
                                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-2">
                                    <LucideAlertCircle className="text-red-400 flex-shrink-0" size={18} />
                                    <p className="text-sm text-red-300">{error}</p>
                                </div>
                            )}
                        </div>

                        {/* Saved Prompts */}
                        {savedPrompts.length > 0 && (
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
                                <h3 className="font-bold text-white mb-3 flex items-center space-x-2 text-sm">
                                    <LucideStar size={14} className="text-yellow-400" />
                                    <span>Saved Prompts</span>
                                </h3>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {savedPrompts.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => { setPrompt(item.text); setGenMode(item.mode); }}
                                            className="w-full text-left px-3 py-2 bg-black/20 hover:bg-black/40 rounded-lg text-sm text-gray-300 hover:text-white transition-colors truncate"
                                        >
                                            {item.text}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick Templates */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
                            <h3 className="font-bold text-white mb-3 text-sm">Quick Start</h3>
                            <div className="grid gap-2">
                                {currentTemplates.slice(0, 3).map((template, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => loadTemplate(template)}
                                        className="flex items-center justify-between px-3 py-2.5 bg-black/20 hover:bg-purple-500/20 rounded-lg text-sm text-gray-300 hover:text-white transition-all border border-white/5 hover:border-purple-500/30"
                                    >
                                        <span className="truncate">{template.name}</span>
                                        <LucideChevronRight size={14} className="text-gray-500" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Output Section */}
                    <div className="space-y-4">
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                            <div className="p-4 border-b border-white/10 bg-black/20">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center space-x-2">
                                        <h2 className="text-lg font-bold text-white">Output</h2>
                                        {response && <span className="text-xs text-gray-500">{wordCount} words • {readingTime} min read</span>}
                                    </div>
                                    {response && (
                                        <div className="flex items-center space-x-1">
                                            {isHTMLResponse && (
                                                <>
                                                    <button onClick={() => setDevicePreview('desktop')} className={`p-1.5 rounded ${devicePreview === 'desktop' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400'}`}>
                                                        <LucideMonitor size={16} />
                                                    </button>
                                                    <button onClick={() => setDevicePreview('mobile')} className={`p-1.5 rounded ${devicePreview === 'mobile' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400'}`}>
                                                        <LucideSmartphone size={16} />
                                                    </button>
                                                    <div className="w-px h-5 bg-white/10 mx-1" />
                                                    <button onClick={() => setViewMode(viewMode === 'preview' ? 'code' : 'preview')} className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-gray-400">
                                                        {viewMode === 'preview' ? 'Code' : 'Preview'}
                                                    </button>
                                                    <button onClick={() => setIsFullscreen(true)} className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-gray-400">
                                                        <LucideMaximize2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                            <div className="w-px h-5 bg-white/10 mx-1" />
                                            <button onClick={() => generateContent(prompt, true)} disabled={loading} className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-gray-400" title="Regenerate variation">
                                                <LucideRefreshCw size={16} />
                                            </button>
                                            <button onClick={improveResponse} disabled={loading} className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-gray-400" title="Improve">
                                                <LucideWand2 size={16} />
                                            </button>
                                            <button onClick={copyToClipboard} className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-gray-400">
                                                {copied ? <LucideCheck size={16} className="text-green-400" /> : <LucideCopy size={16} />}
                                            </button>
                                            <button onClick={shareContent} className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-gray-400">
                                                <LucideShare2 size={16} />
                                            </button>
                                            <button onClick={downloadCode} className="p-1.5 bg-purple-600 hover:bg-purple-700 rounded text-white">
                                                <LucideDownload size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="relative min-h-[400px]">
                                {!response && !loading && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-8">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                            <LucideSparkles size={28} className="opacity-50" />
                                        </div>
                                        <p className="text-center">Your AI-generated content will appear here</p>
                                        <p className="text-sm text-center mt-2 text-gray-600">Press Ctrl+Enter to generate</p>
                                    </div>
                                )}

                                {loading && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="relative">
                                            <div className="w-14 h-14 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                                            <LucideZap size={20} className="absolute inset-0 m-auto text-purple-400" />
                                        </div>
                                        <p className="text-gray-400 font-medium mt-4">AI is creating...</p>
                                    </div>
                                )}

                                {response && !loading && (
                                    <>
                                        {isHTMLResponse && viewMode === 'preview' ? (
                                            <div className={`flex items-center justify-center p-4 bg-gray-800 min-h-[400px]`}>
                                                <div className={`bg-white transition-all duration-300 ${devicePreview === 'mobile' ? 'w-[375px] h-[600px] rounded-3xl border-8 border-gray-700 overflow-hidden' : 'w-full h-[400px]'}`}>
                                                    <iframe srcDoc={response} title="preview" className="w-full h-full" sandbox="allow-scripts" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 h-[400px] overflow-auto">
                                                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">{response}</pre>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
                            <div className="grid grid-cols-4 gap-3 text-center">
                                <div>
                                    <p className="text-xl font-bold text-white">{history.length}</p>
                                    <p className="text-xs text-gray-500">Generated</p>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-white">{savedPrompts.length}</p>
                                    <p className="text-xs text-gray-500">Saved</p>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-purple-400">{TONES.find(t => t.id === tone)?.emoji}</p>
                                    <p className="text-xs text-gray-500">Tone</p>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-purple-400">{LANGUAGES.find(l => l.id === language)?.flag}</p>
                                    <p className="text-xs text-gray-500">Language</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-white/10">
                <p className="text-center text-sm text-gray-500">
                    AI Builder Pro • Powered by OpenAI GPT-4o-mini • Build anything with AI
                </p>
            </footer>
        </div>
    );
}
