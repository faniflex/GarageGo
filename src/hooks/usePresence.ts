import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export const usePresence = (userId: string | null | undefined) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setOnline = async () => {
    if (!userId) return;
    await supabase
      .from("profiles")
      .update({ online_status: true, last_seen: new Date().toISOString() })
      .eq("user_id", userId);
  };

  const setOffline = async () => {
    if (!userId) return;
    await supabase
      .from("profiles")
      .update({ online_status: false, last_seen: new Date().toISOString() })
      .eq("user_id", userId);
  };

  useEffect(() => {
    if (!userId) return;

    setOnline();

    // Heartbeat every 30s
    intervalRef.current = setInterval(setOnline, 30_000);

    // On tab close / navigate away
    const handleBeforeUnload = () => { setOffline(); };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(intervalRef.current!);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      setOffline();
    };
  }, [userId]);
};
