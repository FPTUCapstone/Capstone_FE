"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { webLogout } from "@/lib/authApi";
import LogoutDialog from "./LogoutDialog";

export default function LogoutButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    await webLogout();
    setOpen(false);
    router.replace("/sign-in");
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-100 active:scale-[0.98]"
      >
        <span className="material-symbols-outlined text-base" aria-hidden="true">
          logout
        </span>
        Đăng xuất
      </button>

      <LogoutDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
