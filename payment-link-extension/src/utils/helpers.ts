export function validateSurcharge(customSurcharge: number | string, vendorSurcharge: number): boolean {
  if (customSurcharge === '') {
    alert('Missing custom surcharge.');
    return false;
  }

  const customSurchargeNum = Number(customSurcharge);
  
  if (isNaN(customSurchargeNum) || customSurchargeNum < 0 || customSurchargeNum > vendorSurcharge) {
    alert(`Invalid custom surcharge. Custom surcharge must not be higher than ${vendorSurcharge * 100}%`);
    return false;
  }

  return true;
}

export function generatePaymentUrl(
  subdomain: string,
  lookupCode: string,
  accountId: string | null,
  options: {
    amount?: number;
    invoiceIds?: string[];
  }
): string {
  const accountString = accountId ? `&accountid=${accountId}` : '';
  let queryParams = '';

  if (options.amount) {
    queryParams = `&amount=${options.amount}`;
  }

  if (options.invoiceIds && options.invoiceIds.length > 0) {
    queryParams = `&invoiceid=${options.invoiceIds.join(',')}`;
  }

  return `https://${subdomain}.instechpay.co/app/pay?account=${lookupCode}${accountString}${queryParams}`;
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export function showCopiedNotification(
  onShow: () => void,
  onHide: () => void,
  duration: number = 2000
): void {
  onShow();
  setTimeout(onHide, duration);
}

export function generateEmailUrl(
  emailAddress: string,
  subject: string,
  body: string
): string {
  const encodedBody = encodeURIComponent(body);
  const encodedSubject = encodeURIComponent(subject);
  return `mailto:${emailAddress}?subject=${encodedSubject}&body=${encodedBody}`;
}
