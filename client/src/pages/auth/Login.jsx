import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles, Zap, CheckCircle2, Award, BookOpen, Layers } from 'lucide-react';
import Button from '../../components/Button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, getDashboardUrl } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email, password);
      showToast(`Welcome back, ${user.name}!`, 'success');
      navigate(getDashboardUrl(user.role));
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const populateRole = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6 lg:p-10 selection:bg-indigo-500/20 selection:text-indigo-900">
      {/* Main Split-Screen Container inspired by Colorlib 04 */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* LEFT COLUMN: Ultra-Premium Academic & AI Branding Banner */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#090d16] via-[#11162e] to-[#1a1844] p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden text-white border-r border-slate-800/40 selection:bg-indigo-500/30">
          {/* Subtle geometric glowing orbs */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* SECTION 1: Brand Identity & Active Engine Status */}
          <div className="relative z-10 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans text-white">
                  Pariksha
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/30 to-purple-500/30 text-indigo-300 border border-indigo-400/30 shadow-xs">
                  AI Suite
                </span>
              </div>
              <span className="inline-flex items-center space-x-1.5 text-[10px] font-mono text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Gemini 2.5 Active</span>
              </span>
            </div>
            
            <p className="text-xs text-indigo-200/80 font-medium leading-relaxed">
              Autonomous Examination Lifecycle, Question Bank Blueprints & Multimodal Neural Evaluation.
            </p>

            {/* Micro-Stats Ticker */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-center backdrop-blur-xs hover:bg-white/[0.07] transition-all">
                <span className="block font-mono font-bold text-sm text-indigo-300">100k+</span>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-medium">Copies Scanned</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-center backdrop-blur-xs hover:bg-white/[0.07] transition-all">
                <span className="block font-mono font-bold text-sm text-emerald-400">&lt; 1.2s</span>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-medium">Grading Speed</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-center backdrop-blur-xs hover:bg-white/[0.07] transition-all">
                <span className="block font-mono font-bold text-sm text-amber-300">99.8%</span>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-medium">Audit Accuracy</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: Interactive-looking Visual Mockup Card (Live AI Paper Evaluation) */}
          <div className="relative z-10 my-4 space-y-3">
            {/* Live Simulation Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.03] border border-white/15 backdrop-blur-md shadow-lg space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
                  <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                    Live Evaluation Engine
                  </span>
                </div>
                <span className="text-[9px] font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-400/30">
                  OCR Vision + Rubrics
                </span>
              </div>

              {/* Simulated Answer Sheet Snippet */}
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-mono">Q3. Quantum Entanglement (5 Marks)</span>
                  <span className="font-bold text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    4.5 / 5.0
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 font-serif italic bg-white/[0.02] p-1.5 rounded border-l-2 border-indigo-500">
                  &ldquo;Entangled state pairs demonstrate instantaneous correlation regardless of spatial separation...&rdquo;
                </p>
                <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5 font-mono">
                  <span className="text-emerald-300 flex items-center space-x-1">
                    <span>✓ Key Derivation Verified</span>
                  </span>
                  <span className="text-indigo-300 bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-500/30">
                    Confidence: 99.4%
                  </span>
                </div>
              </div>

              {/* Pipeline Step Indicators */}
              <div className="grid grid-cols-4 gap-1 text-[8px] font-mono text-center pt-0.5">
                <div className="py-1 px-1 rounded bg-slate-900/90 text-indigo-300 border border-indigo-500/30 font-semibold">
                  1. Scan
                </div>
                <div className="py-1 px-1 rounded bg-slate-900/90 text-indigo-300 border border-indigo-500/30 font-semibold">
                  2. OCR
                </div>
                <div className="py-1 px-1 rounded bg-slate-900/90 text-amber-300 border border-amber-500/30 font-semibold">
                  3. Rubrics
                </div>
                <div className="py-1 px-1 rounded bg-slate-900/90 text-emerald-300 border border-emerald-500/30 font-semibold">
                  4. Publish
                </div>
              </div>
            </div>

            {/* 4 Feature Value Pills Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5 hover:bg-white/[0.06] transition-all">
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Digital Canvas</span>
                </div>
                <p className="text-[9.5px] text-slate-400 leading-tight">
                  Handwriting remarks & stylus tools.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5 hover:bg-white/[0.06] transition-all">
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Role Security</span>
                </div>
                <p className="text-[9.5px] text-slate-400 leading-tight">
                  Admin, Setter & Evaluator isolation.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5 hover:bg-white/[0.06] transition-all">
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Auto Blueprints</span>
                </div>
                <p className="text-[9.5px] text-slate-400 leading-tight">
                  Bloom levels & 4 exam schemes.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-0.5 hover:bg-white/[0.06] transition-all">
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Audit Trails</span>
                </div>
                <p className="text-[9.5px] text-slate-400 leading-tight">
                  Cryptographic grade logs.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: Institutional Security & Compliance Footer */}
          <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center space-x-1.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Institutional Enterprise Grade</span>
            </span>
            <span className="font-mono text-[10px] text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-400/30">
              v2.5 Pro
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Modern Clean Login Form */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Header */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Sign In to Platform
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                Enter your authorized credentials to access your examination portal.
              </p>
            </div>

            {/* Quick Demo Role Selection Pills */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span>Quick Login (Demo Credentials)</span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => populateRole('admin@example.com', 'Admin@123')}
                  className="px-2.5 py-2 rounded-xl bg-white hover:bg-indigo-50 hover:border-indigo-300 text-[11px] font-semibold text-slate-700 hover:text-indigo-700 transition-all text-center border border-slate-200 active:scale-95 shadow-xs"
                >
                  🛡️ Admin
                </button>
                <button
                  type="button"
                  onClick={() => populateRole('setter@example.com', 'Setter@123')}
                  className="px-2.5 py-2 rounded-xl bg-white hover:bg-indigo-50 hover:border-indigo-300 text-[11px] font-semibold text-slate-700 hover:text-indigo-700 transition-all text-center border border-slate-200 active:scale-95 shadow-xs"
                >
                  ✍️ Setter
                </button>
                <button
                  type="button"
                  onClick={() => populateRole('evaluator@example.com', 'Evaluator@123')}
                  className="px-2.5 py-2 rounded-xl bg-white hover:bg-indigo-50 hover:border-indigo-300 text-[11px] font-semibold text-slate-700 hover:text-indigo-700 transition-all text-center border border-slate-200 active:scale-95 shadow-xs"
                >
                  🔍 Evaluator
                </button>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@university.edu"
                    className="w-full bg-slate-50/50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50/50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                icon={ArrowRight}
                className="w-full mt-2 font-bold py-3 text-sm shadow-md shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Authenticate & Access Terminal
              </Button>
            </form>

            {/* Footer Notice */}
            <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center space-x-2">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Protected by Role-Based Access Control</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
