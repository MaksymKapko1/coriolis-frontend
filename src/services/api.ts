const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

export const saveSignerToBackend = async (
  accessToken: string,
  linkedSignerPrivateKey: string,
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/link-signer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        linked_signer_private_key: linkedSignerPrivateKey,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to save signer on backend");
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const fetchUserStatus = async (accessToken: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch user status");
    return await response.json();
  } catch (error) {
    console.error("Fetch Status Error:", error);
    throw error;
  }
};
