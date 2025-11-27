declare module '@cardknox/react-ifields' {
  import { Component, RefObject } from 'react';

  export interface AccountConfig {
    xKey: string;
    xSoftwareName?: string;
    xSoftwareVersion?: string;
  }

  export interface IFieldOptions {
    placeholder?: string;
    enableLogging?: boolean;
    autoFormat?: boolean;
    autoFormatSeparator?: string;
    autoSubmit?: boolean;
    blockNonNumericInput?: boolean;
    iFieldstyle?: {
      [key: string]: string;
    };
    [key: string]: any;
  }

  export interface ThreeDSConfig {
    enable3DS?: boolean;
    waitForResponse?: boolean;
    [key: string]: any;
  }

  export interface TokenData {
    xToken: string;
    [key: string]: any;
  }

  export interface IFieldProps {
    type: string;
    account: AccountConfig;
    options?: IFieldOptions;
    threeDS?: ThreeDSConfig;
    onLoad?: () => void;
    onUpdate?: (data: any) => void;
    onSubmit?: (data: any) => void;
    onToken?: (data: TokenData) => void;
    onError?: (error: any) => void;
    className?: string;
    issuer?: string;
    ref?: RefObject<any>;
  }

  export class IField extends Component<IFieldProps> {}

  export const CARD_TYPE: string;
  export const CVV_TYPE: string;
  export const ACH_TYPE: string;

  export default IField;
}