import React from "react";

interface PaymentTabsProps {
  tabs: Record<string, React.ReactNode>; // Each tab key maps to some JSX/content
  activeTab: string;
  setActiveTab: (tabKey: string) => void;
}

const PaymentTabs: React.FC<PaymentTabsProps> = ({ tabs, activeTab, setActiveTab }) => {
  const tabKeys = Object.keys(tabs);

  const tabStyle: React.CSSProperties = {
    cursor: "pointer",
    padding: "4px",
    backgroundColor: "transparent",
    color: "#DDD",
    outline: "none",
  };

  const activeTabStyle: React.CSSProperties = {
    color: "var(--text-color)",
    borderBottom: "2px solid black",
    lineHeight: "17px",
  };

  const tabContainerStyle: React.CSSProperties = {
    marginBottom: "20px",
    cursor: "pointer",
    textAlign: "left",
    fontSize: "14px",
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
            {index < tabKeys.length - 1 ? " | " : ""}
          </React.Fragment>
        ))}
      </div>
      <div>{tabs[activeTab]}</div>
    </div>
  );
};

export default PaymentTabs;
