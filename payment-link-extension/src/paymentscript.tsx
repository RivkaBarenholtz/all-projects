import CardnoxField from "./components/CardnoxField";

import React from 'react';
import ReactDOM from 'react-dom/client';

import  { CARD_TYPE } from '@cardknox/react-ifields';

export default {
  render: ({ key }: { key: string }) => {
    if (!document.getElementById('card-field')) {
      const container = document.createElement('div');
      container.id = 'card-field';
      document.body.appendChild(container);

      const root = ReactDOM.createRoot(container);
      root.render(
         <React.StrictMode>
        <CardnoxField
          ifieldType={CARD_TYPE}
          ifieldsKey={key}
         
        />
      </React.StrictMode>
      );
    }
  },
};