import React from "react";
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  showInput?: boolean;
  placeholder?: string;
  inputValue?: string;
  onInputChange?: (value: string) => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Đồng ý",
  cancelText = "Hủy",
  type = "warning",
  showInput = false,
  placeholder = "",
  inputValue = "",
  onInputChange,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "danger":
        return <XCircle className="w-6 h-6 text-red-600" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
      case "info":
      default:
        return <Info className="w-6 h-6 text-indigo-600" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case "danger":
        return "bg-red-50";
      case "warning":
        return "bg-amber-50";
      case "info":
      default:
        return "bg-indigo-50";
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white";
      case "warning":
        return "bg-amber-500 hover:bg-amber-600 text-white";
      case "info":
      default:
        return "bg-indigo-950 hover:bg-indigo-900 text-white";
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col relative space-y-4">
        <div className="text-center space-y-2">
          <div className={`w-12 h-12 ${getIconBg()} rounded-full flex items-center justify-center mx-auto`}>
            {getIcon()}
          </div>
          <h3 className="font-bold text-slate-900 text-base font-display">{title}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">{message}</p>
          
          {showInput && onInputChange && (
            <div className="pt-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden outline-indigo-600"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 ${getConfirmButtonClass()} text-xs font-bold rounded-xl transition-colors cursor-pointer`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  type?: "success" | "error" | "info";
  closeText?: string;
}

export function AlertModal({
  isOpen,
  title,
  message,
  onClose,
  type = "info",
  closeText = "Đóng",
}: AlertModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-6 h-6 text-emerald-600" />;
      case "error":
        return <XCircle className="w-6 h-6 text-red-600" />;
      case "info":
      default:
        return <Info className="w-6 h-6 text-indigo-600" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case "success":
        return "bg-emerald-50";
      case "error":
        return "bg-red-50";
      case "info":
      default:
        return "bg-indigo-50";
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col relative space-y-4">
        <div className="text-center space-y-2">
          <div className={`w-12 h-12 ${getIconBg()} rounded-full flex items-center justify-center mx-auto`}>
            {getIcon()}
          </div>
          <h3 className="font-bold text-slate-900 text-base font-display">{title}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">{message}</p>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            {closeText}
          </button>
        </div>
      </div>
    </div>
  );
}
