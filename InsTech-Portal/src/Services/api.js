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