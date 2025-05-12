// WritingService.js
import { database } from "../firebaseConfig";
import { ref, get, set, push, update } from "firebase/database";
import { toast } from "react-toastify";

const BASE_PATH = "Lessons/Levels";

// --- Topic Management (Sử dụng ID cho Topics) ---

export const fetchWritingTopics = async (level) => {
  try {
    const topicsRef = ref(database, `${BASE_PATH}/${level}/Writing/Topics`);
    const snapshot = await get(topicsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const topicsArray = Object.keys(data).map((id) => ({
        id: id, // ID của Topic (key của node)
        topicName: data[id].topicName || data[id].title || id, // Tên hiển thị của Topic, ưu tiên 'topicName', rồi 'title', fallback là id
      }));
      // Sắp xếp theo topicName để hiển thị nhất quán
      topicsArray.sort((a, b) =>
        a.topicName.toLowerCase() > b.topicName.toLowerCase() ? 1 : -1
      );
      return topicsArray;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching writing topics:", error);
    toast.error("Failed to fetch writing topics.");
    return [];
  }
};

export const addWritingTopic = async (level, newTopicName) => {
  const trimmedName = newTopicName.trim();
  if (!trimmedName) {
    toast.warn("Topic name cannot be empty.");
    return { success: false };
  }
  try {
    const topicsContainerRef = ref(
      database,
      `${BASE_PATH}/${level}/Writing/Topics`
    );

    // Kiểm tra trùng lặp tên Topic (display name)
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

    const newTopicRef = push(topicsContainerRef); // Firebase tạo ID duy nhất
    const newTopicId = newTopicRef.key;
    const topicData = {
      topicName: trimmedName, // Lưu tên hiển thị
      Exercises: {}, // Khởi tạo node Exercises rỗng
    };
    await set(newTopicRef, topicData);
    toast.success(`Added new writing topic: ${trimmedName}`);
    return { success: true, id: newTopicId, topicName: trimmedName };
  } catch (error) {
    console.error("Error adding writing topic:", error);
    toast.error(`Failed to add topic: "${trimmedName}".`);
    return { success: false };
  }
};

// Sửa tên hiển thị của Topic, ID không đổi
export const editWritingTopicName = async (level, topicId, newTopicName) => {
  const trimmedNewName = newTopicName.trim();
  if (!trimmedNewName) {
    toast.warn("New topic name cannot be empty.");
    return false;
  }
  try {
    // Optional: Kiểm tra xem newTopicName có trùng với topic nào khác không (ngoại trừ topic hiện tại)
    const topicsContainerRef = ref(
      database,
      `${BASE_PATH}/${level}/Writing/Topics`
    );
    const snapshot = await get(topicsContainerRef);
    if (snapshot.exists()) {
      const topicsData = snapshot.val();
      for (const id in topicsData) {
        if (id !== topicId) {
          // Bỏ qua topic đang sửa
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
      `${BASE_PATH}/${level}/Writing/Topics/${topicId}/topicName` // Hoặc /title nếu bạn dùng field đó
    );
    await set(topicNameRef, trimmedNewName);
    toast.success(`Renamed topic to "${trimmedNewName}"`);
    return true;
  } catch (error) {
    console.error("Error editing writing topic name:", error);
    toast.error("Failed to rename topic.");
    return false;
  }
};

// Xóa Topic bằng ID
export const deleteWritingTopic = async (level, topicId) => {
  try {
    const topicRef = ref(
      database,
      `${BASE_PATH}/${level}/Writing/Topics/${topicId}`
    );
    await set(topicRef, null);
    toast.success(`Deleted topic (ID: ${topicId})`);
    return true;
  } catch (error) {
    console.error("Error deleting writing topic:", error);
    toast.error("Failed to delete topic.");
    return false;
  }
};

// --- Exercise Management (Sử dụng topicId thay vì topicTitle) ---

export const fetchWritingExercisesForTopic = async (level, topicId) => {
  // Nhận topicId
  try {
    const exercisesRef = ref(
      database,
      `${BASE_PATH}/${level}/Writing/Topics/${topicId}/Exercises` // Sử dụng topicId
    );
    const snapshot = await get(exercisesRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const exercisesArray = Object.keys(data).map((id) => ({
        id: id,
        title: data[id].title || id, // title của Exercise
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

export const fetchWritingExerciseDetail = async (
  level,
  topicId, // Nhận topicId
  exerciseId
) => {
  try {
    const exerciseRef = ref(
      database,
      `${BASE_PATH}/${level}/Writing/Topics/${topicId}/Exercises/${exerciseId}` // Sử dụng topicId
    );
    // ... (logic còn lại giữ nguyên)
    const snapshot = await get(exerciseRef);
    if (snapshot.exists()) {
      const exerciseRaw = snapshot.val();
      const exerciseDetail = {
        id: exerciseId,
        title: exerciseRaw?.title || exerciseId,
        script: exerciseRaw?.script || "",
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

export const addWritingExercise = async (
  level,
  topicId, // Nhận topicId
  displayTitle // title của Exercise
) => {
  const trimmedDisplayTitle = displayTitle.trim();
  if (!trimmedDisplayTitle) {
    toast.warn("Exercise display title cannot be empty.");
    return { success: false };
  }
  try {
    const exercisesContainerRef = ref(
      database,
      `${BASE_PATH}/${level}/Writing/Topics/${topicId}/Exercises` // Sử dụng topicId
    );
    // ... (logic kiểm tra trùng lặp và thêm exercise giữ nguyên)
    const existingExercisesSnapshot = await get(exercisesContainerRef);
    if (existingExercisesSnapshot.exists()) {
      const exercisesData = existingExercisesSnapshot.val();
      for (const id in exercisesData) {
        if (
          exercisesData[id].title &&
          exercisesData[id].title.toLowerCase() ===
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
      script: "",
    };
    await set(newExerciseRef, defaultExerciseData);
    toast.success(`Added new exercise: ${trimmedDisplayTitle}`);
    return { success: true, id: newExerciseId, title: trimmedDisplayTitle };
  } catch (error) {
    console.error("Error adding writing exercise:", error);
    toast.error(`Failed to add exercise: ${trimmedDisplayTitle}`);
    return { success: false };
  }
};

export const editWritingExerciseDisplayTitle = async (
  level,
  topicId, // Nhận topicId
  exerciseId,
  newDisplayTitle
) => {
  const trimmedNewTitle = newDisplayTitle.trim();
  if (!trimmedNewTitle) {
    toast.warn("New exercise display title cannot be empty.");
    return false;
  }
  try {
    const exerciseTitleFieldRef = ref(
      database,
      `${BASE_PATH}/${level}/Writing/Topics/${topicId}/Exercises/${exerciseId}/title` // Sử dụng topicId
    );
    // ... (logic còn lại giữ nguyên)
    await set(exerciseTitleFieldRef, trimmedNewTitle);
    toast.success(`Exercise display title updated to "${trimmedNewTitle}"`);
    return true;
  } catch (error) {
    console.error("Error editing writing exercise display title:", error);
    toast.error("Failed to update exercise display title.");
    return false;
  }
};

export const deleteWritingExercise = async (
  level,
  topicId, // Nhận topicId
  exerciseId
) => {
  try {
    const exerciseRef = ref(
      database,
      `${BASE_PATH}/${level}/Writing/Topics/${topicId}/Exercises/${exerciseId}` // Sử dụng topicId
    );
    // ... (logic còn lại giữ nguyên)
    await set(exerciseRef, null);
    toast.success("Deleted exercise");
    return true;
  } catch (error) {
    console.error("Error deleting writing exercise:", error);
    toast.error("Failed to delete exercise.");
    return false;
  }
};

export const updateWritingExerciseScript = async (
  level,
  topicId, // Nhận topicId
  exerciseId,
  scriptContent
) => {
  try {
    if (typeof scriptContent === "undefined") {
      throw new Error("Invalid exercise data: 'script' content is required.");
    }
    const scriptRef = ref(
      database,
      `${BASE_PATH}/${level}/Writing/Topics/${topicId}/Exercises/${exerciseId}/script` // Sử dụng topicId
    );
    // ... (logic còn lại giữ nguyên)
    await set(scriptRef, scriptContent || "");
    return true;
  } catch (error) {
    console.error("Error updating writing exercise script:", error);
    toast.error(`Failed to update script for exercise ID "${exerciseId}".`);
    return false;
  }
};
