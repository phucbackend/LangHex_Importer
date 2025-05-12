// ListeningPage.js
import React, { useState, useEffect, useCallback, useMemo } from "react"; // Thêm useMemo
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "../css/speaking.css"; // Giữ nguyên CSS hoặc tạo Listening.css

// Import các hàm service của Listening (đã cập nhật)
import {
  fetchListeningTopics,
  addListeningTopic,
  editListeningTopicName, // Đổi tên hàm service
  deleteListeningTopic,
  fetchListeningExercisesForTopic, // Đổi tên hàm service
  fetchListeningExerciseDetail, // Đổi tên hàm service
  addListeningExercise,
  editListeningExerciseDisplayTitle, // Đổi tên hàm service
  deleteListeningExercise,
  updateListeningExerciseDetail,
} from "../Model/ListeningService";

const ListeningPage = () => {
  const { levelId } = useParams();
  const upperLevelId = levelId.toUpperCase();

  // --- State cho Topics (Sử dụng ID) ---
  const [topics, setTopics] = useState([]); // Array of { id, topicName }
  const [selectedTopic, setSelectedTopic] = useState(null); // Object { id, topicName } or null
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [showAddTopicInput, setShowAddTopicInput] = useState(false);
  const [newTopicName, setNewTopicName] = useState(""); // Tên hiển thị topic mới

  const [topicToEdit, setTopicToEdit] = useState(null); // Object { id, topicName }
  const [editingTopicName, setEditingTopicName] = useState(""); // Tên hiển thị mới đang sửa
  const [showEditTopicModal, setShowEditTopicModal] = useState(false);

  const [topicToDelete, setTopicToDelete] = useState(null); // Object { id, topicName }
  const [showConfirmDeleteTopic, setShowConfirmDeleteTopic] = useState(false);

  // --- State cho Exercises (Sử dụng ID) ---
  const [topicExercises, setTopicExercises] = useState([]); // Array of { id, title }
  const [selectedExercise, setSelectedExercise] = useState(null); // Object { id, title, script, questions } or null
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [showAddExerciseInput, setShowAddExerciseInput] = useState(false);
  const [newExerciseTitle, setNewExerciseTitle] = useState(""); // Tên hiển thị exercise mới

  const [exerciseToEdit, setExerciseToEdit] = useState(null); // Object { id, title }
  const [editingExerciseTitle, setEditingExerciseTitle] = useState(""); // Tên hiển thị mới đang sửa
  const [showEditExerciseModal, setShowEditExerciseModal] = useState(false);

  const [exerciseToDelete, setExerciseToDelete] = useState(null); // Object { id, title }
  const [showConfirmDeleteExercise, setShowConfirmDeleteExercise] =
    useState(false);

  // --- State cho việc chỉnh sửa Exercise Detail ---
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
  ] = useState(null); // JSON string của {script, questions}

  // --- State Loading/Submitting chung ---
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Hàm Fetch Dữ Liệu ---

  // Load danh sách Topics Listening (sử dụng ID)
  const loadTopics = useCallback(async () => {
    setIsLoadingTopics(true);
    setSelectedTopic(null);
    setTopicExercises([]);
    setSelectedExercise(null);
    setCurrentEditingExerciseData(initialEmptyExerciseDataForDetail);
    setInitialExerciseDetailStateForComparison(null);

    const fetchedTopics = await fetchListeningTopics(upperLevelId); // Service đã cập nhật
    setTopics(fetchedTopics); // Service đã sắp xếp
    setIsLoadingTopics(false);
  }, [upperLevelId, initialEmptyExerciseDataForDetail]);

  // Load Exercises cho một Topic Listening cụ thể (sử dụng topicId)
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
      // Gọi hàm mới
      upperLevelId,
      selectedTopic.id // Truyền topicId
    );
    setTopicExercises(fetchedExercises);
    setIsLoadingExercises(false);
  }, [upperLevelId, selectedTopic, initialEmptyExerciseDataForDetail]);

  // Load chi tiết (script, questions) cho một Exercise Listening cụ thể (sử dụng ID)
  const loadExerciseDetail = useCallback(
    async (exerciseIdToLoad) => {
      if (!selectedTopic || !selectedTopic.id || !exerciseIdToLoad) return;
      setIsSubmitting(true);
      const exerciseDetail = await fetchListeningExerciseDetail(
        // Gọi hàm mới
        upperLevelId,
        selectedTopic.id, // Truyền topicId
        exerciseIdToLoad // Truyền exerciseId
      );
      setIsSubmitting(false);
      if (exerciseDetail) {
        setSelectedExercise(exerciseDetail); // Lưu { id, title, script, questions }
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

  // --- Handlers cho Topics (Sử dụng ID) ---

  const handleSelectTopic = (topic) => {
    // Nhận object { id, topicName }
    if (!isSubmitting && topic && topic.id) {
      if (!selectedTopic || topic.id !== selectedTopic.id) {
        setSelectedTopic(topic); // Lưu cả object
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
    const result = await addListeningTopic(upperLevelId, trimmedName); // Service đã cập nhật
    if (result.success) {
      setNewTopicName("");
      setShowAddTopicInput(false);
      await loadTopics();
    }
    setIsSubmitting(false);
  };

  const handleOpenEditTopicModal = (topic) => {
    // Nhận object { id, topicName }
    if (topic && topic.id) {
      setTopicToEdit(topic);
      setEditingTopicName(topic.topicName);
      setShowEditTopicModal(true);
    }
  };

  const handleEditTopicName = async () => {
    // Đổi tên handler
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
    const success = await editListeningTopicName(
      // Gọi hàm service mới
      upperLevelId,
      topicToEdit.id, // Truyền ID
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
    // Nhận object { id, topicName }
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
      ); // Gọi service với ID
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

  // --- Handlers cho Exercises (Sử dụng ID) ---

  const handleSelectExercise = (exercise) => {
    // Nhận object { id, title }
    if (!isSubmitting && exercise && exercise.id) {
      if (!selectedExercise || exercise.id !== selectedExercise.id) {
        loadExerciseDetail(exercise.id); // Load bằng ID
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
      // Gọi hàm service mới
      upperLevelId,
      selectedTopic.id, // Truyền topicId
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
    // Nhận object { id, title }
    if (exercise && exercise.id) {
      setExerciseToEdit(exercise);
      setEditingExerciseTitle(exercise.title);
      setShowEditExerciseModal(true);
    }
  };

  const handleEditExerciseDisplayTitle = async () => {
    // Đổi tên handler
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
    const success = await editListeningExerciseDisplayTitle(
      // Gọi hàm service mới
      upperLevelId,
      selectedTopic.id,
      exerciseToEdit.id, // Truyền ID
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
    // Nhận object { id, title }
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
        // Gọi service với ID
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

  // --- Handlers cho Chỉnh sửa Exercise Detail ---

  const handleScriptChange = (e) => {
    setCurrentEditingExerciseData((prev) => ({
      ...prev,
      script: e.target.value,
    }));
  };

  // Các hàm question handlers giữ nguyên
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

  // --- Handler Lưu Thay Đổi cho Exercise Detail (Sử dụng ID) ---
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
    // --- Validation ---
    if (!currentEditingExerciseData.script?.trim()) {
      toast.warn("Script cannot be empty.");
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
    // --- End Validation ---

    setIsSubmitting(true);
    const success = await updateListeningExerciseDetail(
      // Gọi hàm service mới
      upperLevelId,
      selectedTopic.id,
      selectedExercise.id, // Truyền ID
      currentEditingExerciseData // Truyền { script, questions }
    );
    if (success) {
      setInitialExerciseDetailStateForComparison(
        JSON.stringify(currentEditingExerciseData)
      );
      setSelectedExercise((prev) => ({
        // Cập nhật state local
        ...prev,
        script: currentEditingExerciseData.script,
        questions: currentEditingExerciseData.questions,
      }));
      toast.success("Changes saved successfully!");
    }
    setIsSubmitting(false);
  };

  // Check if changes were made
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

  // --- Render Logic (Giữ nguyên cấu trúc UI, cập nhật dữ liệu và handler) ---
  return (
    <div
      className={`speaking-container ${
        // Giữ class hoặc đổi
        showConfirmDeleteTopic ||
        showEditTopicModal ||
        showConfirmDeleteExercise ||
        showEditExerciseModal
          ? "disable-all"
          : ""
      }`}
    >
      {/* Sidebar: Danh sách Listening Topics (Sử dụng ID) */}
      <div className="topic-sidebar">
        <h2>Listening Topics</h2>
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
      </div>{" "}
      {/* End Sidebar */}
      {/* Detail Area: Exercises List & Exercise Detail Editor (Sử dụng ID) */}
      <div className="topic-detail">
        {selectedTopic ? ( // Check selectedTopic object
          <>
            {/* --- Section Hiển thị Exercises của Topic (Sử dụng ID) --- */}
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
            </div>{" "}
            {/* End Exercise Section */}
            {/* --- Section Chỉnh sửa Exercise Detail (Sử dụng ID) --- */}
            {selectedExercise ? ( // Check selectedExercise object
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

                {/* Script Input */}
                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <label
                    htmlFor="listeningScript"
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Script:
                  </label>
                  <textarea
                    id="listeningScript"
                    value={currentEditingExerciseData.script}
                    onChange={handleScriptChange}
                    placeholder="Enter the listening script here..."
                    rows={8}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Questions Section */}
                <div className="questions-section">
                  {/* ... (Phần render questions giữ nguyên) ... */}
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
                                name={`correctAnswer_Listening_${selectedExercise.id}_${index}`} // Đảm bảo name duy nhất
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
            Select a listening topic from the sidebar to manage its exercises.
          </p>
        )}
      </div>{" "}
      {/* End Detail Area */}
      {/* --- Modals (Sử dụng ID và hiển thị tên từ object) --- */}
      {/* ... (Modals giữ nguyên cấu trúc như Reading/Writing) ... */}
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
              This will delete the exercise script and questions. (ID:{" "}
              {exerciseToDelete?.id}) This action cannot be undone.
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

export default ListeningPage;
