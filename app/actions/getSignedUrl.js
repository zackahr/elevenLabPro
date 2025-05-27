// app/actions/getSignedUrl.js
'use server'

export async function getSignedUrl() {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${process.env.NEXT_PUBLIC_AGENT_ID}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': process.env.ELEVEN_LABS_API_KEY,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      let errorDetails = `API request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorDetails += ` - ${JSON.stringify(errorData)}`;
      } catch (e) {
        // If the error response is not JSON, try to get it as text
        const errorText = await response.text();
        errorDetails += ` - ${errorText}`;
      }
      throw new Error(errorDetails);
    }

    const data = await response.json()
    return { signedUrl: data.signed_url }
  } catch (error) {
    console.error('Server Action Error:', error)
    // Propagate the more detailed error message
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to get signed URL due to an unexpected error.');
  }
}
