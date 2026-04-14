/** * ===================================================== * System Information Modal Component * ===================================================== */ import Modal from "../ui/Modal";
import { XMarkIcon } from "@heroicons/react/24/outline";
export default function SystemInfoModal({ isOpen, onClose }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {" "}
      {isOpen && (
        <>
          {" "}
          <div
            className="fixed inset-0 bg-black bg-opacity-70 transition-opacity"
            onClick={onClose}
          />{" "}
          <div className="flex min-h-full items-center justify-center p-4">
            {" "}
            <div
              className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 shadow-2xl transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              {" "}
              {/* Header */}{" "}
              <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
                {" "}
                <h2 className="text-lg font-bold text-white">
                  Información del Sistema
                </h2>{" "}
                <button
                  onClick={onClose}
                  className="rounded-md p-1 text-slate-400/60 hover:bg-slate-700 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors"
                >
                  {" "}
                  <XMarkIcon className="h-5 w-5" />{" "}
                </button>{" "}
              </div>{" "}
              {/* Content */}{" "}
              <div className="px-6 py-6 space-y-6">
                {" "}
                {/* Control Number Section */}{" "}
                <div className="border border-slate-700 rounded-lg p-5 bg-slate-800">
                  {" "}
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    {" "}
                    No. de Control{" "}
                  </p>{" "}
                  <p className="text-2xl font-bold text-white">
                    F-OP-SMT-019
                  </p>{" "}
                  <p className="text-sm text-slate-400 mt-3">
                    Solder Paste Report
                  </p>{" "}
                </div>{" "}
                {/* Ingeniero Section */}{" "}
                <div className="border border-slate-700 rounded-lg p-5 bg-slate-800">
                  {" "}
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    {" "}
                    Ingeniero a Cargo{" "}
                  </p>{" "}
                  <p className="text-lg font-semibold text-white">
                    Edgar Alberto Guajardo Castro
                  </p>{" "}
                </div>{" "}
                {/* Developer Section */}{" "}
                <div className="border border-slate-700 rounded-lg p-5 bg-slate-800">
                  {" "}
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    {" "}
                    Desarrollador{" "}
                  </p>{" "}
                  <p className="text-lg font-semibold text-white">
                    Marcelo Bazaldua Morales
                  </p>{" "}
                </div>{" "}
              </div>{" "}
              {/* Footer Button */}{" "}
              <div className="border-t border-slate-700 px-6 py-4 bg-slate-800/20 flex justify-end">
                {" "}
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-lg font-medium text-slate-900 border border-slate-600 hover:bg-slate-700 hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors"
                >
                  {" "}
                  Cerrar{" "}
                </button>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </>
      )}{" "}
    </div>
  );
}
