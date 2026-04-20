declare module 'react-pageflip' {
  import React from 'react';

  interface IEventProps {
    onFlip?: (e: { data: number }) => void;
    onChangeOrientation?: (e: { data: 'portrait' | 'landscape' }) => void;
    onChangeState?: (e: { data: 'user_fold' | 'fold_corner' | 'flipping' | 'read' }) => void;
    onInit?: (e: { data: any }) => void;
    onUpdate?: (e: { data: any }) => void;
  }

  interface IFlipSetting {
    startPage?: number;
    size?: 'fixed' | 'stretch';
    width: number;
    height: number;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startZIndex?: number;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    swipeDistance?: number;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
  }

  const HTMLFlipBook: React.ForwardRefExoticComponent<
    React.PropsWithChildren<IFlipSetting & IEventProps & { className?: string; style?: React.CSSProperties }> & React.RefAttributes<any>
  >;

  export default HTMLFlipBook;
}
