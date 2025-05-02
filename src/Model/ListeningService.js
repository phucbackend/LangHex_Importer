// ListeningService.js
import { database } from "../firebaseConfig";
import { ref, get, set } from "firebase/database"; // Thêm push, remove
import { toast } from "react-toastify";

const BASE_PATH = "Lessons/Levels";

// --- Topic Management --- (Giữ nguyên các hàm fetch/add/edit/delete Topic)

// Fetch listening topics for a given level (Chỉ lấy title)
export const fetchListeningTopics = async (level) => {
  try {
    const topicsRef = ref(database, `${BASE_PATH}/${level}/Listening/Topics`);
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
    console.error("Error fetching listening topics:", error);
    toast.error("Failed to fetch listening topics.");
    return [];
  }
};

// Add a new listening topic (khởi tạo với node Exercises rỗng)
export const addListeningTopic = async (level, newTopicTitle) => {
  const trimmedTitle = newTopicTitle.trim(); // Giữ lại tên gốc sau khi trim
  if (!trimmedTitle) {
    toast.warn("Topic title cannot be empty.");
    return false; // Vẫn trả về false để component xử lý
  }
  try {
    // --- Phần kiểm tra trùng lặp ---
    // Sử dụng logic tương tự Speaking để chuẩn hóa khi so sánh (lowercase, bỏ khoảng trắng)
    const compareTitle = trimmedTitle.replace(/\s+/g, "").toLowerCase();
    const topicsRef = ref(database, `${BASE_PATH}/${level}/Listening/Topics`);
    const snapshot = await get(topicsRef);
    if (snapshot.exists()) {
      const topicsData = snapshot.val();
      // Chuẩn hóa các topic đã có để so sánh
      const existingTopicsNormalized = Object.keys(topicsData).map((topic) =>
        topic.trim().replace(/\s+/g, "").toLowerCase()
      );
      if (existingTopicsNormalized.includes(compareTitle)) {
        // Thông báo dùng tên gốc (chưa trim) mà user nhập
        toast.warn(`Topic "${newTopicTitle}" already exists.`);
        return false; // Trả về false
      }
    }
    // --- Kết thúc kiểm tra trùng lặp ---

    // Tạo topic mới với tên đã trim (giữ nguyên hoa thường) và giá trị là true
    const topicRef = ref(
      database,
      `${BASE_PATH}/${level}/Listening/Topics/${trimmedTitle}` // Sử dụng trimmedTitle
    );
    // *** THAY ĐỔI CHÍNH: Set giá trị là true thay vì { Exercises: {} } ***
    await set(topicRef, true);
    // *** KẾT THÚC THAY ĐỔI CHÍNH ***

    toast.success(`Added new listening topic: ${trimmedTitle}`);
    return true; // Vẫn trả về true khi thành công
  } catch (error) {
    console.error("Error adding listening topic:", error); // Log lỗi để debug
    // Thông báo lỗi dùng tên gốc user nhập
    toast.error(
      `Failed to add topic: "${newTopicTitle}". Check console for details.`
    );
    return false; // Trả về false khi lỗi
  }
};

// Edit an existing listening topic title (rename) - Logic giữ nguyên
export const editListeningTopic = async (
  level,
  oldTopicTitle,
  newTopicTitle
) => {
  const trimmedNewTitle = newTopicTitle.trim();
  if (!trimmedNewTitle || trimmedNewTitle === oldTopicTitle) {
    toast.warn("New topic title cannot be empty or same as old title.");
    return false;
  }
  try {
    const newTopicCheckRef = ref(
      database,
      `${BASE_PATH}/${level}/Listening/Topics/${trimmedNewTitle}`
    );
    const newSnapshot = await get(newTopicCheckRef);
    if (newSnapshot.exists()) {
      toast.warn(`Topic "${trimmedNewTitle}" already exists.`);
      return false;
    }

    const oldTopicRef = ref(
      database,
      `${BASE_PATH}/${level}/Listening/Topics/${oldTopicTitle}`
    );
    const snapshot = await get(oldTopicRef);

    if (snapshot.exists()) {
      const topicData = snapshot.val();
      const newTopicRef = ref(
        database,
        `${BASE_PATH}/${level}/Listening/Topics/${trimmedNewTitle}`
      );
      await set(newTopicRef, topicData); // Copy toàn bộ dữ liệu (bao gồm cả Exercises)
      await set(oldTopicRef, null); // Xóa topic cũ
      toast.success(`Renamed topic to "${trimmedNewTitle}"`);
      return true;
    } else {
      toast.warn(`Topic "${oldTopicTitle}" not found.`);
      return false;
    }
  } catch (error) {
    console.error("Error editing listening topic:", error);
    toast.error("Failed to rename topic.");
    return false;
  }
};

