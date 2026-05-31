import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import RoutePlanner from "./components/RoutePlanner";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoutePlanner />} />
        <Route path="/route/:token" element={<RoutePlanner />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
