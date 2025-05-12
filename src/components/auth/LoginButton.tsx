
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

const LoginButton = () => {
  const { signInWithGoogle } = useAuth();

  return (
    <Button 
      onClick={signInWithGoogle}
      className="flex items-center gap-2"
      variant="outline"
    >
      <LogIn className="h-4 w-4" />
      Sign in with Google
    </Button>
  );
};

export default LoginButton;
