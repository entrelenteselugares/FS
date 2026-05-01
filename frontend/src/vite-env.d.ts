/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_MP_PUBLIC_KEY: string;
}

declare module 'react-window' {
  import { Component, CSSProperties, ReactNode, Ref } from 'react';
  export interface FixedSizeListProps {
    height: number | string;
    itemCount: number;
    itemSize: number;
    width: number | string;
    children: any;
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
