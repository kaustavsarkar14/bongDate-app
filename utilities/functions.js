export const getChatIdFromUserIds = (userId1, userId2) => {
  return [userId1, userId2].sort().join("");
};

export const calculateAge = (birthdate) => {
  const birthDate = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }
  return age;
};



export function formatTimeGap(timestamp) {
  if (!timestamp) return "";

  let date;

  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else {
    date = new Date(timestamp);
  }

  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diff = now - date;
  const oneDay = 24 * 60 * 60 * 1000;

  // Today: show time in 24hr format without leading zero
  if (diff < oneDay && now.getDate() === date.getDate()) {
    const hours = date.getHours(); // 0–23
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return "Yesterday";
  }

  // Older: show in MM/DD/YY
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().slice(-2)}`;
}



