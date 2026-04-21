import React, { useState } from "react";

const PaymentTabs = ({ tabs, setActiveTab, activeTab }) => {
  const tabKeys = Object.keys(tabs);

  return (
    <div style={{marginTop:"20px"}}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {tabKeys.map((key) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              style={{
                cursor: 'pointer',
                padding: '7px 18px',
                borderRadius: '20px',
                border: isActive ? 'none' : '1px solid #e2e8f0',
                backgroundColor: isActive ? '#043969' : '#f1f5f9',
                color: isActive ? '#ffffff' : '#475569',
                fontWeight: isActive ? '700' : '500',
                fontSize: '13px',
                outline: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {key}
            </button>
          );
        })}
      </div>
      <div>{tabs[activeTab]}</div>
    </div>
  );
};

export default PaymentTabs;