// Delete a listening topic (bao gồm tất cả exercises bên trong) - Logic giữ nguyên
export const deleteListeningTopic = async (level, topicTitle) => {
  try {
    const topicRef = ref(
      database,
      `${BASE_PATH}/${level}/Listening/Topics/${topicTitle}`
    );
    await set(topicRef, null); // Hoặc dùng remove(topicRef)
    toast.success(`Deleted topic: ${topicTitle}`);
    return true;
  } catch (error) {
    console.error("Error deleting listening topic:", error);
    toast.error("Failed to delete topic.");
    return false;
  }
};

// --- Exercise Management --- (Hàm mới)

// Fetch exercises for a specific topic (Chỉ lấy title hoặc key)
export const fetchExercisesForTopic = async (level, topicTitle) => {
  try {
    const exercisesRef = ref(
      database,
      `${BASE_PATH}/${level}/Listening/Topics/${topicTitle}/Exercises`
    );
    const snapshot = await get(exercisesRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Trả về mảng các object { title: exerciseTitle }
      const exercisesArray = Object.keys(data).map((title) => ({ title }));
      // Sắp xếp exercises theo tên nếu cần
      exercisesArray.sort((a, b) => a.title.localeCompare(b.title));
      return exercisesArray;
    } else {
      return []; // Trả về mảng rỗng nếu không có exercise nào
    }
  } catch (error) {
    console.error(`Error fetching exercises for topic ${topicTitle}:`, error);
    toast.error(`Failed to fetch exercises for topic "${topicTitle}".`);
    return [];
  }
};

// Fetch detail (script, questions) of a specific exercise
export const fetchExerciseDetail = async (level, topicTitle, exerciseTitle) => {
  try {
    const exerciseRef = ref(
      database,
      `${BASE_PATH}/${level}/Listening/Topics/${topicTitle}/Exercises/${exerciseTitle}`
    );
    const snapshot = await get(exerciseRef);
    if (snapshot.exists()) {
      const exerciseRaw = snapshot.val();
      // Chuẩn hóa dữ liệu trả về
      const exerciseDetail = {
        title: exerciseTitle, // Bao gồm cả title để tiện sử dụng
        script: exerciseRaw?.script || "",
        questions: Array.isArray(exerciseRaw?.questions)
          ? exerciseRaw.questions
          : [],
      };
      return exerciseDetail;
    } else {
      // Trường hợp exercise không tồn tại (có thể đã bị xóa)
      toast.warn(
        `Exercise "${exerciseTitle}" not found in topic "${topicTitle}".`
      );
      return null; // Trả về null để component xử lý
    }
  } catch (error) {
    console.error(
      `Error fetching detail for exercise ${exerciseTitle}:`,
      error
    );
    toast.error(`Failed to fetch details for exercise "${exerciseTitle}".`);
    return null; // Trả về null khi có lỗi
  }
};

