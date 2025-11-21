import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { LucideLayoutDashboard, LucideCode, LucideSettings, LucideLogOut, LucidePlus, LucideSmartphone, LucideMonitor, LucideDownload, LucideSave, LucideCheck, LucideX, LucideMenu, LucideZap, LucideShield, LucideGlobe, LucideChevronRight } from 'lucide-react';

// --- Configuration & Constants ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Your web app's Firebase configuration
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

// SWITCHED BACK TO GEMINI 2.5 FLASH PREVIEW
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

// --- AI System Prompt ---
const SYSTEM_PROMPT = `
You are an elite Frontend Architect. Your job is to build production-grade, single-file HTML/JS/CSS websites.
Rules:
1. Output ONLY valid HTML. Start with <!DOCTYPE html>.
2. Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>.
3. Use FontAwesome for icons: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />.
4. The design must be "Aikido-level" clean: heavy use of whitespace, subtle borders, modern typography (Inter), and consistent color palettes.
5. Make it fully responsive.
6. NO Markdown code blocks. Just the raw HTML string.
`;

// --- Utility: API Backoff ---
const withBackoff = async (fn, maxRetries = 3) => {
    let attempt = 0;
    while (attempt < maxRetries) {
        try { return await fn(); }
        catch (error) {
            if (attempt === maxRetries - 1) throw error;
            await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
            attempt++;
        }
    }
};

// --- Component: Navigation Sidebar (Dashboard) ---
const Sidebar = ({ view, setView, user, handleSignOut }) => (
    <div className="w-64 bg-gray-900 text-gray-300 flex flex-col border-r border-gray-800 h-screen fixed left-0 top-0 z-20 hidden md:flex">
        <div className="p-6 flex items-center space-x-3 text-white font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <LucideZap size={20} className="text-white" />
            </div>
            <span>WebForge<span className="text-indigo-500">.ai</span></span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
            <SidebarItem icon={<LucideLayoutDashboard size={20}/>} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
            <SidebarItem icon={<LucideCode size={20}/>} label="Editor" active={view === 'editor'} onClick={() => setView('editor')} />
            <SidebarItem icon={<LucideGlobe size={20}/>} label="Deployments" active={view === 'deployments'} onClick={() => setView('deployments')} />
            <div className="pt-6 mt-6 border-t border-gray-800">
                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Settings</p>
                <SidebarItem icon={<LucideSettings size={20}/>} label="Account & Billing" active={view === 'settings'} onClick={() => setView('settings')} />
            </div>
        </nav>

        <div className="p-4 border-t border-gray-800">
            <div className="flex items-center mb-4 px-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                    {user?.uid?.slice(0, 2).toUpperCase() || 'US'}
                </div>
                <div className="ml-3 overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">User {user?.uid?.slice(0, 4)}</p>
                    <p className="text-xs text-gray-500 truncate">Free Plan</p>
                </div>
            </div>
            <button onClick={handleSignOut} className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-400 bg-red-400/10 rounded-lg hover:bg-red-400/20 transition-colors">
                <LucideLogOut size={16} className="mr-2" /> Sign Out
            </button>
        </div>
    </div>
);

