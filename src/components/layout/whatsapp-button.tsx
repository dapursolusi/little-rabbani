import Link from 'next/link';

import { WhatsappIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

/**
 * WhatsApp floating circular contact button.
 *
 * DESIGN.md specs:
 * - 56px diameter, WhatsApp Green (#25D366) fill
 * - Layered shadow: 0 0 6px rgba(0,0,0,0.24) + 0 8px 12px rgba(0,0,0,0.14)
 * - Fixed position bottom-right with -0.8rem touch offset
 * - Active: scale(0.95), ambient shadow fades to 0
 * - Persists across all pages
 */
export function WhatsAppButton() {
  return (
    <Link
      href="https://wa.me/6281234567890"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Hubungi via WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_0_6px_rgba(0,0,0,0.24),0_8px_12px_rgba(0,0,0,0.14)] transition-all duration-200 ease-out hover:shadow-[0_0_6px_rgba(0,0,0,0.24),0_8px_12px_rgba(0,0,0,0.14)] active:scale-95 active:shadow-[0_0_6px_rgba(0,0,0,0.24),0_8px_12px_rgba(0,0,0,0)] active:outline-none"
    >
      <HugeiconsIcon icon={WhatsappIcon} className="h-6 w-6" />
    </Link>
  );
}
