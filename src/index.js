import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LevelPage from "./View/LevelPage";
import Home from "./View/Home";
import SpeakingPage from "./View/SpeakingPage";
import ListeningPage from "./View/ListeningPage";
import ReadingPage from "./View/ReadingPage";
import WritingPage from "./View/WritingPage";
import PronunciationPage from "./View/PronunciationPage";

import { ToastContainer } from "react-toastify";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/level/:levelId" element={<LevelPage />} />
        <Route path="/level/:levelId/speaking/qa" element={<SpeakingPage />} />
        <Route
          path="/level/:levelId/speaking/pronunciation"
          element={<PronunciationPage />}
        />
        <Route path="/level/:levelId/listening" element={<ListeningPage />} />
        <Route path="/level/:levelId/reading" element={<ReadingPage />} />
        <Route path="/level/:levelId/writing" element={<WritingPage />} />
      </Routes>
    </Router>
    <ToastContainer position="top-right" autoClose={3000} />
  </React.StrictMode>
);
