import { useAuth } from "@/contexts/AuthContext";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentOptions {
  amount: number;
  currency: string;
  planType: "monthly" | "yearly";
  planName: string;
}

export const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const createPayment = async (
  options: PaymentOptions,
): Promise<string> => {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/payments/create-order`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(options),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to create payment order");
  }

  const { orderId } = await response.json();
  return orderId;
};

export const processPayment = async (
  orderId: string,
  userEmail: string,
  userName: string,
  planType: string,
): Promise<void> => {
  const isLoaded = await loadRazorpay();

  if (!isLoaded) {
    throw new Error("Razorpay SDK failed to load");
  }

  return new Promise((resolve, reject) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: planType === "yearly" ? 29900 : 4900, // in paise
      currency: "INR",
      name: "PdfPage Premium",
      description: `${planType === "yearly" ? "Yearly" : "Monthly"} Premium Subscription`,
      image: "/favicon.ico",
      order_id: orderId,
      prefill: {
        email: userEmail,
        name: userName,
      },
      theme: {
        color: "#E5322D",
      },
      handler: async (response: any) => {
        try {
          // Verify payment on backend
          const token = document.cookie
            .split("; ")
            .find((row) => row.startsWith("token="))
            ?.split("=")[1];

          const verifyResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/payments/verify`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                planType,
              }),
            },
          );

          if (verifyResponse.ok) {
            resolve();
          } else {
            reject(new Error("Payment verification failed"));
          }
        } catch (error) {
          reject(error);
        }
      },
      modal: {
        ondismiss: () => {
          reject(new Error("Payment cancelled"));
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  });
};
