import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles, Zap, CheckCircle2 } from 'lucide-react';
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
    <div className="min-h-screen bg-[#070b14] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-indigo-600/15 via-violet-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Central Login Card */}
      <div className="max-w-md w-full surface-card p-8 rounded-3xl border border-slate-800/90 shadow-2xl shadow-black/80 relative z-10 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-950/60 mb-3 ring-1 ring-white/20">
            <Zap className="w-6 h-6 fill-white text-white" />
          </div>

          <div className="flex items-center justify-center space-x-1.5">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Pariksha
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              AI
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
            AI-Powered Examination & Digital Evaluation Platform
          </p>
        </div>

        {/* Quick Demo Role Fillers */}
        <div className="mb-6 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <span>Quick Login (Demo Roles)</span>
            </span>
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => populateRole('admin@example.com', 'Admin@123')}
              className="px-2.5 py-2 rounded-xl bg-slate-850 hover:bg-indigo-600/20 hover:border-indigo-500/50 text-[11px] font-semibold text-slate-200 hover:text-white transition-all text-center border border-slate-800 active:scale-95 shadow-sm"
            >
              🛡️ Admin
            </button>
            <button
              type="button"
              onClick={() => populateRole('setter@example.com', 'Setter@123')}
              className="px-2.5 py-2 rounded-xl bg-slate-850 hover:bg-indigo-600/20 hover:border-indigo-500/50 text-[11px] font-semibold text-slate-200 hover:text-white transition-all text-center border border-slate-800 active:scale-95 shadow-sm"
            >
              ✍️ Setter
            </button>
            <button
              type="button"
              onClick={() => populateRole('evaluator@example.com', 'Evaluator@123')}
              className="px-2.5 py-2 rounded-xl bg-slate-850 hover:bg-indigo-600/20 hover:border-indigo-500/50 text-[11px] font-semibold text-slate-200 hover:text-white transition-all text-center border border-slate-800 active:scale-95 shadow-sm"
            >
              🔍 Evaluator
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            icon={ArrowRight}
            className="w-full mt-2 font-bold py-3 text-sm shadow-lg shadow-indigo-950/80"
          >
            Authenticate & Access Terminal
          </Button>
        </form>

        {/* Security & System Info Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center flex items-center justify-center space-x-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Role-Based Access Control • Audit Logged</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
