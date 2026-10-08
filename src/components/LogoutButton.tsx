"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { webLogout } from "@/lib/authApi";
import { AuthStorage } from "@/features/auth/session/authSession";
import { operatorCommonEn } from "@/features/operator/common/resources/en";
import LogoutDialog from "./LogoutDialog";

export default function LogoutButton() {
  const router = useRouter();
  const logoutInFlightRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (logoutInFlightRef.current) return;
    logoutInFlightRef.current = true;
    setErrorMessage(null);
    try {
      await webLogout();
      AuthStorage.clear();
      setOpen(false);
      router.replace("/sign-in");
      router.refresh();
    } catch {
      setErrorMessage(operatorCommonEn.logout.errorMessage);
    } finally {
      logoutInFlightRef.current = false;
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setErrorMessage(null);
          setOpen(true);
        }}
        aria-label={operatorCommonEn.logout.button}
        className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-100 active:scale-[0.98]"
      >
        <span className="material-symbols-outlined text-base" aria-hidden="true">
          logout
        </span>
        {operatorCommonEn.logout.button}
      </button>

      <LogoutDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        errorMessage={errorMessage}
      />
    </>
  );
}
