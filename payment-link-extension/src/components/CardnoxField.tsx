import IField, {
  CARD_TYPE,
  CVV_TYPE,
  ACH_TYPE,
} from "@cardknox/react-ifields";
import React, { useImperativeHandle, useRef, forwardRef } from "react";

export type CardnoxFieldProps = {
  ifieldType: typeof CARD_TYPE | typeof CVV_TYPE | typeof ACH_TYPE;
  issuer?: string;
  onIssuer?: (issuer: string) => void;
  onFocusedChanged?: (event: any) => void;
  onToken?: (data: { xToken: string }) => void;
  onError?: (err: any) => void;
  handle3DSResults?: (data: any) => void;
  ifieldsKey: string;
  className?: string;
};

export type CardnoxFieldRef = {
  getToken: () => void;
  focusIfield: () => void;
  clearIfield: () => void;
};

const CardnoxField = forwardRef<CardnoxFieldRef, CardnoxFieldProps>(
  (
    {
      className ,
      ifieldType,
      issuer,
      onIssuer = () => {},
      onToken = () => {},
      onError = () => {},
      handle3DSResults = () => {},
      onFocusedChanged = () => {},
      ifieldsKey,
    },
    ref
  ) => {
    const internalRef = useRef<any>();

    useImperativeHandle(ref, () => ({
      getToken: () => internalRef.current.getToken(),
      focusIfield: () => internalRef.current.focusIfield(),
      clearIfield: () => internalRef.current.clearIfield(),
    }));

    const account = {
      xKey: ifieldsKey,
      xSoftwareName: "ins-tech-dev",
      xSoftwareVersion: "1.0.0",
    };

    const options = {
      placeholder: ifieldType === CARD_TYPE ? "Card Number" : "CVV",
      enableLogging: false,
      autoFormat: true,
      autoFormatSeparator: " ",
      autoSubmit: true,
      blockNonNumericInput: true,
      iFieldstyle: {
        width: ifieldType === CARD_TYPE ? "92%" : "60%",
        maxWidth: "100%",
        backgroundColor: "#ffffff",
        border: "none",
        color: "#363636",
        height: "2.25em",
        lineHeight: "1.5",
        padding: "calc(0.375em - 1px) calc(0.625em - 1px)",
        outline: "none",
        fontFamily: "sans-serif",
      },
    };

    const onLoad = () => {
      console.log("Iframe loaded");
    };

    const onUpdate = (data: any) => {
      onFocusedChanged(data.event);
      if (ifieldType === CARD_TYPE && data.issuer) {
        onIssuer(data.issuer);
      }
    };

    const onSubmit = (data: any) => {
      console.log("IFrame submitted", data);
    };

    const threeds =
      ifieldType === CARD_TYPE
        ? {
            enable3DS: true,
            environment: null,
            handle3DSResults,
          }
        : undefined;

    return (
      <IField
        type={ifieldType}
        account={account}
        options={options}
        threeDS={threeds}
        onLoad={onLoad}
        onUpdate={onUpdate}
        onSubmit={onSubmit}
        onToken={onToken}
        ref={internalRef}
        onError={onError}
        className={className}
        issuer={issuer}
      />
    );
  }
);

export default CardnoxField;
