import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { BookOpen, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative">
      <div className="max-w-md w-full surface-card p-8 rounded-2xl border border-slate-800 shadow-xl relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            Eval<span className="text-indigo-400 font-extrabold">Pro</span> Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise Examination Management & AI Evaluation Platform
          </p>
        </div>

        {/* Quick Demo Role Fillers */}
        <div className="mb-5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span>Quick Login Role Switcher</span>
            <Sparkles className="w-3 h-3 text-indigo-400" />
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => populateRole('admin@example.com', 'Admin@123')}
              className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-[11px] font-medium text-slate-300 hover:text-white transition-colors text-center border border-slate-700/40"
            >
              🛡️ Admin
            </button>
            <button
              type="button"
              onClick={() => populateRole('setter@example.com', 'Setter@123')}
              className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-[11px] font-medium text-slate-300 hover:text-white transition-colors text-center border border-slate-700/40"
            >
              ✍️ Setter
            </button>
            <button
              type="button"
              onClick={() => populateRole('evaluator@example.com', 'Evaluator@123')}
              className="px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-[11px] font-medium text-slate-300 hover:text-white transition-colors text-center border border-slate-700/40"
            >
              🔍 Evaluator
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            icon={ArrowRight}
            className="w-full mt-2"
          >
            Sign In to Portal
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted with JWT & Role-Based Access Controls</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
