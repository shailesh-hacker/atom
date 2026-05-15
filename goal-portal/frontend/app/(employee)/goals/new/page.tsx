import GoalForm from '@/components/goals/GoalForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewGoalPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Link href="/goals" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium transition-colors">
        <ArrowLeft size={18} />
        <span>Back to Goals</span>
      </Link>
      
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Set a New Objective</h1>
        <p className="text-slate-500 mt-2">Define your targets and weightage for this cycle.</p>
      </div>

      <GoalForm />
    </div>
  );
}
