import { useState } from 'react';
import { isAuthenticated } from '../services/authService';

export const useAuth = () => {
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());

  const refresh = () => setLoggedIn(isAuthenticated());

  return { loggedIn, refresh };
};
