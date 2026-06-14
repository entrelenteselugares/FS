/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_MP_PUBLIC_KEY: string;
}

declare module 'react-window' {
  import { Component, CSSProperties } from 'react';
  export interface FixedSizeListProps {
    height: number | string;
    itemCount: number;
    itemSize: number;
    width: number | string;
    children: (props: { index: number; style: CSSProperties }) => JSX.Element;
    overscanCount?: number;
    style?: CSSProperties;
    className?: string;
  }
  export class FixedSizeList extends Component<FixedSizeListProps> {}
  const rw: { FixedSizeList: typeof FixedSizeList };
  export default rw;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  fsPendingCaptureFiles?: File[];
  fsCurrentEventId?: string;
}
