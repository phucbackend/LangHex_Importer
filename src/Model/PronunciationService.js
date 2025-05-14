// src/Model/PronunciationService.js
import { database } from "../firebaseConfig";
import { ref, get, set, push, child } from "firebase/database";
import { toast } from "react-toastify";

const PRONUNCIATION_TYPE = "Pronunciation";

// Helper function to find a topic by its topicName and return its ID and data
const findPronunciationTopicByTitle = async (level, titleToFind) => {
  const topicsRef = ref(
    database,
    `Lessons/Levels/${level}/Speaking/${PRONUNCIATION_TYPE}/Topics`
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

export const fetchPronunciationTopics = async (level) => {
  try {
    const topicsRef = ref(
      database,
      `Lessons/Levels/${level}/Speaking/${PRONUNCIATION_TYPE}/Topics`
    );
    const snapshot = await get(topicsRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const topicsArray = Object.entries(data).map(([topicId, topicData]) => ({
        id: topicId,
        title: topicData.topicName || "Unnamed Topic",
        // Thay 'questions' bằng 'scripts'
        scripts: topicData.scripts
          ? Object.entries(topicData.scripts).map(
              ([scriptKey, scriptText]) => ({
                key: scriptKey, // Firebase key của script (vd: script1, script2)
                text: scriptText, // Nội dung của script
              })
            )
          : [],
      }));
      return topicsArray;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching Pronunciation topics:", error);
    toast.error("Failed to fetch Pronunciation topics.");
    return [];
  }
};

export const addPronunciationTopic = async (level, newTopicUITitle) => {
  try {
    const trimmedTopicName = newTopicUITitle.trim();
    if (!trimmedTopicName) {
      toast.warn("Topic title cannot be empty.");
      return;
    }

    const existingTopic = await findPronunciationTopicByTitle(
      level,
      trimmedTopicName
    );
    if (existingTopic) {
      toast.warn(`Topic "${trimmedTopicName}" already exists.`);
      return;
    }

    const topicsContainerRef = ref(
      database,
      `Lessons/Levels/${level}/Speaking/${PRONUNCIATION_TYPE}/Topics`
    );
    const newTopicFirebaseRef = push(topicsContainerRef);
    await set(newTopicFirebaseRef, {
      topicName: trimmedTopicName,
      scripts: {}, // Khởi tạo node 'scripts' rỗng
    });

    toast.success(`Added new topic: ${trimmedTopicName}`);
  } catch (error) {
    console.error("Error adding topic:", error);
    toast.error(`Failed to add topic: ${newTopicUITitle}`);
  }
};

export const editPronunciationTopic = async (
  level,
  oldTopicUITitle,
  newTopicUITitle
) => {
  try {
    const trimmedNewName = newTopicUITitle.trim();
    if (!trimmedNewName) {
      toast.warn("New topic title cannot be empty.");
      return;
    }

    if (oldTopicUITitle === trimmedNewName) {
      // toast.info("Topic title is the same."); // Optional: thông báo nếu tên không đổi
      return;
    }

    const topicToEditInfo = await findPronunciationTopicByTitle(
      level,
      oldTopicUITitle
    );
    if (!topicToEditInfo) {
      toast.error(`Topic "${oldTopicUITitle}" not found to edit.`);
      return;
    }
    const topicIdToEdit = topicToEditInfo.id;

    // Check if the new name already exists for another topic
    const allTopicsRef = ref(
      database,
      `Lessons/Levels/${level}/Speaking/${PRONUNCIATION_TYPE}/Topics`
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
      `Lessons/Levels/${level}/Speaking/${PRONUNCIATION_TYPE}/Topics/${topicIdToEdit}/topicName`
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

export const deletePronunciationTopic = async (level, topicUITitleToDelete) => {
  try {
    const topicInfo = await findPronunciationTopicByTitle(
      level,
      topicUITitleToDelete
    );
    if (!topicInfo) {
      toast.error(`Topic "${topicUITitleToDelete}" not found to delete.`);
      return;
    }
    const topicIdToDelete = topicInfo.id;

    const topicFirebaseRef = ref(
      database,
      `Lessons/Levels/${level}/Speaking/${PRONUNCIATION_TYPE}/Topics/${topicIdToDelete}`
    );
    await set(topicFirebaseRef, null);
    toast.success(`Deleted topic: ${topicUITitleToDelete}`);
  } catch (error) {
    console.error("Error deleting topic:", error);
    toast.error("Failed to delete topic.");
  }
};

export const addScriptToTopic = async (level, topicTitle, newScriptText) => {
  try {
    const topicInfo = await findPronunciationTopicByTitle(level, topicTitle);
    if (!topicInfo) {
      toast.error(`Topic "${topicTitle}" not found.`);
      return;
    }
    const topicId = topicInfo.id;

    const scriptsRef = ref(
      database,
      `Lessons/Levels/${level}/Speaking/${PRONUNCIATION_TYPE}/Topics/${topicId}/scripts`
    );
    const snapshot = await get(scriptsRef);
    let nextScriptKey;

    if (snapshot.exists()) {
      const scriptsData = snapshot.val();
      const scriptKeys = Object.keys(scriptsData);
      const scriptNumbers = scriptKeys
        .map((key) => {
          const match = key.match(/^script(\d+)$/); // Đảm bảo key theo dạng scriptX
          return match ? parseInt(match[1]) : 0;
        })
        .filter((num) => typeof num === "number");
      const nextNumber =
        scriptNumbers.length > 0 ? Math.max(0, ...scriptNumbers) + 1 : 1;
      nextScriptKey = `script${nextNumber}`;
    } else {
      nextScriptKey = "script1";
    }

    const newScriptRef = child(scriptsRef, nextScriptKey);
    await set(newScriptRef, newScriptText);
    toast.success("Script added successfully!");
  } catch (error) {
    console.error("Error adding script:", error);
    toast.error("Failed to add script.");
  }
};

export const deleteScriptFromTopic = async (
  level,
  topicTitle,
  scriptKey // Firebase key của script (vd: script1)
) => {
  try {
    const topicInfo = await findPronunciationTopicByTitle(level, topicTitle);
    if (!topicInfo) {
      toast.error(`Topic "${topicTitle}" not found.`);
      return;
    }
    const topicId = topicInfo.id;

    const scriptRef = ref(
      database,
      `Lessons/Levels/${level}/Speaking/${PRONUNCIATION_TYPE}/Topics/${topicId}/scripts/${scriptKey}`
    );
    await set(scriptRef, null);
    toast.success("Script deleted successfully!");
  } catch (error) {
    console.error("Error deleting script:", error);
    toast.error("Failed to delete script.");
  }
};

export const editScriptInTopic = async (
  level,
  topicTitle,
  scriptKey, // Firebase key của script
  updatedText
) => {
  try {
    const topicInfo = await findPronunciationTopicByTitle(level, topicTitle);
    if (!topicInfo) {
      toast.error(`Topic "${topicTitle}" not found.`);
      return;
    }
    const topicId = topicInfo.id;

    const scriptRef = ref(
      database,
      `Lessons/Levels/${level}/Speaking/${PRONUNCIATION_TYPE}/Topics/${topicId}/scripts/${scriptKey}`
    );
    await set(scriptRef, updatedText);
    toast.success("Script updated successfully!");
  } catch (error) {
    console.error("Error editing script:", error);
    toast.error("Failed to edit script.");
  }
};
