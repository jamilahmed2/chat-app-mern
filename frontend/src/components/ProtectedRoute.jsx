import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
    const token = localStorage.getItem("user");
    return token ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedRoute;
