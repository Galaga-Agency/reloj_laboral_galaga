import { useEffect, useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

export const useUserRole = () => {
  const [role, setRole] = useState<"employee" | "official" | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useSupabaseClient();
  const user = useUser();

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        const { data, error } = await supabase
          .from("usuarios")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setRole(data.role || "employee");
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole("employee");
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user?.id, supabase]);

  return {
    role,
    loading,
    isEmployee: role === "employee",
    isOfficial: role === "official",
  };
};
