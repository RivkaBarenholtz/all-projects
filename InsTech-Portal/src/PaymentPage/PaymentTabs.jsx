import React, { useState } from "react";

const PaymentTabs = ({ tabs, setActiveTab, activeTab }) => {
  const tabKeys = Object.keys(tabs);
  
  const tabStyle = {
   
    cursor: "pointer",
    padding: '4px', 
    
    backgroundColor: "transparent",
    color:"#DDD",
    outline: "none",
  };

  const activeTabStyle = {
    color: 'var(--text-color)', 
    borderBottom: '2px solid black',
    lineHeight: '17px'
  };

  const tabContainerStyle = {
    marginBottom: '20px',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '14px'
  };

  
  return (
    <div>
      <div style={tabContainerStyle}>
        {tabKeys.map((key, index) => (
          <React.Fragment key={key}>
          <span
            
            onClick={() => setActiveTab(key)}
            style={activeTab === key ? activeTabStyle : tabStyle}
          >
            {key}
            
          </span>
          {index<tabKeys.length-1?" | ":""}
          </React.Fragment>
        ))}
      </div>
      <div >{tabs[activeTab]}</div>
    </div>
  );
};

export default PaymentTabs;
