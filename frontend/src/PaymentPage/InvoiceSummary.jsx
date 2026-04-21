import React, { useState } from 'react';
import { FormatCurrency } from '../Utilities';

const STEPS = ['Summary', 'Payment', 'Complete'];

const InvoiceSummary = ({ invoices, onProceed, accountCode }) => {
  
  const [btnHovered, setBtnHovered] = useState(false);

  const total = invoices
    .filter(inv => inv.Selected !== false)
    .reduce((sum, inv) => sum + (inv.Balance || 0), 0);

  const toggleInvoice = (index) => {
    setInvoices(prev =>
      prev.map((inv, i) => (i === index ? { ...inv, Selected: !inv.Selected } : inv))
    );
  };

  // ── Layout ──────────────────────────────────────────────────────────────────
  const containerStyle = {
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    backgroundColor: '#f0f4f8',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '48px 20px',
    color: '#1e293b',
  };

  const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    width: '100%',
    maxWidth: '520px',
    padding: '40px 36px',
  };

  // ── Wizard steps ─────────────────────────────────────────────────────────
  const wizardStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0',
    marginBottom: '36px',
  };

  const stepCircleBase = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '700',
    flexShrink: 0,
  };

  const connectorStyle = {
    flex: 1,
    height: '2px',
    backgroundColor: '#e2e8f0',
    maxWidth: '60px',
  };

  // ── Table ────────────────────────────────────────────────────────────────
  const tableHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 4px 12px',
    borderBottom: '2px solid #e2e8f0',
    marginBottom: '4px',
  };

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 4px',
    borderBottom: '1px solid #f1f5f9',
  };

  const totalSectionStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 4px 4px',
    borderTop: '2px solid #e2e8f0',
    marginTop: '8px',
  };

  // ── Button ───────────────────────────────────────────────────────────────
  const buttonStyle = {
    width: '100%',
    backgroundColor: btnHovered ? '#005ea6' : '#0070ba',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '18px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.18s ease, box-shadow 0.18s ease',
    marginTop: '28px',
    letterSpacing: '0.3px',
    boxShadow: btnHovered
      ? '0 6px 20px rgba(0,112,186,0.35)'
      : '0 2px 8px rgba(0,112,186,0.18)',
  };

  return (
    <div style={containerStyle}>
      {/* ── Wizard progress ── */}
      <div style={{ width: '100%', maxWidth: '520px', marginBottom: '8px' }}>
        <div style={wizardStyle}>
          {STEPS.map((label, i) => {
            const isActive = i === 0;
            const isDone = false;
            return (
              <React.Fragment key={label}>
                {i > 0 && <div style={connectorStyle} />}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{
                      ...stepCircleBase,
                      backgroundColor: isActive ? '#0070ba' : '#e2e8f0',
                      color: isActive ? '#fff' : '#94a3b8',
                    }}
                  >
                    {i + 1}
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: isActive ? '700' : '400',
                      color: isActive ? '#0070ba' : '#94a3b8',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Card ── */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 28px', fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
          Payment Summary
        </h3>

        {accountCode && (
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
              Account ID
            </span>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
              {accountCode}
            </div>
          </div>
        )}

        {/* Table header */}
        <div style={tableHeaderStyle}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Invoice Number
          </span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Balance
          </span>
        </div>

        {/* Invoice rows */}
        {invoices.map((inv, index) => (
          <div key={inv.AppliedEpicInvoiceNumber ?? index} style={rowStyle}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '12px' }}>
              <input
                type="checkbox"
                checked={inv.Selected !== false}
                style={{ width: '17px', height: '17px', accentColor: '#0070ba', cursor: 'pointer' }}
                onChange={() => toggleInvoice(index)}
              />
              <span style={{ fontSize: '15px', fontWeight: '500' }}>
                #{inv.AppliedEpicInvoiceNumber}
              </span>
            </label>
            <span style={{ fontSize: '15px', fontWeight: '600' }}>
              {FormatCurrency(inv.Balance)}
            </span>
          </div>
        ))}

        {/* Total */}
        <div style={totalSectionStyle}>
          <span style={{ fontSize: '16px', fontWeight: '500', color: '#475569' }}>Total Due</span>
          <span style={{ fontSize: '26px', fontWeight: '800', color: '#1e293b' }}>
            {FormatCurrency(total)}
          </span>
        </div>

        {/* CTA button */}
        <button
          style={buttonStyle}
          onMouseEnter={() => setBtnHovered(true)}
          onMouseLeave={() => setBtnHovered(false)}
          onClick={onProceed}
        >
          Proceed to Payment →
        </button>
      </div>
    </div>
  );
};

export default InvoiceSummary;
