import { fetchWithAuth } from "../Utilities";


export const getUserInfo = async () => {
    return await fetchWithAuth(`get-user-info`, {});
}

export const createUser = async (userData) => {
    return await fetchWithAuth(`create-user`, userData);
}
export const listUsers = async (userData) => {
    return await fetchWithAuth(`list-all-users`, {});
}

export const getSubAccounts = async () => {
    const list = await fetchWithAuth(`get-subaccounts`, {});
    const accounts = list ?? [];
    const anyDefault = accounts.some(sa => sa.IsDefault);
    const defaultAccount = { Id: "", Name: "Default Account", CardknoxApiKey: "", CardknoxApiKeySecretName: "", IsDefault: !anyDefault, _isGlobalAccount: true };
    return [defaultAccount, ...accounts];
}

export const createSubAccount = async (subAccount) => {
    return await fetchWithAuth(`create-subaccount`, subAccount);
}

export const updateSubAccount = async (subAccount) => {
    return await fetchWithAuth(`update-subaccount`, subAccount);
}

export const getEmailAssignments = async () => {
    return await fetchWithAuth(`get-email-assignments`, {});
}

export const saveEmailAssignment = async (assignment) => {
    return await fetchWithAuth(`save-email-assignment`, assignment);
}

export const deleteEmailAssignment = async (assignment) => {
    return await fetchWithAuth(`delete-email-assignment`, assignment);
}