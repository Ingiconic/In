import { supabase } from "@/lib/supabase";

export const checkAdminRole = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    // Check if user has admin role using the has_role function
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (error) {
      console.error('Error checking admin role:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in checkAdminRole:', error);
    return false;
  }
};
