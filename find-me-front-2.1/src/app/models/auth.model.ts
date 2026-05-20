// auth.model.ts

// Define the interface for the authentication request
export interface AuthenticationRequest {
    email: string;
    password: string;
  }
  
  // Define the interface for the authentication response
  export interface AuthenticationResponse {
    token: string;
  }
  