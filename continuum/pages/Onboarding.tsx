
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { createInitialProfile } from '../services/geminiService';
import { Button, Card, Input, Textarea } from '../components/UI';
import { Logo } from '../components/Logo';
import { ArrowRight, Loader2, Sparkles, MapPin, User as UserIcon, LogOut } from 'lucide-react';

export const Onboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { user, updateUser, signOut } = useAuth();
  const { updateProfile, setRecommendations } = useStore();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    role: '',
    goals: '',
    interests: ''
  });

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      // Update auth context name immediately for UI responsiveness
      updateUser(formData.name);
      
      const { profile, recommendations } = await createInitialProfile(user.id, formData);
      
      // Batch updates
      updateProfile(profile);
      setRecommendations(recommendations);
      
      onComplete();
    } catch (e) {
      console.error("Onboarding failed", e);
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Building your Continuum...</h2>
        <p className="text-gray-500 mt-2">Generating personalized recommendations and initializing profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative">
      {/* Escape Hatch for trapped users */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8">
        <Button variant="ghost" onClick={signOut} icon={LogOut} className="text-gray-400 hover:text-gray-600">
          Sign Out
        </Button>
      </div>

      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex justify-center">
            <Logo className="w-16 h-16 shadow-lg rounded-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Continuum</h1>
          <p className="text-gray-500">Let's calibrate your intelligent memory.</p>
        </div>

        <Card className="p-8 shadow-lg">
          
          {/* Step 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
               <h2 className="text-lg font-semibold text-gray-900">First, the basics</h2>
               
               <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">What should we call you?</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    autoFocus
                    placeholder="Full Name"
                    className="pl-9"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Where are you based?</label>
                <p className="text-xs text-gray-500 mb-2">Helps with local recommendations (weather, events).</p>
                <div className="relative">
                   <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <Input 
                    placeholder="e.g. Seattle, WA or London, UK"
                    className="pl-9"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>

              <Button onClick={handleNext} disabled={!formData.name || !formData.location} className="w-full mt-4" icon={ArrowRight}>Next</Button>
            </div>
          )}

          {/* Step 2: Role */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-lg font-semibold text-gray-900">Your Context</h2>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">What do you do?</label>
                <p className="text-xs text-gray-500 mb-2">Role, Occupation, or Primary Focus</p>
                <Input 
                  autoFocus
                  placeholder="e.g. Product Designer, Student, Entrepreneur"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                />
              </div>
              <Button onClick={handleNext} disabled={!formData.role} className="w-full mt-4" icon={ArrowRight}>Next</Button>
            </div>
          )}

          {/* Step 3: Goals */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-lg font-semibold text-gray-900">Your Trajectory</h2>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">What are you working towards?</label>
                <p className="text-xs text-gray-500 mb-2">Current major goals or projects for the next 3 months.</p>
                <Textarea 
                  autoFocus
                  placeholder="e.g. Launching a SaaS, running a marathon, learning Spanish"
                  value={formData.goals}
                  onChange={e => setFormData({...formData, goals: e.target.value})}
                />
              </div>
               <Button onClick={handleNext} disabled={!formData.goals} className="w-full mt-4" icon={ArrowRight}>Next</Button>
            </div>
          )}

          {/* Step 4: Interests */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-lg font-semibold text-gray-900">Your Interests</h2>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">What fascinates you?</label>
                <p className="text-xs text-gray-500 mb-2">Hobbies, topics, or curiosities.</p>
                <Textarea 
                  autoFocus
                  placeholder="e.g. AI agents, mid-century modern furniture, hiking trails"
                  value={formData.interests}
                  onChange={e => setFormData({...formData, interests: e.target.value})}
                />
              </div>
               <Button onClick={handleNext} disabled={!formData.interests} className="w-full mt-4" icon={Sparkles}>Finish Setup</Button>
            </div>
          )}

          <div className="mt-8 flex justify-center gap-2">
            {[1,2,3,4].map(i => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? 'w-8 bg-gray-900' : step > i ? 'w-2 bg-gray-900' : 'w-2 bg-gray-200'}`} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
