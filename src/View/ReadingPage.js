// ReadingPage.js
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
// Có thể tạo Reading.css hoặc dùng chung speaking.css
import "../css/speaking.css";

// Import các hàm service của Reading
import {
  fetchReadingTopics,
  addReadingTopic,
  editReadingTopic,
  deleteReadingTopic,
  fetchReadingExercisesForTopic,
  fetchReadingExerciseDetail,
  addReadingExercise,
  editReadingExerciseTitle,
  deleteReadingExercise,
  updateReadingExerciseDetail, // Hàm update detail của Reading
} from "../Model/ReadingService"; // Import từ ReadingService

const ReadingPage = () => {
  const { levelId } = useParams();
  const upperLevelId = levelId.toUpperCase();

  // --- State cho Topics --- (Giữ nguyên cấu trúc state)
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

  // --- State cho Exercises (Giữ nguyên cấu trúc state)
  const [topicExercises, setTopicExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null); // Sẽ chứa { title, readingText, questions }
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [showAddExerciseInput, setShowAddExerciseInput] = useState(false);
  const [newExerciseTitle, setNewExerciseTitle] = useState("");
  const [exerciseToEdit, setExerciseToEdit] = useState(null);
  const [editingExerciseTitle, setEditingExerciseTitle] = useState("");
  const [showEditExerciseModal, setShowEditExerciseModal] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  const [showConfirmDeleteExercise, setShowConfirmDeleteExercise] =
    useState(false);

  // --- State cho việc chỉnh sửa Exercise Detail (thay script -> readingText) ---
  // Thay đổi initial state
  const initialEmptyExerciseData = { script: "", questions: [] };
  const [currentEditingExerciseData, setCurrentEditingExerciseData] = useState(
    initialEmptyExerciseData
  );
  const [initialExerciseDetailState, setInitialExerciseDetailState] =
    useState(null);

  // --- State Loading/Submitting chung --- (Giữ nguyên)
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Hàm Fetch Dữ Liệu --- (Thay đổi hàm gọi service)

  // Load danh sách Topics Reading
  const loadTopics = useCallback(async () => {
    setIsLoadingTopics(true);
    setSelectedTopicTitle(null);
    setTopicExercises([]);
    setSelectedExercise(null);
    setCurrentEditingExerciseData(initialEmptyExerciseData);
    setInitialExerciseDetailState(null);

    // Gọi hàm fetch của Reading
    const fetchedTopics = await fetchReadingTopics(upperLevelId);
    const sortedTopics = fetchedTopics.sort((a, b) =>
      a.title.localeCompare(b.title)
    );
    setTopics(sortedTopics);
    setIsLoadingTopics(false);
  }, [upperLevelId]); // Phụ thuộc levelId

  // Load Exercises cho một Topic Reading cụ thể
  const loadExercisesForSelectedTopic = useCallback(async () => {
    if (!selectedTopicTitle) return;

    setIsLoadingExercises(true);
    setSelectedExercise(null);
    setCurrentEditingExerciseData(initialEmptyExerciseData);
    setInitialExerciseDetailState(null);

    // Gọi hàm fetch exercises của Reading
    const fetchedExercises = await fetchReadingExercisesForTopic(
      upperLevelId,
      selectedTopicTitle
    );
    setTopicExercises(fetchedExercises);
    setIsLoadingExercises(false);
  }, [upperLevelId, selectedTopicTitle]);

  // Load chi tiết (readingText, questions) cho một Exercise Reading cụ thể
  const loadExerciseDetail = useCallback(
    async (exerciseTitle) => {
      if (!selectedTopicTitle || !exerciseTitle) return;

      setIsSubmitting(true);
      // Gọi hàm fetch detail của Reading
      const exerciseDetail = await fetchReadingExerciseDetail(
        upperLevelId,
        selectedTopicTitle,
        exerciseTitle
      );
      setIsSubmitting(false);

      if (exerciseDetail) {
        setSelectedExercise(exerciseDetail); // Lưu cả title, readingText, questions
        setCurrentEditingExerciseData(exerciseDetail);
        setInitialExerciseDetailState(JSON.stringify(exerciseDetail));
      } else {
        setSelectedExercise(null);
        setCurrentEditingExerciseData(initialEmptyExerciseData);
        setInitialExerciseDetailState(null);
        await loadExercisesForSelectedTopic(); // Tải lại danh sách exercises
      }
    },
    [upperLevelId, selectedTopicTitle, loadExercisesForSelectedTopic]
  );

  // --- useEffect Hooks --- (Giữ nguyên logic)
  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  useEffect(() => {
    loadExercisesForSelectedTopic();
  }, [loadExercisesForSelectedTopic]);

  // --- Handlers cho Topics --- (Thay đổi hàm gọi service)

  const handleSelectTopic = (topic) => {
    if (!isSubmitting && topic && topic.title) {
      if (topic.title !== selectedTopicTitle) {
        setSelectedTopicTitle(topic.title);
        // useEffect sẽ lo việc load exercises
        setSelectedExercise(null);
        setCurrentEditingExerciseData(initialEmptyExerciseData);
        setInitialExerciseDetailState(null);
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
    // Gọi hàm add của Reading
    const success = await addReadingTopic(upperLevelId, trimmedTitle);
    if (success) {
      setNewTopicTitle("");
      setShowAddTopicInput(false);
      await loadTopics();
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
    // Gọi hàm edit của Reading
    const success = await editReadingTopic(
      upperLevelId,
      topicToEdit,
      trimmedNewTitle
    );
    setIsSubmitting(false); // Luôn set false sau khi gọi service

    if (success) {
      setShowEditTopicModal(false);
      if (selectedTopicTitle === topicToEdit) {
        setSelectedTopicTitle(trimmedNewTitle);
      }
      await loadTopics();
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
      // Gọi hàm delete của Reading
      const success = await deleteReadingTopic(upperLevelId, topicToDelete);
      if (success) {
        setShowConfirmDeleteTopic(false);
        setTopicToDelete(null);
        await loadTopics(); // Load lại topics sẽ reset mọi thứ
      }
      setIsSubmitting(false);
    }
  };

  const cancelDeleteTopic = () => {
    setTopicToDelete(null);
    setShowConfirmDeleteTopic(false);
  };

  // --- Handlers cho Exercises --- (Thay đổi hàm gọi service)

  const handleSelectExercise = (exercise) => {
    if (!isSubmitting && exercise && exercise.title) {
      if (!selectedExercise || exercise.title !== selectedExercise.title) {
        loadExerciseDetail(exercise.title);
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
    // Gọi hàm add exercise của Reading
    const success = await addReadingExercise(
      upperLevelId,
      selectedTopicTitle,
      trimmedTitle
    );
    if (success) {
      setNewExerciseTitle("");
      setShowAddExerciseInput(false);
      await loadExercisesForSelectedTopic(); // Tải lại exercises của topic hiện tại
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
    // Gọi hàm edit title exercise của Reading
    const success = await editReadingExerciseTitle(
      upperLevelId,
      selectedTopicTitle,
      exerciseToEdit,
      trimmedNewTitle
    );
    setIsSubmitting(false);

    if (success) {
      setShowEditExerciseModal(false);
      if (selectedExercise && selectedExercise.title === exerciseToEdit) {
        // Reset selection khi exercise đang chọn bị đổi tên
        setSelectedExercise(null);
        setCurrentEditingExerciseData(initialEmptyExerciseData);
        setInitialExerciseDetailState(null);
      }
      await loadExercisesForSelectedTopic(); // Tải lại list exercise
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
      // Gọi hàm delete exercise của Reading
      const success = await deleteReadingExercise(
        upperLevelId,
        selectedTopicTitle,
        exerciseToDelete
      );
      if (success) {
        setShowConfirmDeleteExercise(false);
        if (selectedExercise && selectedExercise.title === exerciseToDelete) {
          // Reset selection nếu exercise đang chọn bị xóa
          setSelectedExercise(null);
          setCurrentEditingExerciseData(initialEmptyExerciseData);
          setInitialExerciseDetailState(null);
        }
        setExerciseToDelete(null);
        await loadExercisesForSelectedTopic(); // Tải lại list
      }
      setIsSubmitting(false);
    }
  };

  const cancelDeleteExercise = () => {
    setExerciseToDelete(null);
    setShowConfirmDeleteExercise(false);
  };

  // --- Handlers cho Chỉnh sửa Exercise Detail (thay script -> readingText) ---

  // Đổi tên hàm và trường state
  const handleReadingTextChange = (e) => {
    setCurrentEditingExerciseData((prev) => ({
      ...prev,
      script: e.target.value, // Cập nhật readingText
    }));
  };

  // Các hàm handle question, option, correct answer giữ nguyên logic
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
        const currentOptions = updatedQuestions[qIndex].options || {};
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
    }
  };

  // --- Handler Lưu Thay Đổi cho Exercise Detail --- (Thay đổi hàm gọi service và validation)
  const handleSaveChanges = async () => {
    if (!selectedTopicTitle || !selectedExercise || !selectedExercise.title) {
      toast.warn("Please select a topic and an exercise before saving.");
      return;
    }

    // --- Validation (Kiểm tra readingText thay vì script) ---
    if (!currentEditingExerciseData.script.trim()) {
      // Thay đổi ở đây
      toast.warn("Reading Text cannot be empty."); // Thay đổi message
      return;
    }
    // Validation questions giữ nguyên logic
    for (const q of currentEditingExerciseData.questions || []) {
      if (!q.questionText?.trim()) {
        toast.warn("Question text cannot be empty.");
        return;
      }
      if (!q.correctAnswer || !["A", "B", "C", "D"].includes(q.correctAnswer)) {
        toast.warn(
          `Please select a valid correct answer (A, B, C, or D) for question: "${q.questionText.substring(
            0,
            20
          )}..."`
        );
        return;
      }
      const options = q.options || {};
      if (["A", "B", "C", "D"].some((key) => !(options[key] || "").trim())) {
        toast.warn(
          `All options (A, B, C, D) must be filled for question: "${q.questionText.substring(
            0,
            20
          )}..."`
        );
        return;
      }
    }
    // --- Kết thúc Validation ---

    setIsSubmitting(true);
    // Gọi hàm update detail của Reading
    const success = await updateReadingExerciseDetail(
      upperLevelId,
      selectedTopicTitle,
      selectedExercise.title,
      currentEditingExerciseData // Dữ liệu đang chỉnh sửa (đã có readingText)
    );
    if (success) {
      // Cập nhật lại initial state và selected exercise state
      const updatedExerciseData = {
        ...currentEditingExerciseData,
        title: selectedExercise.title, // Giữ lại title
      };
      setInitialExerciseDetailState(JSON.stringify(updatedExerciseData));
      setSelectedExercise(updatedExerciseData); // Cập nhật state selectedExercise
      toast.success("Changes saved successfully!");
    }
    setIsSubmitting(false);
  };

  // Check if changes were made (So sánh state dựa trên readingText)
  const hasChanges =
    selectedExercise &&
    JSON.stringify(currentEditingExerciseData) !== initialExerciseDetailState;

  // --- Render Logic --- (Thay đổi labels và input/textarea cho readingText)
  return (
    // Sử dụng class `speaking-container` hoặc tạo `reading-container` mới
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
        <h2>Reading Topics</h2> {/* Đổi Title */}
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
        {/* Input Add Topic */}
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
        {/* Topic List */}
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
                    {/* Edit/Delete Topic Buttons */}
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
      {/* End Sidebar */}
      {/* Detail Area: Exercises List & Exercise Detail Editor */}
      <div className="topic-detail">
        {selectedTopicTitle ? (
          <>
            {/* --- Section Hiển thị Exercises của Topic --- */}
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
                  className="add-topic" // Hoặc "add-exercise-btn"
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

              {/* Input Add Exercise */}
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

              {/* Exercise List */}
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
                          {/* Edit/Delete Exercise Buttons */}
                          <div className="edit-delete-btn-container">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditExerciseModal(exercise);
                              }}
                              className="edit-topic" // Reuse class
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
                              className="delete-topic" // Reuse class
                              style={{ cursor: "pointer" }}
                              disabled={isSubmitting} // Có thể thêm logic disable nếu chỉ có 1 exercise
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
            {/* --- Section Chỉnh sửa Exercise Detail (Reading Text & Questions) --- */}
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
                      className="add-question-btn-save" // Style lại nếu cần
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
                {/* --- Form chỉnh sửa Reading Text và Questions --- */}
                {/* Reading Text Input (Thay thế Script Input) */}
                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <label
                    htmlFor="readingText" // Đổi htmlFor
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Reading Text: {/* Đổi Label */}
                  </label>
                  <textarea
                    id="readingText" // Đổi id
                    value={currentEditingExerciseData.script} // Đổi value binding
                    onChange={handleReadingTextChange} // Đổi onChange handler
                    placeholder="Enter the reading text here..." // Đổi placeholder
                    rows={10} // Tăng số dòng nếu cần cho Reading
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "1rem", // Có thể chỉnh font size
                      lineHeight: "1.5", // Có thể chỉnh line height
                    }}
                    disabled={isSubmitting}
                  />
                </div>
                {/* Questions Section (Giữ nguyên cấu trúc render Questions) */}
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
                        {/* Question Header */}
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

                        {/* Question Text Input */}
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

                        {/* Options & Correct Answer */}
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
                                // Cập nhật name để đảm bảo duy nhất cho từng câu hỏi của exercise này
                                name={`correctAnswer_Reading_${selectedExercise.title}_${index}`}
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

                  {/* Add Question Button */}
                  <button
                    onClick={handleAddQuestion}
                    className="add-question-btn"
                    disabled={isSubmitting}
                  >
                    + Add Question
                  </button>
                </div>{" "}
                {/* End Questions Section */}
              </div> // End Exercise Detail Editor
            ) : (
              // Hiển thị khi có topic được chọn nhưng chưa có exercise nào được chọn
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
          // Thông báo khi chưa chọn topic
          <p>
            Select a reading topic from the sidebar to manage its exercises.
          </p>
        )}
      </div>{" "}
      {/* End Detail Area */}
      {/* --- Modals (Giữ nguyên cấu trúc, chỉ thay đổi text và handler nếu cần) --- */}
      {/* Modal Edit Topic Title */}
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
                onClick={handleEditTopic} // Handler đã được cập nhật ở trên
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
      {/* Modal Confirm Delete Topic */}
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
                onClick={confirmDeleteTopic} // Handler đã được cập nhật
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
      {/* Modal Edit Exercise Title */}
      {showEditExerciseModal && (
        <div className="edit-topic-modal">
          {" "}
          {/* Reuse class */}
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
                onClick={handleEditExerciseTitle} // Handler đã được cập nhật
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
      {/* Modal Confirm Delete Exercise */}
      {showConfirmDeleteExercise && (
        <div className="confirm-delete-modal">
          {" "}
          {/* Reuse class */}
          <div className="modal-content">
            <h3>Delete Exercise "{exerciseToDelete}"?</h3>
            <p>Topic: {selectedTopicTitle}</p>
            <p>
              This will delete the exercise reading text and questions. This
              action cannot be undone.
            </p>
            <div style={{ marginTop: "15px" }}>
              <button
                onClick={confirmDeleteExercise} // Handler đã được cập nhật
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
    </div> // End container
  );
};

export default ReadingPage;
