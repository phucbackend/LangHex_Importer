import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/home.css";

const Home = () => {
  const navigate = useNavigate();

  const avatarUrl =
    "https://png.pngtree.com/png-vector/20191101/ourmid/pngtree-cartoon-color-simple-male-avatar-png-image_1934459.jpg";

  const mapleLeafUrl =
    "https://gallery.yopriceville.com/var/resizes/Free-Clipart-Pictures/Fall-PNG/Fall_Maple_Leaves_PNG_Decorative_Clipart_Image.png?m=1629831497";

  const levels = ["Vstep", "A1", "A2", "A3", "A4", "A5", "A6", "A7"];

  const handleNavigate = (level) => {
    navigate(`/level/${level.toLowerCase()}`);
  };

  return (
    <div className="home-container">
      <img src={mapleLeafUrl} alt="Maple Leaf" className="maple-leaf" />
      <div className="sidebar">
        <img
          src={avatarUrl}
          alt="Avatar"
          className="avatar"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        />
        <span className="avatar-text" style={{ cursor: "pointer" }}>
          LangHex
        </span>
      </div>

      <div className="main-content">
        <h2 className="select-level-text">Select English Level</h2>
        <div className="button-grid">
          {levels.map((level) => (
            <button
              key={level}
              className={`level-button ${
                level === "Vstep" ? "vstep-button" : ""
              }`}
              onClick={() => handleNavigate(level)}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
