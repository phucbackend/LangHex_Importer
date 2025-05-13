// src/pages/PronunciationPage.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../css/speaking.css"; // Sử dụng chung CSS hoặc tạo file mới
import {
  fetchPronunciationTopics,
  addPronunciationTopic,
  editPronunciationTopic,
  deletePronunciationTopic,
  addScriptToTopic,
  editScriptInTopic,
  deleteScriptFromTopic,
} from "../Model/PronunciationService"; // Import từ service mới

const PronunciationPage = () => {
  const { levelId } = useParams();
  const upperLevelId = levelId ? levelId.toUpperCase() : "DEFAULT_LEVEL";

  const [topics, setTopics] = useState([]);
  const [selectedTopicTitle, setSelectedTopicTitle] = useState(null);

  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [showAddTopicInput, setShowAddTopicInput] = useState(false);
  const [editingTopicUITitle, setEditingTopicUITitle] = useState("");
  const [showEditTopicModal, setShowEditTopicModal] = useState(false);
  const [currentEditingOldTopicTitle, setCurrentEditingOldTopicTitle] =
    useState(null);

  const [newScript, setNewScript] = useState("");
  const [showAddScriptInput, setShowAddScriptInput] = useState(false);
  const [editingScriptKey, setEditingScriptKey] = useState(null);
  const [editedScriptText, setEditedScriptText] = useState("");
  const [
    currentEditingScriptOriginalText,
    setCurrentEditingScriptOriginalText,
  ] = useState(""); // State to store original script text for comparison

  const [newTopicError, setNewTopicError] = useState(false);
  const [editTopicError, setEditTopicError] = useState(false);
  const [newScriptError, setNewScriptError] = useState(false);
  const [editScriptError, setEditScriptError] = useState(false);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!upperLevelId) return;
      const fetchedTopics = await fetchPronunciationTopics(upperLevelId);
      const sortedTopics = fetchedTopics.sort((a, b) =>
        a.title.localeCompare(b.title)
      );
      setTopics(sortedTopics);
    };
    loadData();
  }, [upperLevelId]);

  const refreshTopics = async () => {
    if (!upperLevelId) return [];
    const updatedTopics = await fetchPronunciationTopics(upperLevelId);
    const sortedTopics = updatedTopics.sort((a, b) =>
      a.title.localeCompare(b.title)
    );
    setTopics(sortedTopics);
    return sortedTopics;
  };

  const handleAddTopic = async () => {
    if (!newTopicTitle.trim()) {
      setNewTopicError(true);
      return;
    }
    await addPronunciationTopic(upperLevelId, newTopicTitle.trim());
    await refreshTopics();
    setNewTopicTitle("");
    setShowAddTopicInput(false);
    setNewTopicError(false);
  };

  const openEditTopicModal = (topic) => {
    setCurrentEditingOldTopicTitle(topic.title);
    setEditingTopicUITitle(topic.title);
    setShowEditTopicModal(true);
    setEditTopicError(false);
  };

  const handleEditTopic = async () => {
    const trimmedNewTitle = editingTopicUITitle.trim();
    if (!trimmedNewTitle) {
      setEditTopicError(true);
      return;
    }
    if (trimmedNewTitle === currentEditingOldTopicTitle) {
      setShowEditTopicModal(false);
      return;
    }
    await editPronunciationTopic(
      upperLevelId,
      currentEditingOldTopicTitle,
      trimmedNewTitle
    );
    const refreshedTopics = await refreshTopics();
    // Update selectedTopicTitle if the currently selected topic was renamed
    if (selectedTopicTitle === currentEditingOldTopicTitle) {
      const newFoundTopic = refreshedTopics.find(
        (t) =>
          t.id ===
          topics.find((topic) => topic.title === currentEditingOldTopicTitle)
            ?.id
      );
      setSelectedTopicTitle(newFoundTopic ? newFoundTopic.title : null);
    }
    setShowEditTopicModal(false);
    setEditingTopicUITitle("");
    setCurrentEditingOldTopicTitle(null);
  };

  const handleAddScript = async () => {
    if (!newScript.trim() || !selectedTopicTitle) {
      setNewScriptError(true);
      return;
    }
    await addScriptToTopic(upperLevelId, selectedTopicTitle, newScript.trim());
    await refreshTopics();
    setNewScript("");
    setShowAddScriptInput(false);
    setNewScriptError(false);
  };

  const handleEditScript = async () => {
    const trimmedEditedScriptText = editedScriptText.trim();
    if (!trimmedEditedScriptText) {
      setEditScriptError(true);
      return;
    }

    // Compare trimmed current text with trimmed original text
    if (trimmedEditedScriptText === currentEditingScriptOriginalText.trim()) {
      // No changes made, so just exit edit mode
      setEditingScriptKey(null);
      setEditedScriptText("");
      setCurrentEditingScriptOriginalText(""); // Clear the stored original text
      setEditScriptError(false);
      return; // Do nothing further
    }

    // If there are changes, proceed with the update
    await editScriptInTopic(
      upperLevelId,
      selectedTopicTitle,
      editingScriptKey,
      trimmedEditedScriptText // Send the trimmed text
    );
    await refreshTopics(); // Refresh to show updated data
    setEditingScriptKey(null); // Exit edit mode
    setEditedScriptText("");
    setCurrentEditingScriptOriginalText(""); // Clear the stored original text
    setEditScriptError(false);
    // The success toast is handled by editScriptInTopic
  };

  const requestDeleteTopic = (topicTitle) => {
    setItemToDelete({ type: "topic", title: topicTitle });
    setShowConfirmDelete(true);
  };

  const requestDeleteScript = (scriptKey) => {
    setItemToDelete({
      type: "script",
      key: scriptKey,
      topicTitle: selectedTopicTitle,
    });
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === "topic") {
      await deletePronunciationTopic(upperLevelId, itemToDelete.title);
      if (selectedTopicTitle === itemToDelete.title) {
        setSelectedTopicTitle(null);
      }
    } else if (itemToDelete.type === "script") {
      await deleteScriptFromTopic(
        upperLevelId,
        itemToDelete.topicTitle,
        itemToDelete.key
      );
    }

    await refreshTopics();
    setShowConfirmDelete(false);
    setItemToDelete(null);
  };

  const cancelDelete = () => {
    setShowConfirmDelete(false);
    setItemToDelete(null);
  };

  const selectedTopic = topics.find((t) => t.title === selectedTopicTitle);

  return (
    <div
      className={`speaking-container ${showConfirmDelete ? "disable-all" : ""}`}
    >
      <div className="topic-sidebar">
        <h2>Pronunciation Topics</h2>
        <button
          className="add-topic"
          onClick={() => {
            setShowAddTopicInput(!showAddTopicInput);
            setNewTopicError(false);
            // Clear other inputs if necessary
            setEditingScriptKey(null);
            setShowAddScriptInput(false);
          }}
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
              key={topic.id}
              className={selectedTopicTitle === topic.title ? "active" : ""}
              onClick={() => {
                setSelectedTopicTitle(topic.title);
                setShowAddScriptInput(false); // Close add script input when changing topic
                setEditingScriptKey(null); // Close edit script input when changing topic
                setNewScriptError(false);
                setEditScriptError(false);
              }}
            >
              <span className="topic-title-text">{topic.title}</span>
              <div className="topic-actions-buttons">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditTopicModal(topic);
                  }}
                  className="edit-topic-btn"
                  style={{
                    border: "1px solid black",
                  }}
                >
                  📝
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    requestDeleteTopic(topic.title);
                  }}
                  className="delete-topic-btn"
                  style={{
                    border: "1px solid black",
                  }}
                >
                  ❌
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="topic-detail">
        {selectedTopicTitle && selectedTopic ? (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2>{selectedTopicTitle}</h2>
              <button
                className="add-question-btn"
                onClick={() => {
                  setShowAddScriptInput(!showAddScriptInput);
                  setEditingScriptKey(null); // Close edit mode if open
                  setEditedScriptText("");
                  setCurrentEditingScriptOriginalText("");
                  setNewScriptError(false);
                  setEditScriptError(false);
                  if (!showAddScriptInput) setNewScript(""); // Clear new script only when opening
                }}
              >
                + Add Script
              </button>
            </div>

            {showAddScriptInput && (
              <div
                style={{
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "flex-start",
                }}
              >
                <textarea
                  value={newScript}
                  onChange={(e) => {
                    setNewScript(e.target.value);
                    setNewScriptError(false);
                  }}
                  placeholder="Enter new script content..."
                  rows={5}
                  style={{
                    padding: "8px",
                    flexGrow: 1,
                    marginRight: "10px",
                    border: newScriptError ? "2px solid red" : "1px solid #ccc",
                    minHeight: "80px",
                    borderRadius: "4px",
                  }}
                />
                <button
                  className="add-question-btn"
                  onClick={handleAddScript}
                  style={{ flexShrink: 0 }}
                >
                  Save
                </button>
              </div>
            )}

            <ul className="question-list script-list">
              {selectedTopic.scripts.map((script, idx) => (
                <li key={script.key}>
                  {editingScriptKey === script.key ? (
                    <>
                      <textarea
                        value={editedScriptText}
                        onChange={(e) => {
                          setEditedScriptText(e.target.value);
                          setEditScriptError(false);
                        }}
                        rows={5}
                        style={{
                          padding: "10px",
                          flexGrow: 1,
                          border: editScriptError
                            ? "2px solid red"
                            : "1px solid #ccc",
                          borderRadius: "4px",
                          minHeight: "100px",
                          fontFamily: "inherit",
                          fontSize: "inherit",
                        }}
                      />
                      <div className="edit-script-actions">
                        <button
                          onClick={handleEditScript}
                          className="script-action-save-btn"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingScriptKey(null);
                            setEditScriptError(false);
                            setEditedScriptText("");
                            setCurrentEditingScriptOriginalText(""); // Clear stored original text on cancel
                          }}
                          className="script-action-cancel-btn"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className="script-text-content"
                        style={{
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          marginRight: "15px",
                          flexGrow: 1,
                          lineHeight: "1.6",
                        }}
                      >
                        <strong
                          style={{ display: "inline-block", minWidth: "25px" }}
                        >
                          {idx + 1}.
                        </strong>{" "}
                        {script.text}
                      </div>
                      <div className="edit-delete-btn-container script-item-actions">
                        <button
                          onClick={() => {
                            setShowAddScriptInput(false); // Close add script input if open
                            setEditingScriptKey(script.key);
                            setEditedScriptText(script.text);
                            setCurrentEditingScriptOriginalText(script.text); // Store original text when starting edit
                            setEditScriptError(false);
                          }}
                          className="edit-delete-btn edit"
                          style={{
                            border: "1px solid black",
                          }}
                        >
                          📝
                        </button>
                        <button
                          onClick={() => requestDeleteScript(script.key)}
                          className="edit-delete-btn delete"
                          disabled={
                            selectedTopic.scripts.length <= 1 &&
                            selectedTopic.scripts[0].key === script.key
                          }
                          style={{
                            border: "1px solid black",
                          }}
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
          <p>Select a topic to view scripts or add a new one.</p>
        )}
      </div>

      {showEditTopicModal && (
        <div className="edit-topic-modal">
          <div className="modal-content">
            <h3>Edit Topic Title</h3>
            <input
              type="text"
              value={editingTopicUITitle}
              onChange={(e) => {
                setEditingTopicUITitle(e.target.value);
                setEditTopicError(false);
              }}
              placeholder="Enter new topic title..."
              style={{
                border: editTopicError ? "2px solid red" : "1px solid #ccc",
              }}
            />
            <button className="btn-modal-save" onClick={handleEditTopic}>
              Save
            </button>
            <button
              className="btn-modal-cancel"
              onClick={() => {
                setShowEditTopicModal(false);
                setEditTopicError(false);
                setEditingTopicUITitle("");
                setCurrentEditingOldTopicTitle(null);
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
            <h3>Are you sure you want to delete this {itemToDelete?.type}?</h3>
            {itemToDelete?.type === "topic" && (
              <p>This will delete the topic and all its scripts.</p>
            )}
            <button onClick={confirmDelete} className="btn-modal-save">
              Yes
            </button>
            <button onClick={cancelDelete} className="btn-modal-cancel">
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PronunciationPage;
