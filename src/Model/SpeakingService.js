import { database } from "../firebaseConfig";
import { ref, get, set } from "firebase/database";
import { toast } from "react-toastify";

// Fetch speaking topics for a given level
export const fetchSpeakingTopics = async (level) => {
  try {
    const topicsRef = ref(database, `Lessons/Levels/${level}/Speaking/Topics`);
    const snapshot = await get(topicsRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const topicsArray = Object.entries(data).map(([title, questionsObj]) => ({
        title,
        questions: Object.values(questionsObj),
      }));
      return topicsArray;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching topics:", error);
    return [];
  }
};

// Add a new question to a topic
export const addQuestionToTopic = async (level, topicTitle, newQuestion) => {
  try {
    const topicRef = ref(
      database,
      `Lessons/Levels/${level}/Speaking/Topics/${topicTitle}`
    );
    const snapshot = await get(topicRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const existingKeys = Object.keys(data);
      const questionNumbers = existingKeys
        .map((key) => {
          const match = key.match(/^question(\d+)$/);
          return match ? parseInt(match[1]) : null;
        })
        .filter((num) => num !== null);

      const nextNumber =
        questionNumbers.length > 0 ? Math.max(...questionNumbers) + 1 : 1;
      const newKey = `question${nextNumber}`;
      const newQuestionRef = ref(
        database,
        `Lessons/Levels/${level}/Speaking/Topics/${topicTitle}/${newKey}`
      );
      await set(newQuestionRef, newQuestion);
      console.log(`Added question under key: ${newKey}`);
    } else {
      console.warn(`Topic "${topicTitle}" does not exist.`);
    }
  } catch (error) {
    console.error("Error adding question:", error);
  }
};

// Delete a question from a topic
export const deleteQuestionFromTopic = async (
  level,
  topicTitle,
  questionKey
) => {
  try {
    const topicRef = ref(
      database,
      `Lessons/Levels/${level}/Speaking/Topics/${topicTitle}`
    );
    const snapshot = await get(topicRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      delete data[questionKey];

      const updatedQuestions = {};
      const sortedValues = Object.values(data);

      sortedValues.forEach((question, index) => {
        const newKey = `question${index + 1}`;
        updatedQuestions[newKey] = question;
      });

      await set(topicRef, updatedQuestions);
      console.log(`Deleted question: ${questionKey} and reordered keys.`);
    } else {
      console.warn(`Topic "${topicTitle}" does not exist.`);
    }
  } catch (error) {
    console.error("Error deleting question:", error);
  }
};

// Edit an existing question in a topic
export const editQuestionInTopic = async (
  level,
  topicTitle,
  questionKey,
  updatedText
) => {
  try {
    const questionRef = ref(
      database,
      `Lessons/Levels/${level}/Speaking/Topics/${topicTitle}/${questionKey}`
    );
    await set(questionRef, updatedText);
    console.log(`Updated question: ${questionKey}`);
  } catch (error) {
    console.error("Error editing question:", error);
  }
};

// Add a new topic
// export const addTopic = async (level, newTopicTitle) => {
//   try {
//     const topicRef = ref(
//       database,
//       `Lessons/Levels/${level}/Speaking/Topics/${newTopicTitle}`
//     );
//     await set(topicRef, true); // Add a topic with a sample question or empty
//     toast.success(`Added new topic: ${newTopicTitle}`);
//   } catch (error) {
//     toast.error(`Failed to add topic: ${newTopicTitle}`);
//   }
// };
export const addTopic = async (level, newTopicTitle) => {
  try {
    // Giữ nguyên tên gốc để hiển thị và lưu, nhưng chuẩn hóa để so sánh
    const formattedInput = newTopicTitle
      .trim()
      .replace(/\s+/g, "")
      .toLowerCase();

    const topicsRef = ref(database, `Lessons/Levels/${level}/Speaking/Topics`);
    const snapshot = await get(topicsRef);

    if (snapshot.exists()) {
      const topicsData = snapshot.val();

      const existingTopicsNormalized = Object.keys(topicsData).map((topic) =>
        topic.trim().replace(/\s+/g, "").toLowerCase()
      );

      if (existingTopicsNormalized.includes(formattedInput)) {
        toast.warn(`Topic "${newTopicTitle}" already exists.`);
        return;
      }
    }

    // Nếu chưa tồn tại, thì thêm vào với tên gốc (có thể chứa hoa thường tùy ý người nhập)
    const topicRef = ref(
      database,
      `Lessons/Levels/${level}/Speaking/Topics/${newTopicTitle.trim()}`
    );
    await set(topicRef, true);
    toast.success(`Added new topic: ${newTopicTitle}`);
  } catch (error) {
    toast.error(`Failed to add topic: ${newTopicTitle}`);
  }
};

// Edit an existing topic (rename or modify it)
export const editTopic = async (level, oldTopicTitle, newTopicTitle) => {
  try {
    const topicRef = ref(
      database,
      `Lessons/Levels/${level}/Speaking/Topics/${oldTopicTitle}`
    );
    const snapshot = await get(topicRef);

    if (snapshot.exists()) {
      const topicData = snapshot.val();
      const newTopicRef = ref(
        database,
        `Lessons/Levels/${level}/Speaking/Topics/${newTopicTitle}`
      );
      await set(newTopicRef, topicData); // Copy data to new topic
      await set(topicRef, null); // Remove the old topic
      console.log(
        `Renamed topic from "${oldTopicTitle}" to "${newTopicTitle}"`
      );
    } else {
      console.warn(`Topic "${oldTopicTitle}" does not exist.`);
    }
  } catch (error) {
    console.error("Error editing topic:", error);
  }
};

// Delete a topic
export const deleteTopic = async (level, topicTitle) => {
  try {
    const topicRef = ref(
      database,
      `Lessons/Levels/${level}/Speaking/Topics/${topicTitle}`
    );
    const snapshot = await get(topicRef);

    if (snapshot.exists()) {
      await set(topicRef, null); // Remove the topic
      console.log(`Deleted topic: ${topicTitle}`);
    } else {
      console.warn(`Topic "${topicTitle}" does not exist.`);
    }
  } catch (error) {
    console.error("Error deleting topic:", error);
  }
};
