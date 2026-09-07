"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AUTH_REDIRECT_PATH } from "@/lib/constants";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            use_fedcm_for_prompt?: boolean;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

/**
 * Renders nothing visible — shows Google's One Tap chip if the visitor is
 * signed into a Google account in this browser and matches an existing
 * Google Identity Services session.
 */
export function GoogleOneTap() {
  const router = useRouter();
  const initialized = useRef(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || initialized.current) return;

    async function handleCredential(response: { credential: string }) {
      try {
        const res = await fetch("/api/auth/one-tap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });
        if (res.ok) {
          router.push(AUTH_REDIRECT_PATH);
          router.refresh();
        }
      } catch (err) {
        console.error("One Tap sign-in failed:", err);
      }
    }

    function initAndPrompt() {
      if (!window.google || initialized.current) return;
      initialized.current = true;
      window.google.accounts.id.initialize({
        client_id: clientId!,
        callback: handleCredential,
        use_fedcm_for_prompt: true,
        cancel_on_tap_outside: true,
      });
      window.google.accounts.id.prompt();
    }

    const existingScript = document.querySelector(
      `script[src="${SCRIPT_SRC}"]`
    );
    if (existingScript) {
      if (window.google) initAndPrompt();
      else existingScript.addEventListener("load", initAndPrompt);
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = initAndPrompt;
    document.head.appendChild(script);
  }, [router]);

  return null;
}
