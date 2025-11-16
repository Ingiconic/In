import { supabase } from "./supabase";

export const checkAndDeductCoins = async (amount: number): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("کاربر وارد نشده است");

    // Use atomic RPC function to prevent race conditions
    const { data: success, error } = await supabase.rpc('deduct_user_coins', {
      _amount: amount,
      _reason: 'tool_usage'
    });

    if (error) {
      console.error("Error deducting coins:", error);
      return false;
    }

    return success === true;
  } catch (error) {
    console.error("Error deducting coins:", error);
    return false;
  }
};

export const getUserCoins = async (): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data: profile } = await supabase
      .from("profiles")
      .select("coins")
      .eq("id", user.id)
      .single();

    return profile?.coins || 0;
  } catch (error) {
    console.error("Error getting user coins:", error);
    return 0;
  }
};
