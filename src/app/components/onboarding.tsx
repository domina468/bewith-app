import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Users, Video, Heart } from 'lucide-react';
import { motion } from 'motion/react';

interface OnboardingProps {
  onComplete: (userData: { username: string; email: string }) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<'welcome' | 'signup'>('welcome');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  const handleSignup = (method: 'google' | 'apple' | 'email') => {
    if (method === 'email') {
      setStep('signup');
    } else {
      // Simulate OAuth login
      onComplete({
        username: method === 'google' ? 'User via Google' : 'User via Apple',
        email: `user@${method}.com`
      });
    }
  };

  const handleEmailSignup = () => {
    if (username && email) {
      onComplete({ username, email });
    }
  };

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] via-[#F5F5DC] to-[#E3F2FD] flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full text-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-8 inline-block bg-white rounded-full p-6 shadow-lg"
          >
            <Heart className="w-16 h-16 text-[#81C784]" fill="currentColor" />
          </motion.div>

          {/* App Name */}
          <h1 className="text-4xl mb-4 text-gray-800">BeWith</h1>
          <p className="text-lg text-gray-600 mb-12">
            Share time together. Stay connected while doing daily activities.
          </p>

          {/* Features */}
          <div className="space-y-4 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl p-4"
            >
              <div className="bg-[#81C784] rounded-full p-3">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-gray-800">Join themed rooms</p>
                <p className="text-sm text-gray-500">Study, work, or relax together</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl p-4"
            >
              <div className="bg-[#64B5F6] rounded-full p-3">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-gray-800">Audio or video calls</p>
                <p className="text-sm text-gray-500">Choose your comfort level</p>
              </div>
            </motion.div>
          </div>

          {/* Sign up buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => handleSignup('google')}
              className="w-full bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 h-12"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <Button
              onClick={() => handleSignup('apple')}
              className="w-full bg-black text-white hover:bg-gray-900 h-12"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Continue with Apple
            </Button>

            <Button
              onClick={() => handleSignup('email')}
              variant="outline"
              className="w-full h-12 border-2 border-[#81C784] text-[#81C784] hover:bg-[#81C784] hover:text-white"
            >
              Continue with Email
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] via-[#F5F5DC] to-[#E3F2FD] flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl mb-2 text-gray-800 text-center">Create your account</h2>
          <p className="text-sm text-gray-600 text-center mb-8">Join the BeWith community</p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="mt-1"
              />
            </div>

            <Button
              onClick={handleEmailSignup}
              className="w-full bg-[#81C784] hover:bg-[#66BB6A] text-white h-12 mt-6"
              disabled={!username || !email}
            >
              Get Started
            </Button>

            <Button
              onClick={() => setStep('welcome')}
              variant="ghost"
              className="w-full"
            >
              Back
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
