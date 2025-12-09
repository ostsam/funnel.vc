"use client";

import React, { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Upload, Loader2, Sparkles, FileText, X } from "lucide-react";
import { useDropzone } from "react-dropzone";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile?: File | null;
}

export function FileUpload({ onFileSelect, selectedFile }: FileUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setIsProcessing(true);
        // Simulate a brief "scanning" effect
        setTimeout(() => {
          setIsProcessing(false);
          onFileSelect(acceptedFiles[0]);
        }, 1000); 
      }
    },
    [onFileSelect],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    multiple: false,
    disabled: !!selectedFile
  });

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
  };

  if (selectedFile) {
    return (
        <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 p-8"
      >
        <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <FileText className="h-8 w-8" />
            </div>
            <div className="text-center">
                <p className="font-medium text-zinc-900">{selectedFile.name}</p>
                <p className="text-sm text-zinc-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
                onClick={removeFile}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm ring-1 ring-zinc-200 hover:bg-red-50"
                type="button"
            >
                <X className="h-4 w-4" />
                Remove File
            </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative w-full"
    >
      <div
        ref={divRef}
        onMouseMove={handleMouseMove}
        {...getRootProps()}
        className={cn(
          "relative h-64 w-full rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 overflow-hidden cursor-pointer",
          "group transition-all duration-300 ease-out hover:border-blue-400 hover:bg-blue-50/30",
          isDragActive && "border-blue-500 bg-blue-50 scale-[1.01]"
        )}
      >
        <input {...getInputProps()} />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center space-y-4"
              >
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm font-medium text-blue-600">
                  Processing PDF...
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center space-y-4"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300",
                    isDragActive
                      ? "bg-blue-100 text-blue-600"
                      : "bg-white text-zinc-400 shadow-sm group-hover:text-blue-500 group-hover:scale-110"
                  )}
                >
                  {isDragActive ? (
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-medium text-zinc-900">
                    {isDragActive ? "Drop file now" : "Upload Pitch Deck"}
                  </h3>
                  <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                    Drag and drop your PDF here, or click to browse.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