const SidebarItem = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
            active 
            ? 'bg-indigo-600/10 text-indigo-400' 
            : 'hover:bg-gray-800 text-gray-400 hover:text-white'
        }`}
    >
        {icon}
        <span className="ml-3">{label}</span>
    </button>
);

// --- Component: Marketing / Landing Page ---
const LandingPage = ({ onLogin }) => (
    <div className="min-h-screen bg-white font-sans text-gray-900">
        {/* Navbar */}
        <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <LucideZap size={20} className="text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">WebForge<span className="text-indigo-600">.ai</span></span>
                    </div>
                    <div className="hidden md:flex space-x-8 text-sm font-medium text-gray-500">
                        <a href="#features" className="hover:text-gray-900">Features</a>
                        <a href="#pricing" className="hover:text-gray-900">Pricing</a>
                        <a href="#" className="hover:text-gray-900">Showcase</a>
                    </div>
                    <button onClick={onLogin} className="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-full text-sm font-medium transition-all transform hover:scale-105">
                        Get Started
                    </button>
                </div>
            </div>
        </nav>

        {/* Hero Section */}
        <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-8">
                Build SaaS Products <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">at the Speed of Thought</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 mb-10">
                Describe your dream application in plain English. Our AI architect builds the frontend, styles it, and prepares it for launch in seconds.
            </p>
            <div className="flex justify-center gap-4">
                <button onClick={onLogin} className="px-8 py-4 bg-indigo-600 text-white text-lg font-bold rounded-full shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all">
                    Start Building Free
                </button>
                <button className="px-8 py-4 bg-white text-gray-700 border border-gray-200 text-lg font-bold rounded-full hover:bg-gray-50 transition-all">
                    View Demo
                </button>
            </div>
            {/* Abstract Dashboard Preview */}
            <div className="mt-16 relative mx-auto max-w-5xl">
                <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-2 overflow-hidden transform rotate-1 hover:rotate-0 transition-all duration-700">
                    <div className="bg-gray-800 rounded-xl h-64 md:h-96 flex items-center justify-center text-gray-600">
                        <span className="text-lg font-mono">Interactive Builder Preview</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900">Everything you need to ship</h2>
                    <p className="text-gray-500 mt-2">We handle the complexity. You handle the vision.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { icon: <LucideZap size={24} />, title: "Instant Generation", desc: "Turn prompts into production-ready React & Tailwind code instantly." },
                        { icon: <LucideCode size={24} />, title: "Clean Code Export", desc: "Download human-readable, maintainable code. No vendor lock-in." },
                        { icon: <LucideShield size={24} />, title: "Enterprise Security", desc: "Built on top of Google Cloud & Firebase security infrastructure." }
                    ].map((f, i) => (
                        <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6">{f.icon}</div>
                            <h3 className="text-xl font-bold mb-3 text-gray-900">{f.title}</h3>
                            <p className="text-gray-500 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// --- Component: Project Card ---
const ProjectCard = ({ project, onDelete, onLoad }) => (
    <div onClick={() => onLoad(project)} className="group bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-md flex flex-col justify-between h-48">
        <div>
            <div className="flex justify-between items-start mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                    <LucideLayoutDashboard size={20} />
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                    className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                >
                    <LucideX size={16} />
                </button>
            </div>
            <h3 className="font-bold text-gray-900 line-clamp-1">{project.name || "Untitled Project"}</h3>
            <p className="text-xs text-gray-500 mt-1">{new Date(project.createdAt?.seconds * 1000).toLocaleDateString()}</p>
        </div>
        <div className="mt-4">
            <p className="text-sm text-gray-500 line-clamp-2 text-ellipsis h-10 leading-relaxed">
                {project.prompt}
            </p>
        </div>
    </div>
);

// --- Component: Editor View ---
const Editor = ({ project, onSave, onBack }) => {
    const [html, setHtml] = useState(project?.html || '');
    const [prompt, setPrompt] = useState(project?.prompt || '');
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('desktop');
    const [generated, setGenerated] = useState(false);

    const generate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
                })
            });
            const data = await res.json();
            const newHtml = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (newHtml) {
                setHtml(newHtml);
                setGenerated(true);
            }
        } catch (e) {
            console.error(e);
            alert("Generation failed. Check console.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        onSave(project?.id, { html, prompt, name: prompt.slice(0, 30) });
        setGenerated(false);
    };

    const downloadCode = () => {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'index.html';
        a.click();
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Toolbar */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
                <div className="flex items-center space-x-4">
                    <button onClick={onBack} className="text-gray-500 hover:text-gray-900">
                        <LucideChevronRight className="transform rotate-180" size={20} />
                    </button>
                    <h2 className="font-bold text-gray-900 truncate max-w-xs">{project?.name || "New Project"}</h2>
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md font-mono">v1.0</span>
                </div>

                <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setViewMode('desktop')} className={`p-2 rounded-md ${viewMode === 'desktop' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>
                        <LucideMonitor size={18} />
                    </button>
                    <button onClick={() => setViewMode('mobile')} className={`p-2 rounded-md ${viewMode === 'mobile' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>
                        <LucideSmartphone size={18} />
                    </button>
                    <button onClick={() => setViewMode('code')} className={`p-2 rounded-md ${viewMode === 'code' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>
                        <LucideCode size={18} />
                    </button>
                </div>

                <div className="flex items-center space-x-3">
                    <button onClick={downloadCode} className="text-gray-500 hover:text-indigo-600 transition-colors">
                        <LucideDownload size={20} />
                    </button>
                    <button onClick={handleSave} disabled={!generated} className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-all ${generated ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400'}`}>
                        <LucideSave size={16} className="mr-2" /> Save
                    </button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Prompt / Input */}
                <div className="w-96 bg-white border-r border-gray-200 flex flex-col z-10 shadow-lg">
                    <div className="p-6 flex-1 flex flex-col">
                        <label className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Prompt Engineering</label>
                        <textarea 
                            className="flex-1 w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-sm leading-relaxed text-gray-700"
                            placeholder="Describe your website structure, style, and content..."
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                        />
                        <button 
                            onClick={generate} 
                            disabled={loading}
                            className="mt-4 w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:opacity-90 transition-all flex items-center justify-center"
                        >
                            {loading ? <LucideZap className="animate-spin mr-2" /> : <LucideZap className="mr-2" />}
                            {loading ? 'Architecting...' : 'Generate Build'}
                        </button>
                    </div>
                </div>

                {/* Right: Preview / Code */}
                <div className="flex-1 bg-gray-100 flex items-center justify-center p-8 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                    
                    {viewMode === 'code' ? (
                        <div className="w-full h-full bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-700 flex flex-col">
                            <div className="bg-gray-800 px-4 py-2 text-xs text-gray-400 font-mono border-b border-gray-700 flex items-center">
                                <div className="flex space-x-2 mr-4"><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-green-500"></div></div>
                                index.html
                            </div>
                            <textarea 
                                className="flex-1 bg-gray-900 text-green-400 font-mono p-6 text-sm resize-none outline-none"
                                value={html}
                                onChange={(e) => setHtml(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div className={`transition-all duration-500 ease-in-out shadow-2xl bg-white ${viewMode === 'mobile' ? 'w-[375px] h-[667px] rounded-3xl border-8 border-gray-800' : 'w-full h-full rounded-lg border border-gray-200'}`}>
                            {html ? (
                                <iframe srcDoc={html} title="preview" className="w-full h-full rounded-md bg-white" sandbox="allow-scripts" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                    <LucideLayoutDashboard size={48} className="mb-4 opacity-50" />
                                    <p>Ready to build. Enter a prompt.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [view, setView] = useState('landing');
    const [projects, setProjects] = useState([]);
    const [currentProject, setCurrentProject] = useState(null);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);

    // Init Firebase
    useEffect(() => {
        const app = initializeApp(firebaseConfig);
        setDb(getFirestore(app));
        setAuth(getAuth(app));
        const unsub = onAuthStateChanged(getAuth(app), (u) => {
            if (u) {
                setUser(u);
                if (view === 'landing') setView('dashboard');
            } else {
                setUser(null);
                setView('landing');
            }
        });
        return () => unsub();
    }, []);

    // Init Data Listener
    useEffect(() => {
        if (!user || !db) return;
        const q = query(collection(db, `artifacts/${appId}/users/${user.uid}/projects`), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snap) => {
            setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    }, [user, db]);

    const handleLogin = async () => {
        if (!auth) return;
        if (initialAuthToken) await signInWithCustomToken(auth, initialAuthToken);
        else await signInAnonymously(auth);
    };

    const handleSignOut = async () => {
        if (auth) await signOut(auth);
    };

    const handleCreateProject = async () => {
        if (!user || !db) return;
        const docRef = await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/projects`), {
            name: 'Untitled Project',
            prompt: '',
            html: '',
            createdAt: serverTimestamp()
        });
        setCurrentProject({ id: docRef.id, name: 'Untitled Project', prompt: '', html: '' });
        setView('editor');
    };

    const handleDelete = async (id) => {
        if (confirm("Delete this project?")) {
            await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/projects`, id));
        }
    };

    const handleSaveProject = async (id, data) => {
        if (!id) return handleCreateProject();
        await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/projects`, id), {
            ...data,
            updatedAt: serverTimestamp()
        });
        setCurrentProject(prev => ({ ...prev, ...data }));
    };

    const openProject = (proj) => {
        setCurrentProject(proj);
        setView('editor');
    };

    if (!user && view === 'landing') return <LandingPage onLogin={handleLogin} />;
    
    if (view === 'editor') {
        return <Editor project={currentProject} onSave={handleSaveProject} onBack={() => setView('dashboard')} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            <Sidebar view={view} setView={setView} user={user} handleSignOut={handleSignOut} />
            
            <div className="flex-1 md:ml-64">
                <div className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center">
                    <span className="font-bold">WebForge</span>
                    <button onClick={handleSignOut}><LucideLogOut size={20}/></button>
                </div>

                <div className="p-8 max-w-7xl mx-auto">
                    {view === 'dashboard' && (
                        <>
                            <div className="flex justify-between items-end mb-8">
                                <div>
                                    <h1 className="text-3xl font-extrabold text-gray-900">Dashboard</h1>
                                    <p className="text-gray-500 mt-1">Manage your web properties and generation history.</p>
                                </div>
                                <button onClick={handleCreateProject} className="flex items-center bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
                                    <LucidePlus size={20} className="mr-2" /> New Project
                                </button>
                            </div>

                            {projects.length === 0 ? (
                                <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
                                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <LucideLayoutDashboard size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">No projects yet</h3>
                                    <p className="text-gray-500 mb-8 max-w-md mx-auto">Start your first AI-powered build today. It takes less than a minute to go from idea to deployed code.</p>
                                    <button onClick={handleCreateProject} className="text-indigo-600 font-bold hover:underline">Create your first project &rarr;</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {projects.map(p => (
                                        <ProjectCard key={p.id} project={p} onDelete={handleDelete} onLoad={openProject} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {view === 'settings' && (
                        <div className="max-w-3xl">
                            <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Account Settings</h1>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-900">Profile Information</h3>
                                    <p className="text-gray-500 text-sm mt-1">Update your account details and public profile.</p>
                                    <div className="mt-6 grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">User ID</label>
                                            <input disabled value={user.uid} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-500 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Plan</label>
                                            <div className="flex items-center">
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded uppercase">Free Tier</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-gray-900">Pro Plan</h4>
                                            <p className="text-sm text-gray-500">Unlimited generations, custom domains, and export to React.</p>
                                        </div>
                                        <button className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow-sm hover:bg-indigo-700">Upgrade - $29/mo</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}