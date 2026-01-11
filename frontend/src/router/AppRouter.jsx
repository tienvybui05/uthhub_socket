import { Route, Routes } from "react-router-dom";
import Messages from "../views/Messages/Messages";
import Login from "../views/Auth/Login/Login";
import Register from "../views/Auth/Register/Register";

function AppRouter() {
  return (
    <>
      <Routes>
        <Route path="/messages" element={<Messages />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </>
  );
}
export default AppRouter;
