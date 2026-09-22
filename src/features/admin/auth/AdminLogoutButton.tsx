"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LogoutDialog from "@/components/LogoutDialog";
import { ROUTES } from "@/lib/routes";
import { signOutAdminSession } from "./services/adminSessionClient";

const logoutErrorMessage = "Không thể đăng xuất. Vui lòng thử lại.";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirm = async () => {
    setErrorMessage(null);

    try {
      await signOutAdminSession();
    } catch {
      setErrorMessage(logoutErrorMessage);
      return;
    }

    setOpen(false);
    router.replace(ROUTES.admin.login);
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
