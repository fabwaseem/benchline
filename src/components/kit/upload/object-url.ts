"use client";

import { useEffect, useState } from "react";

export function useObjectUrl(file: File | null) {
  const [tracked, setTracked] = useState(file);
  const [url, setUrl] = useState<string | null>(null);
  if (file !== tracked) {
    if (url) URL.revokeObjectURL(url);
    setTracked(file);
    setUrl(file ? URL.createObjectURL(file) : null);
  }
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);
  return url;
}
