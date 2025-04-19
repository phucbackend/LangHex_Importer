import React from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

import "../css/levelPage.css";

const LevelPage = () => {
  const { levelId } = useParams();

  const navigate = useNavigate();
  const mapleLeafUrl =
    "https://gallery.yopriceville.com/var/resizes/Free-Clipart-Pictures/Fall-PNG/Fall_Maple_Leaves_PNG_Decorative_Clipart_Image.png?m=1629831497";
  const avatarUrl =
    "https://png.pngtree.com/png-vector/20191101/ourmid/pngtree-cartoon-color-simple-male-avatar-png-image_1934459.jpg";

  const skills = ["Reading", "Listening", "Speaking", "Writing"];

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
        <span
          className="avatar-text"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          LangHex
        </span>
      </div>

      <div className="main-content">
        <h2 className="select-level-text">
          English Level : {levelId.toUpperCase()}
        </h2>
        <div className="button-grid">
          {skills.map((level) => (
            <button
              key={level}
              className={`level-button ${
                skills === "Vstep" ? "vstep-button" : ""
              }`}
              onClick={() => {
                if (level === "Speaking") {
                  navigate(`/level/${levelId.toLowerCase()}/speaking`);
                }
              }}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LevelPage;
