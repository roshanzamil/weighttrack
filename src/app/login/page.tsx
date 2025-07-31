
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Anvil } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { login, signup } from './actions';


function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    
    const formData = new FormData(event.currentTarget);
    const result = await login(formData);

    if (result?.error) {
       toast({
        title: 'Error logging in',
        description: result.error,
        variant: 'destructive',
      });
    } else {
        router.push('/');
    }
    setLoading(false);
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
        />
      </div>
       <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Signing In...' : 'Sign In'}
      </Button>
    </form>
  )
}

function SignupForm() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    
    const formData = new FormData(event.currentTarget);
    const result = await signup(formData);

    if (result?.error) {
       toast({
        title: 'Error signing up',
        description: result.error,
        variant: 'destructive',
      });
    } else {
       toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account and sign in.',
      });
    }
    setLoading(false);
  };

  return (
     <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full-name">Full Name</Label>
        <Input
          id="full-name"
          name="full_name"
          type="text"
          placeholder="John Doe"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
        />
      </div>
       <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
         {loading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  )
}

export default function LoginPage() {
 
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="flex flex-col items-center gap-4 mb-8">
         <div className="bg-primary/10 p-3 rounded-full border-2 border-primary/30">
             <Anvil className="h-10 w-10 text-primary" />
         </div>
        <h1 className="text-3xl font-bold">Forge by Roshan</h1>
       </div>
      <Card className="w-full max-w-sm">
          <Tabs defaultValue="signin" className="w-full">
            <CardHeader>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
            </CardHeader>
            <CardContent>
                <TabsContent value="signin">
                    <LoginForm />
                </TabsContent>
                <TabsContent value="signup">
                    <SignupForm />
                </TabsContent>
            </CardContent>
          </Tabs>
      </Card>
    </div>
  );
}
