'use client';

import { useEffect } from 'react';

export default function DevIndicatorDisabler() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    void fetch('/__nextjs_disable_dev_indicator', {
      method: 'POST',
      keepalive: true,
    }).catch(() => {
      // Ignore local devtool endpoint failures quietly.
    });
  }, []);

  return null;
}
