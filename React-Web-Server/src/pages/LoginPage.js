import React, { useState } from "react";
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from "amazon-cognito-identity-js";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Setup Cognito User Pool
const poolData = {
  UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
  ClientId: process.env.REACT_APP_COGNITO_CLIENT_ID,
};

const userPool = new CognitoUserPool(poolData);

function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const authenticationDetails = new AuthenticationDetails({
      Username: form.username,
      Password: form.password,
    });

    const user = new CognitoUser({
      Username: form.username,
      Pool: userPool,
    });

    user.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        console.log("Login success:", result);
        setSuccess(true);
        
        // Get user attributes after successful login
        user.getUserAttributes(async (err, attributes) => {
          if (err) {
            console.error("Error getting user attributes:", err);
            setLoading(false);
            return;
          }
          
          // Convert array of attributes to an object
          const userAttributes = {};
          if (Array.isArray(attributes)) {
            attributes.forEach(attr => {
              userAttributes[attr.Name] = attr.Value;
            });
          }
          
          // Track user in backend
          try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/users`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${result.getAccessToken().getJwtToken()}`
              },
              body: JSON.stringify({
                sub: userAttributes.sub,
                email: userAttributes.email,
                name: userAttributes['custom:FirstName']
              })
            });
            
            if (!response.ok) {
              console.error('Failed to track user:', await response.text());
            }
          } catch (err) {
            console.error('Error tracking user:', err);
          }

          // Call login from AuthContext with user info
          login({ cognitoUser: user, attributes: userAttributes });
          
          setLoading(false);
          // Redirect to home page
          window.location.href = "/";
        });
      },
      onFailure: (err) => {
        console.error("Login failed:", err);
        setError(err.message || "Authentication failed");
        setLoading(false);
      },
    });
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: "2rem" }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label>Username:</label>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label>Password:</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            style={{ width: "100%" }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: "#03b723",
            color: "#fff",
            padding: "0.5rem 1rem",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>Login successful!</p>}
      <p style={{ marginTop: "1rem" }}>
        Don’t have an account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
}

export default LoginPage;