// Add a new exercise to a topic
export const addListeningExercise = async (
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
    const exercisesRef = ref(
      database,
      `${BASE_PATH}/${level}/Listening/Topics/${topicTitle}/Exercises`
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
    const newExerciseRef = ref(
      database,
      `${BASE_PATH}/${level}/Listening/Topics/${topicTitle}/Exercises/${trimmedTitle}`
    );
    const defaultExerciseData = {
      script: "",
      questions: [],
    };
    await set(newExerciseRef, defaultExerciseData);
    toast.success(`Added new exercise: ${trimmedTitle}`);
    return true;
  } catch (error) {
    console.error("Error adding listening exercise:", error);
    toast.error(`Failed to add exercise: ${trimmedTitle}`);
    return false;
  }
};

// Edit an existing exercise title (rename) within a topic
export const editListeningExerciseTitle = async (
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
    const newExerciseCheckRef = ref(
      database,
      `${BASE_PATH}/${level}/Listening/Topics/${topicTitle}/Exercises/${trimmedNewTitle}`
    );
    const newSnapshot = await get(newExerciseCheckRef);
    if (newSnapshot.exists()) {
      toast.warn(`Exercise "${trimmedNewTitle}" already exists in this topic.`);
      return false;
    }

    // Get old exercise data
    const oldExerciseRef = ref(
      database,
      `${BASE_PATH}/${level}/Listening/Topics/${topicTitle}/Exercises/${oldExerciseTitle}`
    );
    const snapshot = await get(oldExerciseRef);

    if (snapshot.exists()) {
      const exerciseData = snapshot.val();
      // Create new exercise node with old data
      const newExerciseRef = ref(
        database,
        `${BASE_PATH}/${level}/Listening/Topics/${topicTitle}/Exercises/${trimmedNewTitle}`
      );
      await set(newExerciseRef, exerciseData);
      // Remove old exercise node
      await set(oldExerciseRef, null); // Hoặc remove(oldExerciseRef)
      toast.success(`Renamed exercise to "${trimmedNewTitle}"`);
      return true;
    } else {
      toast.warn(`Exercise "${oldExerciseTitle}" not found.`);
      return false;
    }
  } catch (error) {
    console.error("Error editing listening exercise title:", error);
    toast.error("Failed to rename exercise.");
    return false;
  }
};

// Delete an exercise from a topic
export const deleteListeningExercise = async (
  level,
  topicTitle,
  exerciseTitle
) => {
  try {
    const exerciseRef = ref(
      database,
      `${BASE_PATH}/${level}/Listening/Topics/${topicTitle}/Exercises/${exerciseTitle}`
    );
    await set(exerciseRef, null); // Hoặc remove(exerciseRef)
    toast.success(`Deleted exercise: ${exerciseTitle}`);
    return true;
  } catch (error) {
    console.error("Error deleting listening exercise:", error);
    toast.error("Failed to delete exercise.");
    return false;
  }
};

// Update the detail (script and questions) of a specific exercise
export const updateListeningExerciseDetail = async (
  level,
  topicTitle,
  exerciseTitle, // Thêm exerciseTitle
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

    // Sanitize questions (đảm bảo ID, options, correctAnswer)
    const sanitizedQuestions = exerciseData.questions.map((q, index) => ({
      id: q.id || `q_${Date.now()}_${index}`, // Tạo ID nếu chưa có
      questionText: q.questionText?.trim() || "",
      options: q.options || { A: "", B: "", C: "", D: "" },
      correctAnswer: q.correctAnswer || "",
    }));

    const sanitizedExerciseData = {
      script: exerciseData.script || "",
      questions: sanitizedQuestions,
    };

    // Tham chiếu đến đúng exercise cụ thể
    const exerciseDetailRef = ref(
      database,
      `${BASE_PATH}/${level}/Listening/Topics/${topicTitle}/Exercises/${exerciseTitle}`
    );
    await set(exerciseDetailRef, sanitizedExerciseData);
    // Không cần toast ở đây nữa, component sẽ toast khi gọi hàm này thành công
    // toast.success(`Exercise "${exerciseTitle}" updated successfully.`);
    return true;
  } catch (error) {
    console.error("Error updating listening exercise detail:", error);
    toast.error(`Failed to update exercise "${exerciseTitle}".`);
    return false;
  }
};
