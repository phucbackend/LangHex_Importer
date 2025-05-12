// ReadingService.js
import { database } from "../firebaseConfig";
import { ref, get, set, push, update } from "firebase/database";
import { toast } from "react-toastify";

// Đường dẫn cơ sở trong Firebase
const BASE_PATH = "Lessons/Levels";

// --- Topic Management (Sử dụng ID cho Topics) ---
// (Giữ nguyên logic Topic Management như trước)

export const fetchReadingTopics = async (level) => {
  try {
    const topicsRef = ref(database, `${BASE_PATH}/${level}/Reading/Topics`);
    const snapshot = await get(topicsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const topicsArray = Object.keys(data).map((id) => ({
        id: id,
        topicName: data[id].topicName || data[id].title || id,
      }));
      topicsArray.sort((a, b) =>
        a.topicName.toLowerCase() > b.topicName.toLowerCase() ? 1 : -1
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
    return { success: false };
  }
  try {
    const topicsContainerRef = ref(
      database,
      `${BASE_PATH}/${level}/Reading/Topics`
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
          return { success: false };
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
    toast.success(`Added new reading topic: ${trimmedName}`);
    return { success: true, id: newTopicId, topicName: trimmedName };
  } catch (error) {
    console.error("Error adding reading topic:", error);
    toast.error(`Failed to add topic: "${trimmedName}".`);
    return { success: false };
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
      `${BASE_PATH}/${level}/Reading/Topics`
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
      `${BASE_PATH}/${level}/Reading/Topics/${topicId}/topicName`
    );
    await set(topicNameRef, trimmedNewName);
    toast.success(`Renamed topic to "${trimmedNewName}"`);
    return true;
  } catch (error) {
    console.error("Error editing reading topic name:", error);
    toast.error("Failed to rename topic.");
    return false;
  }
};

export const deleteReadingTopic = async (level, topicId) => {
  try {
    const topicRef = ref(
      database,
      `${BASE_PATH}/${level}/Reading/Topics/${topicId}`
    );
    await set(topicRef, null);
    toast.success(`Deleted topic (ID: ${topicId})`);
    return true;
  } catch (error) {
    console.error("Error deleting reading topic:", error);
    toast.error("Failed to delete topic.");
    return false;
  }
};

// --- Exercise Management (Sử dụng topicId và exerciseId, node "script") ---

export const fetchReadingExercisesForTopic = async (level, topicId) => {
  try {
    const exercisesRef = ref(
      database,
      `${BASE_PATH}/${level}/Reading/Topics/${topicId}/Exercises`
    );
    const snapshot = await get(exercisesRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const exercisesArray = Object.keys(data).map((id) => ({
        id: id,
        title: data[id].title || id,
      }));
      exercisesArray.sort((a, b) => a.title.localeCompare(b.title));
      return exercisesArray;
    } else {
      return [];
    }
  } catch (error) {
    console.error(`Error fetching exercises for topic ID ${topicId}:`, error);
    toast.error(`Failed to fetch exercises for the selected topic.`);
    return [];
  }
};

// Fetch detail (title, script, questions) of a specific reading exercise by ID
export const fetchReadingExerciseDetail = async (
  level,
  topicId,
  exerciseId
) => {
  try {
    const exerciseRef = ref(
      database,
      `${BASE_PATH}/${level}/Reading/Topics/${topicId}/Exercises/${exerciseId}`
    );
    const snapshot = await get(exerciseRef);
    if (snapshot.exists()) {
      const exerciseRaw = snapshot.val();
      const exerciseDetail = {
        id: exerciseId,
        title: exerciseRaw?.title || exerciseId,
        script: exerciseRaw?.script || "", // Đổi lại thành script
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
    toast.error(`Failed to fetch details for exercise ID "${exerciseId}".`);
    return null;
  }
};

// Add a new reading exercise to a topic using push() for unique ID
export const addReadingExercise = async (level, topicId, displayTitle) => {
  const trimmedDisplayTitle = displayTitle.trim();
  if (!trimmedDisplayTitle) {
    toast.warn("Exercise display title cannot be empty.");
    return { success: false };
  }
  try {
    const exercisesContainerRef = ref(
      database,
      `${BASE_PATH}/${level}/Reading/Topics/${topicId}/Exercises`
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
          return { success: false };
        }
      }
    }
    const newExerciseRef = push(exercisesContainerRef);
    const newExerciseId = newExerciseRef.key;
    const defaultExerciseData = {
      title: trimmedDisplayTitle,
      script: "", // Đổi lại thành script
      questions: [],
    };
    await set(newExerciseRef, defaultExerciseData);
    toast.success(`Added new exercise: ${trimmedDisplayTitle}`);
    return { success: true, id: newExerciseId, title: trimmedDisplayTitle };
  } catch (error) {
    console.error("Error adding reading exercise:", error);
    toast.error(`Failed to add exercise: ${trimmedDisplayTitle}`);
    return { success: false };
  }
};

// Edit an existing reading exercise display title (ID không đổi)
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
      `${BASE_PATH}/${level}/Reading/Topics/${topicId}/Exercises`
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
      `${BASE_PATH}/${level}/Reading/Topics/${topicId}/Exercises/${exerciseId}/title`
    );
    await set(exerciseTitleFieldRef, trimmedNewTitle);
    toast.success(`Exercise display title updated to "${trimmedNewTitle}"`);
    return true;
  } catch (error) {
    console.error("Error editing reading exercise display title:", error);
    toast.error("Failed to update exercise display title.");
    return false;
  }
};

// Delete a reading exercise by ID
export const deleteReadingExercise = async (level, topicId, exerciseId) => {
  try {
    const exerciseRef = ref(
      database,
      `${BASE_PATH}/${level}/Reading/Topics/${topicId}/Exercises/${exerciseId}`
    );
    await set(exerciseRef, null);
    toast.success(`Deleted exercise (ID: ${exerciseId})`);
    return true;
  } catch (error) {
    console.error("Error deleting reading exercise:", error);
    toast.error("Failed to delete exercise.");
    return false;
  }
};

// Update the detail (script and questions) of a specific exercise by ID
export const updateReadingExerciseDetail = async (
  level,
  topicId,
  exerciseId,
  exerciseData // Dữ liệu { script, questions }
) => {
  try {
    // Validate exerciseData structure
    if (
      !exerciseData ||
      typeof exerciseData.script === "undefined" || // Kiểm tra 'script'
      !Array.isArray(exerciseData.questions)
    ) {
      throw new Error("Invalid exercise data structure for update.");
    }

    // Sanitize questions
    const sanitizedQuestions = exerciseData.questions.map((q, index) => ({
      id: q.id || `q_${Date.now()}_${index}`,
      questionText: q.questionText?.trim() || "",
      options: q.options || { A: "", B: "", C: "", D: "" },
      correctAnswer: q.correctAnswer || "",
    }));

    // Tạo dữ liệu cần update (chỉ script và questions)
    const dataToUpdate = {
      script: exerciseData.script || "", // Đổi lại thành script
      questions: sanitizedQuestions,
    };

    // Tham chiếu đến đúng exercise cụ thể bằng ID
    const exerciseDetailRef = ref(
      database,
      `${BASE_PATH}/${level}/Reading/Topics/${topicId}/Exercises/${exerciseId}`
    );

    // Sử dụng update để chỉ cập nhật các trường này
    await update(exerciseDetailRef, dataToUpdate);

    return true;
  } catch (error) {
    console.error("Error updating reading exercise detail:", error);
    toast.error(`Failed to update exercise ID "${exerciseId}".`);
    return false;
  }
};
