// WritingPage.js (Corrected Syntax for Ternary Operator)
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "../css/speaking.css";

import {
  fetchWritingTopics,
  addWritingTopic,
  editWritingTopicName,
  deleteWritingTopic,
  fetchWritingExercisesForTopic,
  fetchWritingExerciseDetail,
  addWritingExercise,
  editWritingExerciseDisplayTitle,
  deleteWritingExercise,
  updateWritingExerciseScript,
} from "../Model/WritingService";

const WritingPage = () => {
  const { levelId } = useParams();
  const upperLevelId = levelId.toUpperCase();

  // --- State for Topics ---
  const [topics, setTopics] = useState([]); // Array of { id: string, topicName: string }
  const [selectedTopic, setSelectedTopic] = useState(null); // Object { id: string, topicName: string }
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [showAddTopicInput, setShowAddTopicInput] = useState(false);
  const [newTopicName, setNewTopicName] = useState(""); // For adding Topic (display name)

  const [topicToEdit, setTopicToEdit] = useState(null); // Object { id, topicName } of topic to edit
  const [editingTopicName, setEditingTopicName] = useState(""); // New display name for topic
  const [showEditTopicModal, setShowEditTopicModal] = useState(false);

  const [topicToDelete, setTopicToDelete] = useState(null); // Object { id, topicName } of topic to delete
  const [showConfirmDeleteTopic, setShowConfirmDeleteTopic] = useState(false);

  // --- State for Exercises ---
  const [topicExercises, setTopicExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [showAddExerciseInput, setShowAddExerciseInput] = useState(false);
  const [newExerciseTitle, setNewExerciseTitle] = useState(""); // For adding Exercise (display title)

  const [exerciseToEdit, setExerciseToEdit] = useState(null);
  const [editingExerciseTitle, setEditingExerciseTitle] = useState("");
  const [showEditExerciseModal, setShowEditExerciseModal] = useState(false);

  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [showConfirmDeleteExercise, setShowConfirmDeleteExercise] =
    useState(false);

  const initialEmptyExerciseDataForDetail = useMemo(() => ({ script: "" }), []);
  const [currentEditingExerciseData, setCurrentEditingExerciseData] = useState(
    initialEmptyExerciseDataForDetail
  );
  const [
    initialExerciseDetailStateForScript,
    setInitialExerciseDetailStateForScript,
  ] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTopics = useCallback(async () => {
    setIsLoadingTopics(true);
    setSelectedTopic(null);
    setTopicExercises([]);
    setSelectedExercise(null);
    setCurrentEditingExerciseData(initialEmptyExerciseDataForDetail);
    setInitialExerciseDetailStateForScript("");

    const fetchedTopics = await fetchWritingTopics(upperLevelId);
    setTopics(fetchedTopics); // Assumes service sorts them by topicName
    setIsLoadingTopics(false);
  }, [upperLevelId, initialEmptyExerciseDataForDetail]);

  const loadExercisesForSelectedTopic = useCallback(async () => {
    if (!selectedTopic || !selectedTopic.id) {
      setTopicExercises([]);
      setSelectedExercise(null);
      setCurrentEditingExerciseData(initialEmptyExerciseDataForDetail);
      setInitialExerciseDetailStateForScript("");
      return;
    }
    setIsLoadingExercises(true);
    setSelectedExercise(null);
    setCurrentEditingExerciseData(initialEmptyExerciseDataForDetail);
    setInitialExerciseDetailStateForScript("");
    const fetchedExercises = await fetchWritingExercisesForTopic(
      upperLevelId,
      selectedTopic.id
    );
    setTopicExercises(fetchedExercises);
    setIsLoadingExercises(false);
  }, [upperLevelId, selectedTopic, initialEmptyExerciseDataForDetail]);

  const loadExerciseDetail = useCallback(
    async (exerciseIdToLoad) => {
      if (!selectedTopic || !selectedTopic.id || !exerciseIdToLoad) return;
      setIsSubmitting(true);
      const exerciseDetail = await fetchWritingExerciseDetail(
        upperLevelId,
        selectedTopic.id,
        exerciseIdToLoad
      );
      setIsSubmitting(false);
      if (exerciseDetail) {
        setSelectedExercise(exerciseDetail);
        setCurrentEditingExerciseData({ script: exerciseDetail.script });
        setInitialExerciseDetailStateForScript(exerciseDetail.script);
      } else {
        setSelectedExercise(null);
        setCurrentEditingExerciseData(initialEmptyExerciseDataForDetail);
        setInitialExerciseDetailStateForScript("");
      }
    },
    [upperLevelId, selectedTopic, initialEmptyExerciseDataForDetail]
  );

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  useEffect(() => {
    if (selectedTopic && selectedTopic.id) {
      loadExercisesForSelectedTopic();
    } else {
      setTopicExercises([]);
      setSelectedExercise(null);
      setCurrentEditingExerciseData(initialEmptyExerciseDataForDetail);
      setInitialExerciseDetailStateForScript("");
    }
  }, [
    selectedTopic,
    loadExercisesForSelectedTopic,
    initialEmptyExerciseDataForDetail,
  ]);

  const handleSelectTopic = (topic) => {
    if (!isSubmitting && topic && topic.id) {
      if (!selectedTopic || topic.id !== selectedTopic.id) {
        setSelectedTopic(topic);
        setShowAddExerciseInput(false);
      }
    }
  };

  const handleAddTopicOriginal = async () => {
    const trimmedName = newTopicName.trim();
    if (!trimmedName) {
      toast.warn("Topic name cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    const result = await addWritingTopic(upperLevelId, trimmedName);
    if (result.success) {
      setNewTopicName("");
      setShowAddTopicInput(false);
      await loadTopics();
    }
    setIsSubmitting(false);
  };

  const handleOpenEditTopicModal = (topic) => {
    if (topic && topic.id) {
      setTopicToEdit(topic);
      setEditingTopicName(topic.topicName);
      setShowEditTopicModal(true);
    }
  };

  const handleEditTopicOriginal = async () => {
    const trimmedNewName = editingTopicName.trim();
    if (
      !topicToEdit ||
      !topicToEdit.id ||
      !trimmedNewName ||
      topicToEdit.topicName === trimmedNewName
    ) {
      if (topicToEdit && topicToEdit.topicName === trimmedNewName)
        setShowEditTopicModal(false);
      else toast.warn("Invalid input for renaming topic.");
      return;
    }
    setIsSubmitting(true);
    const success = await editWritingTopicName(
      upperLevelId,
      topicToEdit.id,
      trimmedNewName
    );
    setIsSubmitting(false);
    if (success) {
      setShowEditTopicModal(false);
      if (selectedTopic && selectedTopic.id === topicToEdit.id) {
        setSelectedTopic((prev) => ({ ...prev, topicName: trimmedNewName }));
      }
      await loadTopics();
      setTopicToEdit(null);
    }
  };

  const handleDeleteTopicOriginal = (topic) => {
    if (topic && topic.id) {
      setTopicToDelete(topic);
      setShowConfirmDeleteTopic(true);
    }
  };

  const confirmDeleteTopicOriginal = async () => {
    if (topicToDelete && topicToDelete.id) {
      setIsSubmitting(true);
      const success = await deleteWritingTopic(upperLevelId, topicToDelete.id);
      if (success) {
        setShowConfirmDeleteTopic(false);
        setTopicToDelete(null);
        if (selectedTopic && selectedTopic.id === topicToDelete.id) {
          setSelectedTopic(null);
        }
        await loadTopics();
      }
      setIsSubmitting(false);
    }
  };
  const cancelDeleteTopic = () => {
    setTopicToDelete(null);
    setShowConfirmDeleteTopic(false);
  };

  const handleSelectExercise = (exercise) => {
    if (!isSubmitting && exercise && exercise.id) {
      if (!selectedExercise || exercise.id !== selectedExercise.id) {
        loadExerciseDetail(exercise.id);
      }
    }
  };

  const handleAddExerciseOriginal = async () => {
    const trimmedTitle = newExerciseTitle.trim();
    if (!trimmedTitle) {
      toast.warn("Exercise title cannot be empty.");
      return;
    }
    if (!selectedTopic || !selectedTopic.id) {
      toast.error("Cannot add exercise: No topic selected.");
      return;
    }
    setIsSubmitting(true);
    const result = await addWritingExercise(
      upperLevelId,
      selectedTopic.id,
      trimmedTitle
    );
    if (result.success) {
      setNewExerciseTitle("");
      setShowAddExerciseInput(false);
      await loadExercisesForSelectedTopic();
    }
    setIsSubmitting(false);
  };

  const handleOpenEditExerciseModal = (exercise) => {
    if (exercise && exercise.id) {
      setExerciseToEdit(exercise);
      setEditingExerciseTitle(exercise.title);
      setShowEditExerciseModal(true);
    }
  };

  const handleEditExerciseTitleOriginal = async () => {
    const trimmedNewTitle = editingExerciseTitle.trim();
    if (
      !exerciseToEdit ||
      !exerciseToEdit.id ||
      !trimmedNewTitle ||
      exerciseToEdit.title === trimmedNewTitle
    ) {
      if (exerciseToEdit && exerciseToEdit.title === trimmedNewTitle)
        setShowEditExerciseModal(false);
      else toast.warn("Invalid input for renaming exercise.");
      return;
    }
    if (!selectedTopic || !selectedTopic.id) return;

    setIsSubmitting(true);
    const success = await editWritingExerciseDisplayTitle(
      upperLevelId,
      selectedTopic.id,
      exerciseToEdit.id,
      trimmedNewTitle
    );
    setIsSubmitting(false);
    if (success) {
      setShowEditExerciseModal(false);
      if (selectedExercise && selectedExercise.id === exerciseToEdit.id) {
        setSelectedExercise((prev) => ({ ...prev, title: trimmedNewTitle }));
      }
      await loadExercisesForSelectedTopic();
      setExerciseToEdit(null);
    }
  };

  const handleDeleteExerciseOriginal = (exercise) => {
    if (exercise && exercise.id) {
      setExerciseToDelete(exercise);
      setShowConfirmDeleteExercise(true);
    }
  };

  const confirmDeleteExerciseOriginal = async () => {
    if (
      exerciseToDelete &&
      exerciseToDelete.id &&
      selectedTopic &&
      selectedTopic.id
    ) {
      setIsSubmitting(true);
      const success = await deleteWritingExercise(
        upperLevelId,
        selectedTopic.id,
        exerciseToDelete.id
      );
      if (success) {
        setShowConfirmDeleteExercise(false);
        if (selectedExercise && selectedExercise.id === exerciseToDelete.id) {
          setSelectedExercise(null);
          setCurrentEditingExerciseData(initialEmptyExerciseDataForDetail);
          setInitialExerciseDetailStateForScript("");
        }
        setExerciseToDelete(null);
        await loadExercisesForSelectedTopic();
      }
      setIsSubmitting(false);
    }
  };
  const cancelDeleteExercise = () => {
    setExerciseToDelete(null);
    setShowConfirmDeleteExercise(false);
  };

  const handleScriptChange = (e) => {
    setCurrentEditingExerciseData({ script: e.target.value });
  };

  const handleSaveChangesOriginal = async () => {
    if (
      !selectedTopic ||
      !selectedTopic.id ||
      !selectedExercise ||
      !selectedExercise.id
    ) {
      toast.warn("Please select a topic and an exercise before saving script.");
      return;
    }
    setIsSubmitting(true);
    const success = await updateWritingExerciseScript(
      upperLevelId,
      selectedTopic.id,
      selectedExercise.id,
      currentEditingExerciseData.script
    );
    if (success) {
      const newScript = currentEditingExerciseData.script;
      setSelectedExercise((prev) => ({ ...prev, script: newScript }));
      setInitialExerciseDetailStateForScript(newScript);
      toast.success("Changes saved successfully!");
    }
    setIsSubmitting(false);
  };

  const hasChanges =
    selectedExercise &&
    currentEditingExerciseData.script !== initialExerciseDetailStateForScript;

  return (
    <div
      className={`speaking-container ${
        showConfirmDeleteTopic ||
        showEditTopicModal ||
        showConfirmDeleteExercise ||
        showEditExerciseModal
          ? "disable-all"
          : ""
      }`}
    >
      <div className="topic-sidebar">
        <h2>Writing Topics</h2>
        <button
          className="add-topic"
          onClick={() =>
            !isSubmitting && setShowAddTopicInput(!showAddTopicInput)
          }
          style={{ marginBottom: "10px" }}
          disabled={isSubmitting}
        >
          + Add Topic
        </button>
        {showAddTopicInput && (
          <div style={{ marginBottom: "16px" }}>
            <input
              type="text"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              placeholder="Enter new topic name..."
              style={{
                padding: "8px",
                width: "calc(70% - 5px)",
                marginRight: "5px",
              }}
              disabled={isSubmitting}
            />
            <button
              className="add-question-btn-save"
              onClick={handleAddTopicOriginal}
              disabled={isSubmitting || !newTopicName.trim()}
              style={{ width: "auto", padding: "8px 12px" }}
            >
              Save
            </button>
          </div>
        )}
        {isLoadingTopics ? (
          <p>Loading topics...</p>
        ) : (
          <ul>
            {Array.isArray(topics) && topics.length > 0
              ? topics.map((topic) => (
                  <li
                    key={topic.id}
                    className={selectedTopic?.id === topic.id ? "active" : ""}
                    onClick={() => handleSelectTopic(topic)}
                    style={{ pointerEvents: isSubmitting ? "none" : "auto" }}
                  >
                    <span
                      style={{
                        flexGrow: 1,
                        marginRight: "10px",
                        wordBreak: "break-word",
                      }}
                    >
                      {topic.topicName}
                    </span>
                    <div className="edit-delete-btn-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditTopicModal(topic);
                        }}
                        className="edit-topic"
                        style={{ cursor: "pointer" }}
                        disabled={isSubmitting}
                        title="Edit Topic Name"
                      >
                        📝
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTopicOriginal(topic);
                        }}
                        className="delete-topic"
                        style={{ cursor: "pointer" }}
                        disabled={isSubmitting}
                        title="Delete Topic"
                      >
                        ❌
                      </button>
                    </div>
                  </li>
                ))
              : !isLoadingTopics && <li>No topics found.</li>}
          </ul>
        )}
      </div>

      <div className="topic-detail">
        {selectedTopic ? (
          <>
            <div className="exercise-section" style={{ marginBottom: "30px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <h2>{selectedTopic.topicName} - Exercises</h2>
                <button
                  className="add-topic"
                  onClick={() =>
                    !isSubmitting &&
                    setShowAddExerciseInput(!showAddExerciseInput)
                  }
                  disabled={isSubmitting || isLoadingExercises}
                  style={{ width: "auto", padding: "8px 12px" }}
                >
                  + Add Exercise
                </button>
              </div>

              {showAddExerciseInput && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "10px",
                    backgroundColor: "#f0f0f0",
                    borderRadius: "5px",
                  }}
                >
                  <input
                    type="text"
                    value={newExerciseTitle}
                    onChange={(e) => setNewExerciseTitle(e.target.value)}
                    placeholder="Enter new exercise title..."
                    style={{
                      padding: "8px",
                      width: "calc(70% - 5px)",
                      marginRight: "5px",
                    }}
                    disabled={isSubmitting}
                  />
                  <button
                    className="add-question-btn-save"
                    onClick={handleAddExerciseOriginal}
                    disabled={isSubmitting || !newExerciseTitle.trim()}
                    style={{ width: "auto", padding: "8px 12px" }}
                  >
                    Save Exercise
                  </button>
                </div>
              )}

              {isLoadingExercises ? (
                <p>Loading exercises...</p>
              ) : (
                <ul className="exercise-list">
                  {Array.isArray(topicExercises) && topicExercises.length > 0
                    ? topicExercises.map((exercise) => (
                        <li
                          key={exercise.id}
                          className={
                            selectedExercise?.id === exercise.id ? "active" : ""
                          }
                          onClick={() => handleSelectExercise(exercise)}
                          style={{
                            pointerEvents: isSubmitting ? "none" : "auto",
                          }}
                        >
                          <span
                            style={{
                              flexGrow: 1,
                              marginRight: "10px",
                              wordBreak: "break-word",
                            }}
                          >
                            {exercise.title}
                          </span>
                          <div className="edit-delete-btn-container">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditExerciseModal(exercise);
                              }}
                              className="edit-topic"
                              style={{ cursor: "pointer" }}
                              disabled={isSubmitting}
                              title="Edit Exercise Title"
                            >
                              📝
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteExerciseOriginal(exercise);
                              }}
                              className="delete-topic"
                              style={{ cursor: "pointer" }}
                              disabled={isSubmitting}
                              title="Delete Exercise"
                            >
                              ❌
                            </button>
                          </div>
                        </li>
                      ))
                    : !isLoadingExercises && (
                        <li>No exercises found for this topic.</li>
                      )}
                </ul>
              )}
            </div>
            {/* CORRECTED TERNARY OPERATOR FOR SELECTED EXERCISE */}
            {selectedExercise ? (
              <div
                className="exercise-detail-editor"
                style={{ borderTop: "2px solid #ccc", paddingTop: "20px" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <h2>{selectedExercise.title} - Details</h2>
                  {hasChanges && (
                    <button
                      className="add-question-btn-save"
                      onClick={handleSaveChangesOriginal}
                      disabled={isSubmitting}
                      style={{
                        backgroundColor: "#4CAF50",
                        color: "white",
                        width: "auto",
                        padding: "8px 16px",
                      }}
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <label
                    htmlFor="writingScript"
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Writing Script / Prompt:
                  </label>
                  <textarea
                    id="writingScript"
                    value={currentEditingExerciseData.script}
                    onChange={handleScriptChange}
                    placeholder="Enter the writing script or prompt here..."
                    rows={15}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "1rem",
                      lineHeight: "1.5",
                    }}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            ) : (
              // This is the 'else' part for selectedExercise.
              // It directly contains the conditional rendering for !isLoadingExercises.
              !isLoadingExercises && (
                <p
                  style={{
                    marginTop: "20px",
                    fontStyle: "italic",
                    color: "#555",
                  }}
                >
                  Select an exercise from the list above to view or edit its
                  script, or add a new one.
                </p>
              ) // End of the conditional rendering. This is the entire "else" content.
            )}{" "}
            {/* End of selectedExercise ternary operator */}
          </>
        ) : (
          <p>
            {" "}
            Select a writing topic from the sidebar to manage its exercises.{" "}
          </p>
        )}
      </div>

      {showEditTopicModal && topicToEdit && (
        <div className="edit-topic-modal">
          <div className="modal-content">
            <h3>Edit Topic Name</h3>
            <input
              type="text"
              value={editingTopicName}
              onChange={(e) => setEditingTopicName(e.target.value)}
              placeholder="Enter new topic name..."
              disabled={isSubmitting}
            />
            <div style={{ marginTop: "15px" }}>
              <button
                className="btn-modal-save"
                onClick={handleEditTopicOriginal}
                disabled={
                  isSubmitting ||
                  !editingTopicName.trim() ||
                  editingTopicName.trim() === topicToEdit.topicName
                }
              >
                {" "}
                {isSubmitting ? "Saving..." : "Save"}{" "}
              </button>
              <button
                className="btn-modal-cancel"
                onClick={() => !isSubmitting && setShowEditTopicModal(false)}
                disabled={isSubmitting}
              >
                {" "}
                Cancel{" "}
              </button>
            </div>
          </div>
        </div>
      )}
      {showConfirmDeleteTopic && topicToDelete && (
        <div className="confirm-delete-modal">
          <div className="modal-content">
            <h3>Delete Topic "{topicToDelete.topicName}"?</h3>
            <p>
              {" "}
              This will delete the topic and <strong>
                all its exercises
              </strong>{" "}
              . This action cannot be undone.{" "}
            </p>
            <div style={{ marginTop: "15px" }}>
              <button
                onClick={confirmDeleteTopicOriginal}
                disabled={isSubmitting}
                className="confirm-btn"
              >
                {isSubmitting ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                onClick={cancelDeleteTopic}
                disabled={isSubmitting}
                className="cancel-btn"
              >
                No, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditExerciseModal && exerciseToEdit && (
        <div className="edit-topic-modal">
          <div className="modal-content">
            <h3>Edit Exercise Title</h3>
            <p>Topic: {selectedTopic?.topicName}</p>
            <p>Exercise (current): {exerciseToEdit?.title}</p>
            <input
              type="text"
              value={editingExerciseTitle}
              onChange={(e) => setEditingExerciseTitle(e.target.value)}
              placeholder="Enter new exercise title..."
              disabled={isSubmitting}
            />
            <div style={{ marginTop: "15px" }}>
              <button
                className="btn-modal-save"
                onClick={handleEditExerciseTitleOriginal}
                disabled={
                  isSubmitting ||
                  !editingExerciseTitle.trim() ||
                  (exerciseToEdit &&
                    editingExerciseTitle.trim() === exerciseToEdit.title)
                }
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
              <button
                className="btn-modal-cancel"
                onClick={() => !isSubmitting && setShowEditExerciseModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showConfirmDeleteExercise && exerciseToDelete && (
        <div className="confirm-delete-modal">
          <div className="modal-content">
            <h3>Delete Exercise "{exerciseToDelete?.title}"?</h3>
            <p>Topic: {selectedTopic?.topicName}</p>
            <p>
              {" "}
              This will delete the exercise. This action cannot be undone.{" "}
            </p>
            <div style={{ marginTop: "15px" }}>
              <button
                onClick={confirmDeleteExerciseOriginal}
                disabled={isSubmitting}
                className="confirm-btn"
              >
                {isSubmitting ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                onClick={cancelDeleteExercise}
                disabled={isSubmitting}
                className="cancel-btn"
              >
                No, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingPage;
