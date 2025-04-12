// Netlify serverless function
export async function handler(event, context) {
  // For now, we'll just return a simple response
  // In a full implementation, you would adapt your Express routes here
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "API is working!" }),
    headers: {
      "Content-Type": "application/json"
    }
  };
}