import { AlertTriangleIcon, CheckCircleIcon } from './icons/PoiIcons';

interface StatusModalsProps {
  showSuccessModal: boolean;
  showConflictAlert: boolean;
  showNotFoundAlert: boolean;
  onCloseSuccess: () => void;
  onCloseConflict: () => void;
  onCloseNotFound: () => void;
  onResetForm: () => void;
  createdPoiId?: string;
}

export function StatusModals({
  showSuccessModal,
  showConflictAlert,
  showNotFoundAlert,
  onCloseSuccess,
  onCloseConflict,
  onCloseNotFound,
  onResetForm,
  createdPoiId = 'POI-84920',
}: StatusModalsProps) {
  return (
    <>
      {/* HTTP 409 Conflict Banner */}
      {showConflictAlert ? (
        <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-800">
                <AlertTriangleIcon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">HTTP 409 Conflict: Duplicate Point of Interest</h4>
                <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                  A Point of Interest with the name or identical spatial coordinates (16.002874, 108.263889) already exists in the catalog under POI ID <code className="font-mono font-bold">#POI-10042</code> (Marble Mountains). Please adjust the name or location coordinates before resubmitting.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCloseConflict}
              className="rounded-lg p-1 text-amber-700 hover:bg-amber-200 focus-visible:outline-2 focus-visible:outline-amber-600"
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}

      {/* HTTP 404 Reference Error Banner */}
      {showNotFoundAlert ? (
        <div className="mb-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-900 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-200 text-red-800">
                <AlertTriangleIcon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">HTTP 404 Reference Error: Category or Parent Location Not Found</h4>
                <p className="mt-1 text-xs text-red-800 leading-relaxed">
                  The selected Category ID or parent administrative district (<code className="font-mono font-bold">Ngũ Hành Sơn</code>) does not exist in backend system master tables (<code className="font-mono">catalog.POICategories</code>).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCloseNotFound}
              className="rounded-lg p-1 text-red-700 hover:bg-red-200 focus-visible:outline-2 focus-visible:outline-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}

      {/* Success Modal */}
      {showSuccessModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircleIcon className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Point of Interest Created!</h3>
              <p className="mt-1 text-xs text-slate-500">
                UC-52 execution successful. Assigned System Identifier:
              </p>
              <div className="my-3 inline-block rounded-xl bg-slate-100 px-4 py-2 font-mono text-sm font-bold text-slate-800 border border-slate-200">
                #{createdPoiId}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                The POI record has been saved to <code className="font-mono">catalog.POIs</code> and is now active in the TripMate pilot catalog for Da Nang.
              </p>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onCloseSuccess();
                    onResetForm();
                  }}
                  className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-xs hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600"
                >
                  Create Another POI
                </button>
                <button
                  type="button"
                  onClick={onCloseSuccess}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-slate-600"
                >
                  Dismiss Notification
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
