import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import { useAuthStore } from "../store/auth.store.js";

function RootLayout() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <Outlet />;
}

export default RootLayout;
