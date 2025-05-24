"use client";

import { useState, useRef } from "react";
import { X, Upload, FileText } from "lucide-react";
import { axiosInstance } from "@/lib/axios";

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SendMessageModal({
  isOpen,
  onClose,
}: SendMessageModalProps) {
  const [studentId, setStudentId] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // File size validation (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("File size not supported. Maximum file size is 10MB.");
      return;
    }

    // File type validation (only PDF)
    if (file.type !== "application/pdf") {
      setError("File format not supported. Only PDF files are allowed.");
      return;
    }

    setAttachment(file);
    setError(null);
  };

  const handleRemoveFile = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCancel = () => {
    if (studentId.trim() || message.trim() || attachment) {
      setShowCancelDialog(true);
    } else {
      onClose();
    }
  };

  const handleDiscard = () => {
    // Clear all data
    setStudentId("");
    setMessage("");
    setAttachment(null);
    setShowCancelDialog(false);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const handleSaveDraft = () => {
    // Keep the data and just close the dialogs
    setShowCancelDialog(false);
    setError(null);
    setSuccess("Draft saved successfully!");

    // Close the main modal after showing success message
    setTimeout(() => {
      setSuccess(null);
      onClose();
    }, 1500);
  };

  const handleSend = async () => {
    if (!studentId.trim()) {
      setError("Please enter a Student ID");
      return;
    }

    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("recipientId", studentId);
      formData.append("content", message);

      if (attachment) {
        formData.append("attachment", attachment);
      }

      // TODO: Replace with actual API endpoint - for now simulate success
      // await axiosInstance.post("/messages", formData, {
      //   headers: {
      //     "Content-Type": "multipart/form-data",
      //   },
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess("Message delivered successfully!");

      // Clear form after successful send and close modal
      setTimeout(() => {
        handleDiscard();
      }, 2000);
    } catch (error: any) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    // Don't clear data when modal closes via onClose - only via discard
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Send Message</h2>
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

          {/* Student ID */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Student ID
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter student ID"
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

          {/* Attachment */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Attachment (optional)
            </label>
            {attachment ? (
              <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2">
                  <FileText size={16} className="text-red-600" />
                  <span className="text-sm text-gray-900 font-medium truncate">
                    {attachment.name}
                  </span>
                  <span className="text-xs text-gray-600 font-medium">
                    ({(attachment.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="text-red-600 hover:text-red-700"
                  disabled={loading}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <div className="mt-2">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-sm font-semibold text-blue-600 hover:text-blue-500">
                        Choose file
                      </span>
                      <input
                        ref={fileInputRef}
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        disabled={loading}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-600 font-medium mt-1">
                    PDF files only, max 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !studentId.trim() || !message.trim()}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Cancel Message
              </h3>
              <p className="text-sm text-gray-700 mb-6 font-medium">
                You have unsaved changes. What would you like to do?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCancelDialog(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Continue Editing
                </button>
                <button
                  onClick={handleSaveDraft}
                  className="px-4 py-2 text-sm font-semibold text-white bg-yellow-600 border border-transparent rounded-lg hover:bg-yellow-700"
                >
                  Save as Draft
                </button>
                <button
                  onClick={handleDiscard}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
