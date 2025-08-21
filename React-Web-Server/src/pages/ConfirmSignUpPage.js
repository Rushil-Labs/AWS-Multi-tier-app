import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CognitoUser, CognitoUserPool } from "amazon-cognito-identity-js";

const poolData = {
  UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
  ClientId: process.env.REACT_APP_COGNITO_CLIENT_ID,
};

const userPool = new CognitoUserPool(poolData);

function ConfirmSignUpPage() {
  const [confirmationCode, setConfirmationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email) {
      setError("Email is missing. Please try signing up again.");
      setLoading(false);
      return;
    }

    const userData = {
      Username: email,
      Pool: userPool,
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.confirmRegistration(confirmationCode, true, (err, result) => {
      setLoading(false);
      
      if (err) {
        setError(err.message || "Error confirming signup");
        return;
      }

      setSuccess(true);
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    });
  };

  const handleResendCode = () => {
    if (!email) {
      setError("Email is missing. Please try signing up again.");
      return;
    }

    const userData = {
      Username: email,
      Pool: userPool,
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.resendConfirmationCode((err) => {
      if (err) {
        setError(err.message || "Error resending code");
        return;
      }
      setError(""); // Clear any existing errors
      setSuccess(false); // Reset success state
      alert("Verification code has been resent to your email.");
    });
  };

  if (!email) {
    return (
      <div style={styles.container}>
        <h2>Error</h2>
        <p>No email found. Please try signing up again.</p>
        <button 
          onClick={() => navigate("/signup")}
          style={styles.button}
        >
          Go to Sign Up
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Confirm Your Email</h2>
      <p style={styles.instruction}>
        Please enter the verification code sent to {email}
      </p>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <input
            type="text"
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
            placeholder="Enter verification code"
            style={styles.input}
            required
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={styles.button}
        >
          {loading ? "Confirming..." : "Confirm Sign Up"}
        </button>

        <button 
          type="button"
          onClick={handleResendCode}
          style={styles.resendButton}
        >
          Resend Code
        </button>
      </form>

      {error && <p style={styles.error}>{error}</p>}
      {success && (
        <p style={styles.success}>
          Email confirmed successfully! Redirecting to login...
        </p>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "400px",
    margin: "2rem auto",
    padding: "2rem",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
  },
  heading: {
    marginBottom: "1rem",
    textAlign: "center",
    color: "#111827"
  },
  instruction: {
    marginBottom: "2rem",
    textAlign: "center",
    color: "#4b5563"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem"
  },
  inputGroup: {
    marginBottom: "1rem"
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "1rem"
  },
  button: {
    backgroundColor: "#03b723",
    color: "#ffffff",
    padding: "0.75rem 1rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: "#029b1f"
    }
  },
  resendButton: {
    backgroundColor: "transparent",
    color: "#2563eb",
    padding: "0.75rem 1rem",
    border: "none",
    cursor: "pointer",
    fontSize: "0.875rem"
  },
  error: {
    color: "#dc2626",
    marginTop: "1rem",
    textAlign: "center"
  },
  success: {
    color: "#059669",
    marginTop: "1rem",
    textAlign: "center"
  }
};

export default ConfirmSignUpPage;
