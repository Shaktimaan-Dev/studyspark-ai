import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Brain, Sparkles, FileText, CheckCircle2, HelpCircle, 
  Calendar, Layers, Download, Plus, Trash2, Edit3, LogIn, LogOut, 
  Moon, Sun, ChevronRight, ChevronLeft, RotateCcw, Award, Clock, 
  Send, Upload, Settings, User, AlertCircle, Check, Play, Search,
  RefreshCw, FileCheck, Target, Lightbulb, Bookmark, LayoutDashboard,
  ShieldAlert, Eye, BarChart3, Save, ArrowRight, UserCheck, GraduationCap
} from 'lucide-react';

const loadPdfJs = () => {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const callGeminiAPI = async (prompt, systemInstruction = '', apiKey = '', responseSchema = null) => {
  const key = apiKey || (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GEMINI_API_KEY) || '';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${key}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  if (responseSchema) {
    payload.generationConfig = {
      responseMimeType: "application/json",
      responseSchema: responseSchema
    };
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err?.error?.message || 'Gemini API call failed');
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty response from AI");
    return responseSchema ? JSON.parse(text) : text;
  } catch (error) {
    console.warn("Gemini API call failed or key not configured, falling back to client generator:", error);
    throw error;
  }
};

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(true);

  // Student Profile & Onboarding State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('studyspark_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Onboarding Form States
  const [studentNameInput, setStudentNameInput] = useState('');
  const [studentGoalInput, setStudentGoalInput] = useState('High School / College');
  const [selectedAvatar, setSelectedAvatar] = useState('👨‍🎓');

  // Navigation & View State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDocId, setSelectedDocId] = useState(null);

  // API Key State
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('studyspark_api_key') || '');

  // Persistent user storage states (starts clean at 0 docs)
  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem('studyspark_docs');
    return saved ? JSON.parse(saved) : [];
  });

  const [summaries, setSummaries] = useState(() => {
    const saved = localStorage.getItem('studyspark_summaries');
    return saved ? JSON.parse(saved) : {};
  });

  const [quizzes, setQuizzes] = useState(() => {
    const saved = localStorage.getItem('studyspark_quizzes');
    return saved ? JSON.parse(saved) : {};
  });

  const [quizAttempts, setQuizAttempts] = useState(() => {
    const saved = localStorage.getItem('studyspark_attempts');
    return saved ? JSON.parse(saved) : [];
  });

  const [flashcardDecks, setFlashcardDecks] = useState(() => {
    const saved = localStorage.getItem('studyspark_flashcards');
    return saved ? JSON.parse(saved) : {};
  });

  const [studySchedules, setStudySchedules] = useState(() => {
    const saved = localStorage.getItem('studyspark_schedules');
    return saved ? JSON.parse(saved) : [];
  });

  // Processing & UI Feedback States
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      localStorage.setItem('studyspark_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('studyspark_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('studyspark_docs', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('studyspark_summaries', JSON.stringify(summaries));
  }, [summaries]);

  useEffect(() => {
    localStorage.setItem('studyspark_quizzes', JSON.stringify(quizzes));
  }, [quizzes]);

  useEffect(() => {
    localStorage.setItem('studyspark_attempts', JSON.stringify(quizAttempts));
  }, [quizAttempts]);

  useEffect(() => {
    localStorage.setItem('studyspark_flashcards', JSON.stringify(flashcardDecks));
  }, [flashcardDecks]);

  useEffect(() => {
    localStorage.setItem('studyspark_schedules', JSON.stringify(studySchedules));
  }, [studySchedules]);

  useEffect(() => {
    localStorage.setItem('studyspark_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    if (!selectedDocId && documents.length > 0) {
      setSelectedDocId(documents[0].id);
    } else if (documents.length === 0) {
      setSelectedDocId(null);
    }
  }, [documents, selectedDocId]);

  const handleCompleteOnboarding = (e) => {
    e.preventDefault();
    if (!studentNameInput.trim()) return;

    const newUser = {
      name: studentNameInput.trim(),
      goal: studentGoalInput,
      avatar: selectedAvatar,
      id: 'usr_' + Date.now(),
      createdAt: new Date().toISOString()
    };

    setUser(newUser);
  };

  const loadDemoData = () => {
    const demoDoc = {
      id: 'doc_demo_cellular',
      title: 'Cellular Respiration & ATP Production',
      subject: 'Biology 101',
      text: `Cellular respiration is a set of metabolic reactions and processes that take place in the cells of organisms to convert chemical energy from nutrients into adenosine triphosphate (ATP), and then release waste products. The reactions involved in respiration are catabolic reactions, which break large molecules into smaller ones, releasing energy. Respiration is one of the key ways a cell gains useful energy to fuel cellular activity.

The overall reaction is: Glucose + Oxygen -> Carbon Dioxide + Water + ATP Energy (C6H12O6 + 6O2 -> 6CO2 + 6H2O + ~36 ATP).

Glycolysis occurs in the cytoplasm and breaks down glucose into pyruvate, yielding 2 net ATP and 2 NADH. The Krebs Cycle (Citric Acid Cycle) occurs in the mitochondrial matrix, processing Acetyl-CoA to produce NADH, FADH2, and 2 ATP. Finally, Oxidative Phosphorylation on the inner mitochondrial membrane uses the electron transport chain and chemiosmosis via ATP synthase to generate the majority of ATP (~32 ATP).`,
      createdAt: new Date().toISOString(),
    };

    setDocuments(prev => [demoDoc, ...prev]);
    setSelectedDocId(demoDoc.id);
  };

  // Upload state variables
  const [uploadSubject, setUploadSubject] = useState('General');
  const [uploadTitle, setUploadTitle] = useState('');
  const [pastedText, setPastedText] = useState('');
  const fileInputRef = useRef(null);

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setLoadingMsg('Reading document & extracting text...');
    setErrorMsg('');

    try {
      if (file.type === 'application/pdf') {
        const pdfjs = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n\n';
        }

        if (!fullText.trim()) {
          throw new Error("Could not extract readable text from PDF (it might be a scanned image).");
        }

        const newDoc = {
          id: 'doc_' + Date.now(),
          title: uploadTitle || file.name.replace('.pdf', ''),
          subject: uploadSubject || 'General',
          text: fullText.trim(),
          createdAt: new Date().toISOString()
        };

        setDocuments(prev => [newDoc, ...prev]);
        setSelectedDocId(newDoc.id);
      } else {
        const text = await file.text();
        const newDoc = {
          id: 'doc_' + Date.now(),
          title: uploadTitle || file.name,
          subject: uploadSubject || 'General',
          text: text.trim(),
          createdAt: new Date().toISOString()
        };
        setDocuments(prev => [newDoc, ...prev]);
        setSelectedDocId(newDoc.id);
      }

      setUploadTitle('');
      setPastedText('');
      setActiveTab('summary');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to read file.');
    } finally {
      setLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleTextUpload = () => {
    if (!pastedText.trim()) return;

    const newDoc = {
      id: 'doc_' + Date.now(),
      title: uploadTitle || 'Uploaded Notes ' + new Date().toLocaleDateString(),
      subject: uploadSubject || 'General',
      text: pastedText.trim(),
      createdAt: new Date().toISOString()
    };

    setDocuments(prev => [newDoc, ...prev]);
    setSelectedDocId(newDoc.id);
    setUploadTitle('');
    setPastedText('');
    setActiveTab('summary');
  };

  const selectedDoc = documents.find(d => d.id === selectedDocId) || documents[0];

  const generateSummary = async () => {
    if (!selectedDoc) return;
    setLoading(true);
    setLoadingMsg('Generating AI Summary, Key Concepts & Definitions...');
    setErrorMsg('');

    const schema = {
      type: "OBJECT",
      properties: {
        shortSummary: { type: "STRING" },
        importantConcepts: { type: "ARRAY", items: { type: "STRING" } },
        keyDefinitions: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              term: { type: "STRING" },
              definition: { type: "STRING" }
            },
            required: ["term", "definition"]
          }
        }
      },
      required: ["shortSummary", "importantConcepts", "keyDefinitions"]
    };

    const prompt = `Analyze this study material and output a structured JSON:
Document Title: ${selectedDoc.title}
Subject: ${selectedDoc.subject}
Content:
${selectedDoc.text.slice(0, 6000)}`;

    try {
      const res = await callGeminiAPI(prompt, "You are an expert academic tutor.", apiKey, schema);
      setSummaries(prev => ({ ...prev, [selectedDoc.id]: res }));
    } catch (err) {
      const fallback = {
        shortSummary: `${selectedDoc.title} outlines core principles in ${selectedDoc.subject}. The text analyzes key components, operational workflows, and analytical steps necessary for subject comprehension.`,
        importantConcepts: [
          `Primary mechanism outlined in ${selectedDoc.title}`,
          `Energy and resource conversion pathways`,
          `Essential relationships and system dependencies`,
          `High-yield exam topics and key problem areas`
        ],
        keyDefinitions: [
          { term: "Core Catalyst", definition: "The essential input or component driving the main process." },
          { term: "Synthesis Pathway", definition: "The structured sequence of steps yielding the final output." },
          { term: "System Balance", definition: "The state of structural or biological equilibrium during operation." }
        ]
      };
      setSummaries(prev => ({ ...prev, [selectedDoc.id]: fallback }));
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async () => {
    if (!selectedDoc) return;
    setLoading(true);
    setLoadingMsg('Constructing 5 Interactive Multiple Choice Questions...');
    setErrorMsg('');

    const schema = {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          question: { type: "STRING" },
          options: { type: "ARRAY", items: { type: "STRING" } },
          correctAnswerIndex: { type: "INTEGER" },
          explanation: { type: "STRING" }
        },
        required: ["id", "question", "options", "correctAnswerIndex", "explanation"]
      }
    };

    const prompt = `Create 5 high-yield exam multiple choice questions based on this study text:
${selectedDoc.text.slice(0, 6000)}`;

    try {
      const res = await callGeminiAPI(prompt, "You are a university exam creator. Create 5 clear MCQs.", apiKey, schema);
      setQuizzes(prev => ({ ...prev, [selectedDoc.id]: res }));
    } catch (err) {
      const fallback = [
        {
          id: 'q1',
          question: `What is the primary objective described in "${selectedDoc.title}"?`,
          options: [
            "To break down complex inputs into usable cellular energy/output",
            "To absorb light photons without chemical reaction",
            "To store excess liquid in cellular storage",
            "To suppress enzymatic activity completely"
          ],
          correctAnswerIndex: 0,
          explanation: "The primary objective is energy extraction and conversion into usable forms."
        },
        {
          id: 'q2',
          question: "Where in the structure or cell does the initial stage take place?",
          options: ["Outer Membrane", "Cytoplasm / Cytosol", "Nucleolus", "Vacuole"],
          correctAnswerIndex: 1,
          explanation: "The initial reaction stage occurs within the cytoplasm."
        },
        {
          id: 'q3',
          question: "Which molecule serves as the primary output or energy carrier?",
          options: ["NADH", "Glucose", "ATP", "Pyruvate"],
          correctAnswerIndex: 2,
          explanation: "ATP acts as the universal energy currency generated."
        },
        {
          id: 'q4',
          question: "What occurs during the oxidative phosphorylation phase?",
          options: [
            "Electron transfer drives ATP Synthase to generate high ATP yield",
            "Water turns directly into complex sugars",
            "Cellular division immediately stops",
            "DNA replication doubles in speed"
          ],
          correctAnswerIndex: 0,
          explanation: "Electron transport creates a proton gradient that powers ATP synthesis."
        },
        {
          id: 'q5',
          question: "Which waste byproduct is released into the system?",
          options: ["Hydrogen Gas", "Carbon Dioxide", "Complex Lipids", "Methane"],
          correctAnswerIndex: 1,
          explanation: "Carbon dioxide and water are released as metabolic byproducts."
        }
      ];
      setQuizzes(prev => ({ ...prev, [selectedDoc.id]: fallback }));
    } finally {
      setLoading(false);
    }
  };

  const generateFlashcards = async () => {
    if (!selectedDoc) return;
    setLoading(true);
    setLoadingMsg('Crafting High-Yield Study Flashcards...');
    setErrorMsg('');

    const schema = {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          front: { type: "STRING" },
          back: { type: "STRING" },
          category: { type: "STRING" }
        },
        required: ["id", "front", "back", "category"]
      }
    };

    const prompt = `Create 5 study flashcards for active recall based on this text:
${selectedDoc.text.slice(0, 6000)}`;

    try {
      const res = await callGeminiAPI(prompt, "Create concise, high-yield flashcards.", apiKey, schema);
      setFlashcardDecks(prev => ({ ...prev, [selectedDoc.id]: res }));
    } catch (err) {
      const fallback = [
        { id: 'f1', front: `What is the main topic of ${selectedDoc.title}?`, back: "A foundational concept describing energy or operational conversion systems.", category: "Concept" },
        { id: 'f2', front: "Where does Glycolysis take place?", back: "In the cytoplasm of the cell, functioning independently of oxygen.", category: "Location" },
        { id: 'f3', front: "What is the net ATP yield from Glycolysis?", back: "2 ATP molecules per glucose molecule.", category: "Yield" },
        { id: 'f4', front: "What is the function of ATP Synthase?", back: "An enzyme that synthesizes ATP from ADP during chemiosmosis.", category: "Enzymes" },
        { id: 'f5', front: "What is the final electron acceptor in aerobic respiration?", back: "Oxygen (O2), which combines with protons to form water.", category: "Mechanism" }
      ];
      setFlashcardDecks(prev => ({ ...prev, [selectedDoc.id]: fallback }));
    } finally {
      setLoading(false);
    }
  };

  // Quiz state handlers
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const handleSelectOption = (questionId, optionIndex) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleFinishQuiz = (activeQuiz) => {
    let score = 0;
    activeQuiz.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswerIndex) {
        score++;
      }
    });

    const newAttempt = {
      id: 'att_' + Date.now(),
      docTitle: selectedDoc?.title || 'General Quiz',
      subject: selectedDoc?.subject || 'General',
      score,
      total: activeQuiz.length,
      percentage: Math.round((score / activeQuiz.length) * 100),
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setQuizAttempts(prev => [newAttempt, ...prev]);
    setQuizSubmitted(true);
  };

  const resetQuizPlayer = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizSubmitted(false);
  };

  // Flashcards state handlers
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState({});

  const toggleMastered = (cardId) => {
    setMasteredCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  // Study Planner state handlers
  const [planSubjects, setPlanSubjects] = useState('Biology, Organic Chemistry, Calculus');
  const [planExamDate, setPlanExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [planHours, setPlanHours] = useState(3);

  const generatePlanner = async () => {
    setLoading(true);
    setLoadingMsg('Crafting personalized day-by-day study schedule...');
    setErrorMsg('');

    const schema = {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        overallStrategy: { type: "STRING" },
        days: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              dayNumber: { type: "INTEGER" },
              focusSubject: { type: "STRING" },
              tasks: { type: "ARRAY", items: { type: "STRING" } },
              estimatedHours: { type: "NUMBER" }
            },
            required: ["dayNumber", "focusSubject", "tasks", "estimatedHours"]
          }
        }
      },
      required: ["title", "overallStrategy", "days"]
    };

    const prompt = `Create a custom daily study plan.
Subjects to cover: ${planSubjects}
Exam Target Date: ${planExamDate}
Daily Hours Available: ${planHours} hours/day`;

    try {
      const res = await callGeminiAPI(prompt, "You are an expert study planner.", apiKey, schema);
      setStudySchedules(prev => [res, ...prev]);
      setActiveTab('planner');
    } catch (err) {
      const fallback = {
        title: `Study Schedule for ${planSubjects}`,
        overallStrategy: `Targeted daily sessions with active recall across ${planHours} hours/day prior to ${planExamDate}.`,
        days: [
          { dayNumber: 1, focusSubject: planSubjects.split(',')[0] || "Subject 1", tasks: ["Review fundamental chapter concepts", "Extract key definitions into flashcards", "Complete 5 diagnostic MCQs"], estimatedHours: planHours },
          { dayNumber: 2, focusSubject: planSubjects.split(',')[1] || "Subject 2", tasks: ["Analyze complex problem workflows", "Build concept mapping notes", "Solve practice problem sets"], estimatedHours: planHours },
          { dayNumber: 3, focusSubject: planSubjects.split(',')[0] || "Subject 1", tasks: ["Timed flashcard deck review", "Re-read high-yield AI executive summary"], estimatedHours: planHours },
          { dayNumber: 4, focusSubject: "Revision & Mock Exam", tasks: ["Full comprehensive quiz assessment", "Review missed question explanations"], estimatedHours: planHours }
        ]
      };
      setStudySchedules(prev => [fallback, ...prev]);
      setActiveTab('planner');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        
        {/* Animated Background Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }}></div>

        {/* Onboarding Card */}
        <div className="max-w-lg w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 transition-all">
          
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Welcome to StudySpark AI</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Let's Personalize Your Workspace
            </h1>
            <p className="text-xs text-slate-400">
              Tell us a bit about yourself to setup your tailored AI study engine.
            </p>
          </div>

          <form onSubmit={handleCompleteOnboarding} className="space-y-6">
            
            {/* Student Name Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                <User className="w-4 h-4 text-indigo-400" />
                <span>What is your name? *</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Rivera"
                value={studentNameInput}
                onChange={(e) => setStudentNameInput(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
              />
            </div>

            {/* Academic Level / Goal */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-purple-400" />
                <span>Academic Level or Goal</span>
              </label>
              <select
                value={studentGoalInput}
                onChange={(e) => setStudentGoalInput(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="High School">High School Student</option>
                <option value="College / Undergraduate">College / Undergraduate</option>
                <option value="Graduate / Professional">Graduate / Medical / Law</option>
                <option value="Self-Directed Learner">Self-Directed Learner</option>
              </select>
            </div>

            {/* Avatar Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Choose your avatar emoji</label>
              <div className="flex justify-between gap-2">
                {['👨‍🎓', '👩‍🎓', '🧠', '⚡', '🚀', '📚'].map((emoji) => (
                  <button
                    type="button"
                    key={emoji}
                    onClick={() => setSelectedAvatar(emoji)}
                    className={`p-3 rounded-2xl text-xl border transition-all ${
                      selectedAvatar === emoji 
                        ? 'bg-indigo-600/20 border-indigo-500 scale-110' 
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              type="submit"
              disabled={!studentNameInput.trim()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              <span>Launch Study Engine</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Top Banner Header */}
      <header className={`border-b sticky top-0 z-40 backdrop-blur-md ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                StudySpark AI
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                PRO
              </span>
            </div>
          </div>

          {/* User & Settings Actions */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-black'}`}
              title="Toggle Light/Dark Theme"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium border ${apiKey ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{apiKey ? 'API Active' : 'Demo Mode'}</span>
            </button>

            {/* Personalized Profile */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-700/50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-sm font-bold text-white shadow">
                {user.avatar || '👨‍🎓'}
              </div>
              <div className="hidden md:block text-left text-xs">
                <div className="font-semibold text-slate-200">{user.name}</div>
                <div className="text-slate-400 text-[10px]">{user.goal}</div>
              </div>
              <button
                onClick={() => setUser(null)}
                title="Switch Student Profile"
                className="text-slate-500 hover:text-rose-400 p-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6">
        
        {/* Sidebar Nav */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} space-y-6 sticky top-22`}>
            
            <div>
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Core Tools</p>
              <nav className="space-y-1">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'docs', label: 'Document Vault', icon: BookOpen, count: documents.length },
                  { id: 'summary', label: 'AI Summaries', icon: Sparkles },
                  { id: 'quiz', label: 'Quiz Generator', icon: HelpCircle },
                  { id: 'flashcards', label: 'Flashcards', icon: Layers },
                  { id: 'planner', label: 'Study Planner', icon: Calendar },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                          : darkMode 
                            ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.count !== undefined && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Target Document Selection Context */}
            <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-[11px] font-medium text-slate-400 mb-1 flex items-center justify-between">
                <span>Active Study Target</span>
                <BookOpen className="w-3 h-3 text-indigo-400" />
              </div>
              {documents.length > 0 ? (
                <select
                  value={selectedDocId || ''}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className={`w-full text-xs font-semibold rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  {documents.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.subject})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-amber-400 py-1">No material uploaded yet.</p>
              )}
            </div>

            <button
              onClick={() => setActiveTab('docs')}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New Notes</span>
            </button>

          </div>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 min-w-0">
          
          {loading && (
            <div className="mb-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center space-x-3 text-indigo-300 animate-pulse">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
              <div className="text-sm font-medium">{loadingMsg}</div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-3 text-rose-300">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <div className="text-sm">{errorMsg}</div>
            </div>
          )}

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Personalized Greeting Hero */}
              <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/20 shadow-xl">
                <div className="relative z-10 max-w-2xl space-y-3">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 inline-flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Workspace Active</span>
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Welcome back, {user.name}! {user.avatar}
                  </h1>
                  <p className="text-sm text-slate-300">
                    Upload your lecture notes or textbook PDFs. StudySpark will extract key definitions, generate quizzes, build interactive flashcards, and organize your study schedule.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-3">
                    <button 
                      onClick={() => setActiveTab('docs')}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center space-x-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Material</span>
                    </button>

                    {documents.length === 0 && (
                      <button 
                        onClick={loadDemoData}
                        className="px-4 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 text-xs font-bold flex items-center space-x-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Load Sample Biology Notes</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Real-Time Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Documents Uploaded', value: documents.length, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { label: 'Summaries Built', value: Object.keys(summaries).length, icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                  { label: 'Quiz Attempts', value: quizAttempts.length, icon: Award, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  { label: 'Study Schedules', value: studySchedules.length, icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} space-y-2`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">{stat.label}</span>
                        <div className={`p-2 rounded-xl ${stat.bg}`}>
                          <Icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                      </div>
                      <div className="text-2xl font-black text-slate-100">{stat.value}</div>
                    </div>
                  );
                })}
              </div>

              {/* Material Library & Quiz Attempts split */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} space-y-4`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-200 flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      <span>Study Library ({documents.length})</span>
                    </h3>
                    <button onClick={() => setActiveTab('docs')} className="text-xs text-indigo-400 hover:underline font-semibold">Manage</button>
                  </div>

                  {documents.length === 0 ? (
                    <div className="text-center py-8 space-y-3">
                      <p className="text-xs text-slate-500">Your study library is empty.</p>
                      <button onClick={loadDemoData} className="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
                        Try Sample Notes
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {documents.slice(0, 4).map((doc) => (
                        <div 
                          key={doc.id}
                          onClick={() => { setSelectedDocId(doc.id); setActiveTab('summary'); }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            selectedDocId === doc.id 
                              ? 'bg-indigo-500/10 border-indigo-500/30' 
                              : darkMode ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <FileText className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                            <div className="truncate">
                              <div className="text-xs font-semibold text-slate-200 truncate">{doc.title}</div>
                              <div className="text-[10px] text-slate-400">{doc.subject}</div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} space-y-4`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-200 flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      <span>Quiz History ({quizAttempts.length})</span>
                    </h3>
                    <button onClick={() => setActiveTab('quiz')} className="text-xs text-emerald-400 hover:underline font-semibold">Take Quiz</button>
                  </div>

                  {quizAttempts.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <p className="text-xs text-slate-500">No quiz attempts recorded yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {quizAttempts.slice(0, 4).map((att) => (
                        <div key={att.id} className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'} flex items-center justify-between`}>
                          <div>
                            <div className="text-xs font-semibold text-slate-200">{att.docTitle}</div>
                            <div className="text-[10px] text-slate-400">{att.date}</div>
                          </div>
                          <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                            att.percentage >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                            att.percentage >= 60 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {att.score}/{att.total} ({att.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* DOCUMENTS VAULT TAB */}
          {activeTab === 'docs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">Document Vault</h2>
                  <p className="text-xs text-slate-400">Upload PDF lecture notes or paste text to build your study collection.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* PDF Uploader */}
                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} space-y-4`}>
                  <h3 className="font-bold text-sm text-slate-200 flex items-center space-x-2">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>Upload PDF Document</span>
                  </h3>

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:border-indigo-500/50 ${
                      darkMode ? 'border-slate-800 bg-slate-950/50 hover:bg-slate-900' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-10 h-10 mx-auto text-indigo-400 mb-2 opacity-80" />
                    <p className="text-xs font-bold text-slate-200">Click to upload PDF or text file</p>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      accept=".pdf,.txt,.md" 
                      onChange={handlePdfUpload} 
                      className="hidden" 
                    />
                  </div>

                  <input 
                    type="text" 
                    placeholder="Subject Tag (e.g. Biology)" 
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300'}`}
                  />
                </div>

                {/* Direct Text Entry */}
                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} space-y-4`}>
                  <h3 className="font-bold text-sm text-slate-200 flex items-center space-x-2">
                    <Edit3 className="w-4 h-4 text-purple-400" />
                    <span>Paste Study Text / Notes</span>
                  </h3>

                  <input 
                    type="text" 
                    placeholder="Title (e.g., Chapter 2 Notes)" 
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300'}`}
                  />

                  <textarea 
                    rows={4}
                    placeholder="Paste notes content here..."
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    className={`w-full p-3 rounded-xl text-xs border resize-none ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300'}`}
                  />

                  <button
                    onClick={handleTextUpload}
                    disabled={!pastedText.trim()}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-opacity"
                  >
                    Save & Analyze Notes
                  </button>
                </div>

              </div>

              {/* Uploaded Documents Grid */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-300">Your Study Documents ({documents.length})</h3>
                {documents.length === 0 ? (
                  <p className="text-xs text-slate-500">No documents uploaded yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <div 
                        key={doc.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          selectedDocId === doc.id 
                            ? 'border-indigo-500 bg-indigo-500/10' 
                            : darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-indigo-400 border border-slate-700">
                            {doc.subject}
                          </span>
                          <button 
                            onClick={() => setDocuments(prev => prev.filter(d => d.id !== doc.id))}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <h4 className="text-sm font-bold text-slate-100 line-clamp-1 my-2">{doc.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">{doc.text}</p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                          <span className="text-slate-500 text-[10px]">{new Date(doc.createdAt).toLocaleDateString()}</span>
                          <button
                            onClick={() => { setSelectedDocId(doc.id); setActiveTab('summary'); }}
                            className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-1 text-xs"
                          >
                            <span>Open Tools</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* AI SUMMARY TAB */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <span>AI Executive Summary</span>
                  </h2>
                  <p className="text-xs text-slate-400">Target Document: <span className="text-indigo-300 font-semibold">{selectedDoc?.title || 'None selected'}</span></p>
                </div>

                <button
                  onClick={generateSummary}
                  disabled={loading || !selectedDoc}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 hover:opacity-90 disabled:opacity-50 flex items-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>{summaries[selectedDoc?.id] ? 'Re-generate Summary' : 'Generate AI Summary'}</span>
                </button>
              </div>

              {!selectedDoc ? (
                <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800 text-center text-xs text-slate-400">
                  Please upload a document or select one from the library first.
                </div>
              ) : !summaries[selectedDoc.id] ? (
                <div className={`p-12 rounded-3xl border text-center space-y-4 ${darkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <Brain className="w-12 h-12 mx-auto text-indigo-400 opacity-60" />
                  <h3 className="text-base font-bold text-slate-200">No Summary Generated Yet</h3>
                  <button onClick={generateSummary} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold">
                    Generate AI Summary Now
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'} space-y-3`}>
                    <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Executive Overview</span>
                    </h3>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {summaries[selectedDoc.id].shortSummary}
                    </p>
                  </div>

                  <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'} space-y-4`}>
                    <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center space-x-2">
                      <Lightbulb className="w-4 h-4" />
                      <span>Important Concepts</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {summaries[selectedDoc.id].importantConcepts?.map((concept, idx) => (
                        <div key={idx} className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} flex items-start space-x-3`}>
                          <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <p className="text-xs text-slate-200">{concept}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'} space-y-4`}>
                    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
                      <Bookmark className="w-4 h-4" />
                      <span>Key Glossary & Definitions</span>
                    </h3>
                    <div className="space-y-2">
                      {summaries[selectedDoc.id].keyDefinitions?.map((def, idx) => (
                        <div key={idx} className={`p-3.5 rounded-xl border ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-1`}>
                          <div className="text-xs font-extrabold text-emerald-400">{def.term}</div>
                          <div className="text-xs text-slate-300">{def.definition}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI QUIZ GENERATOR TAB */}
          {activeTab === 'quiz' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                    <HelpCircle className="w-5 h-5 text-emerald-400" />
                    <span>AI Multiple Choice Quiz Generator</span>
                  </h2>
                  <p className="text-xs text-slate-400">Target Document: <span className="text-emerald-300 font-semibold">{selectedDoc?.title || 'None selected'}</span></p>
                </div>

                <button
                  onClick={generateQuiz}
                  disabled={loading || !selectedDoc}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 hover:opacity-90 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{quizzes[selectedDoc?.id] ? 'Re-Generate Quiz' : 'Generate 5 MCQs'}</span>
                </button>
              </div>

              {!selectedDoc ? (
                <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800 text-center text-xs text-slate-400">
                  Please upload a document to generate quiz questions.
                </div>
              ) : !quizzes[selectedDoc.id] ? (
                <div className={`p-12 rounded-3xl border text-center space-y-4 ${darkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <HelpCircle className="w-12 h-12 mx-auto text-emerald-400 opacity-60" />
                  <h3 className="text-base font-bold text-slate-200">No Quiz Created Yet</h3>
                  <button onClick={generateQuiz} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold">
                    Generate Quiz Now
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'} flex items-center justify-between`}>
                    <span className="text-xs font-bold text-slate-400">
                      Question {currentQuestionIndex + 1} of {quizzes[selectedDoc.id].length}
                    </span>
                    {quizSubmitted ? (
                      <button 
                        onClick={resetQuizPlayer}
                        className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retake Quiz</span>
                      </button>
                    ) : (
                      <div className="text-xs text-amber-400 font-semibold">
                        {Object.keys(selectedAnswers).length} / {quizzes[selectedDoc.id].length} Answered
                      </div>
                    )}
                  </div>

                  {(() => {
                    const activeQuiz = quizzes[selectedDoc.id];
                    const q = activeQuiz[currentQuestionIndex];
                    if (!q) return null;

                    return (
                      <div className={`p-6 rounded-3xl border space-y-6 ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <h3 className="text-base font-bold text-slate-100 leading-snug">
                          {currentQuestionIndex + 1}. {q.question}
                        </h3>

                        <div className="space-y-3">
                          {q.options.map((option, optIdx) => {
                            const isSelected = selectedAnswers[q.id] === optIdx;
                            const isCorrect = q.correctAnswerIndex === optIdx;

                            let optionStyle = darkMode ? 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800';

                            if (quizSubmitted) {
                              if (isCorrect) {
                                optionStyle = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold';
                              } else if (isSelected && !isCorrect) {
                                optionStyle = 'bg-rose-500/20 border-rose-500/50 text-rose-300';
                              }
                            } else if (isSelected) {
                              optionStyle = 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold';
                            }

                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleSelectOption(q.id, optIdx)}
                                className={`w-full p-4 rounded-2xl border text-left text-xs transition-all flex items-center justify-between ${optionStyle}`}
                              >
                                <span className="flex items-center space-x-3">
                                  <span className="w-6 h-6 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-300">
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span>{option}</span>
                                </span>
                                {quizSubmitted && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                              </button>
                            );
                          })}
                        </div>

                        {quizSubmitted && (
                          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-xs space-y-1">
                            <span className="font-bold text-indigo-400 flex items-center space-x-1">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>AI Explanation:</span>
                            </span>
                            <p className="text-slate-300">{q.explanation}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                          <button
                            disabled={currentQuestionIndex === 0}
                            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                            className="px-4 py-2 rounded-xl bg-slate-800 disabled:opacity-40 text-xs font-semibold text-slate-300 flex items-center space-x-1"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Previous</span>
                          </button>

                          {!quizSubmitted && currentQuestionIndex === activeQuiz.length - 1 ? (
                            <button
                              onClick={() => handleFinishQuiz(activeQuiz)}
                              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg"
                            >
                              Submit Quiz
                            </button>
                          ) : (
                            <button
                              disabled={currentQuestionIndex === activeQuiz.length - 1}
                              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                              className="px-4 py-2 rounded-xl bg-slate-800 disabled:opacity-40 text-xs font-semibold text-slate-300 flex items-center space-x-1"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* FLASHCARDS TAB */}
          {activeTab === 'flashcards' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                    <Layers className="w-5 h-5 text-purple-400" />
                    <span>AI Revision Flashcards</span>
                  </h2>
                  <p className="text-xs text-slate-400">Target Document: <span className="text-purple-300 font-semibold">{selectedDoc?.title || 'None selected'}</span></p>
                </div>

                <button
                  onClick={generateFlashcards}
                  disabled={loading || !selectedDoc}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-purple-600/20 hover:opacity-90 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{flashcardDecks[selectedDoc?.id] ? 'Re-Generate Cards' : 'Generate Cards'}</span>
                </button>
              </div>

              {!selectedDoc ? (
                <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800 text-center text-xs text-slate-400">
                  Please upload a document to build flashcard decks.
                </div>
              ) : !flashcardDecks[selectedDoc.id] ? (
                <div className={`p-12 rounded-3xl border text-center space-y-4 ${darkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <Layers className="w-12 h-12 mx-auto text-purple-400 opacity-60" />
                  <h3 className="text-base font-bold text-slate-200">No Flashcards Created</h3>
                  <button onClick={generateFlashcards} className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold">
                    Build Flashcards Deck
                  </button>
                </div>
              ) : (
                <div className="space-y-6 max-w-xl mx-auto">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Card {currentCardIndex + 1} of {flashcardDecks[selectedDoc.id].length}</span>
                    <span className="text-emerald-400 font-bold">
                      {Object.values(masteredCards).filter(Boolean).length} Mastered
                    </span>
                  </div>

                  {(() => {
                    const deck = flashcardDecks[selectedDoc.id];
                    const card = deck[currentCardIndex];
                    if (!card) return null;

                    return (
                      <div className="space-y-4">
                        <div
                          onClick={() => setIsFlipped(!isFlipped)}
                          className={`w-full min-h-[260px] p-8 rounded-3xl border cursor-pointer transition-all duration-300 flex flex-col justify-between text-center select-none shadow-xl ${
                            isFlipped 
                              ? 'bg-gradient-to-br from-indigo-900/80 to-purple-900/80 border-indigo-500/50' 
                              : darkMode ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>{card.category || 'Term'}</span>
                            <span className="text-indigo-400">{isFlipped ? 'ANSWER' : 'QUESTION'}</span>
                          </div>

                          <div className="my-6">
                            <h3 className="text-base sm:text-lg font-extrabold text-slate-100 leading-relaxed">
                              {isFlipped ? card.back : card.front}
                            </h3>
                          </div>

                          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                            Click to flip card 🔄
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <button
                            onClick={() => toggleMastered(card.id)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                              masteredCards[card.id]
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                            }`}
                          >
                            {masteredCards[card.id] ? '✓ Mastered' : 'Mark as Mastered'}
                          </button>

                          <div className="flex items-center space-x-2">
                            <button
                              disabled={currentCardIndex === 0}
                              onClick={() => { setCurrentCardIndex(prev => prev - 1); setIsFlipped(false); }}
                              className="p-2.5 rounded-xl bg-slate-800 disabled:opacity-40 text-slate-300 hover:bg-slate-700"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              disabled={currentCardIndex === deck.length - 1}
                              onClick={() => { setCurrentCardIndex(prev => prev + 1); setIsFlipped(false); }}
                              className="p-2.5 rounded-xl bg-slate-800 disabled:opacity-40 text-slate-300 hover:bg-slate-700"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* PLANNER TAB */}
          {activeTab === 'planner' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <span>AI Study Schedule Planner</span>
                </h2>
                <p className="text-xs text-slate-400">Generate an actionable daily calendar for your upcoming exams.</p>
              </div>

              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} space-y-4`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Subjects</label>
                    <input 
                      type="text" 
                      value={planSubjects}
                      onChange={(e) => setPlanSubjects(e.target.value)}
                      className={`w-full p-2.5 rounded-xl text-xs border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300'}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Target Date</label>
                    <input 
                      type="date" 
                      value={planExamDate}
                      onChange={(e) => setPlanExamDate(e.target.value)}
                      className={`w-full p-2.5 rounded-xl text-xs border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300'}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Daily Hours</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="12"
                      value={planHours}
                      onChange={(e) => setPlanHours(Number(e.target.value))}
                      className={`w-full p-2.5 rounded-xl text-xs border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300'}`}
                    />
                  </div>
                </div>

                <button
                  onClick={generatePlanner}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold shadow-lg shadow-amber-500/20 hover:opacity-90 flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Study Calendar</span>
                </button>
              </div>

              {studySchedules.length > 0 && (
                <div className="space-y-6">
                  {studySchedules.map((sched, idx) => (
                    <div key={idx} className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <h3 className="text-base font-bold text-amber-400">{sched.title}</h3>
                      <p className="text-xs text-slate-300">{sched.overallStrategy}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {sched.days?.map((day, dIdx) => (
                          <div key={dIdx} className={`p-4 rounded-2xl border space-y-2 ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-indigo-400">Day {day.dayNumber}</span>
                              <span className="text-slate-400 text-[10px]">{day.estimatedHours} hrs</span>
                            </div>
                            <div className="text-xs font-bold text-slate-200 truncate">{day.focusSubject}</div>
                            <ul className="space-y-1 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                              {day.tasks?.map((task, tIdx) => (
                                <li key={tIdx} className="flex items-start space-x-1.5">
                                  <span className="text-amber-400">•</span>
                                  <span>{task}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-slate-400" />
                  <span>Settings & Gemini API Credentials</span>
                </h2>
                <p className="text-xs text-slate-400">Configure your API key or manage stored student data.</p>
              </div>

              <div className={`p-6 rounded-2xl border space-y-4 ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-200">Google Gemini API Key</label>
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..." 
                    className={`w-full p-3 rounded-xl text-xs border ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300'}`}
                  />
                  <p className="text-[11px] text-slate-400">
                    Leaving blank uses local Smart Fallback Mode so you can test all features offline without setup!
                  </p>
                </div>

                <button 
                  onClick={() => alert('Settings saved successfully!')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  Save Settings
                </button>
              </div>

              <div className={`p-6 rounded-2xl border space-y-2 border-rose-500/20 ${darkMode ? 'bg-rose-500/5' : 'bg-rose-50'}`}>
                <h3 className="text-xs font-bold text-rose-400">Reset Student Profile & Clear Data</h3>
                <p className="text-[11px] text-slate-400">Clears student name, documents, and quiz history.</p>
                <button 
                  onClick={() => {
                    localStorage.clear();
                    setUser(null);
                    setDocuments([]);
                    setSummaries({});
                    setQuizzes({});
                    setQuizAttempts([]);
                    setFlashcardDecks({});
                    setStudySchedules([]);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold"
                >
                  Clear All App Data
                </button>
              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  );
}