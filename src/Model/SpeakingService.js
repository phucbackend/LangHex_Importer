// File: SpeakingService.js

import { database } from "../firebaseConfig"; // Đảm bảo đường dẫn này chính xác
import { ref, get, set, push, child } from "firebase/database";
import { toast } from "react-toastify";

const SPEAKING_TYPE = "Q&A";

// Helper function to find a topic by its topicName and return its ID and data
const findTopicByTitle = async (level, titleToFind) => {
  const topicsRef = ref(
    database,
    `Lessons/Levels/${level}/Speaking/${SPEAKING_TYPE}/Topics`
  );
  const snapshot = await get(topicsRef);
  if (snapshot.exists()) {
    const topicsData = snapshot.val();
    for (const topicId in topicsData) {
      if (
        topicsData.hasOwnProperty(topicId) &&
        topicsData[topicId].topicName === titleToFind
      ) {
        return { id: topicId, data: topicsData[topicId] };
      }
    }
  }
  return null; // Topic not found
};

export const fetchSpeakingTopics = async (level) => {
  try {
    const topicsRef = ref(
      database,
      `Lessons/Levels/${level}/Speaking/${SPEAKING_TYPE}/Topics`
    );
    const snapshot = await get(topicsRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const topicsArray = Object.entries(data).map(([topicId, topicData]) => ({
        id: topicId,
        title: topicData.topicName || "Unnamed Topic",
        questions: topicData.questions
          ? Object.entries(topicData.questions).map(([qKey, qText]) => ({
              key: qKey,
              text: qText,
            }))
          : [], // Nếu không có questions hoặc questions rỗng, trả về mảng rỗng
      }));
      return topicsArray;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching Q&A topics:", error);
    toast.error("Failed to fetch Q&A topics.");
    return [];
  }
};

export const addQuestionToTopic = async (
  level,
  topicTitle,
  newQuestionText
) => {
  try {
    const topicInfo = await findTopicByTitle(level, topicTitle);
    if (!topicInfo) {
      toast.error(`Topic "${topicTitle}" not found.`);
      return;
    }
    const topicId = topicInfo.id;

    const questionsRef = ref(
      database,
      `Lessons/Levels/${level}/Speaking/${SPEAKING_TYPE}/Topics/${topicId}/questions`
    );
    const snapshot = await get(questionsRef);
    let nextQuestionKey;

    if (snapshot.exists()) {
      const questionsData = snapshot.val();
      const questionKeys = Object.keys(questionsData);
      const questionNumbers = questionKeys
        .map((key) => {
          const match = key.match(/^question(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter((num) => typeof num === "number");
      const nextNumber =
        questionNumbers.length > 0 ? Math.max(0, ...questionNumbers) + 1 : 1;
      nextQuestionKey = `question${nextNumber}`;
    } else {
      nextQuestionKey = "question1"; // Nếu chưa có câu hỏi nào, bắt đầu từ question1
    }

    const newQuestionRef = child(questionsRef, nextQuestionKey);
    await set(newQuestionRef, newQuestionText);
    toast.success("Question added successfully!");
  } catch (error) {
    console.error("Error adding question:", error);
    toast.error("Failed to add question.");
  }
};

export const deleteQuestionFromTopic = async (
  level,
  topicTitle,
  questionKey
) => {
  try {
    const topicInfo = await findTopicByTitle(level, topicTitle);
    if (!topicInfo) {
      toast.error(`Topic "${topicTitle}" not found.`);
      return;
    }
    const topicId = topicInfo.id;

    const questionRef = ref(
      database,
      `Lessons/Levels/${level}/Speaking/${SPEAKING_TYPE}/Topics/${topicId}/questions/${questionKey}`
    );
    await set(questionRef, null); // Xóa bằng cách set giá trị là null
    toast.success("Question deleted successfully!");
  } catch (error) {
    console.error("Error deleting question:", error);
    toast.error("Failed to delete question.");
  }
};

export const editQuestionInTopic = async (
  level,
  topicTitle,
  questionKey,
  updatedText
) => {
  try {
    const topicInfo = await findTopicByTitle(level, topicTitle);
    if (!topicInfo) {
      toast.error(`Topic "${topicTitle}" not found.`);
      return;
    }
    const topicId = topicInfo.id;

    const questionRef = ref(
      database,
      `Lessons/Levels/${level}/Speaking/${SPEAKING_TYPE}/Topics/${topicId}/questions/${questionKey}`
    );
    await set(questionRef, updatedText);
  } catch (error) {
    console.error("Error editing question:", error);
    toast.error("Failed to edit question.");
  }
};

export const addTopic = async (level, newTopicUITitle) => {
  try {
    const trimmedTopicName = newTopicUITitle.trim();
    if (!trimmedTopicName) {
      toast.warn("Topic title cannot be empty.");
      return;
    }

    const existingTopic = await findTopicByTitle(level, trimmedTopicName);
    if (existingTopic) {
      toast.warn(`Topic "${trimmedTopicName}" already exists.`);
      return;
    }

    const topicsContainerRef = ref(
      database,
      `Lessons/Levels/${level}/Speaking/${SPEAKING_TYPE}/Topics`
    );
    const newTopicFirebaseRef = push(topicsContainerRef);
    await set(newTopicFirebaseRef, {
      topicName: trimmedTopicName,
      questions: {}, // THAY ĐỔI: Khởi tạo questions là một đối tượng rỗng
    });

    toast.success(`Added new topic: ${trimmedTopicName}`);
  } catch (error) {
    console.error("Error adding topic:", error);
    toast.error(`Failed to add topic: ${newTopicUITitle}`);
  }
};

export const editTopic = async (level, oldTopicUITitle, newTopicUITitle) => {
  try {
    const trimmedNewName = newTopicUITitle.trim();
    if (!trimmedNewName) {
      toast.warn("New topic title cannot be empty.");
      return;
    }

    const topicToEditInfo = await findTopicByTitle(level, oldTopicUITitle);
    if (!topicToEditInfo) {
      toast.error(`Topic "${oldTopicUITitle}" not found to edit.`);
      return;
    }
    const topicIdToEdit = topicToEditInfo.id;

    const allTopicsRef = ref(
      database,
      `Lessons/Levels/${level}/Speaking/${SPEAKING_TYPE}/Topics`
    );
    const allTopicsSnapshot = await get(allTopicsRef);
    if (allTopicsSnapshot.exists()) {
      const topicsData = allTopicsSnapshot.val();
      for (const currentTopicId in topicsData) {
        if (
          topicsData.hasOwnProperty(currentTopicId) &&
          currentTopicId !== topicIdToEdit
        ) {
          if (topicsData[currentTopicId].topicName === trimmedNewName) {
            toast.warn(
              `Another topic with the title "${trimmedNewName}" already exists.`
            );
            return;
          }
        }
      }
    }

    const topicNameFieldRef = ref(
      database,
      `Lessons/Levels/${level}/Speaking/${SPEAKING_TYPE}/Topics/${topicIdToEdit}/topicName`
    );
    await set(topicNameFieldRef, trimmedNewName);
    toast.success(
      `Topic title updated from "${oldTopicUITitle}" to "${trimmedNewName}"`
    );
  } catch (error) {
    console.error("Error editing topic title:", error);
    toast.error("Failed to edit topic title.");
  }
};

export const deleteTopic = async (level, topicUITitleToDelete) => {
  try {
    const topicInfo = await findTopicByTitle(level, topicUITitleToDelete);
    if (!topicInfo) {
      toast.error(`Topic "${topicUITitleToDelete}" not found to delete.`);
      return;
    }
    const topicIdToDelete = topicInfo.id;

    const topicFirebaseRef = ref(
      database,
      `Lessons/Levels/${level}/Speaking/${SPEAKING_TYPE}/Topics/${topicIdToDelete}`
    );
    await set(topicFirebaseRef, null); // Xóa bằng cách set giá trị là null
    toast.success(`Deleted topic: ${topicUITitleToDelete}`);
  } catch (error) {
    console.error("Error deleting topic:", error);
    toast.error("Failed to delete topic.");
  }
};
