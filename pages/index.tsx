import React, { useState } from "react";
import { useRouter } from "next/router";
import AuthLayout from "@/components/Layout/AuthLayout";

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (email && password) {
      console.log("Login successful:", { email, password });
      router.push("/dashboard");
    } else {
      alert("Please enter email and password");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <div className="mb-3">
        <input
          type="email"
          className="form-control"
          id="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <input
          type="password"
          className="form-control"
          id="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <input type="checkbox" id="remember" className="form-check-input me-1" />
          <label htmlFor="remember" className="form-check-label">Remember me</label>
        </div>
        <a href="/forgot-password" className="text-decoration-none small">Forgot password?</a>
      </div>

      <button type="submit" className="btn btn-primary w-100">Login</button>

      <div className="text-center mt-3">
        <span>Don't have an account? </span>
        <a href="/register" className="text-decoration-none">Register</a>
      </div>
    </form>
  );
}

LoginPage.Layout = ({ children }: { children: React.ReactNode }) => (
  <AuthLayout
    title="Login"
    imageUrl="https://t3.ftcdn.net/jpg/02/62/71/08/360_F_262710803_CAKuDCLCdRsNLRhyI6hollZZmQrziJrk.jpg"
  >
    {children}
  </AuthLayout>
);


export default LoginPage;
