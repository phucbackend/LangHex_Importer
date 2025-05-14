// ReadingPage.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "../css/speaking.css";

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
  deleteUserAnswersForQuestion,
} from "../Model/ReadingService";

const ReadingPage = () => {
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

  // Logic kiểm tra xem có thay đổi chưa lưu không
  // Sử dụng useMemo để tính toán lại chỉ khi các dependencies thay đổi
  const hasChanges = useMemo(() => {
    // Nếu chưa có exercise nào được chọn hoặc chưa tải dữ liệu ban đầu, không có thay đổi
    if (!selectedExercise || initialExerciseDetailStateForComparison === null) {
      return false;
    }
    try {
      // Tạo một chuỗi JSON từ trạng thái chỉnh sửa hiện tại (chỉ lấy script và questions)
      // Cần cẩn thận nếu thứ tự thuộc tính trong object không nhất quán khi stringify
      const currentComparableState = JSON.stringify({
        script: currentEditingExerciseData.script,
        questions: currentEditingExerciseData.questions,
      });
      // So sánh chuỗi JSON hiện tại với chuỗi JSON ban đầu/đã lưu
      return currentComparableState !== initialExerciseDetailStateForComparison;
    } catch (error) {
      console.error("Error comparing exercise detail states:", error);
      // Nếu có lỗi khi so sánh, coi như có thay đổi để không làm mất dữ liệu
      return true;
    }
  }, [
    selectedExercise, // Chỉ so sánh khi exercise được chọn thay đổi
    currentEditingExerciseData, // Hoặc dữ liệu chỉnh sửa thay đổi
    initialExerciseDetailStateForComparison, // Hoặc trạng thái so sánh ban đầu thay đổi
  ]);

  const loadTopics = useCallback(async () => {
    setIsLoadingTopics(true);
    setSelectedTopic(null);
    const fetchedTopics = await fetchReadingTopics(upperLevelId);
    setTopics(fetchedTopics);
    setIsLoadingTopics(false);
  }, [upperLevelId]);

  const loadExercisesForSelectedTopic = useCallback(async () => {
    if (!selectedTopic || !selectedTopic.id) {
      setTopicExercises([]);
      setSelectedExercise(null);
      setCurrentEditingExerciseData(initialEmptyExerciseDataForDetail);
      setInitialExerciseDetailStateForComparison(null);
      return []; // Return empty array
    }
    setIsLoadingExercises(true);
    setSelectedExercise(null);
    setCurrentEditingExerciseData(initialEmptyExerciseDataForDetail);
    setInitialExerciseDetailStateForComparison(null);
    const fetchedExercises = await fetchReadingExercisesForTopic(
      upperLevelId,
      selectedTopic.id
    );
    setTopicExercises(fetchedExercises); // Update state for list rendering
    setIsLoadingExercises(false);
    return fetchedExercises; // Return the fetched exercises
  }, [upperLevelId, selectedTopic, initialEmptyExerciseDataForDetail]);

  const loadExerciseDetail = useCallback(
    async (exerciseIdToLoad) => {
      if (!selectedTopic || !selectedTopic.id || !exerciseIdToLoad) return;
      setIsSubmitting(true);
      const exerciseDetail = await fetchReadingExerciseDetail(
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
        toast.warn("Exercise details could not be loaded.");
        await loadExercisesForSelectedTopic(); // Tải lại danh sách exercise nếu chi tiết lỗi
      }
    },
    [
      upperLevelId,
      selectedTopic,
      loadExercisesForSelectedTopic,
      initialEmptyExerciseDataForDetail,
    ]
  ); // Effect để tải topics khi component mount

  useEffect(() => {
    loadTopics();
  }, [loadTopics]); // Effect để tải exercises khi selectedTopic thay đổi

  useEffect(() => {
    if (selectedTopic && selectedTopic.id) {
      loadExercisesForSelectedTopic();
    } else {
      // Reset exercise state khi không có topic nào được chọn
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
    // Chỉ cho phép chọn topic khác khi không đang submit và có topic hợp lệ
    if (!isSubmitting && topic && topic.id) {
      // Kiểm tra có thay đổi chưa lưu trong exercise hiện tại không trước khi chuyển topic
      if (hasChanges) {
        if (
          !window.confirm(
            "You have unsaved changes in the current exercise. Are you sure you want to switch topics? Your changes will be lost."
          )
        ) {
          return; // Hủy bỏ nếu người dùng không xác nhận
        }
      } // Nếu không có thay đổi hoặc người dùng đã xác nhận, tiến hành chọn topic mới
      if (!selectedTopic || topic.id !== selectedTopic.id) {
        setSelectedTopic(topic);
        setShowAddExerciseInput(false); // Ẩn input add exercise khi chọn topic mới
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
    setIsSubmitting(false); // Kết thúc submit sau khi gọi API
    if (result.success) {
      setNewTopicName("");
      setShowAddTopicInput(false);
      await loadTopics(); // Tải lại danh sách topics sau khi thêm thành công
    }
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
        toast.info("Topic name is the same, no changes to save.");
        setShowEditTopicModal(false);
      } else {
        toast.warn("New topic name cannot be empty.");
      }
      return;
    }
    setIsSubmitting(true);
    const success = await editReadingTopicName(
      upperLevelId,
      topicToEdit.id,
      trimmedNewName
    );
    setIsSubmitting(false); // Kết thúc submit sau khi gọi API
    if (success) {
      setShowEditTopicModal(false);
      await loadTopics(); // Tải lại danh sách topics sau khi sửa thành công // Cập nhật selectedTopic nếu đang chọn topic vừa sửa
      if (selectedTopic && selectedTopic.id === topicToEdit.id) {
        setSelectedTopic((prev) => ({ ...prev, topicName: trimmedNewName }));
      }
      setTopicToEdit(null); // Reset state topic đang sửa
    }
  };

  const handleDeleteTopic = (topic) => {
    if (topic && topic.id) {
      setTopicToDelete(topic);
      setShowConfirmDeleteTopic(true); // Mở modal xác nhận xóa topic
    }
  };

  const confirmDeleteTopic = async () => {
    if (topicToDelete && topicToDelete.id) {
      setIsSubmitting(true);
      const success = await deleteReadingTopic(upperLevelId, topicToDelete.id);
      setIsSubmitting(false); // Kết thúc submit sau khi gọi API
      if (success) {
        setShowConfirmDeleteTopic(false); // Đóng modal
        const deletedTopicId = topicToDelete.id;
        setTopicToDelete(null); // Reset state topic cần xóa
        await loadTopics(); // Tải lại danh sách topics // Nếu topic đang chọn bị xóa, reset selectedTopic
        if (selectedTopic && selectedTopic.id === deletedTopicId) {
          setSelectedTopic(null); // Đảm bảo exercise list và detail cũng reset khi topic bị xóa
          setTopicExercises([]);
          setSelectedExercise(null);
          setCurrentEditingExerciseData(initialEmptyExerciseDataForDetail);
          setInitialExerciseDetailStateForComparison(null);
        }
      }
    }
  };

  const cancelDeleteTopic = () => {
    setTopicToDelete(null);
    setShowConfirmDeleteTopic(false); // Đóng modal
  };

  const handleSelectExercise = (exercise) => {
    // Chỉ cho phép chọn exercise khác khi không đang submit và có exercise hợp lệ
    if (!isSubmitting && exercise && exercise.id) {
      // Kiểm tra có thay đổi chưa lưu trong exercise hiện tại không trước khi chọn exercise khác
      if (hasChanges) {
        if (
          !window.confirm(
            "You have unsaved changes in the current exercise. Are you sure you want to switch exercises? Your changes will be lost."
          )
        ) {
          return; // Hủy bỏ nếu người dùng không xác nhận
        }
      } // Nếu không có thay đổi hoặc người dùng đã xác nhận, tiến hành tải exercise detail mới
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
    setIsSubmitting(false); // Kết thúc submit sau khi gọi API
    if (result.success) {
      setNewExerciseTitle("");
      setShowAddExerciseInput(false);
      await loadExercisesForSelectedTopic(); // Tải lại danh sách exercises sau khi thêm thành công // Optional: Tự động chọn exercise vừa tạo? Cần ID từ result.data nếu API trả về // if(result.data?.id) { loadExerciseDetail(result.data.id); }
    }
  };

  const handleOpenEditExerciseModal = (exercise) => {
    if (exercise && exercise.id) {
      setExerciseToEdit(exercise);
      setEditingExerciseTitle(exercise.title);
      setShowEditExerciseModal(true); // Mở modal sửa title exercise
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
        toast.info("Exercise title is the same, no changes to save.");
        setShowEditExerciseModal(false);
      } else {
        toast.warn("New exercise title cannot be empty.");
      }
      return;
    }
    if (!selectedTopic || !selectedTopic.id) {
      toast.error("No topic selected for this exercise.");
      return;
    }

    setIsSubmitting(true);
    const success = await editReadingExerciseDisplayTitle(
      upperLevelId,
      selectedTopic.id,
      exerciseToEdit.id, // ID of the exercise whose title is being changed
      trimmedNewTitle
    );

    if (success) {
      setShowEditExerciseModal(false);
      const editedExerciseId = exerciseToEdit.id;

      let preservedCurrentData = null;
      let preservedInitialData = null;
      let wasSelectedExerciseBeingEdited = false;

      // Check if the exercise whose title was changed is the one currently selected and being detailed
      if (selectedExercise && selectedExercise.id === editedExerciseId) {
        wasSelectedExerciseBeingEdited = true;
        preservedCurrentData = currentEditingExerciseData; // Capture current script/questions
        preservedInitialData = initialExerciseDetailStateForComparison; // Capture its comparison baseline
      }

      // Reload the list of exercises for the topic.
      // This function will internally reset selectedExercise, currentEditingExerciseData, etc.,
      // but it will return the updated list.
      const updatedExercisesList = await loadExercisesForSelectedTopic();

      if (wasSelectedExerciseBeingEdited) {
        // If we were editing the details of the exercise that was just renamed:
        // Find it in the newly fetched list.
        const reloadedExerciseInList = updatedExercisesList.find(
          (ex) => ex.id === editedExerciseId
        );

        if (reloadedExerciseInList) {
          // Found it. Now, re-select it (it will have the new title from the DB via updatedExercisesList)
          // and restore the script/question editing state.
          setSelectedExercise(reloadedExerciseInList);
          setCurrentEditingExerciseData(preservedCurrentData);
          setInitialExerciseDetailStateForComparison(preservedInitialData);
        } else {
          // The exercise is somehow not in the list after renaming.
          // selectedExercise remains null (as set by loadExercisesForSelectedTopic),
          // and currentEditingExerciseData remains empty.
        }
      }
      setExerciseToEdit(null);
    }
    setIsSubmitting(false);
  };

  const handleDeleteExercise = (exercise) => {
    if (exercise && exercise.id) {
      setExerciseToDelete(exercise);
      setShowConfirmDeleteExercise(true); // Mở modal xác nhận xóa exercise
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
      setIsSubmitting(false); // Kết thúc submit sau khi gọi API
      if (success) {
        setShowConfirmDeleteExercise(false); // Đóng modal
        const deletedExerciseId = exerciseToDelete.id;
        setExerciseToDelete(null); // Reset state exercise cần xóa
        await loadExercisesForSelectedTopic(); // Tải lại danh sách exercises // Nếu exercise đang chọn bị xóa, reset selectedExercise và detail state
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
    setShowConfirmDeleteExercise(false); // Đóng modal
  }; // --- Các hàm xử lý thay đổi script, questions, options trong trạng thái cục bộ ---

  const handleScriptChange = (e) => {
    setCurrentEditingExerciseData((prev) => ({
      ...prev,
      script: e.target.value,
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    setCurrentEditingExerciseData((prev) => {
      const updatedQuestions = [...(prev.questions || [])]; // Chỉ cập nhật nếu index hợp lệ
      if (updatedQuestions[index]) {
        updatedQuestions[index] = {
          ...updatedQuestions[index],
          [field]: value,
        };
        return { ...prev, questions: updatedQuestions };
      }
      return prev; // Trả về state cũ nếu index không hợp lệ
    });
  };

  const handleOptionChange = (qIndex, optionKey, value) => {
    setCurrentEditingExerciseData((prev) => {
      const updatedQuestions = [...(prev.questions || [])]; // Chỉ cập nhật nếu index câu hỏi hợp lệ
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
      return prev; // Trả về state cũ nếu index câu hỏi không hợp lệ
    });
  };

  const handleCorrectAnswerChange = (qIndex, value) => {
    setCurrentEditingExerciseData((prev) => {
      const updatedQuestions = [...(prev.questions || [])]; // Chỉ cập nhật nếu index câu hỏi hợp lệ
      if (updatedQuestions[qIndex]) {
        updatedQuestions[qIndex] = {
          ...updatedQuestions[qIndex],
          correctAnswer: value,
        };
        return { ...prev, questions: updatedQuestions };
      }
      return prev; // Trả về state cũ nếu index câu hỏi không hợp lệ
    });
  }; // Hàm thêm một câu hỏi mới vào cuối mảng questions trong trạng thái local

  const handleAddQuestion = () => {
    setCurrentEditingExerciseData((prev) => ({
      ...prev,
      questions: [
        ...(Array.isArray(prev.questions) ? prev.questions : []),
        {
          // Sử dụng ID tạm cho câu hỏi mới thêm ở local
          id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          questionText: "",
          options: { A: "", B: "", C: "", D: "" },
          correctAnswer: "",
        },
      ],
    }));
  }; // --- Hàm Xóa Câu hỏi (Logic đã cập nhật) ---

  const handleDeleteQuestion = async (indexToDelete) => {
    // 1. Kiểm tra điều kiện cần thiết
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
    // 2. Kiểm tra index dựa trên trạng thái cục bộ (UI đang hiển thị)
    if (indexToDelete < 0 || indexToDelete >= localQuestions.length) {
      console.warn(
        "Invalid index for deleting question based on local data:",
        indexToDelete
      );
      toast.warn("Cannot delete question: Invalid index.");
      return;
    }

    const questionToDeleteData = localQuestions[indexToDelete];
    const isTextEmpty = !questionToDeleteData?.questionText?.trim();

    const exerciseTitle = selectedExercise.title || "this exercise";
    const questionTextPreview = questionToDeleteData?.questionText
      ? questionToDeleteData.questionText.substring(0, 30) +
        (questionToDeleteData.questionText.length > 30 ? "..." : "")
      : `Question ${indexToDelete + 1}`;

    let shouldDelete = false;

    if (isTextEmpty) {
      // Nếu text rỗng, bỏ qua confirm và tiến hành xóa ngay lập tức (cả local và DB nếu cần)
      console.log("Deleting empty question without confirmation.");
      toast.info(`Empty question ${indexToDelete + 1} deleted.`);
      shouldDelete = true;
    } else {
      // Nếu text không rỗng, hỏi xác nhận như bình thường
      shouldDelete = window.confirm(
        `Are you sure you want to delete "${questionTextPreview}" from "${exerciseTitle}"? ` +
          (hasChanges
            ? "This will remove the question from your unsaved changes." // Thông báo khi có unsaved changes
            : "This will update the database and attempt to delete related user answers. This action cannot be undone.") // Thông báo khi làm việc với DB
      );
    }

    if (shouldDelete) {
      setIsSubmitting(true); // Bắt đầu trạng thái loading

      try {
        // 4. Kiểm tra lại có thay đổi local chưa lưu không
        if (hasChanges) {
          // ======== TRƯỜNG HỢP 1: CÓ THAY ĐỔI LOCAL CHƯA LƯU ========
          console.log("Deleting question locally due to unsaved changes.");
          // Index đã được kiểm tra ở bước 2, nên không cần kiểm tra lại localQuestions.length ở đây
          // Tạo mảng câu hỏi mới bằng cách lọc BỎ câu hỏi ở indexToDelete TỪ DỮ LIỆU LOCAL
          const newQuestionsLocal = localQuestions.filter(
            (_, i) => i !== indexToDelete
          );

          // Cập nhật trạng thái cục bộ với mảng câu hỏi mới
          // Giữ nguyên các phần khác của currentEditingExerciseData (như script)
          setCurrentEditingExerciseData((prev) => ({
            ...prev, // Giữ lại script và bất kỳ data nào khác trong prev
            questions: newQuestionsLocal, // Cập nhật questions
          }));

          // Không cần cập nhật initial state for comparison vì state vẫn chưa được lưu chính thức.
          // toast.success("Question removed locally. Remember to save your changes."); // Thông báo này đã được chuyển lên trên khi text rỗng

          // KHÔNG gọi bất kỳ API nào liên quan đến database (fetch, update, delete user answers)
        } else {
          // ======== TRƯỜNG HỢP 2: KHÔNG CÓ THAY ĐỔI LOCAL CHƯA LƯU (Thao tác trực tiếp với DB) ========
          console.log(
            "Deleting question from database as no unsaved changes detected."
          );
          // BƯỚC QUAN TRỌNG: Lấy dữ liệu exercise mới nhất từ database
          const latestExerciseDetail = await fetchReadingExerciseDetail(
            upperLevelId,
            selectedTopic.id,
            selectedExercise.id
          );

          if (!latestExerciseDetail) {
            toast.error(
              "Failed to fetch the latest exercise data before deletion. Please try again."
            );
            setIsSubmitting(false);
            return;
          }

          const currentQuestionsFromDB = latestExerciseDetail.questions || [];
          // BƯỚC QUAN TRỌNG: Kiểm tra lại index trên dữ liệu mới nhất từ database
          // Điều này cực kỳ quan trọng để không xóa sai câu hỏi nếu database đã thay đổi bởi người khác
          if (
            indexToDelete < 0 ||
            indexToDelete >= currentQuestionsFromDB.length
          ) {
            toast.error(
              "Question index is out of sync with the database. Please refresh the exercise and try again."
            );
            setIsSubmitting(false);
            await loadExerciseDetail(selectedExercise.id); // Tải lại để đồng bộ UI với DB khi phát hiện lỗi sync
            return;
          }

          // Tạo mảng câu hỏi mới bằng cách lọc BỎ câu hỏi ở indexToDelete
          // TỪ DỮ LIỆU DB MỚI NHẤT
          const newQuestionsDB = currentQuestionsFromDB.filter(
            (_, i) => i !== indexToDelete
          );

          // Chuẩn bị dữ liệu cập nhật để gửi lên API
          const updatedExerciseDataForApi = {
            script: latestExerciseDetail.script, // Giữ nguyên script từ DB
            questions: newQuestionsDB, // Sử dụng mảng câu hỏi đã lọc từ DB data
          };

          // Cập nhật exercise trên database
          const successUpdateExercise = await updateReadingExerciseDetail(
            upperLevelId,
            selectedTopic.id,
            selectedExercise.id,
            updatedExerciseDataForApi
          );

          if (successUpdateExercise) {
            // Cập nhật trạng thái cục bộ CHỈ KHI lưu database thành công
            setCurrentEditingExerciseData(updatedExerciseDataForApi);
            // Cập nhật initial state comparison vì trạng thái local giờ đã đồng bộ với DB
            setInitialExerciseDetailStateForComparison(
              JSON.stringify(updatedExerciseDataForApi)
            );
            // Cập nhật selectedExercise nếu cần (ví dụ nếu state này ảnh hưởng đến UI khác)
            setSelectedExercise((prev) => ({
              ...prev,
              script: updatedExerciseDataForApi.script,
              questions: newQuestionsDB,
            }));

            // toast.success("Question deleted successfully from the exercise."); // Thông báo này đã được chuyển lên trên khi text rỗng hoặc hiển thị sau confirm

            // BƯỚC TIẾP THEO: Xóa user answers liên quan TỪ DATABASE
            // Truyền exercise ID và index BAN ĐẦU của câu hỏi bị xóa (trước khi nó bị xóa khỏi DB)
            const exerciseIdForUserAnswers = selectedExercise.id; // Lấy ID từ selectedExercise
            const questionIdentifierForUserAnswers = indexToDelete; // Sử dụng index ban đầu

            console.log(
              `Attempting to delete user answers for exerciseId: ${exerciseIdForUserAnswers}, questionIndex: ${questionIdentifierForUserAnswers}`
            );
            const userAnswerDeletionResult = await deleteUserAnswersForQuestion(
              exerciseIdForUserAnswers,
              questionIdentifierForUserAnswers
            );

            if (userAnswerDeletionResult.success) {
              console.log(
                `User answer deletion status: success, operations: ${userAnswerDeletionResult.operations}`
              );
            } else {
              console.error(
                "Failed to delete user answers:",
                userAnswerDeletionResult.message
              );
              // Toast lỗi (nếu có) đã được xử lý trong service deleteUserAnswersForQuestion
            }
          } else {
            // Nếu cập nhật exercise thất bại trên DB, thông báo lỗi và TẢI LẠI dữ liệu exercise
            toast.error(
              "Failed to update exercise after question deletion attempt. Reloading details."
            );
            await loadExerciseDetail(selectedExercise.id); // Tải lại để đồng bộ trạng thái UI với DB
          }
        } // Kết thúc else (trường hợp không có unsaved changes)
      } catch (error) {
        console.error("Error during question deletion process:", error);
        toast.error(
          "An unexpected error occurred during the deletion process."
        );
        // Chỉ tải lại exercise detail từ DB khi lỗi xảy ra ở nhánh thao tác DB
        // hoặc nếu ban đầu không có unsaved changes (vì lỗi fetch DB ngay đầu)
        // Nếu lỗi xảy ra ở nhánh local (rất ít khả năng), tải lại từ DB sẽ làm mất các thay đổi local khác.
        if (!hasChanges && selectedExercise && selectedExercise.id) {
          console.log(
            "Attempting to reload exercise detail from DB due to error."
          );
          await loadExerciseDetail(selectedExercise.id);
        } else if (hasChanges) {
          // Xử lý lỗi riêng cho nhánh local nếu cần, ví dụ:
          // thông báo lỗi nhưng không mất hết state local.
          console.error("Error occurred in local state handling branch.");
          // Ở đây, ta có thể không làm gì thêm ngoài toast và console.error
          // để không làm mất state local còn lại.
        }
      } finally {
        setIsSubmitting(false); // Luôn kết thúc trạng thái loading
      }
    } // Kết thúc if (shouldDelete)
  }; // Hàm xử lý lưu toàn bộ thay đổi (chỉ gọi khi hasChanges là true và user bấm Save)

  const handleSaveChanges = async () => {
    // Kiểm tra các điều kiện cần thiết trước khi lưu
    if (
      !selectedTopic ||
      !selectedTopic.id ||
      !selectedExercise ||
      !selectedExercise.id
    ) {
      toast.warn("Please select a topic and an exercise before saving.");
      return;
    }
    if (!currentEditingExerciseData.script?.trim()) {
      toast.warn("Script cannot be empty.");
      return;
    }
    // Validation cho từng câu hỏi
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

    setIsSubmitting(true);
    // Gửi toàn bộ dữ liệu currentEditingExerciseData hiện tại lên API update
    const success = await updateReadingExerciseDetail(
      upperLevelId,
      selectedTopic.id,
      selectedExercise.id,
      currentEditingExerciseData // Gửi dữ liệu đang chỉnh sửa
    );
    if (success) {
      // Nếu lưu thành công, cập nhật lại initial state comparison
      setInitialExerciseDetailStateForComparison(
        JSON.stringify(currentEditingExerciseData)
      );
      // Cập nhật selectedExercise nếu cần
      setSelectedExercise((prev) => ({
        ...prev,
        script: currentEditingExerciseData.script,
        questions: currentEditingExerciseData.questions,
      }));
      toast.success("Changes saved successfully!");

      // *** LƯU Ý QUAN TRỌNG VỀ XÓA USER ANSWERS ***
      // Khi lưu toàn bộ (handleSaveChanges), bạn có thể có cả thêm, sửa, xóa câu hỏi.
      // Việc xử lý xóa user answers theo index TRƯỚC KHI XÓA trong DB (như trong handleDeleteQuestion)
      // sẽ phức tạp hơn ở đây vì nhiều câu hỏi có thể bị xóa cùng lúc.
      // Cách tiếp cận an toàn hơn là API updateReadingExerciseDetail ở backend
      // nên xử lý việc dọn dẹp user answers cho các câu hỏi bị xóa DỰA VÀO SO SÁNH
      // TRẠNG THÁI MỚI VÀ CŨ của bài tập.
      // Hoặc bạn cần truyền danh sách các câu hỏi bị xóa (dựa vào so sánh initial state vs current state)
      // lên API để backend biết câu nào cần xóa user answers.
      // Logic hiện tại trong handleSaveChanges KHÔNG gọi deleteUserAnswersForQuestion.
      // Bạn cần xem xét lại API updateReadingExerciseDetail hoặc thêm logic xác định
      // các câu hỏi bị xóa để gọi API deleteUserAnswersForQuestion cho từng câu đó sau khi update exercise thành công.
      // Hiện tại, chỉ deleteUserAnswersForQuestion được gọi khi xóa TỪNG câu VÀ KHÔNG CÓ UNSAVED CHANGES.
      // Điều này có thể dẫn đến user answers "mồ côi" nếu bạn xóa nhiều câu khi có unsaved changes và sau đó lưu.
      // Hãy cân nhắc điều chỉnh backend hoặc hàm handleSaveChanges cho phù hợp.
    } else {
      // Nếu lưu thất bại, có thể muốn tải lại dữ liệu từ DB để đồng bộ
      // hoặc chỉ thông báo lỗi và để người dùng tự quyết định
      // await loadExerciseDetail(selectedExercise.id); // uncomment nếu muốn tải lại state từ DB khi lưu thất bại
      //toast.error("Failed to save changes."); // Toast lỗi đã có trong updateReadingExerciseDetail service?
    }

    setIsSubmitting(false); // Kết thúc submit
  };

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
        <h2>Reading Topics ({upperLevelId})</h2>
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
                padding: "8px",
                flexGrow: 1,
                marginRight: "5px",
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
                      title="Edit Topic"
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
              <li>No topics found for level {upperLevelId}.</li>
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
                    gap: "5px", // Sử dụng gap thay vì marginRight
                    alignItems: "center", // Canh giữa theo chiều dọc
                  }}
                >
                  <input
                    type="text"
                    value={newExerciseTitle}
                    onChange={(e) => setNewExerciseTitle(e.target.value)}
                    placeholder="Enter new exercise title..."
                    style={{
                      padding: "8px",
                      flexGrow: 1,
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
                    <li>No exercises found for this topic.</li>
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
                  {/* Nút Save chỉ hiện khi có thay đổi chưa lưu */}
                  {hasChanges && (
                    <button
                      className="add-question-btn-save"
                      onClick={handleSaveChanges}
                      disabled={isSubmitting} // Disable khi đang submit bất kỳ thao tác nào
                      style={{ backgroundColor: "#4CAF50", color: "white" }}
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <label
                    htmlFor="readingScript"
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    Script / Reading Passage:
                  </label>
                  <textarea
                    id="readingScript"
                    value={currentEditingExerciseData.script || ""}
                    onChange={handleScriptChange}
                    placeholder="Enter the script or reading passage here..."
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
                        key={q.id || `question-${index}`} // Sử dụng ID nếu có, fallback về index
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
                            onClick={() => handleDeleteQuestion(index)} // Gọi hàm xóa với index
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
                                type="radio" // Sử dụng ID exercise + ID câu hỏi (hoặc index tạm) để tạo group name duy nhất
                                name={`correctAnswer_Reading_${
                                  selectedExercise?.id
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
                    disabled={isSubmitting} // Disable khi đang submit bất kỳ thao tác nào
                  >
                    + Add Question
                  </button>
                </div>
              </div>
            ) : (
              // Hiển thị hướng dẫn khi chưa chọn exercise
              !isLoadingExercises && (
                <p
                  style={{
                    marginTop: "20px",
                    fontStyle: "italic",
                    color: "#555",
                    textAlign: "center",
                  }}
                >
                  Select an exercise from the list above to view or edit its
                  details, or add a new one if the list is empty.
                </p>
              )
            )}
          </>
        ) : (
          // Hiển thị hướng dẫn khi chưa chọn topic
          !isLoadingTopics && (
            <p
              style={{
                textAlign: "center",
                marginTop: "20px",
                fontStyle: "italic",
                color: "#777",
              }}
            >
              Select a reading topic from the sidebar to manage its exercises.
              If no topics exist for level {upperLevelId}, please add one.
            </p>
          )
        )}
      </div>

      {/* Modals (Popup xác nhận/chỉnh sửa) */}
      {showEditTopicModal && topicToEdit && (
        <div className="edit-topic-modal modal-overlay">
          {" "}
          {/* Thêm overlay */}
          <div className="modal-content">
            <h3>Edit Topic Name</h3>
            <input
              type="text"
              value={editingTopicName}
              onChange={(e) => setEditingTopicName(e.target.value)}
              placeholder="Enter new topic name..."
              disabled={isSubmitting}
              style={{ width: "100%", padding: "10px", marginBottom: "15px" }}
            />
            <div>
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
        <div className="confirm-delete-modal modal-overlay">
          {" "}
          {/* Thêm overlay */}
          <div className="modal-content">
            <h3>Delete Topic "{topicToDelete.topicName}"?</h3>
            <p>
              This will delete the topic and <strong>all its exercises</strong>.
              This action cannot be undone.
            </p>
            <div>
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
        <div className="edit-topic-modal modal-overlay">
          {" "}
          {/* Thêm overlay */}
          <div className="modal-content">
            <h3>Edit Exercise Title</h3>
            <p>
              <strong>Topic:</strong> {selectedTopic?.topicName}
            </p>
            <p style={{ marginBottom: "10px" }}>
              <strong>Current Title:</strong> {exerciseToEdit?.title}
            </p>
            <input
              type="text"
              value={editingExerciseTitle}
              onChange={(e) => setEditingExerciseTitle(e.target.value)}
              placeholder="Enter new exercise title..."
              disabled={isSubmitting}
              style={{ width: "100%", padding: "10px", marginBottom: "15px" }}
            />
            <div>
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
        <div className="confirm-delete-modal modal-overlay">
          {" "}
          {/* Thêm overlay */}
          <div className="modal-content">
            <h3>Delete Exercise "{exerciseToDelete?.title}"?</h3>
            <p>
              <strong>Topic:</strong> {selectedTopic?.topicName}
            </p>
            <p>
              This will delete the exercise script and all its questions. This
              action cannot be undone.
            </p>
            <div>
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
