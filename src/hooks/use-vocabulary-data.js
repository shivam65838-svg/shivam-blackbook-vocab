import { useEffect, useMemo, useState } from "react";
export function useVocabularyData() {
  const [items, setItems] = useState([]);
  const [categoriesState, setCategoriesState] = useState([]);
  const [initialized] = useState(true);

  useEffect(() => {
    async function loadWords() {
      try {
        const response = await fetch(
          "https://vocab-api-seven.vercel.app/api/vocabulary"
        );

        const data = await response.json();

        const formatted = data.map((item) => ({
          ...item,
          hindiMeaning: item.hindi_meaning,
          category: item.category || "Vocabulary",
          difficulty: item.difficulty || "Medium",
          status: item.status || "New",
        }));

        console.log("DATABASE VOCAB =", formatted.length);

        setItems(formatted);
      } catch (error) {
        console.error("VOCAB LOAD ERROR =", error);
      }
    }

    loadWords();
  }, []);

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch(
          "https://vocab-api-seven.vercel.app/api/categories"
        );

        const data = await response.json();

        if (Array.isArray(data)) {
          setCategoriesState(
            data.map((item) => item.name)
          );
        }
      } catch (error) {
        console.error("CATEGORY LOAD ERROR =", error);
      }
    }

    loadCategories();
  }, []);


const refreshVocabulary = async () => {
  try {
    const response = await fetch(
      "https://vocab-api-seven.vercel.app/api/vocabulary"
    );

    console.log("STATUS =", response.status);

    const text = await response.text();

    console.log("RAW RESPONSE =", text);

    const data = JSON.parse(text);

    const formatted = data.map((item) => ({
      ...item,
      hindiMeaning: item.hindi_meaning,
      category: item.category || "Vocabulary",
      difficulty: item.difficulty || "Medium",
      status: item.status || "New",
    }));

    setItems(formatted);
  } catch (error) {
    console.error(error);
  }
};


    

const addVocabulary = (raw) => {
  const entry = buildEntry(raw);
  setItems((prev) => [entry, ...prev]);
};

const updateVocabulary = (raw) => {
  const entry = buildEntry(raw);

  setItems((prev) =>
    prev.map((item) =>
      item.id === entry.id ? { ...item, ...entry } : item
    )
  );
};

const deleteVocabulary = (id) => {
  setItems((prev) =>
    prev.filter((item) => item.id !== id)
  );
};

const addCategory = async (label) => {
  const clean = (label || "").toString().trim();

  if (!clean) return;

  await fetch(
    "https://vocab-api-seven.vercel.app/api/categories",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: clean,
      }),
    }
  );

  const response = await fetch(
    "https://vocab-api-seven.vercel.app/api/categories"
  );

  const data = await response.json();

  if (Array.isArray(data)) {
    setCategoriesState(
      data.map((item) => item.name)
    );
  }
};

const removeCategory = async (label) => {
  await fetch(
    "https://vocab-api-seven.vercel.app/api/categories",
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: label,
      }),
    }
  );

  const response = await fetch(
    "https://vocab-api-seven.vercel.app/api/categories"
  );

  const data = await response.json();

  if (Array.isArray(data)) {
    setCategoriesState(
      data.map((item) => item.name)
    );
  }
};

const categories = useMemo(
  () => ["All", ...categoriesState],
  [categoriesState]
);

return {
  items,
  setItems,
  refreshVocabulary,
  categories,
  rawCategories: categoriesState,
  addCategory,
  removeCategory,
  addVocabulary,
  updateVocabulary,
  deleteVocabulary,
  initialized,
};
  }