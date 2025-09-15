'use server';

export async function sendSuggestion(suggestion: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error('Webhook URL not set in environment variables.');
    return;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: suggestion }),
    });

    if (!res.ok) {
      throw new Error(`Failed to send webhook: ${res.statusText}`);
    }
  } catch (error) {
    console.error('Error sending suggestion:', error);
  }
}
