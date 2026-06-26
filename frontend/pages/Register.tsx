import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { motion } from 'motion/react';

interface RegisterProps {
  onAuthSuccess?: (token: string, user: any) => void;
}

export const Register: React.FC<RegisterProps> = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background-dark">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md flex justify-center"
      >
        <SignUp
          signInUrl="/login"
          fallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-surface-dark border border-white/10 shadow-2xl rounded-[2.5rem] w-full max-w-md",
              headerTitle: "text-3xl font-bold text-white mb-2",
              headerSubtitle: "text-slate-400",
              socialButtonsBlockButton: "bg-background-dark border border-white/10 hover:bg-white/5 text-white",
              socialButtonsBlockButtonText: "text-white font-medium",
              dividerLine: "bg-white/10",
              dividerText: "text-slate-500",
              formFieldLabel: "text-xs font-semibold text-slate-400 ml-1",
              formFieldInput: "w-full bg-background-dark border border-white/5 rounded-2xl py-4 px-4 text-sm outline-none focus:border-primary/50 transition-colors text-white",
              formButtonPrimary: "w-full bg-primary text-background-dark font-bold py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20",
              footerActionText: "text-slate-400",
              footerActionLink: "text-primary font-semibold hover:underline"
            }
          }}
        />
      </motion.div>

      {/* Developer Credit */}
      <div className="mt-12 flex flex-col items-center justify-center gap-1 opacity-30">
        <p className="text-[8px] uppercase tracking-[0.2em] font-bold text-slate-500">Powered by WIZARD</p>
        <p className="text-[10px] font-bold text-primary tracking-widest">Wing</p>
      </div>
    </div>
  );
};
