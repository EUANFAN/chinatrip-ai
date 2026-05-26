"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { MeResponse } from "@/lib/api/types";

export function useCurrentUser() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  async function loadUser() {
    try {
      return await apiFetch<MeResponse>("/me");
    } catch {
      return null;
    }
  }

  const refreshUser = useCallback(async () => {
    setIsLoadingUser(true);

    const response = await loadUser();
    setMe(response);
    setIsLoadingUser(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialUser() {
      const response = await loadUser();

      if (!isMounted) {
        return;
      }

      setMe(response);
      setIsLoadingUser(false);
    }

    void loadInitialUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    me,
    user: me?.user ?? null,
    isLoadingUser,
    refreshUser,
  };
}
