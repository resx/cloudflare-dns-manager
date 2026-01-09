import React, { useState } from 'react';
import { useAuth } from '../context/authContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { Button } from '../components/ui/button.jsx';
import ParticleBackground from '../components/animated/particle-background.jsx';
import BlurText from '../components/animated/blur-text.jsx';
import FadeIn from '../components/animated/fade-in.jsx';
import { KeyRound } from 'lucide-react';

const LoginForm = () => {
  const [loginKey, setLoginKey] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(loginKey);
      if (result.success) {
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (err) {
      toast.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <ParticleBackground />

      <FadeIn delay={0.2} className="w-full max-w-md">
        <Card className="backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">
              <BlurText text="DNS Manager" className="font-bold" />
            </CardTitle>
            <CardDescription className="text-base">
              Enter your login key to access the dashboard
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loginKey">Login Key</Label>
                <Input
                  id="loginKey"
                  name="loginKey"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Enter your login key"
                  value={loginKey}
                  onChange={(e) => setLoginKey(e.target.value)}
                  className="transition-all"
                />
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </FadeIn>
    </div>
  );
};

export default LoginForm;
