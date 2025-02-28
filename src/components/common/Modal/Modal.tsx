"use client";

import { ReactNode } from "react";
import Icon from "../icon/Icon";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white min-w-280 p-12 rounded-lg shadow-lg relative">
        <button onClick={onClose} className="absolute top-15 right-15 bg-gray-200 rounded-full">
          <Icon type="cross" width={16} height={16} fill="text-gray-500" />
        </button>
        <div className="w-full mt-20">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
