// ListeningService.js
import { database } from "../firebaseConfig";
import { ref, get, set, push, update } from "firebase/database"; // Thêm push, update
import { toast } from "react-toastify";

const BASE_PATH = "Lessons/Levels";

// --- Topic Management (Sử dụng ID cho Topics) ---

// Fetch listening topics for a given level (Lấy id và topicName)
export const fetchListeningTopics = async (level) => {
  try {
    // Đường dẫn đến container Topics của Listening
    const topicsRef = ref(database, `${BASE_PATH}/${level}/Listening/Topics`);
    const snapshot = await get(topicsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const topicsArray = Object.keys(data).map((id) => ({
        id: id, // ID của Topic (key của node)
        topicName: data[id].topicName || data[id].title || id, // Tên hiển thị
      }));
      // Sắp xếp theo topicName
      topicsArray.sort((a, b) =>
        a.topicName.toLowerCase() > b.topicName.toLowerCase() ? 1 : -1
      );
      return topicsArray;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching listening topics:", error);
    toast.error("Failed to fetch listening topics.");
    return [];
  }
};

// Add a new listening topic using push() for unique ID
export const addListeningTopic = async (level, newTopicName) => {
  const trimmedName = newTopicName.trim();
  if (!trimmedName) {
    toast.warn("Topic name cannot be empty.");
    return { success: false };
  }
  try {
    const topicsContainerRef = ref(
      database,
      `${BASE_PATH}/${level}/Listening/Topics`
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
    toast.success(`Added new listening topic: ${trimmedName}`);
    return { success: true, id: newTopicId, topicName: trimmedName };
  } catch (error) {
    console.error("Error adding listening topic:", error);
    toast.error(`Failed to add topic: "${trimmedName}".`);
    return { success: false };
  }
};

// Edit listening topic display name (ID không đổi)
export const editListeningTopicName = async (level, topicId, newTopicName) => {
  const trimmedNewName = newTopicName.trim();
  if (!trimmedNewName) {
    toast.warn("New topic name cannot be empty.");
    return false;
  }
  try {
    // Optional: Kiểm tra trùng lặp tên mới với các topic khác
    const topicsContainerRef = ref(
      database,
      `${BASE_PATH}/${level}/Listening/Topics`
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

    // Chỉ cập nhật trường 'topicName'
    const topicNameRef = ref(
      database,
      `${BASE_PATH}/${level}/Listening/Topics/${topicId}/topicName`
    );
    await set(topicNameRef, trimmedNewName);
    toast.success(`Renamed topic to "${trimmedNewName}"`);
    return true;
  } catch (error) {
    console.error("Error editing listening topic name:", error);
    toast.error("Failed to rename topic.");
    return false;
  }
};

// Delete a listening topic by ID (bao gồm tất cả exercises bên trong)
export const deleteListeningTopic = async (level, topicId) => {
  try {
    const topicRef = ref(
      database,
      `${BASE_PATH}/${level}/Listening/Topics/${topicId}`
    );
    await set(topicRef, null);
    toast.success(`Deleted topic (ID: ${topicId})`);
    return true;
  } catch (error) {
    console.error("Error deleting listening topic:", error);
    toast.error("Failed to delete topic.");
    return false;
  }
};

// --- Exercise Management (Sử dụng topicId và exerciseId) ---

// Fetch exercises for a specific listening topic (Lấy id và title)
export const fetchListeningExercisesForTopic = async (level, topicId) => {
  try {
    const exercisesRef = ref(
      database,
      `${BASE_PATH}/${level}/Listening/Topics/${topicId}/Exercises` // Sử dụng topicId
    );
    const snapshot = await get(exercisesRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const exercisesArray = Object.keys(data).map((id) => ({
        id: id, // ID của Exercise
        title: data[id].title || id, // title của Exercise, fallback là id
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

// Fetch detail (title, script, questions) of a specific listening exercise by ID
export const fetchListeningExerciseDetail = async (
  level,
  topicId,
  exerciseId // Sử dụng exerciseId
) => {
  try {
    const exerciseRef = ref(
      database,
      `${BASE_PATH}/${level}/Listening/Topics/${topicId}/Exercises/${exerciseId}` // Sử dụng ID
    );
    const snapshot = await get(exerciseRef);
    if (snapshot.exists()) {
      const exerciseRaw = snapshot.val();
      // Chuẩn hóa dữ liệu trả về
      const exerciseDetail = {
        id: exerciseId, // Thêm ID vào kết quả trả về
        title: exerciseRaw?.title || exerciseId, // Lấy title hoặc fallback id
        script: exerciseRaw?.script || "", // Giữ nguyên là script
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

// Add a new listening exercise to a topic using push() for unique ID
export const addListeningExercise = async (
  level,
  topicId,
  displayTitle // Tên hiển thị của exercise
) => {
  const trimmedDisplayTitle = displayTitle.trim();
  if (!trimmedDisplayTitle) {
    toast.warn("Exercise display title cannot be empty.");
    return { success: false };
  }
  try {
    const exercisesContainerRef = ref(
      database,
      `${BASE_PATH}/${level}/Listening/Topics/${topicId}/Exercises` // Sử dụng topicId
    );

    // Kiểm tra trùng lặp title (tên hiển thị) của exercise trong cùng topic
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

    const newExerciseRef = push(exercisesContainerRef); // Firebase tạo ID duy nhất
    const newExerciseId = newExerciseRef.key;

    // Cấu trúc dữ liệu mặc định
    const defaultExerciseData = {
      title: trimmedDisplayTitle, // Lưu tên hiển thị
      script: "",
      questions: [],
    };
    await set(newExerciseRef, defaultExerciseData);
    toast.success(`Added new exercise: ${trimmedDisplayTitle}`);
    return { success: true, id: newExerciseId, title: trimmedDisplayTitle };
  } catch (error) {
    console.error("Error adding listening exercise:", error);
    toast.error(`Failed to add exercise: ${trimmedDisplayTitle}`);
    return { success: false };
  }
};

// Edit an existing listening exercise display title (ID không đổi)
export const editListeningExerciseDisplayTitle = async (
  level,
  topicId,
  exerciseId, // Nhận exerciseId
  newDisplayTitle
) => {
  const trimmedNewTitle = newDisplayTitle.trim();
  if (!trimmedNewTitle) {
    toast.warn("New exercise display title cannot be empty.");
    return false;
  }
  try {
    // Optional: Check for duplicate title among other exercises
    const exercisesContainerRef = ref(
      database,
      `${BASE_PATH}/${level}/Listening/Topics/${topicId}/Exercises`
    );
    const snapshot = await get(exercisesContainerRef);
    if (snapshot.exists()) {
      const exercisesData = snapshot.val();
      for (const id in exercisesData) {
        if (id !== exerciseId) {
          // Bỏ qua exercise đang sửa
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

    // Chỉ cập nhật trường 'title'
    const exerciseTitleFieldRef = ref(
      database,
      `${BASE_PATH}/${level}/Listening/Topics/${topicId}/Exercises/${exerciseId}/title` // Sử dụng ID
    );
    await set(exerciseTitleFieldRef, trimmedNewTitle);
    toast.success(`Exercise display title updated to "${trimmedNewTitle}"`);
    return true;
  } catch (error) {
    console.error("Error editing listening exercise display title:", error);
    toast.error("Failed to update exercise display title.");
    return false;
  }
};

// Delete a listening exercise by ID
export const deleteListeningExercise = async (
  level,
  topicId,
  exerciseId // Sử dụng exerciseId
) => {
  try {
    const exerciseRef = ref(
      database,
      `${BASE_PATH}/${level}/Listening/Topics/${topicId}/Exercises/${exerciseId}` // Sử dụng ID
    );
    await set(exerciseRef, null);
    toast.success(`Deleted exercise (ID: ${exerciseId})`);
    return true;
  } catch (error) {
    console.error("Error deleting listening exercise:", error);
    toast.error("Failed to delete exercise.");
    return false;
  }
};

// Update the detail (script and questions) of a specific exercise by ID
export const updateListeningExerciseDetail = async (
  level,
  topicId,
  exerciseId, // Sử dụng exerciseId
  exerciseData // Dữ liệu { script, questions }
) => {
  try {
    // Validate exerciseData structure
    if (
      !exerciseData ||
      typeof exerciseData.script === "undefined" ||
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

    // Dữ liệu cần update (chỉ script và questions)
    const dataToUpdate = {
      script: exerciseData.script || "",
      questions: sanitizedQuestions,
    };

    // Tham chiếu đến đúng exercise cụ thể bằng ID
    const exerciseDetailRef = ref(
      database,
      `${BASE_PATH}/${level}/Listening/Topics/${topicId}/Exercises/${exerciseId}`
    );

    // Sử dụng update để chỉ cập nhật các trường này
    await update(exerciseDetailRef, dataToUpdate);
    return true;
  } catch (error) {
    console.error("Error updating listening exercise detail:", error);
    toast.error(`Failed to update exercise ID "${exerciseId}".`);
    return false;
  }
};
