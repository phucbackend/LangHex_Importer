// ReadingService.js
import { database } from "../firebaseConfig";
import { ref, get, set } from "firebase/database"; // Sử dụng set để thêm/sửa/xóa
import { toast } from "react-toastify";

// Đường dẫn cơ sở trong Firebase, thay Listening thành Reading
const BASE_PATH = "Lessons/Levels";

// --- Topic Management --- (Tương tự Listening)

// Fetch reading topics for a given level (Chỉ lấy title)
export const fetchReadingTopics = async (level) => {
  try {
    // Thay đổi đường dẫn sang Reading
    const topicsRef = ref(database, `${BASE_PATH}/${level}/Reading/Topics`);
    const snapshot = await get(topicsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Chỉ trả về mảng các title topics
      const topicsArray = Object.keys(data).map((title) => ({ title }));
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

// Add a new reading topic (khởi tạo với giá trị true)
export const addReadingTopic = async (level, newTopicTitle) => {
  const trimmedTitle = newTopicTitle.trim();
  if (!trimmedTitle) {
    toast.warn("Topic title cannot be empty.");
    return false;
  }
  try {
    // --- Phần kiểm tra trùng lặp ---
    const compareTitle = trimmedTitle.replace(/\s+/g, "").toLowerCase();
    // Thay đổi đường dẫn sang Reading
    const topicsRef = ref(database, `${BASE_PATH}/${level}/Reading/Topics`);
    const snapshot = await get(topicsRef);
    if (snapshot.exists()) {
      const topicsData = snapshot.val();
      const existingTopicsNormalized = Object.keys(topicsData).map((topic) =>
        topic.trim().replace(/\s+/g, "").toLowerCase()
      );
      if (existingTopicsNormalized.includes(compareTitle)) {
        toast.warn(`Topic "${newTopicTitle}" already exists.`);
        return false;
      }
    }
    // --- Kết thúc kiểm tra trùng lặp ---

    // Tạo topic mới với tên đã trim và giá trị là true
    const topicRef = ref(
      database,
      // Thay đổi đường dẫn sang Reading
      `${BASE_PATH}/${level}/Reading/Topics/${trimmedTitle}`
    );
    await set(topicRef, true); // Giá trị là true

    toast.success(`Added new reading topic: ${trimmedTitle}`);
    return true;
  } catch (error) {
    console.error("Error adding reading topic:", error);
    toast.error(
      `Failed to add topic: "${newTopicTitle}". Check console for details.`
    );
    return false;
  }
};

// Edit an existing reading topic title (rename) - Logic giữ nguyên
export const editReadingTopic = async (level, oldTopicTitle, newTopicTitle) => {
  const trimmedNewTitle = newTopicTitle.trim();
  if (!trimmedNewTitle || trimmedNewTitle === oldTopicTitle) {
    toast.warn("New topic title cannot be empty or same as old title.");
    return false;
  }
  try {
    // Thay đổi đường dẫn sang Reading
    const newTopicCheckRef = ref(
      database,
      `${BASE_PATH}/${level}/Reading/Topics/${trimmedNewTitle}`
    );
    const newSnapshot = await get(newTopicCheckRef);
    if (newSnapshot.exists()) {
      toast.warn(`Topic "${trimmedNewTitle}" already exists.`);
      return false;
    }

    // Thay đổi đường dẫn sang Reading
    const oldTopicRef = ref(
      database,
      `${BASE_PATH}/${level}/Reading/Topics/${oldTopicTitle}`
    );
    const snapshot = await get(oldTopicRef);

    if (snapshot.exists()) {
      const topicData = snapshot.val();
      // Thay đổi đường dẫn sang Reading
      const newTopicRef = ref(
        database,
        `${BASE_PATH}/${level}/Reading/Topics/${trimmedNewTitle}`
      );
      await set(newTopicRef, topicData); // Copy toàn bộ dữ liệu (bao gồm cả Exercises nếu có)
      await set(oldTopicRef, null); // Xóa topic cũ
      toast.success(`Renamed topic to "${trimmedNewTitle}"`);
      return true;
    } else {
      toast.warn(`Topic "${oldTopicTitle}" not found.`);
      return false;
    }
  } catch (error) {
    console.error("Error editing reading topic:", error);
    toast.error("Failed to rename topic.");
    return false;
  }
};

// Delete a reading topic (bao gồm tất cả exercises bên trong) - Logic giữ nguyên
export const deleteReadingTopic = async (level, topicTitle) => {
  try {
    // Thay đổi đường dẫn sang Reading
    const topicRef = ref(
      database,
      `${BASE_PATH}/${level}/Reading/Topics/${topicTitle}`
    );
    await set(topicRef, null); // Hoặc dùng remove(topicRef)
    toast.success(`Deleted topic: ${topicTitle}`);
    return true;
  } catch (error) {
    console.error("Error deleting reading topic:", error);
    toast.error("Failed to delete topic.");
    return false;
  }
};

// --- Exercise Management --- (Logic tương tự Listening, thay script -> readingText)

// Fetch exercises for a specific reading topic (Chỉ lấy title)
export const fetchReadingExercisesForTopic = async (level, topicTitle) => {
  try {
    // Thay đổi đường dẫn sang Reading
    const exercisesRef = ref(
      database,
      `${BASE_PATH}/${level}/Reading/Topics/${topicTitle}/Exercises`
    );
    const snapshot = await get(exercisesRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const exercisesArray = Object.keys(data).map((title) => ({ title }));
      exercisesArray.sort((a, b) => a.title.localeCompare(b.title));
      return exercisesArray;
    } else {
      return [];
    }
  } catch (error) {
    console.error(`Error fetching exercises for topic ${topicTitle}:`, error);
    toast.error(`Failed to fetch exercises for topic "${topicTitle}".`);
    return [];
  }
};

// Fetch detail (readingText, questions) of a specific reading exercise
export const fetchReadingExerciseDetail = async (
  level,
  topicTitle,
  exerciseTitle
) => {
  try {
    // Thay đổi đường dẫn sang Reading
    const exerciseRef = ref(
      database,
      `${BASE_PATH}/${level}/Reading/Topics/${topicTitle}/Exercises/${exerciseTitle}`
    );
    const snapshot = await get(exerciseRef);
    if (snapshot.exists()) {
      const exerciseRaw = snapshot.val();
      // Chuẩn hóa dữ liệu trả về, thay 'script' bằng 'readingText'
      const exerciseDetail = {
        title: exerciseTitle,
        script: exerciseRaw?.script || "", // Thay đổi ở đây
        questions: Array.isArray(exerciseRaw?.questions)
          ? exerciseRaw.questions
          : [],
      };
      return exerciseDetail;
    } else {
      toast.warn(
        `Exercise "${exerciseTitle}" not found in topic "${topicTitle}".`
      );
      return null;
    }
  } catch (error) {
    console.error(
      `Error fetching detail for exercise ${exerciseTitle}:`,
      error
    );
    toast.error(`Failed to fetch details for exercise "${exerciseTitle}".`);
    return null;
  }
};

// Add a new reading exercise to a topic
export const addReadingExercise = async (
  level,
  topicTitle,
  newExerciseTitle
) => {
  const trimmedTitle = newExerciseTitle.trim();
  if (!trimmedTitle) {
    toast.warn("Exercise title cannot be empty.");
    return false;
  }
  try {
    // Check for duplicate exercise title within the same topic
    // Thay đổi đường dẫn sang Reading
    const exercisesRef = ref(
      database,
      `${BASE_PATH}/${level}/Reading/Topics/${topicTitle}/Exercises`
    );
    const snapshot = await get(exercisesRef);
    if (snapshot.exists()) {
      const exercisesData = snapshot.val();
      const existingTitles = Object.keys(exercisesData).map((t) =>
        t.trim().toLowerCase()
      );
      if (existingTitles.includes(trimmedTitle.toLowerCase())) {
        toast.warn(`Exercise "${trimmedTitle}" already exists in this topic.`);
        return false;
      }
    }

    // Add new exercise with default empty structure
    // Thay đổi đường dẫn sang Reading
    const newExerciseRef = ref(
      database,
      `${BASE_PATH}/${level}/Reading/Topics/${topicTitle}/Exercises/${trimmedTitle}`
    );
    // Thay đổi cấu trúc dữ liệu mặc định
    const defaultExerciseData = {
      script: "", // Thay đổi ở đây
      questions: [],
    };
    await set(newExerciseRef, defaultExerciseData);
    toast.success(`Added new exercise: ${trimmedTitle}`);
    return true;
  } catch (error) {
    console.error("Error adding reading exercise:", error);
    toast.error(`Failed to add exercise: ${trimmedTitle}`);
    return false;
  }
};

// Edit an existing reading exercise title (rename) within a topic
export const editReadingExerciseTitle = async (
  level,
  topicTitle,
  oldExerciseTitle,
  newExerciseTitle
) => {
  const trimmedNewTitle = newExerciseTitle.trim();
  if (!trimmedNewTitle || trimmedNewTitle === oldExerciseTitle) {
    toast.warn("New exercise title cannot be empty or same as old title.");
    return false;
  }
  try {
    // Check if new title already exists within the same topic
    // Thay đổi đường dẫn sang Reading
    const newExerciseCheckRef = ref(
      database,
      `${BASE_PATH}/${level}/Reading/Topics/${topicTitle}/Exercises/${trimmedNewTitle}`
    );
    const newSnapshot = await get(newExerciseCheckRef);
    if (newSnapshot.exists()) {
      toast.warn(`Exercise "${trimmedNewTitle}" already exists in this topic.`);
      return false;
    }

    // Get old exercise data
    // Thay đổi đường dẫn sang Reading
    const oldExerciseRef = ref(
      database,
      `${BASE_PATH}/${level}/Reading/Topics/${topicTitle}/Exercises/${oldExerciseTitle}`
    );
    const snapshot = await get(oldExerciseRef);

    if (snapshot.exists()) {
      const exerciseData = snapshot.val();
      // Create new exercise node with old data
      // Thay đổi đường dẫn sang Reading
      const newExerciseRef = ref(
        database,
        `${BASE_PATH}/${level}/Reading/Topics/${topicTitle}/Exercises/${trimmedNewTitle}`
      );
      await set(newExerciseRef, exerciseData);
      // Remove old exercise node
      await set(oldExerciseRef, null);
      toast.success(`Renamed exercise to "${trimmedNewTitle}"`);
      return true;
    } else {
      toast.warn(`Exercise "${oldExerciseTitle}" not found.`);
      return false;
    }
  } catch (error) {
    console.error("Error editing reading exercise title:", error);
    toast.error("Failed to rename exercise.");
    return false;
  }
};

// Delete a reading exercise from a topic
export const deleteReadingExercise = async (
  level,
  topicTitle,
  exerciseTitle
) => {
  try {
    // Thay đổi đường dẫn sang Reading
    const exerciseRef = ref(
      database,
      `${BASE_PATH}/${level}/Reading/Topics/${topicTitle}/Exercises/${exerciseTitle}`
    );
    await set(exerciseRef, null);
    toast.success(`Deleted exercise: ${exerciseTitle}`);
    return true;
  } catch (error) {
    console.error("Error deleting reading exercise:", error);
    toast.error("Failed to delete exercise.");
    return false;
  }
};

// Update the detail (readingText and questions) of a specific exercise
export const updateReadingExerciseDetail = async (
  level,
  topicTitle,
  exerciseTitle,
  exerciseData // Dữ liệu { readingText, questions }
) => {
  try {
    // Validate exerciseData structure (thay script bằng readingText)
    if (
      !exerciseData ||
      typeof exerciseData.script === "undefined" || // Thay đổi ở đây
      !Array.isArray(exerciseData.questions)
    ) {
      throw new Error("Invalid exercise data structure for update.");
    }

    // Sanitize questions (giữ nguyên)
    const sanitizedQuestions = exerciseData.questions.map((q, index) => ({
      id: q.id || `q_${Date.now()}_${index}`,
      questionText: q.questionText?.trim() || "",
      options: q.options || { A: "", B: "", C: "", D: "" },
      correctAnswer: q.correctAnswer || "",
    }));

    // Tạo dữ liệu đã được làm sạch (thay script bằng readingText)
    const sanitizedExerciseData = {
      script: exerciseData.script || "", // Thay đổi ở đây
      questions: sanitizedQuestions,
    };

    // Tham chiếu đến đúng exercise cụ thể
    // Thay đổi đường dẫn sang Reading
    const exerciseDetailRef = ref(
      database,
      `${BASE_PATH}/${level}/Reading/Topics/${topicTitle}/Exercises/${exerciseTitle}`
    );
    await set(exerciseDetailRef, sanitizedExerciseData);
    // Không cần toast ở đây
    return true;
  } catch (error) {
    console.error("Error updating reading exercise detail:", error);
    toast.error(`Failed to update exercise "${exerciseTitle}".`);
    return false;
  }
};
