using AmazonUtilities;
using InsTechClassesV2.AppliedEpic;
using System.Threading.Tasks;

namespace InsTechClassesV2.Services
{
    public static class SubAccountResolver
    {
        /// <summary>
        /// For portal / Applied extension: resolves subAccountId from the logged-in user's Cognito record.
        /// </summary>
        public static async Task<string> ResolveFromUser(string email, int vendorId)
        {
            var users = await User.GetUserAsync(email);
            var userForVendor = users?.FirstOrDefault(u => u.VendorId == vendorId);
            return userForVendor?.SubAccountId;
        }

        /// <summary>
        /// For payment site: resolves subAccountId by looking up the account in Applied Epic,
        /// finding the associated CSR, then matching that CSR code to a CsrSubAccountMapping record.
        /// Returns null if no match found — caller should fall back to vendor default.
        /// </summary>
        public static async Task<string> ResolveFromAccountId(string accountId, Vendor vendor)
        {
            if (string.IsNullOrEmpty(accountId)) return null;

            var client = await AppliedGetClientRequest.Create(accountId, vendor, new GlobalLog());
            if (client == null || string.IsNullOrEmpty(client.CSRLookupCode)) return null;

            var mapping = await CsrSubAccountMapping.GetByCsrCode(vendor.Id, client.CSRLookupCode);
            return string.IsNullOrEmpty(mapping?.SubAccountId) ? null : mapping.SubAccountId;
        }
    }
}
