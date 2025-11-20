import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAdminRole } from '@/lib/adminAuth';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Admin route guard that verifies admin role before rendering content
 * Prevents any admin UI from being visible during verification
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const hasAdminRole = await checkAdminRole();
        
        if (!hasAdminRole) {
          navigate('/admin/login', { replace: true });
          return;
        }
        
        setIsAdmin(true);
      } catch (error) {
        console.error('Admin verification failed:', error);
        navigate('/admin/login', { replace: true });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAdmin();
  }, [navigate]);

  // Show loading screen during verification
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">در حال تایید دسترسی...</p>
        </div>
      </div>
    );
  }

  // Only render admin content after verification succeeds
  return isAdmin ? <>{children}</> : null;
}
