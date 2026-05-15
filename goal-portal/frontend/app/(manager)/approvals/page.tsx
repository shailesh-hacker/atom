'use client';

import { redirect } from 'next/navigation';

// The approvals view is consolidated into the team dashboard
export default function ApprovalsPage() {
  redirect('/team');
}
