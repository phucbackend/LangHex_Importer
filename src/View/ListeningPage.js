// ListeningPage.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "../css/speaking.css"; // Assuming this CSS is generic enough

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
  deleteUserListeningAnswersForQuestion, // Corrected service name
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

  // Logic kiểm tra xem có thay đổi chưa lưu không
  const hasChanges = useMemo(() => {
    if (!selectedExercise || initialExerciseDetailStateForComparison === null) {
      return false;
    }
    try {
      const currentComparableState = JSON.stringify({
        script: currentEditingExerciseData.script,
        questions: currentEditingExerciseData.questions,
      });
      return currentComparableState !== initialExerciseDetailStateForComparison;
    } catch (error) {
      console.error("Error comparing exercise detail states:", error);
      return true; // Assume changes if error occurs to prevent data loss
    }
  }, [
    selectedExercise,
    currentEditingExerciseData,
    initialExerciseDetailStateForComparison,
  ]);

  const loadTopics = useCallback(async () => {
    setIsLoadingTopics(true);
    setSelectedTopic(null); // Reset selected topic when reloading all topics
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
    setSelectedExercise(null); // Reset selected exercise when loading new list
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
      setIsSubmitting(true); // Use isSubmitting to indicate loading detail
      const exerciseDetail = await fetchListeningExerciseDetail(
        upperLevelId,
        selectedTopic.id,
        exerciseIdToLoad
      );
      setIsSubmitting(false);
      if (exerciseDetail) {
        setSelectedExercise(exerciseDetail);
        const editableData = {
          script: exerciseDetail.script || "", // Ensure script is not undefined
          questions: exerciseDetail.questions || [], // Ensure questions is an array
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
        await loadExercisesForSelectedTopic(); // Reload list if detail fails
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
      if (hasChanges) {
        if (
          !window.confirm(
            "You have unsaved changes in the current exercise. Are you sure you want to switch topics? Your changes will be lost."
          )
        ) {
          return;
        }
      }
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
    setIsSubmitting(false);
    if (result.success) {
      setNewTopicName("");
      setShowAddTopicInput(false);
      await loadTopics();
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
          setSelectedTopic(null); // This will trigger the useEffect to clear exercises
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
      if (hasChanges) {
        if (
          !window.confirm(
            "You have unsaved changes in the current exercise. Are you sure you want to switch exercises? Your changes will be lost."
          )
        ) {
          return;
        }
      }
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
    const result = await addListeningExercise(
      upperLevelId,
      selectedTopic.id,
      trimmedTitle
    );
    setIsSubmitting(false);
    if (result.success) {
      setNewExerciseTitle("");
      setShowAddExerciseInput(false);
      await loadExercisesForSelectedTopic();
      // Optional: if API returns the new exercise ID, load it.
      // if (result.data?.id) { loadExerciseDetail(result.data.id); }
    }
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
          setSelectedExercise(null); // This will clear the detail view
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

    const questionToDeleteData = localQuestions[indexToDelete];
    const isEffectivelyEmpty = (q) => {
      if (!q) return true;
      const questionTextEmpty = !q.questionText?.trim();
      let optionsAllEmpty = true;
      if (q.options && typeof q.options === "object") {
        optionsAllEmpty = ["A", "B", "C", "D"].every(
          (key) => !(q.options[key] || "").trim()
        );
      } else if (q.options === undefined || q.options === null) {
        optionsAllEmpty = true;
      } else {
        optionsAllEmpty = false; // q.options is unusual type
      }
      const correctAnswerEmpty = !q.correctAnswer?.trim();
      return questionTextEmpty && optionsAllEmpty && correctAnswerEmpty;
    };

    const effectivelyEmpty = isEffectivelyEmpty(questionToDeleteData);
    const exerciseTitle = selectedExercise.title || "this exercise";
    const questionTextPreview = questionToDeleteData?.questionText
      ? questionToDeleteData.questionText.substring(0, 30) +
        (questionToDeleteData.questionText.length > 30 ? "..." : "")
      : `Question ${indexToDelete + 1}`;

    let shouldProceedWithDeletion = false;

    if (effectivelyEmpty) {
      toast.info(
        `Empty listening question ${indexToDelete + 1} will be removed.`
      );
      shouldProceedWithDeletion = true;
    } else {
      shouldProceedWithDeletion = window.confirm(
        `Are you sure you want to delete "${questionTextPreview}" from "${exerciseTitle}"? ` +
          (hasChanges
            ? "This will remove the question from your unsaved changes."
            : "This will update the database and attempt to delete related user answers. This action cannot be undone.")
      );
    }

    if (shouldProceedWithDeletion) {
      setIsSubmitting(true);
      try {
        if (hasChanges) {
          // CASE 1: HAS UNSAVED LOCAL CHANGES
          console.log(
            "Deleting listening question locally due to unsaved changes."
          );
          const newQuestionsLocal = localQuestions.filter(
            (_, i) => i !== indexToDelete
          );
          setCurrentEditingExerciseData((prev) => ({
            ...prev,
            questions: newQuestionsLocal,
          }));
          if (!effectivelyEmpty) {
            // Only toast success if it wasn't an auto-deleted empty q
            toast.success(
              "Listening question removed from current changes. Save to persist."
            );
          }
        } else {
          // CASE 2: NO UNSAVED LOCAL CHANGES (Direct DB operation)
          console.log(
            "Deleting listening question from database as no unsaved changes detected."
          );

          // Fetch the latest state from DB before making changes
          const latestExerciseDetail = await fetchListeningExerciseDetail(
            upperLevelId,
            selectedTopic.id,
            selectedExercise.id
          );

          if (!latestExerciseDetail) {
            toast.error(
              "Failed to fetch the latest exercise data. Deletion aborted."
            );
            setIsSubmitting(false);
            return;
          }

          const currentQuestionsFromDB = latestExerciseDetail.questions || [];
          // Find the question in the DB data by ID if available, otherwise assume index matches if IDs are not stable/used yet
          // For safety, it's better if questions always have a stable ID once saved.
          // If questionToDeleteData.id exists and is not temporary, use it to find.
          let dbQuestionIndex = -1;
          if (
            questionToDeleteData.id &&
            !questionToDeleteData.id.startsWith("temp_listen_")
          ) {
            dbQuestionIndex = currentQuestionsFromDB.findIndex(
              (q) => q.id === questionToDeleteData.id
            );
          } else {
            // Fallback to index if ID is temporary or not present. This is less safe if backend reorders.
            dbQuestionIndex = indexToDelete;
          }

          if (
            dbQuestionIndex < 0 ||
            dbQuestionIndex >= currentQuestionsFromDB.length
          ) {
            toast.error(
              "Question index out of sync with the database or question not found. Please refresh."
            );
            await loadExerciseDetail(selectedExercise.id); // Refresh
            setIsSubmitting(false);
            return;
          }

          // Get the actual ID of the question to be deleted from the DB version
          const actualQuestionToDeleteFromDB =
            currentQuestionsFromDB[dbQuestionIndex];

          const newQuestionsDB = currentQuestionsFromDB.filter(
            (_, i) => i !== dbQuestionIndex
          );
          const updatedExerciseDataForApi = {
            script: latestExerciseDetail.script,
            questions: newQuestionsDB,
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
              questions: newQuestionsDB,
            }));
            if (!effectivelyEmpty) {
              // Only toast success if it wasn't an auto-deleted empty q
              toast.success(
                "Listening question deleted successfully from the exercise."
              );
            }

            // Delete user answers for the question using its original index from the DB state
            const exerciseIdForUserAnswers = selectedExercise.id;
            // The index must be the one from the `currentQuestionsFromDB` before filtering
            const questionIndexForUserAnswers = dbQuestionIndex;

            console.log(
              `Attempting to delete user listening answers for exerciseId: ${exerciseIdForUserAnswers}, questionIndex: ${questionIndexForUserAnswers} (original DB index)`
            );
            const userAnswerDeletionResult =
              await deleteUserListeningAnswersForQuestion(
                exerciseIdForUserAnswers,
                questionIndexForUserAnswers // Use the original DB index
              );

            if (userAnswerDeletionResult.success) {
              console.log(
                `User listening answer deletion: success, operations: ${userAnswerDeletionResult.operations}`
              );
            } else {
              console.error(
                "Failed to delete user listening answers:",
                userAnswerDeletionResult.message
              );
              // Toast for this error should be handled in the service or here if specific context is needed
            }
          } else {
            toast.error(
              "Failed to update exercise after question deletion. Reloading details."
            );
            await loadExerciseDetail(selectedExercise.id);
          }
        }
      } catch (error) {
        console.error(
          "Error during listening question deletion process:",
          error
        );
        toast.error(
          `An unexpected error occurred: ${
            error.message || "Please try again."
          }`
        );
        if (!hasChanges && selectedExercise && selectedExercise.id) {
          await loadExerciseDetail(selectedExercise.id); // Attempt to resync if error occurred during DB ops
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
      // Basic check for script
      toast.warn(
        "Audio Script / URL cannot be effectively empty if there are questions."
      );
      // Allow empty script if there are no questions, or adjust as per your needs
      // if (currentEditingExerciseData.questions && currentEditingExerciseData.questions.length > 0 && !currentEditingExerciseData.script?.trim()) {
      //    toast.warn("Audio Script / URL cannot be empty if there are questions.");
      //    return;
      // }
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

    setIsSubmitting(true);
    // Prepare data, ensuring questions are an array
    const dataToSave = {
      script: currentEditingExerciseData.script || "",
      questions: currentEditingExerciseData.questions || [],
    };

    const success = await updateListeningExerciseDetail(
      upperLevelId,
      selectedTopic.id,
      selectedExercise.id,
      dataToSave // Send the current local editing state
    );

    if (success) {
      // Re-fetch the exercise detail to get the canonical state from the DB (e.g., with new question IDs)
      const updatedExerciseDetail = await fetchListeningExerciseDetail(
        upperLevelId,
        selectedTopic.id,
        selectedExercise.id
      );
      if (updatedExerciseDetail) {
        setSelectedExercise(updatedExerciseDetail);
        const editableData = {
          script: updatedExerciseDetail.script || "",
          questions: updatedExerciseDetail.questions || [],
        };
        setCurrentEditingExerciseData(editableData);
        setInitialExerciseDetailStateForComparison(
          JSON.stringify(editableData)
        );
        toast.success("Listening exercise changes saved successfully!");
      } else {
        toast.error(
          "Changes saved, but failed to reload updated exercise data. Please refresh manually if needed."
        );
        // As a fallback, update initial state with what was sent, though it might lack new IDs
        setInitialExerciseDetailStateForComparison(JSON.stringify(dataToSave));
      }

      // *** IMPORTANT NOTE ON DELETING USER ANSWERS during Save Changes ***
      // The logic for deleting user answers when questions are removed as part of "Save Changes"
      // (i.e., user deletes questions locally and then clicks Save) is complex.
      // The current `handleSaveChanges` does NOT explicitly call `deleteUserListeningAnswersForQuestion`.
      // Ideally, your `updateListeningExerciseDetail` service on the backend should:
      // 1. Receive the new list of questions.
      // 2. Compare it to the questions currently stored in the database for that exercise.
      // 3. Identify any questions that were removed.
      // 4. For each removed question, trigger the deletion of its associated user answers.
      //
      // If the backend doesn't handle this, you would need to:
      // a. Before calling `updateListeningExerciseDetail`, compare `initialExerciseDetailStateForComparison.questions`
      //    (the state before local edits) with `currentEditingExerciseData.questions`.
      // b. Identify the IDs (or original indices if IDs aren't reliable for this comparison yet) of questions present in initial but not in current.
      // c. After `updateListeningExerciseDetail` succeeds, loop through these identified deleted questions
      //    and call `deleteUserListeningAnswersForQuestion` for each. This makes the frontend logic more complex.
      // The current setup relies on `handleDeleteQuestion` for explicit single deletions with user answer cleanup,
      // or backend logic for batch updates. Consider this for data integrity.
    } else {
      // Error toast should be handled by the service, but you can add a generic one here if needed
      // toast.error("Failed to save listening exercise changes.");
      // Optionally, reload from DB to revert optimistic updates or show consistent error state
      // await loadExerciseDetail(selectedExercise.id);
    }
    setIsSubmitting(false);
  };

  return (
    <div
      className={`speaking-container ${
        // Using speaking-container class as per your structure
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
                  className="add-topic" // Re-use class if style is similar
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
                    gap: "5px",
                    alignItems: "center",
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
                      style={{ backgroundColor: "#4CAF50", color: "white" }}
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
                    value={currentEditingExerciseData.script || ""}
                    onChange={handleScriptChange}
                    placeholder="Enter audio script or URL here..."
                    rows={6} // Adjusted for potentially shorter URLs or scripts
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
                  Select a listening exercise from the list above to view or
                  edit its details, or add a new one if the list is empty.
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
              If no topics exist for level {upperLevelId}, please add one.
            </p>
          )
        )}
      </div>

      {/* Modals */}
      {showEditTopicModal && topicToEdit && (
        <div className="edit-topic-modal modal-overlay">
          {" "}
          {/* Added modal-overlay */}
          <div className="modal-content">
            <h3>Edit Listening Topic Name</h3>
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
          {/* Added modal-overlay */}
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
          {/* Added modal-overlay */}
          <div className="modal-content">
            <h3>Edit Listening Exercise Title</h3>
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
          {/* Added modal-overlay */}
          <div className="modal-content">
            <h3>Delete Exercise "{exerciseToDelete?.title}"?</h3>
            <p>
              <strong>Topic:</strong> {selectedTopic?.topicName}
            </p>
            <p>
              This will delete the exercise script/audio and all its questions.
              This action cannot be undone.
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

export default ListeningPage;
