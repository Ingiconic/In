import { supabase } from "./supabase";

export const checkAndDeductCoins = async (amount: number): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("کاربر وارد نشده است");

    // Get current coins
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("coins")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;
    
    if (!profile || profile.coins < amount) {
      return false;
    }

    // Deduct coins
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ coins: profile.coins - amount })
      .eq("id", user.id);

    if (updateError) throw updateError;

    // Log transaction
    await supabase.from("coin_transactions").insert({
      user_id: user.id,
      amount: -amount,
      reason: "tool_usage",
    });

    return true;
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
