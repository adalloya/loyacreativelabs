import axios from "axios";

// Environment variables
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const META_VERSION = "v19.0";

if (!META_ACCESS_TOKEN || !META_PHONE_NUMBER_ID) {
    console.warn("Meta API keys are missing. WhatsApp integration will not work.");
}

export const whatsappService = {
    // Send a text message
    async sendText(to: string, body: string) {
        try {
            const url = `https://graph.facebook.com/${META_VERSION}/${META_PHONE_NUMBER_ID}/messages`;
            const data = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: to,
                type: "text",
                text: { preview_url: false, body: body },
            };

            const response = await axios.post(url, data, {
                headers: {
                    Authorization: `Bearer ${META_ACCESS_TOKEN}`,
                    "Content-Type": "application/json",
                },
            });
            return response.data;
        } catch (error: any) {
            console.error("Error sending WhatsApp message:", error.response?.data || error.message);
            throw error;
        }
    },

    // Mark a message as read
    async markAsRead(messageId: string) {
        try {
            const url = `https://graph.facebook.com/${META_VERSION}/${META_PHONE_NUMBER_ID}/messages`;
            const data = {
                messaging_product: "whatsapp",
                status: "read",
                message_id: messageId,
            };

            await axios.post(url, data, {
                headers: {
                    Authorization: `Bearer ${META_ACCESS_TOKEN}`,
                    "Content-Type": "application/json",
                },
            });
        } catch (error: any) {
            console.error("Error marking message as read:", error.response?.data || error.message);
        }
    },

    // Download media (audio/image)
    async downloadMedia(mediaId: string): Promise<ArrayBuffer> {
        try {
            // 1. Get Media URL
            const urlResponse = await axios.get(
                `https://graph.facebook.com/${META_VERSION}/${mediaId}`,
                {
                    headers: { Authorization: `Bearer ${META_ACCESS_TOKEN}` },
                }
            );
            const mediaUrl = urlResponse.data.url;

            // 2. Download Binary Data
            const binaryResponse = await axios.get(mediaUrl, {
                headers: { Authorization: `Bearer ${META_ACCESS_TOKEN}` },
                responseType: "arraybuffer",
            });

            return binaryResponse.data;
        } catch (error: any) {
            console.error("Error downloading media:", error.response?.data || error.message);
            throw error;
        }
    }
};
