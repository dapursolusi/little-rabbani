import { IconSvgElement } from '@hugeicons/react';

export function isIconSvgElement(
  icon: IconSvgElement | React.ReactNode
): icon is IconSvgElement {
  if (!Array.isArray(icon)) return false;

  const firstItem = icon[0];
  return (
    Array.isArray(firstItem) &&
    typeof firstItem[0] === 'string' &&
    typeof firstItem[1] === 'object' &&
    firstItem[1] !== null
  );
}
