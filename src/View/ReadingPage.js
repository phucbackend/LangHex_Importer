// ReadingPage.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "../css/speaking.css"; // Hoặc Reading.css

// Import các hàm service của Reading (đã cập nhật)
import {
  fetchReadingTopics,
  addReadingTopic,
  editReadingTopicName,
  deleteReadingTopic,
  fetchReadingExercisesForTopic,
  fetchReadingExerciseDetail,
  addReadingExercise,
  editReadingExerciseDisplayTitle,
  deleteReadingExercise,
  updateReadingExerciseDetail,
} from "../Model/ReadingService";

const ReadingPage = () => {
  const { levelId } = useParams();
  const upperLevelId = levelId.toUpperCase();

  // --- State cho Topics (Sử dụng ID) ---
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

  // --- State cho Exercises (Sử dụng ID) ---
  const [topicExercises, setTopicExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null); // Sẽ chứa { id, title, script, questions }
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [showAddExerciseInput, setShowAddExerciseInput] = useState(false);
  const [newExerciseTitle, setNewExerciseTitle] = useState("");
  const [exerciseToEdit, setExerciseToEdit] = useState(null);
  const [editingExerciseTitle, setEditingExerciseTitle] = useState("");
  const [showEditExerciseModal, setShowEditExerciseModal] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [showConfirmDeleteExercise, setShowConfirmDeleteExercise] =
    useState(false);

  // --- State cho việc chỉnh sửa Exercise Detail (dùng lại "script") ---
  const initialEmptyExerciseDataForDetail = useMemo(
    () => ({ script: "", questions: [] }), // Đổi lại thành script
    []
  );
  // State chứa dữ liệu đang chỉnh sửa (chỉ script và questions)
  const [currentEditingExerciseData, setCurrentEditingExerciseData] = useState(
    initialEmptyExerciseDataForDetail
  );
  // State lưu trữ trạng thái ban đầu của script và questions để so sánh thay đổi
  const [
    initialExerciseDetailStateForComparison,
    setInitialExerciseDetailStateForComparison,
  ] = useState(null); // Sẽ là JSON string của {script, questions}

  // --- State Loading/Submitting chung ---
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Hàm Fetch Dữ Liệu ---

  const loadTopics = useCallback(async () => {
    setIsLoadingTopics(true);
    setSelectedTopic(null);
    setTopicExercises([]);
    setSelectedExercise(null);
    setCurrentEditingExerciseData(initialEmptyExerciseDataForDetail);
    setInitialExerciseDetailStateForComparison(null);
    const fetchedTopics = await fetchReadingTopics(upperLevelId);
    setTopics(fetchedTopics);
    setIsLoadingTopics(false);
  }, [upperLevelId, initialEmptyExerciseDataForDetail]);

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
    const fetchedExercises = await fetchReadingExercisesForTopic(
      upperLevelId,
      selectedTopic.id
    );
    setTopicExercises(fetchedExercises);
    setIsLoadingExercises(false);
  }, [upperLevelId, selectedTopic, initialEmptyExerciseDataForDetail]);

  // Load chi tiết (script, questions) cho một Exercise Reading cụ thể
  const loadExerciseDetail = useCallback(
    async (exerciseIdToLoad) => {
      if (!selectedTopic || !selectedTopic.id || !exerciseIdToLoad) return;
      setIsSubmitting(true);
      const exerciseDetail = await fetchReadingExerciseDetail(
        // Service trả về { id, title, script, questions }
        upperLevelId,
        selectedTopic.id,
        exerciseIdToLoad
      );
      setIsSubmitting(false);
      if (exerciseDetail) {
        setSelectedExercise(exerciseDetail);
        // Lưu phần cần chỉnh sửa và so sánh (script và questions)
        const editableData = {
          script: exerciseDetail.script, // Đổi lại thành script
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
        toast.warn("Exercise details could not be loaded.");
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

  // --- useEffect Hooks ---
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

  // --- Handlers cho Topics (Giữ nguyên) ---
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
    const result = await addReadingTopic(upperLevelId, trimmedName);
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
      } else toast.warn("Invalid input for renaming topic.");
      return;
    }
    setIsSubmitting(true);
    const success = await editReadingTopicName(
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

  const handleDeleteTopic = (topic) => {
    if (topic && topic.id) {
      setTopicToDelete(topic);
      setShowConfirmDeleteTopic(true);
    }
  };

  const confirmDeleteTopic = async () => {
    if (topicToDelete && topicToDelete.id) {
      setIsSubmitting(true);
      const success = await deleteReadingTopic(upperLevelId, topicToDelete.id);
      if (success) {
        setShowConfirmDeleteTopic(false);
        const deletedTopicId = topicToDelete.id;
        setTopicToDelete(null);
        if (selectedTopic && selectedTopic.id === deletedTopicId) {
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

  // --- Handlers cho Exercises (Giữ nguyên logic, chỉ gọi service đúng) ---

  const handleSelectExercise = (exercise) => {
    if (!isSubmitting && exercise && exercise.id) {
      if (!selectedExercise || exercise.id !== selectedExercise.id) {
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
    const result = await addReadingExercise(
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
      exerciseToEdit.title === trimmedNewTitle
    ) {
      if (exerciseToEdit && exerciseToEdit.title === trimmedNewTitle) {
        setShowEditExerciseModal(false);
      } else toast.warn("Invalid input for renaming exercise.");
      return;
    }
    if (!selectedTopic || !selectedTopic.id) return;
    setIsSubmitting(true);
    const success = await editReadingExerciseDisplayTitle(
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
      const success = await deleteReadingExercise(
        upperLevelId,
        selectedTopic.id,
        exerciseToDelete.id
      );
      if (success) {
        setShowConfirmDeleteExercise(false);
        const deletedExerciseId = exerciseToDelete.id;
        setExerciseToDelete(null);
        if (selectedExercise && selectedExercise.id === deletedExerciseId) {
          setSelectedExercise(null);
          setCurrentEditingExerciseData(initialEmptyExerciseDataForDetail);
          setInitialExerciseDetailStateForComparison(null);
        }
        await loadExercisesForSelectedTopic();
      }
      setIsSubmitting(false);
    }
  };

  const cancelDeleteExercise = () => {
    setExerciseToDelete(null);
    setShowConfirmDeleteExercise(false);
  };

  // --- Handlers cho Chỉnh sửa Exercise Detail (dùng lại "script") ---

  // Đổi tên lại handler và state update
  const handleScriptChange = (e) => {
    setCurrentEditingExerciseData((prev) => ({
      ...prev,
      script: e.target.value, // Cập nhật script
    }));
  };

  // Các hàm handle question, option, correct answer giữ nguyên logic cũ
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
          id: `temp_${Date.now()}`,
          questionText: "",
          options: { A: "", B: "", C: "", D: "" },
          correctAnswer: "",
        },
      ],
    }));
  };

  const handleDeleteQuestion = (index) => {
    if (
      index >= 0 &&
      index < (currentEditingExerciseData.questions?.length || 0)
    ) {
      if (window.confirm("Are you sure you want to delete this question?")) {
        setCurrentEditingExerciseData((prev) => ({
          ...prev,
          questions: prev.questions.filter((_, i) => i !== index),
        }));
      }
    } else {
      console.warn("Invalid index for deleting question:", index);
    }
  };

  // --- Handler Lưu Thay Đổi cho Exercise Detail (dùng lại "script") ---
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

    // --- Validation (Kiểm tra script và questions) ---
    if (!currentEditingExerciseData.script?.trim()) {
      // Kiểm tra script
      toast.warn("Script cannot be empty."); // Đổi message
      return;
    }
    // Validation questions giữ nguyên
    for (const [index, q] of (
      currentEditingExerciseData.questions || []
    ).entries()) {
      if (!q.questionText?.trim()) {
        toast.warn(`Question text cannot be empty for Question ${index + 1}.`);
        return;
      }
      if (!q.correctAnswer || !["A", "B", "C", "D"].includes(q.correctAnswer)) {
        toast.warn(
          `Please select a valid correct answer (A, B, C, or D) for Question ${
            index + 1
          }.`
        );
        return;
      }
      const options = q.options || {};
      if (["A", "B", "C", "D"].some((key) => !(options[key] || "").trim())) {
        toast.warn(
          `All options (A, B, C, D) must be filled for Question ${index + 1}.`
        );
        return;
      }
    }
    // --- Kết thúc Validation ---

    setIsSubmitting(true);
    // Gọi service với dữ liệu { script, questions }
    const success = await updateReadingExerciseDetail(
      upperLevelId,
      selectedTopic.id,
      selectedExercise.id,
      currentEditingExerciseData // Truyền object chứa { script, questions }
    );
    if (success) {
      // Cập nhật lại initial state để hasChanges thành false
      setInitialExerciseDetailStateForComparison(
        JSON.stringify(currentEditingExerciseData)
      );
      // Cập nhật lại state selectedExercise
      setSelectedExercise((prev) => ({
        ...prev,
        script: currentEditingExerciseData.script, // Cập nhật script
        questions: currentEditingExerciseData.questions,
      }));
      toast.success("Changes saved successfully!");
    }
    setIsSubmitting(false);
  };

  // Check if changes were made (So sánh JSON string của script và questions)
  const hasChanges = useMemo(() => {
    if (!selectedExercise || initialExerciseDetailStateForComparison === null) {
      return false;
    }
    // So sánh state hiện tại (script & questions) với state ban đầu
    const currentComparableState = JSON.stringify({
      script: currentEditingExerciseData.script, // Đổi lại thành script
      questions: currentEditingExerciseData.questions,
    });
    return currentComparableState !== initialExerciseDetailStateForComparison;
  }, [
    selectedExercise,
    currentEditingExerciseData,
    initialExerciseDetailStateForComparison,
  ]);

  // --- Render Logic (Đổi lại label/placeholder/binding cho script) ---
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
      {/* Sidebar: Danh sách Reading Topics */}
      <div className="topic-sidebar">
        {/* ... (Phần Topic List giữ nguyên như trước, dùng ID) ... */}
        <h2>Reading Topics</h2>
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
              onClick={handleAddTopic}
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
                          handleDeleteTopic(topic);
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

      {/* Detail Area: Exercises List & Exercise Detail Editor */}
      <div className="topic-detail">
        {selectedTopic ? (
          <>
            {/* --- Section Hiển thị Exercises của Topic --- */}
            <div className="exercise-section" style={{ marginBottom: "30px" }}>
              {/* ... (Phần Exercise List giữ nguyên như trước, dùng ID) ... */}
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
                                handleDeleteExercise(exercise);
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

            {/* --- Section Chỉnh sửa Exercise Detail (dùng lại "script") --- */}
            {selectedExercise ? (
              <div
                className="exercise-detail-editor"
                style={{ borderTop: "2px solid #ccc", paddingTop: "20px" }}
              >
                {/* Header: Title và nút Save Changes */}
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

                {/* Script Input (Đổi lại từ Reading Text) */}
                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <label
                    htmlFor="readingScript" // Đổi lại htmlFor
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Script / Reading Passage: {/* Đổi lại Label */}
                  </label>
                  <textarea
                    id="readingScript" // Đổi lại id
                    value={currentEditingExerciseData.script} // Bind với script
                    onChange={handleScriptChange} // Dùng handler script
                    placeholder="Enter the script or reading passage here..." // Đổi placeholder
                    rows={10}
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

                {/* Questions Section (Giữ nguyên logic render Questions) */}
                <div className="questions-section">
                  {/* ... (Phần render questions giữ nguyên như trước) ... */}
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
                            title="Delete Question"
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
                            style={{ width: "100%", padding: "8px" }}
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
                                name={`correctAnswer_Reading_${selectedExercise.id}_${index}`}
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
                                style={{ flexGrow: 1, padding: "6px" }}
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
                  }}
                >
                  Select an exercise from the list above to view or edit its
                  details, or add a new one.
                </p>
              )
            )}
          </>
        ) : (
          <p>
            Select a reading topic from the sidebar to manage its exercises.
          </p>
        )}
      </div>

      {/* --- Modals (Giữ nguyên như trước, dùng ID và hiển thị tên từ object) --- */}
      {/* ... (Modals giữ nguyên cấu trúc như phiên bản trước) ... */}
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
                onClick={handleEditTopicName}
                disabled={
                  isSubmitting ||
                  !editingTopicName.trim() ||
                  editingTopicName.trim() === topicToEdit.topicName
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
      {showConfirmDeleteTopic && topicToDelete && (
        <div className="confirm-delete-modal">
          <div className="modal-content">
            <h3>Delete Topic "{topicToDelete.topicName}"?</h3>
            <p>
              This will delete the topic and <strong>all its exercises</strong>.
              (ID: {topicToDelete.id}) This action cannot be undone.
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
      {showEditExerciseModal && exerciseToEdit && selectedTopic && (
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
                onClick={handleEditExerciseDisplayTitle}
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
      {showConfirmDeleteExercise && exerciseToDelete && selectedTopic && (
        <div className="confirm-delete-modal">
          <div className="modal-content">
            <h3>Delete Exercise "{exerciseToDelete?.title}"?</h3>
            <p>Topic: {selectedTopic?.topicName}</p>
            <p>
              This will delete the exercise script and questions.{" "}
              {/* Đổi lại text */}
              (ID: {exerciseToDelete?.id}) This action cannot be undone.
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

export default ReadingPage;
