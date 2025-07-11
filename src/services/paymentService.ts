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

  // Use proper API URL with fallback
  const apiUrl = "https://pdfpage-app.onrender.com/api";
  const fullUrl = `${apiUrl}/payments/create-order`;

  console.log("Creating payment with:", { options, apiUrl: fullUrl });

  try {
    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(options),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Payment creation failed:", {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      });

      // Handle specific error cases
      if (response.status === 401) {
        throw new Error("Please login to create a payment order");
      } else if (response.status === 400) {
        const errorMessage =
          responseData.message ||
          responseData.errors?.[0]?.msg ||
          "Invalid payment data";
        throw new Error(errorMessage);
      } else if (response.status >= 500) {
        throw new Error(
          "Payment service is temporarily unavailable. Please try again later.",
        );
      } else {
        throw new Error(
          responseData.message || "Failed to create payment order",
        );
      }
    }

    if (!responseData.orderId) {
      throw new Error("Invalid response from payment service");
    }

    return responseData.orderId;
  } catch (error) {
    console.error("Payment creation error:", error);

    // Re-throw with more user-friendly message if it's a network error
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Unable to connect to payment service. Please check your internet connection.",
      );
    }

    throw error;
  }
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

          const apiUrl =
            import.meta.env.VITE_API_URL ||
            "https://pdfpage-app.onrender.com/api";
          const verifyResponse = await fetch(`${apiUrl}/payments/verify`, {
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
          });

          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            resolve(verifyData); // Return the response data including queued plan info
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
