import { useState, useEffect } from 'react';
import { CheckCircle2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../Components/UI/card';
import { Separator } from '../Components/UI/separator';
import '../Styles/payment-success.css';
import { FormatCurrency, BaseUrl } from '../Utilities';

export default function ThankYouPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const amount = urlParams.get('amount') || 0;
  const amountString = FormatCurrency(amount);
  const method = urlParams.get('method') || '';
  const policyId = urlParams.get('policyid') || '';
  const subdomain = urlParams.get('subdomain') || '';

  const [signedDocUrl, setSignedDocUrl] = useState(null);

  useEffect(() => {
    if (!policyId || !subdomain) return;
    fetch(`${BaseUrl()}/pay/${subdomain}/get-signed-doc-url?policyid=${policyId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.url) setSignedDocUrl(data.url); })
      .catch(() => {});
  }, [policyId, subdomain]);
  
  
  const paymentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="content-wrapper"
      >
        <Card className="shadow-card">
          <CardContent className="card-content">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 0.2, 
                type: "spring", 
                stiffness: 200, 
                damping: 15 
              }}
              className="icon-container"
            >
              <div className="icon-wrapper">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="icon-glow"
                />
                <CheckCircle2 className="success-icon" />
              </div>
            </motion.div>

            {/* Thank You Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="message-section"
            >
              <h1 className="heading-primary">Payment Successful!</h1>
              <p className="text-body">
                Your premium payment has been received and your coverage should now be active{ method=="wire"&& " pending payment verification"}.
                {/* A confirmation has been sent to your email. */}
              </p>
            </motion.div>

            {/* Payment Details */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="details-card-wrapper"
            >
              <Card className="card-muted">
                <CardContent className="details-card-content">
                  <div className="details-list">
                    <div className="detail-row">
                      <span className="text-muted">Amount Paid</span>
                      <span>{amountString}</span>
                    </div>
                    <Separator />
                    <div className="detail-row">
                      <span className="text-muted">Payment Date</span>
                      <span>{paymentDate}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Signed Document Download */}
            {signedDocUrl && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                style={{ marginTop: 16, textAlign: 'center' }}
              >
                <a
                  href={signedDocUrl}
                  download
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
                >
                  <Download size={16} />
                  Download Signed Policy
                </a>
              </motion.div>
            )}

            {/* What's Next Section */}
            {/* <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="whats-next-section"
            >
              <h2 className="heading-secondary">What happens next?</h2>
              <div className="info-list">
                <div className="info-item">
                  <div className="icon-badge icon-badge-blue">
                    <Shield className="icon-small icon-blue" />
                  </div>
                  <div>
                    <h3 className="heading-tertiary">Coverage Active</h3>
                    <p className="text-body">
                      Your insurance coverage is now active and you're fully protected under your policy terms.
                    </p>
                  </div>
                </div>
                <div className="info-item">
                  <div className="icon-badge icon-badge-purple">
                    <FileText className="icon-small icon-purple" />
                  </div>
                  <div>
                    <h3 className="heading-tertiary">Policy Documents</h3>
                    <p className="text-body">
                      Your policy documents and payment receipt are available in your account.
                      {/* and have been sent to your email 
                    </p>
                  </div>
                </div>
              </div>
            </motion.div> */}

            {/* Action Buttons */}
            {/* <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="actions-section"
            >
              <Button 
                className="flex-1 button-group"
                size="lg"
              >
                View Policy Details
                <ArrowRight className="arrow-icon" />
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                size="lg"
              >
                Go to Dashboard
              </Button>
            </motion.div> */}

            {/* Support Note */}
            {/* <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="support-section"
            >
              <p className="text-body">
                Need help? Contact our support team at{' '}
                <a href="mailto:support@example.com" className="text-link">
                  support@example.com
                </a>
              </p>
            </motion.div> */}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
