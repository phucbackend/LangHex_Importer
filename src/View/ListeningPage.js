// ListeningPage.js
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "../css/speaking.css"; // Sử dụng CSS hiện có hoặc tạo Listening.css

// Import tất cả các hàm service cần thiết
import {
  fetchListeningTopics,
  addListeningTopic,
  editListeningTopic,
  deleteListeningTopic,
  fetchExercisesForTopic, // Mới
  fetchExerciseDetail, // Mới
  addListeningExercise, // Mới
  editListeningExerciseTitle, // Mới
  deleteListeningExercise, // Mới
  updateListeningExerciseDetail, // Đổi tên từ updateListeningExercise
} from "../Model/ListeningService";

const ListeningPage = () => {
  const { levelId } = useParams();
  const upperLevelId = levelId.toUpperCase();

  // --- State cho Topics ---
  const [topics, setTopics] = useState([]);
  const [selectedTopicTitle, setSelectedTopicTitle] = useState(null);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [showAddTopicInput, setShowAddTopicInput] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [topicToEdit, setTopicToEdit] = useState(null); // Lưu title của topic đang edit
  const [editingTopicTitle, setEditingTopicTitle] = useState(""); // Title mới khi edit
  const [showEditTopicModal, setShowEditTopicModal] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState(null); // Lưu title topic cần xóa
  const [showConfirmDeleteTopic, setShowConfirmDeleteTopic] = useState(false);

  // --- State cho Exercises (của Topic đang chọn) ---
  const [topicExercises, setTopicExercises] = useState([]); // Danh sách exercises của topic đã chọn
  const [selectedExercise, setSelectedExercise] = useState(null); // Object exercise đang được chọn { title, script, questions }
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [showAddExerciseInput, setShowAddExerciseInput] = useState(false);
  const [newExerciseTitle, setNewExerciseTitle] = useState("");
  const [exerciseToEdit, setExerciseToEdit] = useState(null); // Lưu title exercise đang edit
  const [editingExerciseTitle, setEditingExerciseTitle] = useState(""); // Title mới khi edit
  const [showEditExerciseModal, setShowEditExerciseModal] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState(null); // Lưu title exercise cần xóa
  const [showConfirmDeleteExercise, setShowConfirmDeleteExercise] =
    useState(false);

  // --- State cho việc chỉnh sửa Exercise Detail (Script & Questions) ---
  const initialEmptyExerciseData = { script: "", questions: [] };
  const [currentEditingExerciseData, setCurrentEditingExerciseData] = useState(
    initialEmptyExerciseData
  ); // Dữ liệu đang chỉnh sửa
  const [initialExerciseDetailState, setInitialExerciseDetailState] =
    useState(null); // Chuỗi JSON ban đầu để so sánh thay đổi

  // --- State Loading/Submitting chung ---
  const [isSubmitting, setIsSubmitting] = useState(false); // Dùng chung cho các thao tác (add/edit/delete/save)

  // --- Hàm Fetch Dữ Liệu ---

  // Load danh sách Topics
  const loadTopics = useCallback(async () => {
    setIsLoadingTopics(true);
    setSelectedTopicTitle(null); // Reset topic chọn
    setTopicExercises([]); // Reset danh sách exercises
    setSelectedExercise(null); // Reset exercise chọn
    setCurrentEditingExerciseData(initialEmptyExerciseData); // Reset form chỉnh sửa
    setInitialExerciseDetailState(null);

    const fetchedTopics = await fetchListeningTopics(upperLevelId);
    const sortedTopics = fetchedTopics.sort((a, b) =>
      a.title.localeCompare(b.title)
    );
    setTopics(sortedTopics);
    setIsLoadingTopics(false);
  }, [upperLevelId]); // Chỉ phụ thuộc levelId

  // Load Exercises cho một Topic cụ thể
  const loadExercisesForSelectedTopic = useCallback(async () => {
    if (!selectedTopicTitle) return; // Phải có topic được chọn

    setIsLoadingExercises(true);
    setSelectedExercise(null); // Reset exercise đang chọn khi load lại list
    setCurrentEditingExerciseData(initialEmptyExerciseData);
    setInitialExerciseDetailState(null);

    const fetchedExercises = await fetchExercisesForTopic(
      upperLevelId,
      selectedTopicTitle
    );
    setTopicExercises(fetchedExercises); // fetchedExercises đã được sắp xếp trong service
    setIsLoadingExercises(false);
  }, [upperLevelId, selectedTopicTitle]); // Phụ thuộc level và topic đang chọn

  // Load chi tiết (script, questions) cho một Exercise cụ thể
  const loadExerciseDetail = useCallback(
    async (exerciseTitle) => {
      if (!selectedTopicTitle || !exerciseTitle) return;

      setIsSubmitting(true); // Coi như đang loading detail
      const exerciseDetail = await fetchExerciseDetail(
        upperLevelId,
        selectedTopicTitle,
        exerciseTitle
      );
      setIsSubmitting(false);

      if (exerciseDetail) {
        setSelectedExercise(exerciseDetail); // Lưu cả title, script, questions
        setCurrentEditingExerciseData(exerciseDetail); // Đưa vào form chỉnh sửa
        setInitialExerciseDetailState(JSON.stringify(exerciseDetail)); // Lưu trạng thái ban đầu
      } else {
        // Xử lý trường hợp exercise không tìm thấy (ví dụ: đã bị xóa bởi người khác)
        setSelectedExercise(null);
        setCurrentEditingExerciseData(initialEmptyExerciseData);
        setInitialExerciseDetailState(null);
        await loadExercisesForSelectedTopic(); // Tải lại danh sách exercises của topic
      }
    },
    [upperLevelId, selectedTopicTitle, loadExercisesForSelectedTopic]
  ); // Phụ thuộc level, topic, và hàm load list exercises

  // --- useEffect Hooks ---
  useEffect(() => {
    loadTopics(); // Load topics khi component mount hoặc level thay đổi
  }, [loadTopics]);

  useEffect(() => {
    // Load exercises bất cứ khi nào topic được chọn thay đổi
    loadExercisesForSelectedTopic();
  }, [loadExercisesForSelectedTopic]); // Phụ thuộc vào hàm load (bao gồm cả selectedTopicTitle)

  // --- Handlers cho Topics --- (Logic tương tự bản gốc, gọi service tương ứng)

  const handleSelectTopic = (topic) => {
    if (!isSubmitting && topic && topic.title) {
      if (topic.title !== selectedTopicTitle) {
        setSelectedTopicTitle(topic.title);
        // Việc load exercises sẽ được trigger bởi useEffect theo dõi selectedTopicTitle
        // Reset các state liên quan đến exercise cụ thể
        setSelectedExercise(null);
        setCurrentEditingExerciseData(initialEmptyExerciseData);
        setInitialExerciseDetailState(null);
        setShowAddExerciseInput(false); // Ẩn input add exercise nếu đang mở
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
    const success = await addListeningTopic(upperLevelId, trimmedTitle);
    if (success) {
      setNewTopicTitle("");
      setShowAddTopicInput(false);
      await loadTopics(); // Tải lại toàn bộ topics
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
    const success = await editListeningTopic(
      upperLevelId,
      topicToEdit,
      trimmedNewTitle
    );
    setIsSubmitting(false); // Luôn set false sau khi gọi service

    if (success) {
      setShowEditTopicModal(false);
      // Nếu topic đang được chọn bị đổi tên, cập nhật lại selectedTopicTitle
      if (selectedTopicTitle === topicToEdit) {
        setSelectedTopicTitle(trimmedNewTitle); // Chuyển selection sang tên mới
      }
      await loadTopics(); // Tải lại danh sách topics
      // Lưu ý: Việc load lại topics sẽ tự động reset exercise list và selection
    }
    // Không cần set isSubmitting false ở đây nữa vì đã làm ở trên
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
      const success = await deleteListeningTopic(upperLevelId, topicToDelete);
      if (success) {
        setShowConfirmDeleteTopic(false);
        setTopicToDelete(null);
        // Load lại topics sẽ tự reset mọi thứ khác
        await loadTopics();
      }
      setIsSubmitting(false);
    }
  };

  const cancelDeleteTopic = () => {
    setTopicToDelete(null);
    setShowConfirmDeleteTopic(false);
  };

  // --- Handlers cho Exercises --- (Logic mới)

  const handleSelectExercise = (exercise) => {
    if (!isSubmitting && exercise && exercise.title) {
      // Chỉ load detail nếu exercise được chọn khác exercise hiện tại hoặc chưa có exercise nào được chọn
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
    const success = await addListeningExercise(
      upperLevelId,
      selectedTopicTitle,
      trimmedTitle
    );
    if (success) {
      setNewExerciseTitle("");
      setShowAddExerciseInput(false);
      await loadExercisesForSelectedTopic(); // Tải lại danh sách exercises của topic hiện tại
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
    if (!selectedTopicTitle) return; // Cần topic

    setIsSubmitting(true);
    const success = await editListeningExerciseTitle(
      upperLevelId,
      selectedTopicTitle,
      exerciseToEdit,
      trimmedNewTitle
    );
    setIsSubmitting(false); // Luôn set false

    if (success) {
      setShowEditExerciseModal(false);
      // Nếu exercise đang được chọn bị đổi tên, cập nhật lại selectedExercise title và load lại detail
      if (selectedExercise && selectedExercise.title === exerciseToEdit) {
        // Cập nhật title trong state selectedExercise trước khi load lại detail
        // Hoặc đơn giản là reset selection và để user chọn lại
        setSelectedExercise(null); // Reset selection
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
      const success = await deleteListeningExercise(
        upperLevelId,
        selectedTopicTitle,
        exerciseToDelete
      );
      if (success) {
        setShowConfirmDeleteExercise(false);
        // Nếu exercise bị xóa là exercise đang được chọn, reset selection
        if (selectedExercise && selectedExercise.title === exerciseToDelete) {
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

  // --- Handlers cho Chỉnh sửa Exercise Detail (Script & Questions) --- (Giữ nguyên logic cập nhật state)

  const handleScriptChange = (e) => {
    setCurrentEditingExerciseData((prev) => ({
      ...prev,
      script: e.target.value,
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    setCurrentEditingExerciseData((prev) => {
      const updatedQuestions = [...(prev.questions || [])]; // Đảm bảo questions là array
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

  // --- Handler Lưu Thay Đổi cho Exercise Detail ---
  const handleSaveChanges = async () => {
    // Phải chọn topic và exercise trước khi lưu
    if (!selectedTopicTitle || !selectedExercise || !selectedExercise.title) {
      toast.warn("Please select a topic and an exercise before saving.");
      return;
    }
    // --- Validation (Giữ nguyên logic validation) ---
    if (!currentEditingExerciseData.script.trim()) {
      toast.warn("Script cannot be empty.");
      return;
    }
    for (const q of currentEditingExerciseData.questions || []) {
      // Kiểm tra questions có tồn tại
      if (!q.questionText?.trim()) {
        // Kiểm tra cả questionText
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
      // Kiểm tra options có tồn tại và có đủ A, B, C, D không rỗng
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
    const success = await updateListeningExerciseDetail(
      upperLevelId,
      selectedTopicTitle,
      selectedExercise.title, // Truyền title của exercise đang được chọn
      currentEditingExerciseData // Dữ liệu đang chỉnh sửa
    );
    if (success) {
      // Cập nhật lại initial state sau khi lưu thành công để hasChanges thành false
      const updatedExerciseData = {
        ...currentEditingExerciseData,
        title: selectedExercise.title,
      }; // Giữ lại title
      setInitialExerciseDetailState(JSON.stringify(updatedExerciseData));
      setSelectedExercise(updatedExerciseData); // Cập nhật state selectedExercise với dữ liệu mới nhất (quan trọng)
      toast.success("Changes saved successfully!"); // Thông báo thành công từ component
    }
    setIsSubmitting(false);
  };

  // Check if changes were made to the current exercise detail
  const hasChanges =
    selectedExercise && // Phải có exercise được chọn
    JSON.stringify(currentEditingExerciseData) !== initialExerciseDetailState; // So sánh state hiện tại và ban đầu

  // --- Render Logic ---
  return (
    // Class và điều kiện disable chung
    <div
      className={`speaking-container ${
        // Có thể đổi tên class gốc thành listening-container
        showConfirmDeleteTopic ||
        showEditTopicModal ||
        showConfirmDeleteExercise ||
        showEditExerciseModal
          ? "disable-all"
          : ""
      }`}
    >
      {/* Sidebar: Danh sách Topics */}
      <div className="topic-sidebar">
        <h2>Listening Topics</h2>
        <button
          className="add-topic" // Giữ class cũ hoặc đổi tên
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
              }} // Adjust width slightly
              disabled={isSubmitting}
            />
            <button
              className="add-question-btn-save" // Nên đổi tên class này
              onClick={handleAddTopic}
              disabled={isSubmitting || !newTopicTitle.trim()}
              style={{ width: "auto", padding: "8px 12px" }} // More flexible width
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
            {
              Array.isArray(topics) && topics.length > 0
                ? topics.map((topic) => (
                    <li
                      key={topic.title} // Key vẫn là title (cẩn thận nếu trùng)
                      className={
                        selectedTopicTitle === topic.title ? "active" : ""
                      }
                      onClick={() => handleSelectTopic(topic)}
                      // Ngăn chọn khi đang submit để tránh lỗi race condition
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
                          className="edit-topic" // Giữ class cũ
                          style={{ cursor: "pointer" }}
                          disabled={isSubmitting}
                          title="Edit Topic Title" // Thêm title cho rõ
                        >
                          📝
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTopic(topic.title);
                          }}
                          className="delete-topic" // Giữ class cũ
                          style={{ cursor: "pointer" }}
                          disabled={isSubmitting}
                          title="Delete Topic" // Thêm title
                        >
                          ❌
                        </button>
                      </div>
                    </li>
                  ))
                : !isLoadingTopics && <li>No topics found.</li> // Hiển thị khi không có topic
            }
          </ul>
        )}
      </div>{" "}
      {/* End Sidebar */}
      {/* Detail Area: Hiển thị Exercises của Topic đã chọn HOẶC Form chỉnh sửa Exercise Detail */}
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
                  className="add-topic" // Reuse class or create new e.g., "add-exercise-btn"
                  onClick={() =>
                    !isSubmitting &&
                    setShowAddExerciseInput(!showAddExerciseInput)
                  }
                  disabled={isSubmitting || isLoadingExercises} // Disable khi đang load exercises
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
                    className="add-question-btn-save" // Reuse class
                    onClick={handleAddExercise}
                    disabled={isSubmitting || !newExerciseTitle.trim()}
                    style={{ width: "auto", padding: "8px 12px" }}
                  >
                    Save Exercise
                  </button>
                </div>
              )}

              {/* Exercise List for the selected topic */}
              {isLoadingExercises ? (
                <p>Loading exercises...</p>
              ) : (
                <ul className="exercise-list">
                  {" "}
                  {/* Add class for styling */}
                  {Array.isArray(topicExercises) && topicExercises.length > 0
                    ? topicExercises.map((exercise) => (
                        <li
                          key={exercise.title} // Exercise title làm key
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
                              className="edit-topic" // Reuse class or create 'edit-exercise'
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
                              className="delete-topic" // Reuse class or create 'delete-exercise'
                              style={{ cursor: "pointer" }}
                              disabled={
                                isSubmitting || topicExercises.length === 1
                              }
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
            {/* --- Section Chỉnh sửa Exercise Detail (Script & Questions) --- */}
            {/* Chỉ hiển thị khi có exercise được chọn */}
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
                  {/* Hiển thị title của exercise đang được chọn */}
                  <h2>{selectedExercise.title} - Details</h2>
                  {/* Chỉ hiển thị nút Save khi có thay đổi */}
                  {hasChanges && (
                    <button
                      className="add-question-btn-save" // Đổi tên class hoặc dùng style riêng
                      onClick={handleSaveChanges}
                      disabled={isSubmitting} // Disable khi đang lưu
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
                {/* --- Form chỉnh sửa Script và Questions --- */}
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
                    value={currentEditingExerciseData.script} // Sử dụng state chỉnh sửa
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
                  <h3
                    style={{
                      borderBottom: "1px solid #eee",
                      paddingBottom: "10px",
                      marginBottom: "15px",
                    }}
                  >
                    Questions
                  </h3>
                  {/* Map qua questions trong currentEditingExerciseData */}
                  {currentEditingExerciseData &&
                    Array.isArray(currentEditingExerciseData.questions) &&
                    currentEditingExerciseData.questions.map((q, index) => (
                      <div
                        key={q.id || `question-${index}`} // Ưu tiên q.id nếu có
                        className="question-item"
                        style={{
                          border: "1px solid #ddd",
                          padding: "15px",
                          marginBottom: "15px",
                          borderRadius: "5px",
                          backgroundColor: "#f9f9f9",
                        }}
                      >
                        {/* Question Header (Number và Delete Button) */}
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
                            // className="edit-delete-btn delete" // Có thể dùng class cũ
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
                                name={`correctAnswer_${selectedExercise.title}_${index}`} // Đảm bảo name duy nhất cho nhóm radio
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
            Select a listening topic from the sidebar to manage its exercises.
          </p>
        )}
      </div>{" "}
      {/* End Detail Area */}
      {/* --- Modals --- */}
      {/* Modal Edit Topic Title (Giữ nguyên) */}
      {showEditTopicModal && (
        <div className="edit-topic-modal">
          {" "}
          {/* Lớp phủ và căn giữa */}
          <div className="modal-content">
            {" "}
            {/* Nội dung modal */}
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
                  editingTopicTitle.trim() === topicToEdit // Disable nếu tên rỗng hoặc không đổi
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
      {/* Modal Confirm Delete Topic (Giữ nguyên) */}
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
      {/* Modal Edit Exercise Title (Mới) */}
      {showEditExerciseModal && (
        <div className="edit-topic-modal">
          {" "}
          {/* Tái sử dụng class modal */}
          <div className="modal-content">
            <h3>Edit Exercise Title</h3>
            <p>Topic: {selectedTopicTitle}</p> {/* Hiển thị topic cho rõ */}
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
      {/* Modal Confirm Delete Exercise (Mới) */}
      {showConfirmDeleteExercise && (
        <div className="confirm-delete-modal">
          {" "}
          {/* Tái sử dụng class modal */}
          <div className="modal-content">
            <h3>Delete Exercise "{exerciseToDelete}"?</h3>
            <p>Topic: {selectedTopicTitle}</p>
            <p>
              This will delete the exercise script and questions. This action
              cannot be undone.
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
    </div> // End container
  );
};

export default ListeningPage;
