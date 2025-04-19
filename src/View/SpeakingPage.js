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
  const [editingQuestionKey, setEditingQuestionKey] = useState(null);
  const [editedQuestionText, setEditedQuestionText] = useState("");

  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [showAddTopicInput, setShowAddTopicInput] = useState(false);
  const [editingTopicTitle, setEditingTopicTitle] = useState("");
  const [showEditTopicModal, setShowEditTopicModal] = useState(false); // Popup modal state

  const [newTopicError, setNewTopicError] = useState(false);
  const [newQuestionError, setNewQuestionError] = useState(false);
  const [editQuestionError, setEditQuestionError] = useState(false);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false); // Modal for confirming delete
  const [questionToDelete, setQuestionToDelete] = useState(null); // Question to delete
  const [topicToDelete, setTopicToDelete] = useState(null); // Topic to delete

  useEffect(() => {
    const loadData = async () => {
      const fetchedTopics = await fetchSpeakingTopics(upperLevelId);
      const sortedTopics = fetchedTopics.sort((a, b) =>
        a.title.localeCompare(b.title)
      );
      setTopics(sortedTopics);
    };
    loadData();
  }, [upperLevelId]);

  const handleAddTopic = async () => {
    if (!newTopicTitle.trim()) {
      setNewTopicError(true);
      return;
    }
    await addTopic(upperLevelId, newTopicTitle.trim());
    const updatedTopics = await fetchSpeakingTopics(upperLevelId);
    const sortedTopics = updatedTopics.sort((a, b) =>
      a.title.localeCompare(b.title)
    );
    setTopics(sortedTopics);
    setNewTopicTitle("");
    setShowAddTopicInput(false);
    setNewTopicError(false);
  };

  const handleEditTopic = async () => {
    const trimmedNewTitle = editingTopicTitle.trim();

    // Kiểm tra nếu tiêu đề không thay đổi
    if (trimmedNewTitle === selectedTopicTitle) {
      setShowEditTopicModal(false);
      return;
    }

    if (!trimmedNewTitle) {
      setNewTopicError(true);
      return;
    }

    await editTopic(upperLevelId, selectedTopicTitle, trimmedNewTitle);
    const updatedTopics = await fetchSpeakingTopics(upperLevelId);
    const sortedTopics = updatedTopics.sort((a, b) =>
      a.title.localeCompare(b.title)
    );
    setTopics(sortedTopics);
    setSelectedTopicTitle(trimmedNewTitle);
    setEditingTopicTitle("");
    setShowEditTopicModal(false);
    setNewTopicError(false);
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.trim() || !selectedTopicTitle) {
      setNewQuestionError(true);
      return;
    }

    await addQuestionToTopic(upperLevelId, selectedTopicTitle, newQuestion);
    const updatedTopics = await fetchSpeakingTopics(upperLevelId);
    const sortedTopics = updatedTopics.sort((a, b) =>
      a.title.localeCompare(b.title)
    );
    setTopics(sortedTopics);
    setNewQuestion("");
    setShowAddInput(false);
    setNewQuestionError(false);
  };

  const handleEditQuestion = async (questionKey) => {
    if (!editedQuestionText.trim()) {
      setEditQuestionError(true);
      return;
    }

    await editQuestionInTopic(
      upperLevelId,
      selectedTopicTitle,
      questionKey,
      editedQuestionText
    );
    const updatedTopics = await fetchSpeakingTopics(upperLevelId);
    const sortedTopics = updatedTopics.sort((a, b) =>
      a.title.localeCompare(b.title)
    );
    setTopics(sortedTopics);
    setEditingQuestionKey(null);
    setEditedQuestionText("");
    setEditQuestionError(false);
  };

  const handleDeleteQuestion = (questionKey) => {
    setShowConfirmDelete(true);
    setQuestionToDelete(questionKey);
  };

  const handleDeleteTopic = (topicTitle) => {
    setShowConfirmDelete(true);
    setTopicToDelete(topicTitle);
  };

  const confirmDelete = async () => {
    if (questionToDelete) {
      await deleteQuestionFromTopic(
        upperLevelId,
        selectedTopicTitle,
        questionToDelete
      );
    } else if (topicToDelete) {
      await deleteTopic(upperLevelId, topicToDelete);
    }
    const updatedTopics = await fetchSpeakingTopics(upperLevelId);
    const sortedTopics = updatedTopics.sort((a, b) =>
      a.title.localeCompare(b.title)
    );
    setTopics(sortedTopics);
    setSelectedTopicTitle(null);
    setShowConfirmDelete(false);
  };

  const cancelDelete = () => {
    setShowConfirmDelete(false);
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
              key={topic.title}
              className={selectedTopicTitle === topic.title ? "active" : ""}
              onClick={() => {
                setSelectedTopicTitle(topic.title);
                setShowAddInput(false);
                setEditingQuestionKey(null);
              }}
            >
              {topic.title}
              <div className="edit-delete-btn-container">
                <button
                  onClick={() => {
                    setEditingTopicTitle(topic.title);
                    setShowEditTopicModal(true); // Open the modal
                  }}
                  className="edit-topic"
                  style={{ cursor: "pointer" }}
                >
                  📝
                </button>
                <button
                  onClick={() => handleDeleteTopic(topic.title)}
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
        {selectedTopicTitle ? (
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
                  setEditingQuestionKey(null);
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
                  className="add-question-btn"
                  onClick={handleAddQuestion}
                >
                  Save
                </button>
              </div>
            )}

            <ul className="question-list">
              {selectedTopic?.questions.map((q, idx) => (
                <li key={idx}>
                  <strong>{idx + 1}.</strong>{" "}
                  {editingQuestionKey === idx ? (
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
                        onClick={() => handleEditQuestion(`question${idx + 1}`)}
                        className="add-question-btn"
                      >
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      {q}
                      <div className="edit-delete-btn-container">
                        <button
                          onClick={() => {
                            setShowAddInput(false);
                            setEditingQuestionKey(idx);
                            setEditedQuestionText(q);
                          }}
                          className="edit-delete-btn edit"
                        >
                          📝
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteQuestion(`question${idx + 1}`)
                          }
                          className="edit-delete-btn delete"
                          disabled={selectedTopic?.questions.length <= 1}
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
              onChange={(e) => setEditingTopicTitle(e.target.value)}
              placeholder="Enter new topic title..."
            />
            <button className="btn-modal-save" onClick={handleEditTopic}>
              Save
            </button>
            <button
              className="btn-modal-cancel"
              onClick={() => setShowEditTopicModal(false)}
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
