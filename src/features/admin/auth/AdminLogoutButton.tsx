"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutDialog from "@/components/LogoutDialog";
import { ROUTES } from "@/lib/routes";
import { webLogout } from "@/lib/authApi";
import { AuthStorage } from "@/features/auth/session/authSession";
import { adminStaffEn } from "@/features/admin/staff/resources/en";

const logoutErrorMessage = adminStaffEn.login.logoutError;

export default function AdminLogoutButton() {
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
    } catch {
      setErrorMessage(logoutErrorMessage);
      return;
    } finally {
      logoutInFlightRef.current = false;
    }

    setOpen(false);
    router.replace(ROUTES.signIn);
    router.refresh();
  };

  const handleClose = () => {
    setErrorMessage(null);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setErrorMessage(null);
          setOpen(true);
        }}
        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Sign out of administration"
      >
        <span className="material-symbols-outlined text-[20px]">logout</span>
      </button>

      <LogoutDialog
        open={open}
        onClose={handleClose}
        onConfirm={handleConfirm}
        errorMessage={errorMessage}
      />
    </>
  );
}
