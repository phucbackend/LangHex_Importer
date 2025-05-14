import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../css/speaking.css";
import {
  fetchSpeakingTopics,
  addQuestionToTopic,
  deleteQuestionFromTopic,
  editQuestionInTopic,
  addTopic,
  deleteTopic,
  editTopic,
} from "../Model/SpeakingService";

const SpeakingPage = () => {
  const { levelId } = useParams();
  const upperLevelId = levelId.toUpperCase();
  const [topics, setTopics] = useState([]);
  const [selectedTopicTitle, setSelectedTopicTitle] = useState(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const [editingQuestionKey, setEditingQuestionKey] = useState(null); // Sẽ lưu Firebase key của câu hỏi
  const [editedQuestionText, setEditedQuestionText] = useState("");

  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [showAddTopicInput, setShowAddTopicInput] = useState(false);
  const [editingTopicTitle, setEditingTopicTitle] = useState("");
  const [showEditTopicModal, setShowEditTopicModal] = useState(false);

  const [newTopicError, setNewTopicError] = useState(false);
  const [newQuestionError, setNewQuestionError] = useState(false);
  const [editQuestionError, setEditQuestionError] = useState(false);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null); // Sẽ lưu Firebase key của câu hỏi
  const [topicToDelete, setTopicToDelete] = useState(null); // Sẽ lưu title của chủ đề

  useEffect(() => {
    const loadData = async () => {
      const fetchedTopics = await fetchSpeakingTopics(upperLevelId);
      // Service đã trả về questions là [{key, text}, ...]
      const sortedTopics = fetchedTopics.sort((a, b) =>
        a.title.localeCompare(b.title)
      );
      setTopics(sortedTopics);
    };
    loadData();
  }, [upperLevelId]);

  const refreshTopics = async () => {
    const updatedTopics = await fetchSpeakingTopics(upperLevelId);
    const sortedTopics = updatedTopics.sort((a, b) =>
      a.title.localeCompare(b.title)
    );
    setTopics(sortedTopics);
    return sortedTopics; // Trả về để có thể sử dụng nếu cần
  };

  const handleAddTopic = async () => {
    if (!newTopicTitle.trim()) {
      setNewTopicError(true);
      return;
    }
    await addTopic(upperLevelId, newTopicTitle.trim());
    await refreshTopics();
    setNewTopicTitle("");
    setShowAddTopicInput(false);
    setNewTopicError(false);
  };

  const handleEditTopic = async () => {
    const trimmedNewTitle = editingTopicTitle.trim();

    if (trimmedNewTitle === selectedTopicTitle) {
      setShowEditTopicModal(false);
      return;
    }

    if (!trimmedNewTitle) {
      setNewTopicError(true); // Có thể dùng một state error riêng cho edit topic nếu cần
      return;
    }

    await editTopic(upperLevelId, selectedTopicTitle, trimmedNewTitle);
    await refreshTopics();
    setSelectedTopicTitle(trimmedNewTitle); // Cập nhật selectedTopicTitle sau khi sửa đổi thành công
    setEditingTopicTitle("");
    setShowEditTopicModal(false);
    setNewTopicError(false); // Reset error
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.trim() || !selectedTopicTitle) {
      setNewQuestionError(true);
      return;
    }

    await addQuestionToTopic(
      upperLevelId,
      selectedTopicTitle,
      newQuestion.trim()
    );
    await refreshTopics();
    setNewQuestion("");
    setShowAddInput(false);
    setNewQuestionError(false);
  };

  const handleEditQuestion = async () => {
    // Không cần tham số questionKey ở đây nữa
    if (!editedQuestionText.trim()) {
      setEditQuestionError(true);
      return;
    }

    // editingQuestionKey đã là Firebase key được set khi bấm nút sửa
    await editQuestionInTopic(
      upperLevelId,
      selectedTopicTitle,
      editingQuestionKey,
      editedQuestionText.trim()
    );
    await refreshTopics();
    setEditingQuestionKey(null);
    setEditedQuestionText("");
    setEditQuestionError(false);
  };

  const handleDeleteQuestion = (firebaseQuestionKey) => {
    // Nhận Firebase key
    setShowConfirmDelete(true);
    setQuestionToDelete(firebaseQuestionKey); // Lưu Firebase key để xóa
    setTopicToDelete(null); // Đảm bảo chỉ một loại xóa được thực hiện
  };

  const handleDeleteTopic = (topicTitle) => {
    setShowConfirmDelete(true);
    setTopicToDelete(topicTitle); // Lưu title của chủ đề để xóa
    setQuestionToDelete(null); // Đảm bảo chỉ một loại xóa được thực hiện
  };

  const confirmDelete = async () => {
    if (questionToDelete) {
      // questionToDelete là Firebase key
      await deleteQuestionFromTopic(
        upperLevelId,
        selectedTopicTitle,
        questionToDelete
      );
    } else if (topicToDelete) {
      // topicToDelete là title
      await deleteTopic(upperLevelId, topicToDelete);
    }
    const updatedTopics = await refreshTopics();

    // Nếu chủ đề đang chọn bị xóa, thì bỏ chọn nó
    if (topicToDelete && topicToDelete === selectedTopicTitle) {
      setSelectedTopicTitle(null);
    }
    // Nếu chủ đề chứa câu hỏi bị xóa vẫn là chủ đề đang chọn, không cần thay đổi selectedTopicTitle
    // Trừ khi sau khi xóa câu hỏi, chủ đề không còn câu hỏi nào (logic này tùy thuộc yêu cầu, hiện tại không xử lý)

    setQuestionToDelete(null);
    setTopicToDelete(null);
    setShowConfirmDelete(false);
  };

  const cancelDelete = () => {
    setShowConfirmDelete(false);
    setQuestionToDelete(null);
    setTopicToDelete(null);
  };

  const selectedTopic = topics.find((t) => t.title === selectedTopicTitle);

  return (
    <div
      className={`speaking-container ${showConfirmDelete ? "disable-all" : ""}`}
    >
      <div className="topic-sidebar">
        <h2>Speaking Topics</h2>

        <button
          className="add-topic"
          onClick={() => setShowAddTopicInput(!showAddTopicInput)}
          style={{ marginBottom: "10px" }}
        >
          + Add Topic
        </button>

        {showAddTopicInput && (
          <div style={{ marginBottom: "16px" }}>
            <input
              type="text"
              value={newTopicTitle}
              onChange={(e) => {
                setNewTopicTitle(e.target.value);
                setNewTopicError(false);
              }}
              placeholder="Enter new topic title..."
              style={{
                padding: "8px",
                width: "70%",
                marginRight: "10px",
                border: newTopicError ? "2px solid red" : "1px solid #ccc",
              }}
            />
            <button className="add-question-btn-save" onClick={handleAddTopic}>
              Save
            </button>
          </div>
        )}

        <ul>
          {topics.map((topic) => (
            <li
              key={topic.id} // Sử dụng topic.id (Firebase key của chủ đề) làm key
              className={selectedTopicTitle === topic.title ? "active" : ""}
              onClick={() => {
                setSelectedTopicTitle(topic.title);
                setShowAddInput(false); // Reset input thêm câu hỏi khi chọn topic mới
                setEditingQuestionKey(null); // Reset trạng thái sửa câu hỏi
              }}
            >
              {topic.title}
              <div className="edit-delete-btn-container">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Ngăn li's onClick triggered
                    setSelectedTopicTitle(topic.title); // Đảm bảo topic này được chọn trước khi mở modal
                    setEditingTopicTitle(topic.title);
                    setShowEditTopicModal(true);
                  }}
                  className="edit-topic"
                  style={{ cursor: "pointer" }}
                >
                  📝
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Ngăn li's onClick triggered
                    handleDeleteTopic(topic.title);
                  }}
                  className="delete-topic"
                  style={{ cursor: "pointer" }}
                >
                  ❌
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="topic-detail">
        {selectedTopicTitle && selectedTopic ? ( // Đảm bảo selectedTopic tồn tại
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2>{selectedTopicTitle}</h2>
              <button
                className="add-question-btn"
                onClick={() => {
                  setShowAddInput(!showAddInput);
                  setEditingQuestionKey(null); // Nếu đang sửa, hủy sửa khi bấm add
                  setEditedQuestionText("");
                }}
              >
                + Add Question
              </button>
            </div>

            {showAddInput && (
              <div style={{ marginBottom: "16px" }}>
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => {
                    setNewQuestion(e.target.value);
                    setNewQuestionError(false);
                  }}
                  placeholder="Enter new question..."
                  style={{
                    padding: "8px",
                    width: "70%",
                    marginRight: "10px",
                    border: newQuestionError
                      ? "2px solid red"
                      : "1px solid #ccc",
                  }}
                />
                <button
                  className="add-question-btn" // CSS class có thể cần xem lại nếu khác "add-question-btn-save"
                  onClick={handleAddQuestion}
                >
                  Save
                </button>
              </div>
            )}

            <ul className="question-list">
              {selectedTopic.questions.map((q, idx) => (
                <li key={q.key}>
                  {" "}
                  {/* Sử dụng q.key (Firebase key) làm key */}
                  <strong>{idx + 1}.</strong>{" "}
                  {editingQuestionKey === q.key ? ( // So sánh với q.key
                    <>
                      <input
                        type="text"
                        value={editedQuestionText}
                        onChange={(e) => {
                          setEditedQuestionText(e.target.value);
                          setEditQuestionError(false);
                        }}
                        style={{
                          padding: "8px",
                          marginRight: "10px",
                          width: "70%",
                          border: editQuestionError
                            ? "2px solid red"
                            : "1px solid #ccc",
                        }}
                      />
                      <button
                        onClick={handleEditQuestion} // Không truyền tham số
                        className="add-question-btn" // CSS class
                      >
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      {q.text} {/* Hiển thị q.text */}
                      <div className="edit-delete-btn-container">
                        <button
                          onClick={() => {
                            setShowAddInput(false); // Ẩn input thêm nếu đang mở
                            setEditingQuestionKey(q.key); // Set Firebase key để sửa
                            setEditedQuestionText(q.text); // Set text hiện tại vào input sửa
                            setEditQuestionError(false);
                          }}
                          className="edit-delete-btn edit"
                          style={{
                            border: "1px solid black",
                          }}
                        >
                          📝
                        </button>
                        <button
                          onClick={
                            () => handleDeleteQuestion(q.key) // Truyền Firebase key để xóa
                          }
                          className="edit-delete-btn delete"
                          style={{
                            border: "1px solid black",
                          }}
                          disabled={selectedTopic.questions.length <= 1}
                        >
                          ❌
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>Select a topic to view questions.</p>
        )}
      </div>

      {showEditTopicModal && (
        <div className="edit-topic-modal">
          <div className="modal-content">
            <h3>Edit Topic Title</h3>
            <input
              type="text"
              value={editingTopicTitle}
              onChange={(e) => {
                setEditingTopicTitle(e.target.value);
                setNewTopicError(false); // Reset error khi thay đổi
              }}
              placeholder="Enter new topic title..."
              style={{
                border: newTopicError ? "2px solid red" : "1px solid #ccc", // Thêm style error
              }}
            />
            <button className="btn-modal-save" onClick={handleEditTopic}>
              Save
            </button>
            <button
              className="btn-modal-cancel"
              onClick={() => {
                setShowEditTopicModal(false);
                setNewTopicError(false); // Reset error khi hủy
                setEditingTopicTitle(""); // Xóa title đang sửa
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showConfirmDelete && (
        <div className="confirm-delete-modal">
          <div className="modal-content">
            <h3>Are you sure you want to delete this?</h3>
            <button onClick={confirmDelete}>Yes</button>
            <button onClick={cancelDelete}>No</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeakingPage;
