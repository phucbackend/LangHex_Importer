// ListeningPage.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "../css/speaking.css"; // Hoặc Listening.css

import {
  fetchListeningTopics,
  addListeningTopic,
  editListeningTopicName,
  deleteListeningTopic,
  fetchListeningExercisesForTopic,
  fetchListeningExerciseDetail,
  addListeningExercise,
  editListeningExerciseDisplayTitle,
  deleteListeningExercise,
  updateListeningExerciseDetail,
  deleteUserListeningAnswersForQuestion,
} from "../Model/ListeningService";

const ListeningPage = () => {
  const { levelId } = useParams();
  const upperLevelId = levelId.toUpperCase();

  // --- State cho Topics ---
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [showAddTopicInput, setShowAddTopicInput] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [topicToEdit, setTopicToEdit] = useState(null);
  const [editingTopicName, setEditingTopicName] = useState("");
  const [showEditTopicModal, setShowEditTopicModal] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState(null);
  const [showConfirmDeleteTopic, setShowConfirmDeleteTopic] = useState(false);

  // --- State cho Exercises ---
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

  const initialEmptyExerciseDataForDetail = useMemo(
    () => ({ script: "", questions: [] }),
    []
  );
  const [currentEditingExerciseData, setCurrentEditingExerciseData] = useState(
    initialEmptyExerciseDataForDetail
  );
  const [
    initialExerciseDetailStateForComparison,
    setInitialExerciseDetailStateForComparison,
  ] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTopics = useCallback(async () => {
    setIsLoadingTopics(true);
    setSelectedTopic(null);
    const fetchedTopics = await fetchListeningTopics(upperLevelId);
    setTopics(fetchedTopics);
    setIsLoadingTopics(false);
  }, [upperLevelId]);

  const loadExercisesForSelectedTopic = useCallback(async () => {
    if (!selectedTopic || !selectedTopic.id) {
      setTopicExercises([]);
      setSelectedExercise(null);
      setCurrentEditingExerciseData(initialEmptyExerciseDataForDetail);
      setInitialExerciseDetailStateForComparison(null);
      return;
    }
    setIsLoadingExercises(true);
    setSelectedExercise(null);
    setCurrentEditingExerciseData(initialEmptyExerciseDataForDetail);
    setInitialExerciseDetailStateForComparison(null);
    const fetchedExercises = await fetchListeningExercisesForTopic(
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
      const exerciseDetail = await fetchListeningExerciseDetail(
        upperLevelId,
        selectedTopic.id,
        exerciseIdToLoad
      );
      setIsSubmitting(false);
      if (exerciseDetail) {
        setSelectedExercise(exerciseDetail);
        const editableData = {
          script: exerciseDetail.script,
          questions: exerciseDetail.questions,
        };
        setCurrentEditingExerciseData(editableData);
        setInitialExerciseDetailStateForComparison(
          JSON.stringify(editableData)
        );
      } else {
        setSelectedExercise(null);
        setCurrentEditingExerciseData(initialEmptyExerciseDataForDetail);
        setInitialExerciseDetailStateForComparison(null);
        toast.warn("Listening exercise details could not be loaded.");
        await loadExercisesForSelectedTopic();
      }
    },
    [
      upperLevelId,
      selectedTopic,
      loadExercisesForSelectedTopic,
      initialEmptyExerciseDataForDetail,
    ]
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
      setInitialExerciseDetailStateForComparison(null);
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

  const handleAddTopic = async () => {
    const trimmedName = newTopicName.trim();
    if (!trimmedName) {
      toast.warn("Topic name cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    const result = await addListeningTopic(upperLevelId, trimmedName);
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

  const handleEditTopicName = async () => {
    const trimmedNewName = editingTopicName.trim();
    if (
      !topicToEdit ||
      !topicToEdit.id ||
      !trimmedNewName ||
      topicToEdit.topicName === trimmedNewName
    ) {
      if (topicToEdit && topicToEdit.topicName === trimmedNewName) {
        setShowEditTopicModal(false);
      } else {
        toast.warn(
          "New topic name cannot be empty or is the same as the current name."
        );
      }
      return;
    }
    setIsSubmitting(true);
    const success = await editListeningTopicName(
      upperLevelId,
      topicToEdit.id,
      trimmedNewName
    );
    setIsSubmitting(false);
    if (success) {
      setShowEditTopicModal(false);
      await loadTopics();
      if (selectedTopic && selectedTopic.id === topicToEdit.id) {
        setSelectedTopic((prev) => ({ ...prev, topicName: trimmedNewName }));
      }
      setTopicToEdit(null);
    }
  };

  const handleDeleteTopic = (topic) => {
    if (topic && topic.id) {
      setTopicToDelete(topic);
      setShowConfirmDeleteTopic(true);
    }
  };

  const confirmDeleteTopic = async () => {
    if (topicToDelete && topicToDelete.id) {
      setIsSubmitting(true);
      const success = await deleteListeningTopic(
        upperLevelId,
        topicToDelete.id
      );
      setIsSubmitting(false);
      if (success) {
        setShowConfirmDeleteTopic(false);
        const deletedTopicId = topicToDelete.id;
        setTopicToDelete(null);
        await loadTopics();
        if (selectedTopic && selectedTopic.id === deletedTopicId) {
          setSelectedTopic(null);
        }
      }
    }
  };

  const cancelDeleteTopic = () => {
    setTopicToDelete(null);
    setShowConfirmDeleteTopic(false);
  };

  const handleSelectExercise = (exercise) => {
    if (!isSubmitting && exercise && exercise.id) {
      if (!selectedExercise || exercise.id !== selectedExercise.id) {
        if (hasChanges) {
          if (
            !window.confirm(
              "You have unsaved changes in the current exercise. Are you sure you want to switch? Your changes will be lost."
            )
          ) {
            return;
          }
        }
        loadExerciseDetail(exercise.id);
      }
    }
  };

  const handleAddExercise = async () => {
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
    const result = await addListeningExercise(
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

  const handleEditExerciseDisplayTitle = async () => {
    const trimmedNewTitle = editingExerciseTitle.trim();
    if (
      !exerciseToEdit ||
      !exerciseToEdit.id ||
      !trimmedNewTitle ||
      (exerciseToEdit.title && exerciseToEdit.title === trimmedNewTitle)
    ) {
      if (exerciseToEdit && exerciseToEdit.title === trimmedNewTitle) {
        setShowEditExerciseModal(false);
      } else {
        toast.warn(
          "New exercise title cannot be empty or is the same as the current title."
        );
      }
      return;
    }
    if (!selectedTopic || !selectedTopic.id) {
      toast.error("No topic selected for this exercise.");
      return;
    }
    setIsSubmitting(true);
    const success = await editListeningExerciseDisplayTitle(
      upperLevelId,
      selectedTopic.id,
      exerciseToEdit.id,
      trimmedNewTitle
    );
    setIsSubmitting(false);
    if (success) {
      setShowEditExerciseModal(false);
      await loadExercisesForSelectedTopic();
      if (selectedExercise && selectedExercise.id === exerciseToEdit.id) {
        setSelectedExercise((prev) => ({ ...prev, title: trimmedNewTitle }));
      }
      setExerciseToEdit(null);
    }
  };

  const handleDeleteExercise = (exercise) => {
    if (exercise && exercise.id) {
      setExerciseToDelete(exercise);
      setShowConfirmDeleteExercise(true);
    }
  };

  const confirmDeleteExercise = async () => {
    if (
      exerciseToDelete &&
      exerciseToDelete.id &&
      selectedTopic &&
      selectedTopic.id
    ) {
      setIsSubmitting(true);
      const success = await deleteListeningExercise(
        upperLevelId,
        selectedTopic.id,
        exerciseToDelete.id
      );
      setIsSubmitting(false);
      if (success) {
        setShowConfirmDeleteExercise(false);
        const deletedExerciseId = exerciseToDelete.id;
        setExerciseToDelete(null);
        await loadExercisesForSelectedTopic();
        if (selectedExercise && selectedExercise.id === deletedExerciseId) {
          setSelectedExercise(null);
          setCurrentEditingExerciseData(initialEmptyExerciseDataForDetail);
          setInitialExerciseDetailStateForComparison(null);
        }
      }
    }
  };

  const cancelDeleteExercise = () => {
    setExerciseToDelete(null);
    setShowConfirmDeleteExercise(false);
  };

  const handleScriptChange = (e) => {
    setCurrentEditingExerciseData((prev) => ({
      ...prev,
      script: e.target.value,
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    setCurrentEditingExerciseData((prev) => {
      const updatedQuestions = [...(prev.questions || [])];
      if (updatedQuestions[index]) {
        updatedQuestions[index] = {
          ...updatedQuestions[index],
          [field]: value,
        };
        return { ...prev, questions: updatedQuestions };
      }
      return prev;
    });
  };

  const handleOptionChange = (qIndex, optionKey, value) => {
    setCurrentEditingExerciseData((prev) => {
      const updatedQuestions = [...(prev.questions || [])];
      if (updatedQuestions[qIndex]) {
        const currentOptions = updatedQuestions[qIndex].options || {
          A: "",
          B: "",
          C: "",
          D: "",
        };
        updatedQuestions[qIndex] = {
          ...updatedQuestions[qIndex],
          options: { ...currentOptions, [optionKey]: value },
        };
        return { ...prev, questions: updatedQuestions };
      }
      return prev;
    });
  };

  const handleCorrectAnswerChange = (qIndex, value) => {
    setCurrentEditingExerciseData((prev) => {
      const updatedQuestions = [...(prev.questions || [])];
      if (updatedQuestions[qIndex]) {
        updatedQuestions[qIndex] = {
          ...updatedQuestions[qIndex],
          correctAnswer: value,
        };
        return { ...prev, questions: updatedQuestions };
      }
      return prev;
    });
  };

  const handleAddQuestion = () => {
    setCurrentEditingExerciseData((prev) => ({
      ...prev,
      questions: [
        ...(Array.isArray(prev.questions) ? prev.questions : []),
        {
          id: `temp_listen_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          questionText: "",
          options: { A: "", B: "", C: "", D: "" },
          correctAnswer: "",
        },
      ],
    }));
  };

  const handleDeleteQuestion = async (indexToDelete) => {
    if (
      !selectedTopic ||
      !selectedTopic.id ||
      !selectedExercise ||
      !selectedExercise.id
    ) {
      toast.warn(
        "Please select a topic and an exercise before deleting a question."
      );
      return;
    }

    const localQuestions = currentEditingExerciseData.questions || [];
    if (indexToDelete < 0 || indexToDelete >= localQuestions.length) {
      console.warn(
        "Invalid index for deleting listening question based on local data:",
        indexToDelete
      );
      toast.warn("Cannot delete listening question: Invalid index.");
      return;
    }

    const exerciseIdForUserAnswers = selectedExercise.id;
    const questionIdentifierForUserAnswers = indexToDelete;

    const exerciseTitle = selectedExercise.title || "this exercise";
    const questionTextPreview =
      localQuestions[indexToDelete]?.questionText.substring(0, 30) + "..." ||
      `Question ${indexToDelete + 1}`;

    if (
      window.confirm(
        `Are you sure you want to delete "${questionTextPreview}" from "${exerciseTitle}"? This will update the database and attempt to delete related user listening answers. This action cannot be undone.`
      )
    ) {
      setIsSubmitting(true);
      try {
        const latestExerciseDetail = await fetchListeningExerciseDetail(
          upperLevelId,
          selectedTopic.id,
          selectedExercise.id
        );

        if (!latestExerciseDetail) {
          toast.error(
            "Failed to fetch the latest listening exercise data. Please try again."
          );
          setIsSubmitting(false);
          return;
        }

        const currentQuestionsFromDB = latestExerciseDetail.questions || [];
        if (
          indexToDelete < 0 ||
          indexToDelete >= currentQuestionsFromDB.length
        ) {
          toast.error(
            "Listening question index is out of sync with the database. Please refresh and try again."
          );
          setIsSubmitting(false);
          await loadExerciseDetail(selectedExercise.id);
          return;
        }

        const newQuestions = currentQuestionsFromDB.filter(
          (_, i) => i !== indexToDelete
        );
        const updatedExerciseDataForApi = {
          script: latestExerciseDetail.script,
          questions: newQuestions,
        };

        const successUpdateExercise = await updateListeningExerciseDetail(
          upperLevelId,
          selectedTopic.id,
          selectedExercise.id,
          updatedExerciseDataForApi
        );

        if (successUpdateExercise) {
          setCurrentEditingExerciseData(updatedExerciseDataForApi);
          setInitialExerciseDetailStateForComparison(
            JSON.stringify(updatedExerciseDataForApi)
          );
          setSelectedExercise((prev) => ({
            ...prev,
            script: updatedExerciseDataForApi.script,
            questions: newQuestions,
          }));
          toast.success(
            "Listening question deleted successfully from the exercise."
          );

          console.log(
            `Proceeding to delete user listening answers for exerciseId: ${exerciseIdForUserAnswers}, questionIndex: ${questionIdentifierForUserAnswers}`
          );
          const userAnswerDeletionResult =
            await deleteUserListeningAnswersForQuestion(
              exerciseIdForUserAnswers,
              questionIdentifierForUserAnswers
            );

          // BỎ TOAST.INFO TẠI ĐÂY
          if (userAnswerDeletionResult.success) {
            console.log(
              `User listening answer deletion status: success, operations: ${userAnswerDeletionResult.operations}`
            );
          } else {
            console.error(
              "Failed to delete user listening answers:",
              userAnswerDeletionResult.message
            );
            // Toast lỗi đã được hiển thị trong service nếu có
          }
        } else {
          await loadExerciseDetail(selectedExercise.id);
        }
      } catch (error) {
        console.error(
          "Error during listening question deletion process:",
          error
        );
        toast.error(
          "An unexpected error occurred while deleting the listening question."
        );
        if (selectedExercise && selectedExercise.id) {
          await loadExerciseDetail(selectedExercise.id);
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSaveChanges = async () => {
    if (
      !selectedTopic ||
      !selectedTopic.id ||
      !selectedExercise ||
      !selectedExercise.id
    ) {
      toast.warn("Please select a topic and an exercise before saving.");
      return;
    }
    if (typeof currentEditingExerciseData.script !== "string") {
      toast.warn("Script data is invalid.");
      return;
    }

    for (const [index, q] of (
      currentEditingExerciseData.questions || []
    ).entries()) {
      if (!q.questionText?.trim()) {
        toast.warn(`Question text cannot be empty for Question ${index + 1}.`);
        return;
      }
      if (!q.correctAnswer || !["A", "B", "C", "D"].includes(q.correctAnswer)) {
        toast.warn(
          `Please select a valid correct answer for Question ${index + 1}.`
        );
        return;
      }
      const options = q.options || {};
      if (["A", "B", "C", "D"].some((key) => !(options[key] || "").trim())) {
        toast.warn(`All options must be filled for Question ${index + 1}.`);
        return;
      }
    }

    setIsSubmitting(true);
    const success = await updateListeningExerciseDetail(
      upperLevelId,
      selectedTopic.id,
      selectedExercise.id,
      currentEditingExerciseData
    );
    if (success) {
      setInitialExerciseDetailStateForComparison(
        JSON.stringify(currentEditingExerciseData)
      );
      setSelectedExercise((prev) => ({
        ...prev,
        script: currentEditingExerciseData.script,
        questions: currentEditingExerciseData.questions,
      }));
      toast.success("Listening exercise changes saved successfully!");
    }
    setIsSubmitting(false);
  };

  const hasChanges = useMemo(() => {
    if (!selectedExercise || initialExerciseDetailStateForComparison === null) {
      return false;
    }
    const currentComparableState = JSON.stringify({
      script: currentEditingExerciseData.script,
      questions: currentEditingExerciseData.questions,
    });
    return currentComparableState !== initialExerciseDetailStateForComparison;
  }, [
    selectedExercise,
    currentEditingExerciseData,
    initialExerciseDetailStateForComparison,
  ]);

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
        <h2>Listening Topics ({upperLevelId})</h2>
        <button
          className="add-topic"
          onClick={() =>
            !isSubmitting && setShowAddTopicInput(!showAddTopicInput)
          }
          style={{ marginBottom: "10px" }}
          disabled={isSubmitting || isLoadingTopics}
        >
          + Add Topic
        </button>
        {showAddTopicInput && (
          <div style={{ marginBottom: "16px", display: "flex" }}>
            <input
              type="text"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              placeholder="Enter new topic name..."
              style={{
                flexGrow: 1,
                marginRight: "5px",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
              disabled={isSubmitting}
            />
            <button
              className="add-question-btn-save"
              onClick={handleAddTopic}
              disabled={isSubmitting || !newTopicName.trim()}
            >
              Save
            </button>
          </div>
        )}
        {isLoadingTopics ? (
          <p>Loading topics...</p>
        ) : (
          <ul>
            {Array.isArray(topics) && topics.length > 0 ? (
              topics.map((topic) => (
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
                      disabled={isSubmitting}
                      title="Edit Topic Name"
                    >
                      📝
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTopic(topic);
                      }}
                      className="delete-topic"
                      disabled={isSubmitting}
                      title="Delete Topic"
                    >
                      ❌
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <li>No listening topics found for level {upperLevelId}.</li>
            )}
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
                    display: "flex",
                  }}
                >
                  <input
                    type="text"
                    value={newExerciseTitle}
                    onChange={(e) => setNewExerciseTitle(e.target.value)}
                    placeholder="Enter new exercise title..."
                    style={{
                      flexGrow: 1,
                      marginRight: "5px",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                    disabled={isSubmitting}
                  />
                  <button
                    className="add-question-btn-save"
                    onClick={handleAddExercise}
                    disabled={isSubmitting || !newExerciseTitle.trim()}
                  >
                    Save Exercise
                  </button>
                </div>
              )}
              {isLoadingExercises ? (
                <p>Loading exercises for {selectedTopic.topicName}...</p>
              ) : (
                <ul className="exercise-list">
                  {Array.isArray(topicExercises) &&
                  topicExercises.length > 0 ? (
                    topicExercises.map((exercise) => (
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
                            disabled={isSubmitting}
                            title="Edit Exercise Title"
                          >
                            📝
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteExercise(exercise);
                            }}
                            className="delete-topic"
                            disabled={isSubmitting}
                            title="Delete Exercise"
                          >
                            ❌
                          </button>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li>No listening exercises found for this topic.</li>
                  )}
                </ul>
              )}
            </div>

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
                  <h2>Edit: {selectedExercise.title}</h2>
                  {hasChanges && (
                    <button
                      className="add-question-btn-save"
                      onClick={handleSaveChanges}
                      disabled={isSubmitting}
                      style={{
                        backgroundColor: "#4CAF50",
                        color: "white",
                        padding: "8px 16px",
                      }}
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  )}
                </div>
                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <label
                    htmlFor="listeningScript"
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Audio Script / URL:
                  </label>
                  <textarea
                    id="listeningScript"
                    value={currentEditingExerciseData.script}
                    onChange={handleScriptChange}
                    placeholder="Enter audio script or URL here..."
                    rows={6}
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
                <div className="questions-section">
                  <h3
                    style={{
                      borderBottom: "1px solid #eee",
                      paddingBottom: "10px",
                      marginBottom: "15px",
                    }}
                  >
                    Questions
                  </h3>
                  {currentEditingExerciseData &&
                    Array.isArray(currentEditingExerciseData.questions) &&
                    currentEditingExerciseData.questions.map((q, index) => (
                      <div
                        key={q.id || `question-${index}`}
                        className="question-item"
                        style={{
                          border: "1px solid #ddd",
                          padding: "15px",
                          marginBottom: "15px",
                          borderRadius: "5px",
                          backgroundColor: "#f9f9f9",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "10px",
                          }}
                        >
                          <strong>Question {index + 1}</strong>
                          <button
                            onClick={() => handleDeleteQuestion(index)}
                            style={{
                              cursor: "pointer",
                              color: "red",
                              background: "none",
                              border: "none",
                              fontSize: "1.2em",
                            }}
                            disabled={isSubmitting}
                            title="Delete This Question"
                          >
                            ❌
                          </button>
                        </div>
                        <div
                          className="form-group"
                          style={{ marginBottom: "10px" }}
                        >
                          <label
                            style={{ display: "block", marginBottom: "3px" }}
                          >
                            Question Text:
                          </label>
                          <input
                            type="text"
                            value={q.questionText || ""}
                            onChange={(e) =>
                              handleQuestionChange(
                                index,
                                "questionText",
                                e.target.value
                              )
                            }
                            placeholder="Enter question text"
                            style={{
                              width: "100%",
                              padding: "8px",
                              border: "1px solid #ccc",
                              borderRadius: "3px",
                            }}
                            disabled={isSubmitting}
                          />
                        </div>
                        <div
                          className="form-group options-group"
                          style={{ marginBottom: "10px" }}
                        >
                          <label
                            style={{ display: "block", marginBottom: "5px" }}
                          >
                            Options & Correct Answer:
                          </label>
                          {["A", "B", "C", "D"].map((optionKey) => (
                            <div
                              key={optionKey}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                marginBottom: "5px",
                              }}
                            >
                              <input
                                type="radio"
                                name={`correctAnswer_Listening_${
                                  selectedExercise.id
                                }_${q.id || index}`}
                                value={optionKey}
                                checked={q.correctAnswer === optionKey}
                                onChange={(e) =>
                                  handleCorrectAnswerChange(
                                    index,
                                    e.target.value
                                  )
                                }
                                style={{
                                  marginRight: "8px",
                                  cursor: "pointer",
                                }}
                                disabled={isSubmitting}
                              />
                              <span
                                style={{
                                  marginRight: "5px",
                                  fontWeight: "bold",
                                  minWidth: "20px",
                                }}
                              >
                                {optionKey}.
                              </span>
                              <input
                                type="text"
                                value={
                                  (q.options && q.options[optionKey]) || ""
                                }
                                onChange={(e) =>
                                  handleOptionChange(
                                    index,
                                    optionKey,
                                    e.target.value
                                  )
                                }
                                placeholder={`Option ${optionKey}`}
                                style={{
                                  flexGrow: 1,
                                  padding: "6px",
                                  border: "1px solid #ccc",
                                  borderRadius: "3px",
                                }}
                                disabled={isSubmitting}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  <button
                    onClick={handleAddQuestion}
                    className="add-question-btn"
                    disabled={isSubmitting}
                  >
                    + Add Question
                  </button>
                </div>
              </div>
            ) : (
              !isLoadingExercises && (
                <p
                  style={{
                    marginTop: "20px",
                    fontStyle: "italic",
                    color: "#555",
                    textAlign: "center",
                  }}
                >
                  Select a listening exercise to view or edit its details.
                </p>
              )
            )}
          </>
        ) : (
          !isLoadingTopics && (
            <p
              style={{
                textAlign: "center",
                marginTop: "20px",
                fontStyle: "italic",
                color: "#777",
              }}
            >
              Select a listening topic from the sidebar to manage its exercises.
              If no topics exist, please add one.
            </p>
          )
        )}
      </div>

      {showEditTopicModal && topicToEdit && (
        <div className="edit-topic-modal">
          {" "}
          <div className="modal-content">
            {" "}
            <h3>Edit Listening Topic Name</h3>{" "}
            <input
              type="text"
              value={editingTopicName}
              onChange={(e) => setEditingTopicName(e.target.value)}
              placeholder="Enter new topic name..."
              disabled={isSubmitting}
              style={{ width: "100%", padding: "10px", marginBottom: "15px" }}
            />{" "}
            <div>
              {" "}
              <button
                className="btn-modal-save"
                onClick={handleEditTopicName}
                disabled={
                  isSubmitting ||
                  !editingTopicName.trim() ||
                  editingTopicName.trim() === topicToEdit.topicName
                }
              >
                {" "}
                {isSubmitting ? "Saving..." : "Save"}{" "}
              </button>{" "}
              <button
                className="btn-modal-cancel"
                onClick={() => !isSubmitting && setShowEditTopicModal(false)}
                disabled={isSubmitting}
              >
                {" "}
                Cancel{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}
      {showConfirmDeleteTopic && topicToDelete && (
        <div className="confirm-delete-modal">
          {" "}
          <div className="modal-content">
            {" "}
            <h3>Delete Topic "{topicToDelete.topicName}"?</h3>{" "}
            <p>
              {" "}
              This will delete the topic and <strong>all its exercises</strong>.
              (ID: {topicToDelete.id}) This action cannot be undone.{" "}
            </p>{" "}
            <div>
              {" "}
              <button
                onClick={confirmDeleteTopic}
                disabled={isSubmitting}
                className="confirm-btn"
              >
                {" "}
                {isSubmitting ? "Deleting..." : "Yes, Delete"}{" "}
              </button>{" "}
              <button
                onClick={cancelDeleteTopic}
                disabled={isSubmitting}
                className="cancel-btn"
              >
                {" "}
                No, Cancel{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}
      {showEditExerciseModal && exerciseToEdit && selectedTopic && (
        <div className="edit-topic-modal">
          {" "}
          <div className="modal-content">
            {" "}
            <h3>Edit Listening Exercise Title</h3>{" "}
            <p>
              <strong>Topic:</strong> {selectedTopic?.topicName}
            </p>{" "}
            <p style={{ marginBottom: "10px" }}>
              <strong>Current Title:</strong> {exerciseToEdit?.title}
            </p>{" "}
            <input
              type="text"
              value={editingExerciseTitle}
              onChange={(e) => setEditingExerciseTitle(e.target.value)}
              placeholder="Enter new exercise title..."
              disabled={isSubmitting}
              style={{ width: "100%", padding: "10px", marginBottom: "15px" }}
            />{" "}
            <div>
              {" "}
              <button
                className="btn-modal-save"
                onClick={handleEditExerciseDisplayTitle}
                disabled={
                  isSubmitting ||
                  !editingExerciseTitle.trim() ||
                  (exerciseToEdit &&
                    editingExerciseTitle.trim() === exerciseToEdit.title)
                }
              >
                {" "}
                {isSubmitting ? "Saving..." : "Save"}{" "}
              </button>{" "}
              <button
                className="btn-modal-cancel"
                onClick={() => !isSubmitting && setShowEditExerciseModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}
      {showConfirmDeleteExercise && exerciseToDelete && selectedTopic && (
        <div className="confirm-delete-modal">
          {" "}
          <div className="modal-content">
            {" "}
            <h3>Delete Exercise "{exerciseToDelete?.title}"?</h3>{" "}
            <p>
              <strong>Topic:</strong> {selectedTopic?.topicName}
            </p>{" "}
            <p>
              {" "}
              This will delete the exercise script/audio and all its questions.
              (ID: {exerciseToDelete?.id}) This action cannot be undone.{" "}
            </p>{" "}
            <div>
              {" "}
              <button
                onClick={confirmDeleteExercise}
                disabled={isSubmitting}
                className="confirm-btn"
              >
                {" "}
                {isSubmitting ? "Deleting..." : "Yes, Delete"}{" "}
              </button>{" "}
              <button
                onClick={cancelDeleteExercise}
                disabled={isSubmitting}
                className="cancel-btn"
              >
                No, Cancel
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}
    </div>
  );
};

export default ListeningPage;
