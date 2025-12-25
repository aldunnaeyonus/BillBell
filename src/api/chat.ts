import { serverURL } from '@/data/vendors';
import { getToken } from '../auth/session'; // <--- 1. Import Auth Helper

export interface BillData {
  merchant: string;
  date: string | null;
  total: number | null;
  currency: string;
  category: string;
  summary: string;
}

// Ensure this matches where you actually saved the PHP script
const SERVER_URL = serverURL+'/chat';

// <--- 2. Add 'context' parameter here
export const sendMessageToBillBell = async (
  message: string, 
  context: string, 
  imageFile?: any
): Promise<string | null> => {
  
  try {
    // <--- 3. Get the User's Secure Token
    const token = await getToken();
    
    // <--- 4. Include 'context' in the body
    let body: any = { 
      message,
      context 
    };

    if (imageFile) {
        // If sending base64, ensure it's just the raw string (no data:image/... prefix if your PHP handles that)
        // or match what your PHP expects.
        body.image = imageFile.base64 || imageFile; 
    }

    const response = await fetch(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // <--- 5. Add Auth Header
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error("Server Error:", response.status);
      return "Sorry, I couldn't reach the server. "
    }

    const data = await response.json();
    
    // Check standard Gemini response structure
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    } else if (data.error) {
      return `Error: ${data.error.message}`;
    }
    
    return "I didn't understand that response.";

  } catch (error) {
    console.error("Network Error:", error);
    return "Network error. Please check your connection.";
  }
};