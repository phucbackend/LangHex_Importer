import React, { useState } from "react"; // Import useState
import { useNavigate, useParams } from "react-router-dom";
import "../css/levelPage.css"; // Your existing CSS
import "../css/speakingPopup.css"; // CSS for the popup (create this file)

const LevelPage = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();

  // State to control the visibility of the speaking options popup
  const [showSpeakingPopup, setShowSpeakingPopup] = useState(false);

  const mapleLeafUrl =
    "https://gallery.yopriceville.com/var/resizes/Free-Clipart-Pictures/Fall-PNG/Fall_Maple_Leaves_PNG_Decorative_Clipart_Image.png?m=1629831497";
  const avatarUrl =
    "https://png.pngtree.com/png-vector/20191101/ourmid/pngtree-cartoon-color-simple-male-avatar-png-image_1934459.jpg";

  const skills = ["Reading", "Listening", "Speaking", "Writing"];

  // Updated handler for skill button clicks
  const handleSkillButtonClick = (skillName) => {
    if (skillName === "Speaking") {
      setShowSpeakingPopup(true); // Show the popup for "Speaking"
    } else {
      // Navigate directly for other skills
      const currentLevelLower = levelId.toLowerCase();
      const skillLower = skillName.toLowerCase();
      navigate(`/level/${currentLevelLower}/${skillLower}`);
    }
  };

  // Handler for choosing an option from the speaking popup
  const handleSpeakingOptionNavigate = (speakingType) => {
    setShowSpeakingPopup(false); // Close the popup
    const currentLevelLower = levelId.toLowerCase();
    // Navigate to the chosen speaking sub-page
    // Paths suggested:
    // - For Q&A: /level/{levelId}/speaking/qa
    // - For Pronunciation: /level/{levelId}/speaking/pronunciation
    navigate(`/level/${currentLevelLower}/speaking/${speakingType}`);
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
          {skills.map((skill) => (
            <button
              key={skill}
              className="level-button"
              onClick={() => handleSkillButtonClick(skill)} // Updated handler
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      {/* Speaking Options Popup */}
      {showSpeakingPopup && (
        <div className="speaking-popup-overlay">
          <div className="speaking-popup-content">
            <h3>Choose Speaking Practice</h3>
            <button
              className="popup-option-button"
              onClick={() => handleSpeakingOptionNavigate("qa")}
            >
              Question & Answer (Q&A)
            </button>
            <button
              className="popup-option-button"
              onClick={() => handleSpeakingOptionNavigate("pronunciation")}
            >
              Pronunciation
            </button>
            <button
              className="popup-close-button"
              onClick={() => setShowSpeakingPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelPage;
