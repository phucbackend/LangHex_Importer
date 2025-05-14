// ReadingService.js
import { database } from "../firebaseConfig"; // Đảm bảo đường dẫn này chính xác
import { ref, get, set, push, update } from "firebase/database";
import { toast } from "react-toastify";

// Đường dẫn cơ sở trong Firebase
const LESSONS_BASE_PATH = "Lessons/Levels";
const USERS_BASE_PATH = "Users/MicrosoftUsers";

// --- Topic Management ---
export const fetchReadingTopics = async (level) => {
  try {
    const topicsRef = ref(
      database,
      `${LESSONS_BASE_PATH}/${level}/Reading/Topics`
    );
    const snapshot = await get(topicsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const topicsArray = Object.keys(data).map((id) => ({
        id: id,
        topicName: data[id].topicName || data[id].title || id,
      }));
      topicsArray.sort((a, b) =>
        a.topicName.toLowerCase().localeCompare(b.topicName.toLowerCase())
      );
      return topicsArray;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching reading topics:", error);
    toast.error("Failed to fetch reading topics.");
    return [];
  }
};

export const addReadingTopic = async (level, newTopicName) => {
  const trimmedName = newTopicName.trim();
  if (!trimmedName) {
    toast.warn("Topic name cannot be empty.");
    return { success: false, message: "Topic name cannot be empty." };
  }
  try {
    const topicsContainerRef = ref(
      database,
      `${LESSONS_BASE_PATH}/${level}/Reading/Topics`
    );
    const snapshot = await get(topicsContainerRef);
    if (snapshot.exists()) {
      const topicsData = snapshot.val();
      for (const id in topicsData) {
        const existingName = topicsData[id].topicName || topicsData[id].title;
        if (
          existingName &&
          existingName.trim().toLowerCase() === trimmedName.toLowerCase()
        ) {
          toast.warn(`Topic with name "${trimmedName}" already exists.`);
          return {
            success: false,
            message: `Topic with name "${trimmedName}" already exists.`,
          };
        }
      }
    }
    const newTopicRef = push(topicsContainerRef);
    const newTopicId = newTopicRef.key;
    const topicData = {
      topicName: trimmedName,
      Exercises: {},
    };
    await set(newTopicRef, topicData);
    toast.success(`Added new reading topic: "${trimmedName}"`);
    return { success: true, id: newTopicId, topicName: trimmedName };
  } catch (error) {
    console.error("Error adding reading topic:", error);
    toast.error(`Failed to add topic: "${trimmedName}". ${error.message}`);
    return { success: false, message: `Failed to add topic: ${error.message}` };
  }
};

export const editReadingTopicName = async (level, topicId, newTopicName) => {
  const trimmedNewName = newTopicName.trim();
  if (!trimmedNewName) {
    toast.warn("New topic name cannot be empty.");
    return false;
  }
  try {
    const topicsContainerRef = ref(
      database,
      `${LESSONS_BASE_PATH}/${level}/Reading/Topics`
    );
    const snapshot = await get(topicsContainerRef);
    if (snapshot.exists()) {
      const topicsData = snapshot.val();
      for (const id in topicsData) {
        if (id !== topicId) {
          const existingName = topicsData[id].topicName || topicsData[id].title;
          if (
            existingName &&
            existingName.trim().toLowerCase() === trimmedNewName.toLowerCase()
          ) {
            toast.warn(
              `Another topic with the name "${trimmedNewName}" already exists.`
            );
            return false;
          }
        }
      }
    }
    const topicNameRef = ref(
      database,
      `${LESSONS_BASE_PATH}/${level}/Reading/Topics/${topicId}/topicName`
    );
    await set(topicNameRef, trimmedNewName);
    toast.success(`Renamed topic to "${trimmedNewName}"`);
    return true;
  } catch (error) {
    console.error("Error editing reading topic name:", error);
    toast.error(`Failed to rename topic. ${error.message}`);
    return false;
  }
};

export const deleteReadingTopic = async (level, topicId) => {
  try {
    const topicRef = ref(
      database,
      `${LESSONS_BASE_PATH}/${level}/Reading/Topics/${topicId}`
    );
    await set(topicRef, null);
    toast.success(`Deleted topic and its exercises.`);
    return true;
  } catch (error) {
    console.error("Error deleting reading topic:", error);
    toast.error(`Failed to delete topic. ${error.message}`);
    return false;
  }
};

// --- Exercise Management ---
export const fetchReadingExercisesForTopic = async (level, topicId) => {
  try {
    const exercisesRef = ref(
      database,
      `${LESSONS_BASE_PATH}/${level}/Reading/Topics/${topicId}/Exercises`
    );
    const snapshot = await get(exercisesRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const exercisesArray = Object.keys(data).map((id) => ({
        id: id,
        title: data[id].title || id,
      }));
      exercisesArray.sort((a, b) =>
        a.title.toLowerCase().localeCompare(b.title.toLowerCase())
      );
      return exercisesArray;
    } else {
      return [];
    }
  } catch (error) {
    console.error(`Error fetching exercises for topic ID ${topicId}:`, error);
    toast.error("Failed to fetch exercises for the selected topic.");
    return [];
  }
};

export const fetchReadingExerciseDetail = async (
  level,
  topicId,
  exerciseId
) => {
  try {
    const exerciseRef = ref(
      database,
      `${LESSONS_BASE_PATH}/${level}/Reading/Topics/${topicId}/Exercises/${exerciseId}`
    );
    const snapshot = await get(exerciseRef);
    if (snapshot.exists()) {
      const exerciseRaw = snapshot.val();
      const exerciseDetail = {
        id: exerciseId,
        title: exerciseRaw?.title || exerciseId,
        script: exerciseRaw?.script || "",
        questions: Array.isArray(exerciseRaw?.questions)
          ? exerciseRaw.questions
          : [],
      };
      return exerciseDetail;
    } else {
      toast.warn(
        `Exercise with ID "${exerciseId}" not found in the selected topic.`
      );
      return null;
    }
  } catch (error) {
    console.error(
      `Error fetching detail for exercise ID ${exerciseId}:`,
      error
    );
    toast.error(
      `Failed to fetch details for exercise ID "${exerciseId}". ${error.message}`
    );
    return null;
  }
};

export const addReadingExercise = async (level, topicId, displayTitle) => {
  const trimmedDisplayTitle = displayTitle.trim();
  if (!trimmedDisplayTitle) {
    toast.warn("Exercise display title cannot be empty.");
    return {
      success: false,
      message: "Exercise display title cannot be empty.",
    };
  }
  try {
    const exercisesContainerRef = ref(
      database,
      `${LESSONS_BASE_PATH}/${level}/Reading/Topics/${topicId}/Exercises`
    );
    const existingExercisesSnapshot = await get(exercisesContainerRef);
    if (existingExercisesSnapshot.exists()) {
      const exercisesData = existingExercisesSnapshot.val();
      for (const id in exercisesData) {
        if (
          exercisesData[id].title &&
          exercisesData[id].title.trim().toLowerCase() ===
            trimmedDisplayTitle.toLowerCase()
        ) {
          toast.warn(
            `An exercise with the title "${trimmedDisplayTitle}" already exists in this topic.`
          );
          return {
            success: false,
            message: `Exercise title "${trimmedDisplayTitle}" already exists.`,
          };
        }
      }
    }

    const newExerciseRef = push(exercisesContainerRef);
    const newExerciseId = newExerciseRef.key;
    const defaultExerciseData = {
      title: trimmedDisplayTitle,
      script: "",
      questions: [],
    };
    await set(newExerciseRef, defaultExerciseData);
    toast.success(`Added new exercise: "${trimmedDisplayTitle}"`);
    return { success: true, id: newExerciseId, title: trimmedDisplayTitle };
  } catch (error) {
    console.error("Error adding reading exercise:", error);
    toast.error(
      `Failed to add exercise: "${trimmedDisplayTitle}". ${error.message}`
    );
    return {
      success: false,
      message: `Failed to add exercise: ${error.message}`,
    };
  }
};

export const editReadingExerciseDisplayTitle = async (
  level,
  topicId,
  exerciseId,
  newDisplayTitle
) => {
  const trimmedNewTitle = newDisplayTitle.trim();
  if (!trimmedNewTitle) {
    toast.warn("New exercise display title cannot be empty.");
    return false;
  }
  try {
    const exercisesContainerRef = ref(
      database,
      `${LESSONS_BASE_PATH}/${level}/Reading/Topics/${topicId}/Exercises`
    );
    const snapshot = await get(exercisesContainerRef);
    if (snapshot.exists()) {
      const exercisesData = snapshot.val();
      for (const id in exercisesData) {
        if (id !== exerciseId) {
          if (
            exercisesData[id].title &&
            exercisesData[id].title.trim().toLowerCase() ===
              trimmedNewTitle.toLowerCase()
          ) {
            toast.warn(
              `Another exercise with the title "${trimmedNewTitle}" already exists in this topic.`
            );
            return false;
          }
        }
      }
    }
    const exerciseTitleFieldRef = ref(
      database,
      `${LESSONS_BASE_PATH}/${level}/Reading/Topics/${topicId}/Exercises/${exerciseId}/title`
    );
    await set(exerciseTitleFieldRef, trimmedNewTitle);
    toast.success(`Exercise display title updated to "${trimmedNewTitle}"`);
    return true;
  } catch (error) {
    console.error("Error editing reading exercise display title:", error);
    toast.error(`Failed to update exercise display title. ${error.message}`);
    return false;
  }
};

export const deleteReadingExercise = async (level, topicId, exerciseId) => {
  try {
    const exerciseRef = ref(
      database,
      `${LESSONS_BASE_PATH}/${level}/Reading/Topics/${topicId}/Exercises/${exerciseId}`
    );
    await set(exerciseRef, null);
    toast.success("Deleted exercise");
    return true;
  } catch (error) {
    console.error("Error deleting reading exercise:", error);
    toast.error(`Failed to delete exercise. ${error.message}`);
    return false;
  }
};

export const updateReadingExerciseDetail = async (
  level,
  topicId,
  exerciseId,
  exerciseData // { script, questions }
) => {
  try {
    if (
      !exerciseData ||
      typeof exerciseData.script === "undefined" ||
      !Array.isArray(exerciseData.questions)
    ) {
      console.error(
        "Invalid exercise data for update. Script and questions array are required.",
        exerciseData
      );
      toast.error(
        "Invalid data structure: Script and questions array are required for update."
      );
      return false;
    }
    const sanitizedQuestions = exerciseData.questions.map((q, index) => {
      const questionId =
        q.id ||
        `q_temp_${Date.now()}_${index}_${Math.random()
          .toString(36)
          .substring(2, 9)}`;
      return {
        id: questionId,
        questionText: q.questionText?.trim() || "",
        options:
          q.options &&
          typeof q.options === "object" &&
          !Array.isArray(q.options)
            ? {
                A: q.options.A?.trim() || "",
                B: q.options.B?.trim() || "",
                C: q.options.C?.trim() || "",
                D: q.options.D?.trim() || "",
              }
            : { A: "", B: "", C: "", D: "" },
        correctAnswer: q.correctAnswer || "",
      };
    });

    const dataToUpdate = {
      script: exerciseData.script || "",
      questions: sanitizedQuestions,
    };

    const exerciseRef = ref(
      database,
      `${LESSONS_BASE_PATH}/${level}/Reading/Topics/${topicId}/Exercises/${exerciseId}`
    );
    await update(exerciseRef, dataToUpdate);
    return true;
  } catch (error) {
    console.error("Error updating reading exercise detail:", error);
    toast.error(
      `Failed to update exercise (ID: ${exerciseId}). ${error.message}`
    );
    return false;
  }
};

// --- User Answer Management ---
export const deleteUserAnswersForQuestion = async (
  exerciseId,
  questionIndexToDelete
) => {
  console.log(
    `Attempting to delete answers for exerciseId: ${exerciseId}, questionIndex: ${questionIndexToDelete}`
  );
  try {
    const usersRef = ref(database, USERS_BASE_PATH);
    const usersSnapshot = await get(usersRef);

    if (!usersSnapshot.exists()) {
      console.log("No MicrosoftUsers found to process for answer deletion.");
      return { success: true, message: "No users to process.", operations: 0 };
    }

    const usersData = usersSnapshot.val();
    let updates = {};
    let deletedCount = 0;

    for (const userId in usersData) {
      // Path to the specific question's answer within a user's progress for a specific exercise
      const userAnswerPath = `${USERS_BASE_PATH}/${userId}/Progress/ReadingAnswers/${exerciseId}/${questionIndexToDelete}`;
      const userAnswerRef = ref(database, userAnswerPath);
      const userAnswerSnapshot = await get(userAnswerRef);

      if (userAnswerSnapshot.exists()) {
        updates[userAnswerPath] = null; // Mark for deletion
        deletedCount++;
        console.log(`Marked for deletion: ${userAnswerPath}`);
      }
    }

    if (Object.keys(updates).length > 0) {
      await update(ref(database), updates); // Perform batch deletion
      // Toast success is handled in the calling component (ReadingPage) for better user feedback flow
      console.log(
        `Successfully deleted ${deletedCount} user answer(s) for question index ${questionIndexToDelete} in exercise ${exerciseId}.`
      );
    } else {
      console.log(
        `No user answers found for question index ${questionIndexToDelete} in exercise ${exerciseId} to delete.`
      );
    }
    return { success: true, operations: deletedCount };
  } catch (error) {
    console.error(
      `Error deleting user answers for question index ${questionIndexToDelete} in exercise ${exerciseId}:`,
      error
    );
    toast.error(`Failed to delete some user answers. ${error.message}`);
    return { success: false, message: error.message, operations: 0 };
  }
};
