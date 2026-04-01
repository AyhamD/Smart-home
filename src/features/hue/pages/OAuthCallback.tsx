// OAuth callback page - handles redirect from Hue authorization
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useHueAuth } from "../context/HueAuthContext";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthCallback } = useHueAuth();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error) {
        setStatus("error");
        setErrorMessage(errorDescription || error);
        return;
      }

      if (!code || !state) {
        setStatus("error");
        setErrorMessage("Missing authorization code or state");
        return;
      }

      const success = await handleOAuthCallback(code, state);
      
      if (success) {
        setStatus("success");
        // Redirect to dashboard after short delay
        setTimeout(() => navigate("/", { replace: true }), 1500);
      } else {
        setStatus("error");
        setErrorMessage("Failed to complete authentication");
      }
    };

    processCallback();
  }, [searchParams, handleOAuthCallback, navigate]);

  return (
    <div className="oauth-callback-page">
      {status === "processing" && (
        <>
          <div className="loading-spinner"></div>
          <h2>Connecting to Hue...</h2>
          <p>Please wait while we complete authentication.</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="success-icon">✓</div>
          <h2>Connected!</h2>
          <p>Redirecting to dashboard...</p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="error-icon">✗</div>
          <h2>Authentication Failed</h2>
          <p>{errorMessage}</p>
          <button onClick={() => navigate("/", { replace: true })} className="btn-primary">
            Back to Dashboard
          </button>
        </>
      )}
    </div>
  );
};

export default OAuthCallback;
