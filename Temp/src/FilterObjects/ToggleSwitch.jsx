import React from 'react';

const ToggleSwitch = ({ checked, onChange, label }) => {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="slider"></span>
      {label && <span className="switch-label">{label}</span>}
    </label>
  );
};

export default ToggleSwitch;
