"use client";

import { useState, useRef, useEffect } from "react";
import { X, Upload, FileText, Save } from "lucide-react";
import { messageService } from "@/services/messages";

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMessageSent?: () => void;
}

interface DraftMessage {
  studentNumber: string;
  message: string;
  timestamp: number;
}

export default function SendMessageModal({
  isOpen,
  onClose,
  onMessageSent,
}: SendMessageModalProps) {
  const [studentNumber, setStudentNumber] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  const DRAFT_KEY = "message_draft";

  // Load draft when modal opens
  useEffect(() => {
    if (isOpen) {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        try {
          const draft: DraftMessage = JSON.parse(savedDraft);
          setStudentNumber(draft.studentNumber);
          setMessage(draft.message);
          setHasDraft(true);
        } catch (error) {
          console.error("Error loading draft:", error);
          localStorage.removeItem(DRAFT_KEY);
        }
      }
    }
  }, [isOpen]);

  // Check if there's content to save as draft
  const hasContent = studentNumber.trim() || message.trim();

  const saveDraft = () => {
    if (!hasContent) return;

    const draft: DraftMessage = {
      studentNumber: studentNumber.trim(),
      message: message.trim(),
      timestamp: Date.now(),
    };

    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    setHasDraft(true);
    setSuccess("Draft saved successfully!");

    setTimeout(() => {
      setSuccess(null);
    }, 2000);
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  };

  const handleCancel = () => {
    if (hasContent) {
      setShowCancelDialog(true);
    } else {
      onClose();
    }
  };

  const handleDiscard = () => {
    // Clear all data and draft
    setStudentNumber("");
    setMessage("");
    setShowCancelDialog(false);
    setError(null);
    setSuccess(null);
    clearDraft();
    onClose();
  };

  const handleSaveDraftAndClose = () => {
    saveDraft();
    setShowCancelDialog(false);

    // Close modal after showing success message
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleSend = async () => {
    if (!studentNumber.trim()) {
      setError("Please enter a Student Number");
      return;
    }

    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await messageService.createMessage({
        content: message,
        studentNumber: studentNumber.trim(),
      });

      setSuccess("Message sent successfully!");
      clearDraft(); // Clear draft after successful send

      // Clear form after successful send and close modal
      setTimeout(() => {
        handleDiscard();
        onMessageSent?.();
      }, 1500);
    } catch (error: any) {
      console.error("Error sending message:", error);
      setError(
        error.response?.data?.message ||
          "Failed to send message. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Send Message
            </h2>
            {hasDraft && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Draft loaded
              </span>
            )}
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 text-sm font-medium">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Student Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Student Number
            </label>
            <input
              type="text"
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              placeholder="Enter student number (e.g., 2023001)"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 font-medium"
              disabled={loading}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500 font-medium"
              disabled={loading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !studentNumber.trim() || !message.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Message"}
          </button>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Save your work?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                You have unsaved changes. Would you like to save as draft or
                discard?
              </p>
              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleSaveDraftAndClose}
                  className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700"
                >
                  <Save className="h-4 w-4" />
                  <span>Save as Draft</span>
                </button>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowCancelDialog(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Keep Editing
                  </button>
                  <button
                    onClick={handleDiscard}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700"
                  >
                    Discard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
