import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Mail,
  ArrowLeft,
  CheckCircle,
  Lock,
  Eye,
  EyeOff,
  Clock,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

type Step = "email" | "otp" | "newPassword" | "success";

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  // OTP timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setStep("otp");
        setOtpTimer(300); // 5 minutes
        toast({
          title: "OTP sent!",
          description: "Check your email for the 6-digit verification code.",
        });
      } else {
        throw new Error(data.message || "Failed to send OTP");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code sent to your email.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, otp }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setStep("newPassword");
        toast({
          title: "OTP verified!",
          description: "Please enter your new password.",
        });
      } else {
        throw new Error(data.message || "Invalid OTP");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Invalid or expired OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      toast({
        title: "Password requirements",
        description: "Password must contain uppercase, lowercase, and number.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, otp, newPassword }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setStep("success");
        toast({
          title: "Password reset successful!",
          description: "You can now log in with your new password.",
        });
      } else {
        throw new Error(data.message || "Failed to reset password");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;

    setIsLoading(true);
    try {
      await handleEmailSubmit(new Event("submit") as any);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Step 1: Email Input */}
            {step === "email" && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Forgot your password?
                  </h1>
                  <p className="text-gray-600">
                    Enter your email address and we'll send you a 6-digit
                    verification code to reset your password.
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-brand-red hover:bg-red-600"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      "Send verification code"
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center text-sm text-brand-red hover:text-red-600 hover:underline"
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to login
                  </Link>
                </div>
              </>
            )}

            {/* Step 2: OTP Verification */}
            {step === "otp" && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Enter verification code
                  </h1>
                  <p className="text-gray-600">
                    We've sent a 6-digit code to <strong>{email}</strong>
                  </p>
                  {otpTimer > 0 && (
                    <div className="flex items-center justify-center mt-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {Math.floor(otpTimer / 60)}:
                      {(otpTimer % 60).toString().padStart(2, "0")}
                    </div>
                  )}
                </div>

                <form onSubmit={handleOtpSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="Enter 6-digit code"
                      className="text-center text-2xl tracking-widest"
                      maxLength={6}
                      required
                    />
                    <p className="text-xs text-gray-500 text-center">
                      Check your email for the 6-digit verification code
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-brand-red hover:bg-red-600"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify code"
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center space-y-2">
                  {otpTimer > 0 ? (
                    <p className="text-sm text-gray-500">
                      Didn't receive the code? Wait {Math.floor(otpTimer / 60)}:
                      {(otpTimer % 60).toString().padStart(2, "0")} to resend
                    </p>
                  ) : (
                    <Button
                      onClick={handleResendOtp}
                      variant="ghost"
                      className="text-sm text-brand-red hover:text-red-600"
                      disabled={isLoading}
                    >
                      Resend verification code
                    </Button>
                  )}
                  <div>
                    <Button
                      onClick={() => setStep("email")}
                      variant="ghost"
                      className="text-sm"
                    >
                      <ArrowLeft className="mr-1 h-4 w-4" />
                      Change email
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Step 3: New Password */}
            {step === "newPassword" && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Create new password
                  </h1>
                  <p className="text-gray-600">
                    Choose a strong password for your account
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Must be at least 6 characters with uppercase, lowercase,
                      and number
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-brand-red hover:bg-red-600"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting password...
                      </>
                    ) : (
                      "Reset password"
                    )}
                  </Button>
                </form>
              </>
            )}

            {/* Step 4: Success */}
            {step === "success" && (
              <div className="text-center">
                <div className="mb-6">
                  <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Password reset successful!
                </h1>
                <p className="text-gray-600 mb-8">
                  Your password has been successfully reset. You can now log in
                  with your new password.
                </p>

                <Button
                  onClick={() => navigate("/login")}
                  className="w-full bg-brand-red hover:bg-red-600"
                >
                  Continue to login
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ForgotPassword;
