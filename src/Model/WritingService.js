// WritingService.js
import { database } from "../firebaseConfig";
import { ref, get, set } from "firebase/database";
import { toast } from "react-toastify";

// Base path in Firebase, changed to Writing
const BASE_PATH = "Lessons/Levels";

// --- Topic Management --- (Similar to Reading/Listening)

// Fetch writing topics for a given level (Only fetches title)
export const fetchWritingTopics = async (level) => {
  try {
    // Change path to Writing
    const topicsRef = ref(database, `${BASE_PATH}/${level}/Writing/Topics`);
    const snapshot = await get(topicsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Return an array of topic titles
      const topicsArray = Object.keys(data).map((title) => ({ title }));
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

// Add a new writing topic (initialized with true value)
export const addWritingTopic = async (level, newTopicTitle) => {
  const trimmedTitle = newTopicTitle.trim();
  if (!trimmedTitle) {
    toast.warn("Topic title cannot be empty.");
    return false;
  }
  try {
    // --- Duplicate check section ---
    const compareTitle = trimmedTitle.replace(/\s+/g, "").toLowerCase();
    // Change path to Writing
    const topicsRef = ref(database, `${BASE_PATH}/${level}/Writing/Topics`);
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
    // --- End duplicate check ---

    // Create new topic with trimmed name and value true
    const topicRef = ref(
      database,
      // Change path to Writing
      `${BASE_PATH}/${level}/Writing/Topics/${trimmedTitle}`
    );
    await set(topicRef, true); // Value is true

    toast.success(`Added new writing topic: ${trimmedTitle}`);
    return true;
  } catch (error) {
    console.error("Error adding writing topic:", error);
    toast.error(
      `Failed to add topic: "${newTopicTitle}". Check console for details.`
    );
    return false;
  }
};

// Edit an existing writing topic title (rename) - Logic remains the same
export const editWritingTopic = async (level, oldTopicTitle, newTopicTitle) => {
  const trimmedNewTitle = newTopicTitle.trim();
  if (!trimmedNewTitle || trimmedNewTitle === oldTopicTitle) {
    toast.warn("New topic title cannot be empty or same as old title.");
    return false;
  }
  try {
    // Change path to Writing
    const newTopicCheckRef = ref(
      database,
      `${BASE_PATH}/${level}/Writing/Topics/${trimmedNewTitle}`
    );
    const newSnapshot = await get(newTopicCheckRef);
    if (newSnapshot.exists()) {
      toast.warn(`Topic "${trimmedNewTitle}" already exists.`);
      return false;
    }

    // Change path to Writing
    const oldTopicRef = ref(
      database,
      `${BASE_PATH}/${level}/Writing/Topics/${oldTopicTitle}`
    );
    const snapshot = await get(oldTopicRef);

    if (snapshot.exists()) {
      const topicData = snapshot.val();
      // Change path to Writing
      const newTopicRef = ref(
        database,
        `${BASE_PATH}/${level}/Writing/Topics/${trimmedNewTitle}`
      );
      await set(newTopicRef, topicData); // Copy all data (including Exercises if any)
      await set(oldTopicRef, null); // Delete old topic
      toast.success(`Renamed topic to "${trimmedNewTitle}"`);
      return true;
    } else {
      toast.warn(`Topic "${oldTopicTitle}" not found.`);
      return false;
    }
  } catch (error) {
    console.error("Error editing writing topic:", error);
    toast.error("Failed to rename topic.");
    return false;
  }
};

// Delete a writing topic (including all exercises within) - Logic remains the same
export const deleteWritingTopic = async (level, topicTitle) => {
  try {
    // Change path to Writing
    const topicRef = ref(
      database,
      `${BASE_PATH}/${level}/Writing/Topics/${topicTitle}`
    );
    await set(topicRef, null); // Or use remove(topicRef)
    toast.success(`Deleted topic: ${topicTitle}`);
    return true;
  } catch (error) {
    console.error("Error deleting writing topic:", error);
    toast.error("Failed to delete topic.");
    return false;
  }
};

// --- Exercise Management --- (Similar logic to Reading, but no questions field)

// Fetch exercises for a specific writing topic (Only fetches title)
export const fetchWritingExercisesForTopic = async (level, topicTitle) => {
  try {
    // Change path to Writing
    const exercisesRef = ref(
      database,
      `${BASE_PATH}/${level}/Writing/Topics/${topicTitle}/Exercises`
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

// Fetch detail (script) of a specific writing exercise
export const fetchWritingExerciseDetail = async (
  level,
  topicTitle,
  exerciseTitle
) => {
  try {
    // Change path to Writing
    const exerciseRef = ref(
      database,
      `${BASE_PATH}/${level}/Writing/Topics/${topicTitle}/Exercises/${exerciseTitle}`
    );
    const snapshot = await get(exerciseRef);
    if (snapshot.exists()) {
      const exerciseRaw = snapshot.val();
      // Standardize returned data, only script
      const exerciseDetail = {
        title: exerciseTitle,
        script: exerciseRaw?.script || "", // Only script field
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

// Add a new writing exercise to a topic
export const addWritingExercise = async (
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
    // Change path to Writing
    const exercisesRef = ref(
      database,
      `${BASE_PATH}/${level}/Writing/Topics/${topicTitle}/Exercises`
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

    // Add new exercise with default empty structure (only script)
    // Change path to Writing
    const newExerciseRef = ref(
      database,
      `${BASE_PATH}/${level}/Writing/Topics/${topicTitle}/Exercises/${trimmedTitle}`
    );
    // Change default data structure
    const defaultExerciseData = {
      script: "", // Only script field
    };
    await set(newExerciseRef, defaultExerciseData);
    toast.success(`Added new exercise: ${trimmedTitle}`);
    return true;
  } catch (error) {
    console.error("Error adding writing exercise:", error);
    toast.error(`Failed to add exercise: ${trimmedTitle}`);
    return false;
  }
};

// Edit an existing writing exercise title (rename) within a topic
export const editWritingExerciseTitle = async (
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
    // Change path to Writing
    const newExerciseCheckRef = ref(
      database,
      `${BASE_PATH}/${level}/Writing/Topics/${topicTitle}/Exercises/${trimmedNewTitle}`
    );
    const newSnapshot = await get(newExerciseCheckRef);
    if (newSnapshot.exists()) {
      toast.warn(`Exercise "${trimmedNewTitle}" already exists in this topic.`);
      return false;
    }

    // Get old exercise data
    // Change path to Writing
    const oldExerciseRef = ref(
      database,
      `${BASE_PATH}/${level}/Writing/Topics/${topicTitle}/Exercises/${oldExerciseTitle}`
    );
    const snapshot = await get(oldExerciseRef);

    if (snapshot.exists()) {
      const exerciseData = snapshot.val();
      // Create new exercise node with old data
      // Change path to Writing
      const newExerciseRef = ref(
        database,
        `${BASE_PATH}/${level}/Writing/Topics/${topicTitle}/Exercises/${trimmedNewTitle}`
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
    console.error("Error editing writing exercise title:", error);
    toast.error("Failed to rename exercise.");
    return false;
  }
};

// Delete a writing exercise from a topic
export const deleteWritingExercise = async (
  level,
  topicTitle,
  exerciseTitle
) => {
  try {
    // Change path to Writing
    const exerciseRef = ref(
      database,
      `${BASE_PATH}/${level}/Writing/Topics/${topicTitle}/Exercises/${exerciseTitle}`
    );
    await set(exerciseRef, null);
    toast.success(`Deleted exercise: ${exerciseTitle}`);
    return true;
  } catch (error) {
    console.error("Error deleting writing exercise:", error);
    toast.error("Failed to delete exercise.");
    return false;
  }
};

// Update the detail (script) of a specific exercise
export const updateWritingExerciseDetail = async (
  level,
  topicTitle,
  exerciseTitle,
  exerciseData // Data { script }
) => {
  try {
    // Validate exerciseData structure (only script)
    if (!exerciseData || typeof exerciseData.script === "undefined") {
      throw new Error(
        "Invalid exercise data structure for update. 'script' is required."
      );
    }

    // Create cleaned data (only script)
    const sanitizedExerciseData = {
      script: exerciseData.script || "",
    };

    // Reference to the specific exercise
    // Change path to Writing
    const exerciseDetailRef = ref(
      database,
      `${BASE_PATH}/${level}/Writing/Topics/${topicTitle}/Exercises/${exerciseTitle}`
    );
    await set(exerciseDetailRef, sanitizedExerciseData);
    // No toast here, typically handled in the component
    return true;
  } catch (error) {
    console.error("Error updating writing exercise detail:", error);
    toast.error(`Failed to update exercise "${exerciseTitle}".`);
    return false;
  }
};
