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

  // Hàm xử lý điều hướng đến trang kỹ năng tương ứng
  const handleNavigateToSkill = (skillName) => {
    const currentLevelLower = levelId.toLowerCase(); // Đảm bảo levelId là chữ thường
    const skillLower = skillName.toLowerCase(); // Chuyển tên kỹ năng thành chữ thường
    navigate(`/level/${currentLevelLower}/${skillLower}`); // Tạo URL động, ví dụ: /level/a1/listening
  };

  return (
    <div className="home-container">
      {" "}
      {/* Có thể đổi tên class nếu cần */}
      <img src={mapleLeafUrl} alt="Maple Leaf" className="maple-leaf" />
      <div className="sidebar">
        <img
          src={avatarUrl}
          alt="Avatar"
          className="avatar"
          onClick={() => navigate("/")} // Về trang Home
          style={{ cursor: "pointer" }}
        />
        <span
          className="avatar-text"
          onClick={() => navigate("/")} // Về trang Home
          style={{ cursor: "pointer" }}
        >
          LangHex
        </span>
      </div>
      <div className="main-content">
        <h2 className="select-level-text">
          English Level : {levelId.toUpperCase()} {/* Hiển thị Level ID */}
        </h2>
        <div className="button-grid">
          {skills.map(
            (
              skill // Đổi 'level' thành 'skill' cho rõ nghĩa
            ) => (
              <button
                key={skill}
                // Loại bỏ logic class vstep-button không cần thiết ở đây
                className="level-button"
                // Gọi hàm điều hướng khi nhấn nút
                onClick={() => handleNavigateToSkill(skill)}
              >
                {skill} {/* Hiển thị tên kỹ năng */}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default LevelPage;
