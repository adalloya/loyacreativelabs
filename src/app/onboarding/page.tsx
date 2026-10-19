// src/app/onboarding/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { OnboardingFlow } from './OnboardingFlow';

export default function OnboardingPage() {
  const router = useRouter();
  return (
    <OnboardingFlow
      onComplete={() => {
        router.push('/apex');
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            if (window.location.pathname !== '/apex') {
              window.location.href = '/apex';
            }
          }, 100);
        }
      }}
    />
  );
}
