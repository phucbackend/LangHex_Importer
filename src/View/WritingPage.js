// WritingPage.js
import React, { useState, useEffect, useCallback, useMemo } from "react"; // Import useMemo
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "../css/speaking.css"; // Assuming shared CSS

import {
  fetchWritingTopics,
  addWritingTopic,
  editWritingTopic,
  deleteWritingTopic,
  fetchWritingExercisesForTopic,
  fetchWritingExerciseDetail,
  addWritingExercise,
  editWritingExerciseTitle,
  deleteWritingExercise,
  updateWritingExerciseDetail,
} from "../Model/WritingService";

const WritingPage = () => {
  const { levelId } = useParams();
  const upperLevelId = levelId.toUpperCase();

  // --- State for Topics ---
  const [topics, setTopics] = useState([]);
  const [selectedTopicTitle, setSelectedTopicTitle] = useState(null);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [showAddTopicInput, setShowAddTopicInput] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [topicToEdit, setTopicToEdit] = useState(null);
  const [editingTopicTitle, setEditingTopicTitle] = useState("");
  const [showEditTopicModal, setShowEditTopicModal] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState(null);
  const [showConfirmDeleteTopic, setShowConfirmDeleteTopic] = useState(false);

  // --- State for Exercises ---
  const [topicExercises, setTopicExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [showAddExerciseInput, setShowAddExerciseInput] = useState(false);
  const [newExerciseTitle, setNewExerciseTitle] = useState("");
  const [exerciseToEdit, setExerciseToEdit] = useState(null);
  const [editingExerciseTitle, setEditingExerciseTitle] = useState("");
  const [showEditExerciseModal, setShowEditExerciseModal] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [showConfirmDeleteExercise, setShowConfirmDeleteExercise] =
    useState(false);

  // --- State for Editing Exercise Detail (only script) ---
  // Memoize initialEmptyExerciseData
  const initialEmptyExerciseData = useMemo(() => ({ script: "" }), []); // MODIFIED HERE

  const [currentEditingExerciseData, setCurrentEditingExerciseData] = useState(
    initialEmptyExerciseData
  );
  const [initialExerciseDetailState, setInitialExerciseDetailState] =
    useState(null);

  // --- General Loading/Submitting State ---
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Data Fetching Functions ---

  const loadTopics = useCallback(async () => {
    setIsLoadingTopics(true);
    setSelectedTopicTitle(null);
    setTopicExercises([]);
    setSelectedExercise(null);
    setCurrentEditingExerciseData(initialEmptyExerciseData);
    setInitialExerciseDetailState(null);

    const fetchedTopics = await fetchWritingTopics(upperLevelId);
    const sortedTopics = fetchedTopics.sort((a, b) =>
      a.title.localeCompare(b.title)
    );
    setTopics(sortedTopics);
    setIsLoadingTopics(false);
  }, [upperLevelId, initialEmptyExerciseData]); // initialEmptyExerciseData is now stable

  const loadExercisesForSelectedTopic = useCallback(async () => {
    if (!selectedTopicTitle) {
      setTopicExercises([]); // Clear exercises if no topic is selected
      setSelectedExercise(null);
      setCurrentEditingExerciseData(initialEmptyExerciseData);
      setInitialExerciseDetailState(null);
      return;
    }

    setIsLoadingExercises(true);
    setSelectedExercise(null);
    setCurrentEditingExerciseData(initialEmptyExerciseData);
    setInitialExerciseDetailState(null);

    const fetchedExercises = await fetchWritingExercisesForTopic(
      upperLevelId,
      selectedTopicTitle
    );
    setTopicExercises(fetchedExercises);
    setIsLoadingExercises(false);
  }, [upperLevelId, selectedTopicTitle, initialEmptyExerciseData]); // initialEmptyExerciseData is now stable

  const loadExerciseDetail = useCallback(
    async (exerciseTitle) => {
      if (!selectedTopicTitle || !exerciseTitle) return;

      setIsSubmitting(true);
      const exerciseDetail = await fetchWritingExerciseDetail(
        upperLevelId,
        selectedTopicTitle,
        exerciseTitle
      );
      setIsSubmitting(false);

      if (exerciseDetail) {
        setSelectedExercise(exerciseDetail);
        setCurrentEditingExerciseData(exerciseDetail);
        setInitialExerciseDetailState(JSON.stringify(exerciseDetail));
      } else {
        setSelectedExercise(null);
        setCurrentEditingExerciseData(initialEmptyExerciseData);
        setInitialExerciseDetailState(null);
        // No need to await loadExercisesForSelectedTopic here if it's in useEffect dependency
      }
    },
    [upperLevelId, selectedTopicTitle, initialEmptyExerciseData] // Removed loadExercisesForSelectedTopic, initialEmptyExerciseData is stable
  );

  // --- useEffect Hooks ---
  useEffect(() => {
    loadTopics();
  }, [loadTopics]); // loadTopics is stable due to initialEmptyExerciseData being memoized

  useEffect(() => {
    // This effect will run when selectedTopicTitle changes OR when loadExercisesForSelectedTopic definition changes
    // (which it won't frequently now that initialEmptyExerciseData is memoized)
    if (selectedTopicTitle) {
      loadExercisesForSelectedTopic();
    } else {
      // Clear exercises and selection when topic is deselected
      setTopicExercises([]);
      setSelectedExercise(null);
      setCurrentEditingExerciseData(initialEmptyExerciseData);
      setInitialExerciseDetailState(null);
    }
  }, [
    selectedTopicTitle,
    loadExercisesForSelectedTopic,
    initialEmptyExerciseData,
  ]); // initialEmptyExerciseData is stable

  // --- Handlers for Topics ---

  const handleSelectTopic = (topic) => {
    if (!isSubmitting && topic && topic.title) {
      if (topic.title !== selectedTopicTitle) {
        setSelectedTopicTitle(topic.title);
        setShowAddExerciseInput(false);
      }
    }
  };

  const handleAddTopic = async () => {
    const trimmedTitle = newTopicTitle.trim();
    if (!trimmedTitle) {
      toast.warn("Topic title cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    const success = await addWritingTopic(upperLevelId, trimmedTitle);
    if (success) {
      setNewTopicTitle("");
      setShowAddTopicInput(false);
      await loadTopics(); // loadTopics itself is stable
    }
    setIsSubmitting(false);
  };

  const handleOpenEditTopicModal = (topic) => {
    if (topic && topic.title) {
      setTopicToEdit(topic.title);
      setEditingTopicTitle(topic.title);
      setShowEditTopicModal(true);
    }
  };

  const handleEditTopic = async () => {
    const trimmedNewTitle = editingTopicTitle.trim();
    if (!topicToEdit || !trimmedNewTitle || topicToEdit === trimmedNewTitle) {
      if (topicToEdit === trimmedNewTitle) setShowEditTopicModal(false);
      else toast.warn("Invalid input for renaming topic.");
      return;
    }

    setIsSubmitting(true);
    const success = await editWritingTopic(
      upperLevelId,
      topicToEdit,
      trimmedNewTitle
    );
    setIsSubmitting(false);

    if (success) {
      setShowEditTopicModal(false);
      if (selectedTopicTitle === topicToEdit) {
        setSelectedTopicTitle(trimmedNewTitle); // This will trigger the useEffect for exercises
      } else {
        await loadTopics(); // If a non-selected topic was edited, reload all
      }
    }
  };

  const handleDeleteTopic = (topicTitle) => {
    if (topicTitle) {
      setTopicToDelete(topicTitle);
      setShowConfirmDeleteTopic(true);
    }
  };

  const confirmDeleteTopic = async () => {
    if (topicToDelete) {
      setIsSubmitting(true);
      const success = await deleteWritingTopic(upperLevelId, topicToDelete);
      if (success) {
        setShowConfirmDeleteTopic(false);
        setTopicToDelete(null);
        await loadTopics();
      }
      setIsSubmitting(false);
    }
  };

  const cancelDeleteTopic = () => {
    setTopicToDelete(null);
    setShowConfirmDeleteTopic(false);
  };

  // --- Handlers for Exercises ---

  const handleSelectExercise = (exercise) => {
    if (!isSubmitting && exercise && exercise.title) {
      if (!selectedExercise || exercise.title !== selectedExercise.title) {
        loadExerciseDetail(exercise.title); // loadExerciseDetail is stable
      }
    }
  };

  const handleAddExercise = async () => {
    const trimmedTitle = newExerciseTitle.trim();
    if (!trimmedTitle) {
      toast.warn("Exercise title cannot be empty.");
      return;
    }
    if (!selectedTopicTitle) {
      toast.error("Cannot add exercise: No topic selected.");
      return;
    }

    setIsSubmitting(true);
    const success = await addWritingExercise(
      upperLevelId,
      selectedTopicTitle,
      trimmedTitle
    );
    if (success) {
      setNewExerciseTitle("");
      setShowAddExerciseInput(false);
      await loadExercisesForSelectedTopic(); // loadExercisesForSelectedTopic is stable
    }
    setIsSubmitting(false);
  };

  const handleOpenEditExerciseModal = (exercise) => {
    if (exercise && exercise.title) {
      setExerciseToEdit(exercise.title);
      setEditingExerciseTitle(exercise.title);
      setShowEditExerciseModal(true);
    }
  };

  const handleEditExerciseTitle = async () => {
    const trimmedNewTitle = editingExerciseTitle.trim();
    if (
      !exerciseToEdit ||
      !trimmedNewTitle ||
      exerciseToEdit === trimmedNewTitle
    ) {
      if (exerciseToEdit === trimmedNewTitle) setShowEditExerciseModal(false);
      else toast.warn("Invalid input for renaming exercise.");
      return;
    }
    if (!selectedTopicTitle) return;

    setIsSubmitting(true);
    const success = await editWritingExerciseTitle(
      upperLevelId,
      selectedTopicTitle,
      exerciseToEdit,
      trimmedNewTitle
    );
    setIsSubmitting(false);

    if (success) {
      setShowEditExerciseModal(false);
      if (selectedExercise && selectedExercise.title === exerciseToEdit) {
        setSelectedExercise(null); // Deselect if the edited one was selected
        setCurrentEditingExerciseData(initialEmptyExerciseData);
        setInitialExerciseDetailState(null);
      }
      await loadExercisesForSelectedTopic();
    }
  };

  const handleDeleteExercise = (exerciseTitle) => {
    if (exerciseTitle) {
      setExerciseToDelete(exerciseTitle);
      setShowConfirmDeleteExercise(true);
    }
  };

  const confirmDeleteExercise = async () => {
    if (exerciseToDelete && selectedTopicTitle) {
      setIsSubmitting(true);
      const success = await deleteWritingExercise(
        upperLevelId,
        selectedTopicTitle,
        exerciseToDelete
      );
      if (success) {
        setShowConfirmDeleteExercise(false);
        if (selectedExercise && selectedExercise.title === exerciseToDelete) {
          setSelectedExercise(null);
          setCurrentEditingExerciseData(initialEmptyExerciseData);
          setInitialExerciseDetailState(null);
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

  // --- Handlers for Editing Exercise Detail (only script) ---

  const handleScriptChange = (e) => {
    setCurrentEditingExerciseData((prev) => ({
      ...prev,
      script: e.target.value,
    }));
  };

  const handleSaveChanges = async () => {
    if (!selectedTopicTitle || !selectedExercise || !selectedExercise.title) {
      toast.warn("Please select a topic and an exercise before saving.");
      return;
    }

    if (!currentEditingExerciseData.script.trim()) {
      toast.warn("Writing script cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    const success = await updateWritingExerciseDetail(
      upperLevelId,
      selectedTopicTitle,
      selectedExercise.title,
      currentEditingExerciseData
    );
    if (success) {
      const updatedExerciseData = {
        ...currentEditingExerciseData,
        title: selectedExercise.title,
      };
      setInitialExerciseDetailState(JSON.stringify(updatedExerciseData));
      setSelectedExercise(updatedExerciseData);
      toast.success("Changes saved successfully!");
    }
    setIsSubmitting(false);
  };

  const hasChanges =
    selectedExercise &&
    JSON.stringify(currentEditingExerciseData) !== initialExerciseDetailState;

  // --- Render Logic ---
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
              value={newTopicTitle}
              onChange={(e) => setNewTopicTitle(e.target.value)}
              placeholder="Enter new topic title..."
              style={{
                padding: "8px",
                width: "calc(70% - 5px)",
                marginRight: "5px",
              }}
              disabled={isSubmitting}
            />
            <button
              className="add-question-btn-save"
              onClick={handleAddTopic}
              disabled={isSubmitting || !newTopicTitle.trim()}
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
                    key={topic.title}
                    className={
                      selectedTopicTitle === topic.title ? "active" : ""
                    }
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
                      {topic.title}
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
                        title="Edit Topic Title"
                      >
                        📝
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTopic(topic.title);
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
      </div>{" "}
      <div className="topic-detail">
        {selectedTopicTitle ? (
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
                <h2>{selectedTopicTitle} - Exercises</h2>
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
                    onClick={handleAddExercise}
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
                          key={exercise.title}
                          className={
                            selectedExercise?.title === exercise.title
                              ? "active"
                              : ""
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
                                handleDeleteExercise(exercise.title);
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
            </div>{" "}
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
                      onClick={handleSaveChanges}
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
              )
            )}
          </>
        ) : (
          <p>
            Select a writing topic from the sidebar to manage its exercises.
          </p>
        )}
      </div>{" "}
      {showEditTopicModal && (
        <div className="edit-topic-modal">
          <div className="modal-content">
            <h3>Edit Topic Title</h3>
            <input
              type="text"
              value={editingTopicTitle}
              onChange={(e) => setEditingTopicTitle(e.target.value)}
              placeholder="Enter new topic title..."
              disabled={isSubmitting}
            />
            <div style={{ marginTop: "15px" }}>
              <button
                className="btn-modal-save"
                onClick={handleEditTopic}
                disabled={
                  isSubmitting ||
                  !editingTopicTitle.trim() ||
                  editingTopicTitle.trim() === topicToEdit
                }
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
              <button
                className="btn-modal-cancel"
                onClick={() => !isSubmitting && setShowEditTopicModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showConfirmDeleteTopic && (
        <div className="confirm-delete-modal">
          <div className="modal-content">
            <h3>Delete Topic "{topicToDelete}"?</h3>
            <p>
              This will delete the topic and <strong>all its exercises</strong>.
              This action cannot be undone.
            </p>
            <div style={{ marginTop: "15px" }}>
              <button
                onClick={confirmDeleteTopic}
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
      {showEditExerciseModal && (
        <div className="edit-topic-modal">
          <div className="modal-content">
            <h3>Edit Exercise Title</h3>
            <p>Topic: {selectedTopicTitle}</p>
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
                onClick={handleEditExerciseTitle}
                disabled={
                  isSubmitting ||
                  !editingExerciseTitle.trim() ||
                  editingExerciseTitle.trim() === exerciseToEdit
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
      {showConfirmDeleteExercise && (
        <div className="confirm-delete-modal">
          <div className="modal-content">
            <h3>Delete Exercise "{exerciseToDelete}"?</h3>
            <p>Topic: {selectedTopicTitle}</p>
            <p>
              This will delete the exercise script. This action cannot be
              undone.
            </p>
            <div style={{ marginTop: "15px" }}>
              <button
                onClick={confirmDeleteExercise}
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
